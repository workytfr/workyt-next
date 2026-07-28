import dbConnect from '@/lib/mongodb';
import UserCard from '@/models/UserCard';
import CalendarClaim from '@/models/CalendarClaim';
import Calendar from '@/models/Calendar';
import Chest from '@/models/Chest';
import ChestReward from '@/models/ChestReward';
import Gem from '@/models/Gem';

/**
 * Service du Plateau de l'Aventure : cartes hebdomadaires à collectionner.
 *
 * Règles :
 * - Le mois est découpé en segments de 7 jours (1-7, 8-14, 15-21, 22-28, 29-fin).
 * - Quand l'utilisateur a réclamé TOUTES les cases d'un segment, il gagne
 *   la carte de la semaine (une seule fois, index unique en base).
 * - Quand toutes les cartes du mois sont gagnées → coffre bonus
 *   (legendary, avec repli rare → common si non configuré).
 */

export interface WeekSegment {
  week: number;
  startDay: number; // jour du mois (1-based)
  endDay: number;
}

export interface CollectionInfo {
  cards: Array<{ week: number; theme: string; earnedAt: Date }>;
  totalWeeks: number;
  setCompleted: boolean;
}

export function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Découpe un mois en segments de 7 jours : [1-7, 8-14, 15-21, 22-28, 29-fin].
 */
export function getWeekSegments(year: number, monthIndex: number): WeekSegment[] {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const segments: WeekSegment[] = [];
  let week = 0;
  for (let start = 1; start <= lastDay; start += 7) {
    segments.push({ week, startDay: start, endDay: Math.min(start + 6, lastDay) });
    week++;
  }
  return segments;
}

function toMidnight(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/**
 * Ouvre un coffre bonus de set complet. Essaie epic, puis rare, puis common
 * (pas de legendary : récompense plafonnée volontairement).
 */
async function openSetCompletionChest(userId: string): Promise<any> {
  for (const chestType of ['epic', 'rare', 'common'] as const) {
    const chest = await Chest.findOne({ type: chestType, isActive: true });
    if (!chest || chest.possibleRewards.length === 0) continue;

    const totalWeight = chest.possibleRewards.reduce((sum: number, r: any) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedReward: any = null;
    for (const reward of chest.possibleRewards) {
      random -= reward.weight;
      if (random <= 0) {
        selectedReward = reward;
        break;
      }
    }
    if (!selectedReward) selectedReward = chest.possibleRewards[0];

    const chestReward = new ChestReward({
      user: userId,
      chest: chest._id,
      rewardType: selectedReward.type,
      amount: selectedReward.amount,
      cosmeticType: selectedReward.cosmeticType,
      cosmeticId: selectedReward.cosmeticId,
      claimed: false
    });
    await chestReward.save();

    if (selectedReward.type === 'points') {
      const { addPointsWithBoost } = await import('@/lib/pointsService');
      await addPointsWithBoost(userId, selectedReward.amount || 0, 'completeQuiz');
    } else if (selectedReward.type === 'gems') {
      let gem = await Gem.findOne({ user: userId });
      if (!gem) {
        gem = new Gem({ user: userId, balance: 0, totalEarned: 0, totalSpent: 0 });
      }
      gem.balance += selectedReward.amount || 0;
      gem.totalEarned += selectedReward.amount || 0;
      await gem.save();
    } else if (selectedReward.type === 'mushrooms') {
      const { MushroomService } = await import('@/lib/mushroomService');
      await MushroomService.addMushrooms(userId, selectedReward.amount || 0, 'chest');
    }

    chestReward.claimed = true;
    chestReward.claimedAt = new Date();
    await chestReward.save();

    return {
      chestType,
      rewardType: selectedReward.type,
      amount: selectedReward.amount,
      cosmeticType: selectedReward.cosmeticType,
      cosmeticId: selectedReward.cosmeticId
    };
  }
  return null;
}

/**
 * Récupère la collection de cartes d'un utilisateur pour un mois donné.
 */
export async function getCollection(userId: string, monthKey: string): Promise<CollectionInfo> {
  await dbConnect();

  const [year, month] = monthKey.split('-').map(Number);
  const segments = getWeekSegments(year, month - 1);

  const userCards = await UserCard.find({ user: userId, month: monthKey }).lean();

  const cards = userCards.map((c: any) => ({
    week: c.week,
    theme: c.theme || 'default',
    earnedAt: c.earnedAt
  }));

  return {
    cards,
    totalWeeks: segments.length,
    setCompleted: cards.length >= segments.length
  };
}

/**
 * Appelé après chaque claim réussi du calendrier.
 * Vérifie si le segment de la semaine est entièrement réclamé → carte gagnée.
 * Vérifie ensuite si le set du mois est complet → coffre bonus.
 */
export async function checkAndGrantCard(
  userId: string,
  date: Date
): Promise<{
  cardEarned?: { week: number; theme: string };
  setCompleted?: boolean;
  setChestReward?: any;
  setEquipmentLoot?: any;
}> {
  await dbConnect();

  const day = toMidnight(date);
  const year = day.getFullYear();
  const monthIndex = day.getMonth();
  const monthKey = getMonthKey(day);
  const segments = getWeekSegments(year, monthIndex);
  const dayOfMonth = day.getDate();

  const segment = segments.find(s => dayOfMonth >= s.startDay && dayOfMonth <= s.endDay);
  if (!segment) return {};

  // Carte déjà gagnée pour ce segment ? (chemin le plus fréquent : on sort tôt)
  const existing = await UserCard.exists({ user: userId, month: monthKey, week: segment.week });
  if (existing) return {};

  // Toutes les cases du segment sont-elles réclamées ?
  // countDocuments suffit : l'index unique {user, date} garantit 1 claim/jour.
  const segmentStart = new Date(year, monthIndex, segment.startDay);
  const segmentEnd = new Date(year, monthIndex, segment.endDay, 23, 59, 59, 999);
  const claimCount = await CalendarClaim.countDocuments({
    user: userId,
    date: { $gte: segmentStart, $lte: segmentEnd }
  });
  const requiredDays = segment.endDay - segment.startDay + 1;
  if (claimCount < requiredDays) return {}; // segment incomplet

  // Thème de la carte = thème spécial du segment, sinon du mois, sinon default
  const [segmentSpecial, monthSpecial] = await Promise.all([
    Calendar.findOne({ date: { $gte: segmentStart, $lte: segmentEnd }, isSpecial: true })
      .select('theme')
      .lean(),
    Calendar.findOne({
      date: { $gte: new Date(year, monthIndex, 1), $lte: new Date(year, monthIndex + 1, 0, 23, 59, 59) },
      isSpecial: true
    })
      .select('theme')
      .lean()
  ]);
  const theme = (segmentSpecial as any)?.theme || (monthSpecial as any)?.theme || 'default';

  // Créer la carte (l'index unique protège des doublons en cas de course)
  try {
    await new UserCard({ user: userId, month: monthKey, week: segment.week, theme }).save();
  } catch (err: any) {
    if (err?.code === 11000) return {}; // doublon : déjà gagnée
    throw err;
  }

  const result: {
    cardEarned?: { week: number; theme: string };
    setCompleted?: boolean;
    setChestReward?: any;
    setEquipmentLoot?: any;
  } = { cardEarned: { week: segment.week, theme } };

  // Set complet ? (cette carte était la dernière manquante)
  const cardCount = await UserCard.countDocuments({ user: userId, month: monthKey });
  if (cardCount >= segments.length) {
    result.setCompleted = true;
    result.setChestReward = await openSetCompletionChest(userId);

    // RPG : équipement legendary garanti pour le set complet
    try {
      const { grantSetCompletionLoot } = await import('@/lib/heroService');
      const loot = await grantSetCompletionLoot(userId);
      if (loot.granted && loot.equipment) {
        result.setEquipmentLoot = {
          id: loot.equipment.id,
          name: loot.equipment.name,
          emoji: loot.equipment.emoji,
          rarity: loot.equipment.rarity,
          autoEquipped: loot.autoEquipped
        };
      }
    } catch (err) {
      console.error('Erreur grantSetCompletionLoot:', err);
    }
  }

  return result;
}
