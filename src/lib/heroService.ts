import dbConnect from '@/lib/mongodb';
import HeroProfile, { IHeroProfile } from '@/models/HeroProfile';
import HeroEquipment from '@/models/HeroEquipment';
import { getEquipment, rollBossLoot, rollEpicLoot, type EquipmentDef } from '@/lib/equipment';

/**
 * Service du héros RPG « Workyt Quest ».
 * XP, niveaux, HP, dégâts, potions (champignons), loot d'équipement.
 */

// ---- Formules ----
export function xpForLevel(level: number): number {
  return Math.round(50 * Math.pow(level, 1.5));
}

export const XP_REWARDS = {
  dailyVictory: 10,
  bossVictory: 50,
  critMultiplier: 1.5,
  questDaily: 15,
  questWeekly: 40,
  questMonthly: 80
} as const;

export interface HeroStats {
  hpMax: number;
  attack: number;
  defense: number;
}

export function computeStats(level: number, equipped: IHeroProfile['equipped']): HeroStats {
  let hpMax = 20 + 4 * level;
  let attack = 3 + level;
  let defense = 1 + Math.floor(level / 2);

  for (const slot of ['weapon', 'armor', 'amulet'] as const) {
    const id = equipped?.[slot];
    if (!id) continue;
    const def = getEquipment(id);
    if (!def) continue;
    if (slot === 'weapon') attack += def.stat;
    else if (slot === 'armor') defense += def.stat;
    else hpMax += def.stat;
  }

  return { hpMax, attack, defense };
}

function toMidnight(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/**
 * Récupère (ou crée) le héros d'un utilisateur.
 * Restaure les HP à fond si on a changé de jour.
 */
export async function getOrCreateHero(userId: string): Promise<IHeroProfile> {
  await dbConnect();

  // Upsert atomique : la page /recompenses appelle /api/hero depuis deux
  // composants en parallèle. Avec un findOne + new + save, les deux requêtes
  // créaient le héros en même temps → E11000 sur l'index unique → 500.
  let hero: IHeroProfile;
  try {
    hero = (await HeroProfile.findOneAndUpdate(
      { user: userId },
      {
        $setOnInsert: {
          user: userId,
          level: 1,
          xp: 0,
          hp: 24,
          dungeonKills: 0,
          lastHpReset: new Date()
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ))!;
  } catch (err: any) {
    if (err?.code !== 11000) throw err;
    hero = (await HeroProfile.findOne({ user: userId }))!; // course perdue : le doc existe
  }

  // Malus d'inactivité : le monstre a frappé pendant le sommeil du héros.
  // Appliqué AVANT la réanimation, pour qu'une longue absence puisse coucher
  // le héros et qu'il se réveille évanoui.
  await applyInactivityPenalty(hero);

  // Réanimation : uniquement si le héros est tombé à 0, et pas le jour même.
  // Les PV ne se rechargent PAS tous les jours — c'est une ressource longue
  // qui mesure les erreurs accumulées.
  const today = toMidnight(new Date());
  if (hero.hp <= 0 && toMidnight(new Date(hero.lastHpReset)) < today) {
    const stats = computeStats(hero.level, hero.equipped);
    hero.hp = stats.hpMax;
    hero.lastHpReset = new Date();
  }

  // Clamp des HP si l'équipement a changé les hpMax
  const stats = computeStats(hero.level, hero.equipped);
  if (hero.hp > stats.hpMax) hero.hp = stats.hpMax;

  // Marque le passage du jour (base du calcul d'inactivité)
  if (toMidnight(new Date(hero.lastActiveAt ?? 0)) < today) {
    hero.lastActiveAt = new Date();
  }

  if (hero.isModified()) await hero.save();
  return hero;
}

/**
 * « Le monstre a attaqué pendant ton sommeil. »
 *
 * Chaque jour SCOLAIRE manqué au-delà du premier coûte un coup de monstre et
 * 10 % de l'XP du niveau courant. Si l'XP passe sous zéro, le héros perd un
 * niveau. Les vacances scolaires ne comptent pas : sinon tous les élèves
 * perdraient un niveau chaque février.
 *
 * Mute le document sans le sauvegarder (getOrCreateHero s'en charge).
 */
async function applyInactivityPenalty(hero: IHeroProfile): Promise<void> {
  const last = hero.lastActiveAt ? new Date(hero.lastActiveAt) : null;
  if (!last) return;

  const { countSchoolDaysBetween } = await import('@/lib/schoolHolidays');
  const missed = countSchoolDaysBetween(last, new Date(), 14);

  // Tolérance : un jour manqué ne coûte rien, la vie arrive
  if (missed <= 1) return;

  const daysPenalized = missed - 1;
  const stats = computeStats(hero.level, hero.equipped);

  // Dégâts : un coup du monstre par jour manqué (approximé sur le monstre
  // « moyen » du mois — on ne rejoue pas l'historique jour par jour)
  const perHit = Math.max(1, Math.round(stats.hpMax / 3) - stats.defense);
  hero.hp = Math.max(0, hero.hp - perHit * daysPenalized);

  // Perte d'XP, avec descente de niveau si le solde passe sous zéro
  const xpLost = Math.round(xpForLevel(hero.level) * 0.1 * daysPenalized);
  hero.xp -= xpLost;
  while (hero.xp < 0 && hero.level > 1) {
    hero.level -= 1;
    hero.xp += xpForLevel(hero.level);
  }
  if (hero.xp < 0) hero.xp = 0; // plancher niveau 1
}

/**
 * Résumé de l'absence, pour l'écran de retour (« pendant ton absence… »).
 * Lecture seule : n'applique rien, getOrCreateHero l'a déjà fait.
 */
export async function getInactivityReport(userId: string) {
  const hero = await getOrCreateHero(userId);
  return {
    hp: hero.hp,
    fainted: hero.hp <= 0,
    level: hero.level
  };
}

/**
 * Version allégée de getHeroState : pas de lecture de l'inventaire d'équipement.
 * Pour les chemins chauds qui n'ont besoin que du niveau / des HP
 * (riposte du monstre, contrôle « héros évanoui » avant un claim).
 */
export async function getHeroCombatState(userId: string) {
  const hero = await getOrCreateHero(userId);
  const stats = computeStats(hero.level, hero.equipped);
  return {
    level: hero.level,
    hp: hero.hp,
    hpMax: stats.hpMax,
    attack: stats.attack,
    defense: stats.defense,
    fainted: hero.hp <= 0
  };
}

/**
 * État complet du héros pour l'API / l'UI.
 */
export async function getHeroState(userId: string) {
  const hero = await getOrCreateHero(userId);
  const stats = computeStats(hero.level, hero.equipped);

  const equippedDetails: Record<string, EquipmentDef | null> = {};
  for (const slot of ['weapon', 'armor', 'amulet'] as const) {
    const id = hero.equipped?.[slot];
    equippedDetails[slot] = id ? getEquipment(id) || null : null;
  }

  const inventory = await HeroEquipment.find({ user: userId }).lean();
  const ownedIds = inventory.map((i: any) => i.equipmentId);

  const xpCurrentLevel = xpForLevel(hero.level);

  return {
    level: hero.level,
    xp: hero.xp,
    xpForNext: xpCurrentLevel,
    xpProgress: Math.min(1, hero.xp / xpCurrentLevel),
    hp: hero.hp,
    hpMax: stats.hpMax,
    attack: stats.attack,
    defense: stats.defense,
    dungeonKills: hero.dungeonKills,
    fainted: hero.hp <= 0,
    equipped: equippedDetails,
    ownedEquipment: ownedIds
  };
}

/**
 * Applique un gain d'XP avec détection de level-up (plusieurs niveaux possibles).
 * Chaque niveau franchi donne des récompenses :
 * +10 pts/niv · 🍄 tous les 3 niv · 💎 tous les 5 niv · équipement tous les 10 niv.
 */
async function gainXp(hero: IHeroProfile, amount: number): Promise<{
  leveledUp: boolean;
  levelsGained: number;
  levelRewards?: { points: number; gems: number; mushrooms: number; equipment: boolean };
}> {
  hero.xp += Math.max(0, Math.round(amount));
  let levelsGained = 0;
  const rewards = { points: 0, gems: 0, mushrooms: 0, equipment: false };

  while (hero.xp >= xpForLevel(hero.level)) {
    hero.xp -= xpForLevel(hero.level);
    hero.level += 1;
    levelsGained++;
    rewards.points += 10;
    if (hero.level % 3 === 0) rewards.mushrooms += 1;
    if (hero.level % 5 === 0) rewards.gems += 2;
    if (hero.level % 10 === 0) rewards.equipment = true;
  }

  if (levelsGained > 0) {
    // Level-up : HP restaurés à fond (récompense classique de RPG)
    const stats = computeStats(hero.level, hero.equipped);
    hero.hp = stats.hpMax;
    hero.lastHpReset = new Date();
  }

  return { leveledUp: levelsGained > 0, levelsGained, levelRewards: levelsGained > 0 ? rewards : undefined };
}

/**
 * Victoire au combat (quiz résolu).
 * Critique si 1er essai (×1.5) · Boss si le 15 (×5 de base) · Combo streak (+2%/jour, max +60%).
 */
export async function recordVictory(
  userId: string,
  opts: { firstTry: boolean; isBoss: boolean; elapsedMs?: number | null }
): Promise<{ xpGained: number; critical: boolean; leveledUp: boolean; levelsGained: number; newLevel: number; fainted?: boolean; timeMultiplier?: number; levelRewards?: { points: number; gems: number; mushrooms: number; equipment: boolean } }> {
  const hero = await getOrCreateHero(userId);

  // Héros évanoui : la victoire compte (le quiz est résolu, la case du
  // calendrier se débloque) mais elle ne rapporte aucune XP tant qu'il
  // n'a pas été soigné avec un champignon.
  if (hero.hp <= 0) {
    return {
      xpGained: 0,
      critical: false,
      leveledUp: false,
      levelsGained: 0,
      newLevel: hero.level,
      fainted: true
    };
  }

  let xp = opts.isBoss ? XP_REWARDS.bossVictory : XP_REWARDS.dailyVictory;
  if (opts.firstTry) xp *= XP_REWARDS.critMultiplier;

  // Anti-triche : le temps de réponse module la récompense, jamais les PV
  const { xpTimeMultiplier } = await import('@/lib/dailyQuizService');
  const timeMultiplier = xpTimeMultiplier(opts.elapsedMs ?? null, hero.level);
  xp *= timeMultiplier;

  // L'attaque du héros booste l'XP : +2% par point d'ATK (plafond +100%)
  const stats = computeStats(hero.level, hero.equipped);
  xp *= 1 + Math.min(stats.attack, 50) * 0.02;

  // Combo streak
  try {
    const { StreakService } = await import('@/lib/streakService');
    const info = await StreakService.getStreakInfo(userId);
    const combo = 1 + Math.min(info.currentStreak, 30) * 0.02;
    xp *= combo;
  } catch (err) {
    console.error('Erreur combo streak:', err);
  }

  hero.dungeonKills += 1;
  const { leveledUp, levelsGained, levelRewards } = await gainXp(hero, xp);
  await hero.save();

  // Appliquer les récompenses de palier de niveau
  if (levelRewards) {
    try {
      const userIdStr = userId;
      if (levelRewards.points > 0) {
        const { addPointsWithBoost } = await import('@/lib/pointsService');
        await addPointsWithBoost(userIdStr, levelRewards.points, 'completeQuiz');
      }
      if (levelRewards.gems > 0) {
        const { default: GemModel } = await import('@/models/Gem');
        let gem = await GemModel.findOne({ user: userIdStr });
        if (!gem) gem = new GemModel({ user: userIdStr, balance: 0, totalEarned: 0, totalSpent: 0 });
        gem.balance += levelRewards.gems;
        gem.totalEarned += levelRewards.gems;
        await gem.save();
      }
      if (levelRewards.mushrooms > 0) {
        const { MushroomService } = await import('@/lib/mushroomService');
        await MushroomService.addMushrooms(userIdStr, levelRewards.mushrooms, 'event');
      }
      if (levelRewards.equipment) {
        await grantBossLoot(userIdStr);
      }
    } catch (err) {
      console.error('Erreur level rewards:', err);
    }
  }

  return {
    xpGained: Math.round(xp),
    critical: opts.firstTry,
    leveledUp,
    levelsGained,
    newLevel: hero.level,
    timeMultiplier,
    levelRewards
  };
}

/**
 * Défaite partielle (mauvaise réponse au quiz) : le monstre riposte.
 * Critique monstre : 20% (35% si pouvoir « brutal »). Poison : +2 dégâts.
 */
export async function recordDefeat(
  userId: string,
  monsterAttack: number,
  opts?: { power?: 'poison' | 'brutal' | null }
): Promise<{ damage: number; hp: number; fainted: boolean; critical: boolean; poisoned: boolean }> {
  const hero = await getOrCreateHero(userId);
  const stats = computeStats(hero.level, hero.equipped);

  const critChance = opts?.power === 'brutal' ? 0.35 : 0.2;
  const critical = Math.random() < critChance;
  const poisoned = opts?.power === 'poison';

  let damage = Math.max(1, monsterAttack - stats.defense);
  if (critical) damage = Math.round(damage * 1.5);
  if (poisoned) damage += 2; // le poison ignore une partie de l'armure

  hero.hp = Math.max(0, hero.hp - damage);
  await hero.save();

  return { damage, hp: hero.hp, fainted: hero.hp <= 0, critical, poisoned };
}

/**
 * XP gagnée sur un défi entre amis.
 *
 * Aucun dégât, aucune perte de PV : un ami ne doit pas pouvoir vider tes PV et
 * te bloquer ta case de calendrier. Le PvE (quiz du jour) reste la seule source
 * de dégâts du jeu.
 */
export async function grantChallengeXp(
  userId: string,
  amount: number
): Promise<{ xpGained: number; leveledUp: boolean; newLevel: number }> {
  try {
    const hero = await getOrCreateHero(userId);
    const { leveledUp } = await gainXp(hero, amount);
    await hero.save();
    return { xpGained: amount, leveledUp, newLevel: hero.level };
  } catch (err) {
    console.error('Erreur grantChallengeXp:', err);
    return { xpGained: 0, leveledUp: false, newLevel: 1 };
  }
}

/**
 * Lien avec les quêtes : une quête complétée donne de l'XP au héros.
 * (appelé depuis questService quand une quête passe à 'completed')
 */
export async function recordQuestCompleted(
  userId: string,
  questType: 'daily' | 'weekly' | 'monthly'
): Promise<{ xpGained: number; leveledUp: boolean }> {
  try {
    const hero = await getOrCreateHero(userId);
    const xp = questType === 'monthly' ? XP_REWARDS.questMonthly
      : questType === 'weekly' ? XP_REWARDS.questWeekly
      : XP_REWARDS.questDaily;
    const { leveledUp } = await gainXp(hero, xp);
    await hero.save();
    return { xpGained: xp, leveledUp };
  } catch (err) {
    console.error('Erreur recordQuestCompleted:', err);
    return { xpGained: 0, leveledUp: false };
  }
}

/**
 * Remet le héros à ses PV max. Ne touche pas aux champignons — c'est
 * l'appelant qui gère la dépense (soin direct ou activation d'un boost).
 */
export async function restoreHeroToFull(userId: string): Promise<{ hp: number; hpMax: number }> {
  const hero = await getOrCreateHero(userId);
  const stats = computeStats(hero.level, hero.equipped);

  if (hero.hp < stats.hpMax) {
    hero.hp = stats.hpMax;
    hero.lastHpReset = new Date(); // consomme la réanimation gratuite du jour
    await hero.save();
  }

  return { hp: hero.hp, hpMax: stats.hpMax };
}

/**
 * Potion : 1 champignon → PV au max ET activation du Petit Boost.
 *
 * Un champignon dépensé rend toujours les deux effets, dans les deux sens :
 * soigner active le boost, activer un boost soigne (voir useBoost).
 * Le joueur n'a donc jamais à arbitrer entre « me soigner » et « me booster ».
 */
export async function healWithMushroom(
  userId: string
): Promise<{
  success: boolean;
  message?: string;
  hp?: number;
  mushroomsLeft?: number;
  boost?: { name: string; expiresAt: Date | null };
}> {
  await dbConnect();

  const hero = await getOrCreateHero(userId);
  const stats = computeStats(hero.level, hero.equipped);
  if (hero.hp >= stats.hpMax) {
    return { success: false, message: 'Tes PV sont déjà au maximum !' };
  }

  const { MushroomService, BOOST_CONFIG } = await import('@/lib/mushroomService');

  // Débit atomique : deux clics rapides ne peuvent pas dépenser un seul champignon deux fois
  const mushroomsLeft = await MushroomService.spendMushrooms(userId, 1, 'hero', 'double_points');
  if (mushroomsLeft === null) {
    return { success: false, message: 'Pas assez de champignons 🍄' };
  }

  hero.hp = stats.hpMax;
  hero.lastHpReset = new Date();
  await hero.save();

  // Le même champignon déclenche le boost. Best-effort : si ça échoue,
  // le soin reste acquis (le joueur a déjà payé).
  let boost: { name: string; expiresAt: Date | null } | undefined;
  try {
    const expiresAt = await MushroomService.grantBoost(userId, 'double_points');
    boost = { name: BOOST_CONFIG.double_points.name, expiresAt };
  } catch (err) {
    console.error('Erreur activation boost via soin:', err);
  }

  return { success: true, hp: hero.hp, mushroomsLeft, boost };
}

/**
 * Donne un équipement au héros (skip si déjà possédé) + auto-équipe si meilleur.
 */
async function grantEquipment(
  userId: string,
  def: EquipmentDef
): Promise<{ granted: boolean; equipment?: EquipmentDef; duplicate?: boolean; autoEquipped?: boolean }> {
  await dbConnect();

  try {
    await new HeroEquipment({
      user: userId,
      equipmentId: def.id,
      slot: def.slot,
      rarity: def.rarity
    }).save();
  } catch (err: any) {
    if (err?.code === 11000) return { granted: false, duplicate: true };
    throw err;
  }

  // Auto-équipe si le slot est vide ou si l'item est meilleur
  const hero = await getOrCreateHero(userId);
  const currentId = hero.equipped?.[def.slot];
  const currentDef = currentId ? getEquipment(currentId) : undefined;
  let autoEquipped = false;
  if (!currentDef || def.stat > currentDef.stat) {
    hero.equipped = { ...hero.equipped, [def.slot]: def.id };
    await hero.save();
    autoEquipped = true;
  }

  return { granted: true, equipment: def, autoEquipped };
}

/**
 * Loot du boss du 15 (pool rare/epic/legendary).
 * En cas de doublon, on retente jusqu'à 3 fois.
 */
export async function grantBossLoot(userId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const def = rollBossLoot();
    const result = await grantEquipment(userId, def);
    if (result.granted) return result;
  }
  return { granted: false, duplicate: true };
}

/**
 * Loot epic garanti pour le set de cartes complet (pas de legendary : plafond volontaire).
 */
export async function grantSetCompletionLoot(userId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const def = rollEpicLoot();
    const result = await grantEquipment(userId, def);
    if (result.granted) return result;
  }
  return { granted: false, duplicate: true };
}
