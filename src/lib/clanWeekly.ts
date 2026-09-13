import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Clan, { TIERS } from '@/models/Clan';
import ClanMember from '@/models/ClanMember';
import ClanDailyResult from '@/models/ClanDailyResult';
import UserLeague from '@/models/UserLeague';
import Chest from '@/models/Chest';
import { seasonKey } from '@/lib/clanService';

/**
 * Résolution de fin de semaine.
 *
 * Le clan qui a remporté le plus de journées gagne. Le vainqueur monte d'un
 * rang, le perdant descend — SAUF son meilleur contributeur, qui garde sa
 * place : on punit le clan, pas celui qui l'a porté.
 */

/** Coffres par rang. Les coffres sont réservés au clan VAINQUEUR. */
export const REWARDS_BY_TIER: Record<
  number,
  { mvp: string[]; winner: string[]; loserPoints: number }
> = {
  1: { mvp: ['rare'], winner: ['common'], loserPoints: 20 },
  2: { mvp: ['epic'], winner: ['rare'], loserPoints: 40 },
  3: { mvp: ['legendary'], winner: ['epic'], loserPoints: 60 },
  4: { mvp: ['legendary', 'rare'], winner: ['epic'], loserPoints: 80 },
  5: { mvp: ['legendary', 'legendary'], winner: ['legendary'], loserPoints: 100 },
  6: { mvp: ['legendary', 'legendary', 'epic'], winner: ['legendary', 'legendary'], loserPoints: 120 }
};

/**
 * Part du trésor non dépensé rendue aux membres, en points du site.
 *
 * ⚠️ Ce taux crée de la monnaie. Chaque point gagné sur Workyt alimente le
 * trésor du clan (creditClanPoints), donc le reliquat rend des points qui
 * n'existaient pas. À 20 %, deux effets pervers : l'inflation, et surtout une
 * incitation inversée — un clan qui ne dépense rien touchait le reliquat
 * maximum, si bien que ne pas jouer pouvait rapporter plus que se battre.
 *
 * À 5 %, le reliquat reste un lot de consolation pour le trésor mal employé,
 * jamais une stratégie. Les coffres de victoire pèsent bien plus lourd.
 */
const LEFTOVER_RATE = 0.05;

const oid = (id: string) => new mongoose.Types.ObjectId(id);

/**
 * Ouvre un coffre d'un type donné pour un joueur.
 * Réutilise QuestService.openChest — poids, boost « éclat de chance » et
 * application des gains y sont déjà gérés.
 */
async function grantChest(userId: string, type: string): Promise<any | null> {
  const chest = await Chest.findOne({ type, isActive: true }).select('_id').lean<any>();
  if (!chest) {
    console.warn(`[Clans] Aucun coffre actif de type "${type}" — récompense ignorée`);
    return null;
  }
  const { QuestService } = await import('@/lib/questService');
  return QuestService.openChest(userId, chest._id.toString());
}

/**
 * Départage à trois niveaux quand les journées sont à égalité.
 *
 * Le 3ᵉ critère favorise volontairement l'outsider : à mérite strictement
 * égal, on préfère faire circuler les rangs plutôt que figer les positions.
 */
export function tiebreak(
  a: { daysWon: number; damage: number; tier: number },
  b: { daysWon: number; damage: number; tier: number }
): 'a' | 'b' | 'draw' {
  if (a.daysWon !== b.daysWon) return a.daysWon > b.daysWon ? 'a' : 'b';
  if (a.damage !== b.damage) return a.damage > b.damage ? 'a' : 'b';
  if (a.tier !== b.tier) return a.tier < b.tier ? 'a' : 'b'; // le plus bas l'emporte
  return 'draw';
}

export interface WeekResolution {
  resolved: boolean;
  reason?: 'no_clans' | 'already_resolved';
  season: string;
  pairs: number;
  players: number;
}

/**
 * Résout la semaine pour tous les clans de la saison.
 * Idempotent : les clans déjà résolus sont ignorés.
 */
export async function resolveWeek(now: Date = new Date()): Promise<WeekResolution> {
  await dbConnect();

  const season = seasonKey(now);
  const clans = await Clan.find({ season, resolved: false }).lean<any[]>();
  if (clans.length === 0) {
    return { resolved: false, reason: 'no_clans', season, pairs: 0, players: 0 };
  }

  // Dégâts cumulés de la semaine, en une seule agrégation
  const damageRows = await ClanDailyResult.aggregate([
    { $match: { season } },
    { $group: { _id: '$clan', damage: { $sum: '$damageDealt' } } }
  ]);
  const damageByClan = new Map(damageRows.map((r: any) => [r._id.toString(), r.damage]));

  const byId = new Map(clans.map((c) => [c._id.toString(), c]));
  const done = new Set<string>();
  let pairs = 0;
  let players = 0;

  for (const clan of clans) {
    const id = clan._id.toString();
    if (done.has(id) || !clan.rival) continue;
    const rival = byId.get(clan.rival.toString());
    if (!rival) continue;

    done.add(id);
    done.add(rival._id.toString());

    const stats = (c: any) => ({
      daysWon: c.daysWon ?? 0,
      damage: damageByClan.get(c._id.toString()) ?? 0,
      tier: c.tier
    });
    const verdict = tiebreak(stats(clan), stats(rival));

    if (verdict === 'draw') {
      // Aucun ne monte ni ne descend, chacun touche la compensation
      players += await settleClan(clan, 'draw', now);
      players += await settleClan(rival, 'draw', now);
    } else {
      const winner = verdict === 'a' ? clan : rival;
      const loser = verdict === 'a' ? rival : clan;
      players += await settleClan(winner, 'win', now);
      players += await settleClan(loser, 'loss', now);
    }
    pairs++;
  }

  return { resolved: true, season, pairs, players };
}

/* ------------------------------------------------------- un clan */

async function settleClan(
  clan: any,
  outcome: 'win' | 'loss' | 'draw',
  now: Date
): Promise<number> {
  // Verrou AVANT toute distribution : le passage de resolved à true est
  // atomique et conditionné à false. Un second passage du cron — ou une reprise
  // après une coupure au milieu de la boucle — ne peut donc pas redistribuer
  // les coffres à des membres déjà servis. Marquer le clan à la fin, comme
  // avant, laissait exactement cette porte ouverte.
  const locked = await Clan.findOneAndUpdate(
    { _id: clan._id, resolved: false },
    { $set: { resolved: true } }
  ).lean<any>();
  if (!locked) return 0; // déjà réglé par un autre passage

  const members = await ClanMember.find({ clan: clan._id })
    .select('user totalPoints')
    .sort({ totalPoints: -1 })
    .lean<any[]>();

  if (members.length === 0) return 0;

  const tier = Math.min(6, Math.max(1, clan.tier));
  const rewards = REWARDS_BY_TIER[tier] ?? REWARDS_BY_TIER[1];
  const mvpId = members[0].user.toString();

  // Reliquat : 20 % du trésor non dépensé, rendu en points au prorata
  const totalPoints = members.reduce((s, m) => s + (m.totalPoints || 0), 0);
  const leftoverPool = Math.floor((clan.resources ?? 0) * LEFTOVER_RATE);

  const { addPointsWithBoost } = await import('@/lib/pointsService');
  const { NotificationService } = await import('@/lib/notificationService');

  for (const m of members) {
    const userId = m.user.toString();
    const isMvp = userId === mvpId;
    const contributed = (m.totalPoints || 0) > 0;

    // --- coffres (vainqueur uniquement) ---
    if (outcome === 'win') {
      const chests = isMvp ? rewards.mvp : rewards.winner;
      for (const type of chests) {
        try {
          await grantChest(userId, type);
        } catch (err) {
          console.error('[Clans] Erreur ouverture coffre:', err);
        }
      }
    } else if (contributed) {
      // --- compensation (perdants et égalité) ---
      // Conditionnée à une contribution réelle : sinon la compensation
      // deviendrait un revenu passif pour les enrôlés inactifs.
      try {
        await addPointsWithBoost(userId, rewards.loserPoints, 'completeQuiz');
      } catch (err) {
        console.error('[Clans] Erreur points de compensation:', err);
      }
    }

    // --- reliquat du trésor ---
    if (leftoverPool > 0 && totalPoints > 0 && contributed) {
      const share = Math.floor((leftoverPool * (m.totalPoints || 0)) / totalPoints);
      if (share > 0) {
        try {
          await addPointsWithBoost(userId, share, 'completeQuiz');
        } catch { /* le reliquat est un bonus, il ne doit rien bloquer */ }
      }
    }

    // --- rang ---
    // Le meilleur contributeur du clan perdant conserve sa place.
    let delta = 0;
    if (outcome === 'win') delta = 1;
    else if (outcome === 'loss' && !isMvp) delta = -1;

    await UserLeague.findOneAndUpdate(
      { user: oid(userId) },
      [
        {
          $set: {
            tier: {
              $max: [1, { $min: [6, { $add: [{ $ifNull: ['$tier', 1] }, delta] }] }]
            },
            wins: { $add: [{ $ifNull: ['$wins', 0] }, outcome === 'win' ? 1 : 0] },
            losses: { $add: [{ $ifNull: ['$losses', 0] }, outcome === 'loss' ? 1 : 0] },
            mvpCount: { $add: [{ $ifNull: ['$mvpCount', 0] }, isMvp ? 1 : 0] },
            lastSeason: clan.season,
            updatedAt: now
          }
        },
        { $set: { bestTier: { $max: ['$bestTier', '$tier'] } } }
      ],
      { upsert: true }
    );

    // --- badges de victoire ---
    // Apres la mise a jour du rang : les badges clan_win lisent UserLeague.wins.
    if (outcome === 'win') {
      try {
        const { BadgeService } = await import('@/lib/badgeService');
        await BadgeService.triggerBadgeCheck(userId);
      } catch (err) {
        console.error('[Clans] Erreur verification badges:', err);
      }
    }

    // --- notification ---
    try {
      const title =
        outcome === 'win' ? 'Guerre remportée !'
        : outcome === 'draw' ? 'Guerre : égalité'
        : 'Guerre perdue';
      const message =
        outcome === 'win'
          ? `${clan.name} l'emporte ! ${isMvp ? 'Tu es le meilleur combattant du clan — coffre exceptionnel.' : 'Ton coffre t\'attend.'}`
          : outcome === 'draw'
            ? `${clan.name} termine à égalité. Tu gardes ton rang et reçois ${rewards.loserPoints} points.`
            : isMvp
              ? `${clan.name} est tombé, mais tu as porté le clan : tu conserves ton rang.`
              : `${clan.name} est tombé. Tu reçois ${rewards.loserPoints} points de compensation.`;

      await NotificationService.createNotification({
        type: 'clan_result',
        recipientId: userId,
        senderId: userId,
        relatedEntityType: 'clan',
        relatedEntityId: clan._id.toString(),
        title,
        message
      });
    } catch (err) {
      console.error('[Clans] Erreur notification résultat:', err);
    }
  }

  return members.length;
}

/** Nom lisible d'un rang. */
export function tierName(tier: number): string {
  return TIERS[Math.min(TIERS.length, Math.max(1, tier)) - 1];
}
