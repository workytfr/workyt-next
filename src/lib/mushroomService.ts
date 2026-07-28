import MushroomInventory from '@/models/MushroomInventory';
import MushroomTransaction, { BoostType, MushroomSource } from '@/models/MushroomTransaction';
import ActiveBoost from '@/models/ActiveBoost';
import dbConnect from '@/lib/mongodb';

/**
 * Configuration des boosts disponibles
 */
export const BOOST_CONFIG: Record<BoostType, {
  name: string;
  description: string;
  cost: number;
  durationMs: number; // duree en ms (0 = usage unique)
  multiplier: number;
}> = {
  double_points: {
    name: 'Petit Boost',
    description: 'x1.25 points gagnes pendant 30 minutes',
    cost: 1,
    durationMs: 30 * 60 * 1000, // 30 min
    multiplier: 1.25
  },
  quest_extra: {
    name: 'Boost Quete',
    description: '1 quete quotidienne supplementaire pendant 24h',
    cost: 2,
    durationMs: 24 * 60 * 60 * 1000, // 24h
    multiplier: 1
  },
  lucky_chest: {
    name: 'Eclat de Chance',
    description: 'Ameliore legerement les odds du prochain coffre (+10% rarete)',
    cost: 3,
    durationMs: 0, // usage unique (1 coffre)
    multiplier: 1.10
  }
};

export class MushroomService {
  /**
   * Recupere le solde de champignons d'un utilisateur
   */
  static async getBalance(userId: string): Promise<{
    balance: number;
    totalEarned: number;
    totalUsed: number;
  }> {
    await dbConnect();

    const inventory = await MushroomInventory.findOne({ user: userId });
    return {
      balance: inventory?.balance || 0,
      totalEarned: inventory?.totalEarned || 0,
      totalUsed: inventory?.totalUsed || 0
    };
  }

  /**
   * Ajoute des champignons a un utilisateur
   */
  static async addMushrooms(userId: string, amount: number, source: MushroomSource): Promise<void> {
    await dbConnect();

    let inventory = await MushroomInventory.findOne({ user: userId });
    if (!inventory) {
      inventory = new MushroomInventory({
        user: userId,
        balance: 0,
        totalEarned: 0,
        totalUsed: 0
      });
    }

    inventory.balance += amount;
    inventory.totalEarned += amount;
    await inventory.save();

    const tx = new MushroomTransaction({
      user: userId,
      type: 'earn',
      amount,
      source
    });
    await tx.save();
  }

  /**
   * Débite des champignons de façon ATOMIQUE.
   *
   * Un findOne + save() classique perd une écriture quand deux requêtes
   * arrivent en même temps (les deux lisent le même solde). Ici la condition
   * `balance >= amount` fait partie de l'écriture : Mongo n'en laisse passer
   * qu'une seule.
   *
   * @returns le nouveau solde, ou null si les fonds étaient insuffisants
   */
  static async spendMushrooms(
    userId: string,
    amount: number,
    source: MushroomSource,
    boostType?: BoostType
  ): Promise<number | null> {
    await dbConnect();

    const inventory = await MushroomInventory.findOneAndUpdate(
      { user: userId, balance: { $gte: amount } },
      { $inc: { balance: -amount, totalUsed: amount } },
      { new: true }
    );
    if (!inventory) return null;

    await new MushroomTransaction({
      user: userId,
      type: 'use',
      amount,
      source,
      boostType
    }).save();

    return inventory.balance;
  }

  /**
   * Active un boost, ou PROLONGE celui déjà en cours au lieu de le refuser.
   * Le champignon n'est jamais gaspillé. Plafond : 2× la durée de base.
   */
  static async grantBoost(userId: string, boostType: BoostType): Promise<Date | null> {
    await dbConnect();

    const config = BOOST_CONFIG[boostType];
    if (!config) return null;

    // Usage unique (lucky_chest) : on empile simplement une charge de 24h
    if (config.durationMs === 0) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await new ActiveBoost({ user: userId, boostType, multiplier: config.multiplier, expiresAt }).save();
      return expiresAt;
    }

    const existing = await ActiveBoost.findOne({
      user: userId,
      boostType,
      expiresAt: { $gt: new Date() }
    });

    if (existing) {
      const maxEnd = Date.now() + config.durationMs * 2;
      const extended = Math.min(new Date(existing.expiresAt).getTime() + config.durationMs, maxEnd);
      existing.expiresAt = new Date(extended);
      await existing.save();
      return existing.expiresAt;
    }

    const expiresAt = new Date(Date.now() + config.durationMs);
    await new ActiveBoost({ user: userId, boostType, multiplier: config.multiplier, expiresAt }).save();
    return expiresAt;
  }

  /**
   * Utilise un champignon pour activer un boost
   */
  static async useBoost(userId: string, boostType: BoostType): Promise<{
    success: boolean;
    boost?: { name: string; expiresAt: Date | null };
    healed?: { hp: number; hpMax: number };
    mushroomsLeft?: number;
    message?: string;
  }> {
    await dbConnect();

    const config = BOOST_CONFIG[boostType];
    if (!config) {
      return { success: false, message: 'Type de boost invalide' };
    }

    // Débit atomique — protège du double-clic
    const mushroomsLeft = await this.spendMushrooms(userId, config.cost, 'quest', boostType);
    if (mushroomsLeft === null) {
      return { success: false, message: 'Pas assez de champignons' };
    }

    // Un boost déjà actif est prolongé, jamais refusé : le champignon est débité,
    // il doit toujours rendre quelque chose.
    const expiresAt = await this.grantBoost(userId, boostType);

    // Le champignon soigne AUSSI le héros : une seule dépense, les deux effets.
    // Ne doit jamais faire échouer le boost si le RPG est en panne.
    let healed: { hp: number; hpMax: number } | undefined;
    try {
      const { restoreHeroToFull } = await import('@/lib/heroService');
      healed = await restoreHeroToFull(userId);
    } catch (err) {
      console.error('Erreur soin héros via boost:', err);
    }

    return {
      success: true,
      boost: { name: config.name, expiresAt },
      healed,
      mushroomsLeft
    };
  }

  /**
   * Recupere les boosts actifs d'un utilisateur
   */
  static async getActiveBoosts(userId: string): Promise<Array<{
    boostType: BoostType;
    name: string;
    description: string;
    multiplier: number;
    expiresAt: Date;
    durationMs: number; // permet à l'UI d'afficher un anneau de progression
  }>> {
    await dbConnect();

    const boosts = await ActiveBoost.find({
      user: userId,
      expiresAt: { $gt: new Date() }
    });

    return boosts.map(b => {
      const config = BOOST_CONFIG[b.boostType as BoostType];
      return {
        boostType: b.boostType,
        name: config.name,
        description: config.description,
        multiplier: b.multiplier,
        expiresAt: b.expiresAt,
        durationMs: config.durationMs
      };
    });
  }

  /**
   * Verifie si un utilisateur a un boost actif d'un certain type
   */
  static async hasActiveBoost(userId: string, boostType: BoostType): Promise<boolean> {
    await dbConnect();

    const boost = await ActiveBoost.findOne({
      user: userId,
      boostType,
      expiresAt: { $gt: new Date() }
    });

    return !!boost;
  }

  /**
   * Consomme un boost a usage unique (quiz_hint, lucky_chest)
   * Retourne le multiplicateur si le boost existait
   */
  static async consumeSingleUseBoost(userId: string, boostType: BoostType): Promise<number> {
    await dbConnect();

    const boost = await ActiveBoost.findOneAndDelete({
      user: userId,
      boostType,
      expiresAt: { $gt: new Date() }
    });

    if (!boost) return 1;
    return boost.multiplier;
  }

  /**
   * Recupere le multiplicateur de points actif pour un utilisateur
   */
  static async getPointsMultiplier(userId: string): Promise<number> {
    await dbConnect();

    const boost = await ActiveBoost.findOne({
      user: userId,
      boostType: 'double_points',
      expiresAt: { $gt: new Date() }
    });

    return boost ? boost.multiplier : 1;
  }

  /**
   * Historique des transactions champignons
   */
  static async getHistory(userId: string, limit: number = 20): Promise<any[]> {
    await dbConnect();

    const transactions = await MushroomTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return transactions.map(tx => ({
      type: tx.type,
      amount: tx.amount,
      source: tx.source,
      boostType: tx.boostType,
      createdAt: tx.createdAt
    }));
  }
}
