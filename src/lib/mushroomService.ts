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
   * Utilise un champignon pour activer un boost
   */
  static async useBoost(userId: string, boostType: BoostType): Promise<{
    success: boolean;
    boost?: { name: string; expiresAt: Date | null };
    message?: string;
  }> {
    await dbConnect();

    const config = BOOST_CONFIG[boostType];
    if (!config) {
      return { success: false, message: 'Type de boost invalide' };
    }

    // Verifier le solde
    const inventory = await MushroomInventory.findOne({ user: userId });
    if (!inventory || inventory.balance < config.cost) {
      return { success: false, message: 'Pas assez de champignons' };
    }

    // Verifier si un boost du meme type est deja actif (pour les boosts a duree)
    if (config.durationMs > 0) {
      const existingBoost = await ActiveBoost.findOne({
        user: userId,
        boostType,
        expiresAt: { $gt: new Date() }
      });
      if (existingBoost) {
        return { success: false, message: 'Un boost de ce type est deja actif' };
      }
    }

    // Deduire les champignons
    inventory.balance -= config.cost;
    inventory.totalUsed += config.cost;
    await inventory.save();

    // Enregistrer la transaction
    const tx = new MushroomTransaction({
      user: userId,
      type: 'use',
      amount: config.cost,
      source: 'quest', // source generique pour usage
      boostType
    });
    await tx.save();

    // Creer le boost actif
    let expiresAt: Date | null = null;
    if (config.durationMs > 0) {
      expiresAt = new Date(Date.now() + config.durationMs);
      const boost = new ActiveBoost({
        user: userId,
        boostType,
        multiplier: config.multiplier,
        expiresAt
      });
      await boost.save();
    } else {
      // Boost a usage unique : expire dans 24h max (sera consomme a l'usage)
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const boost = new ActiveBoost({
        user: userId,
        boostType,
        multiplier: config.multiplier,
        expiresAt
      });
      await boost.save();
    }

    return {
      success: true,
      boost: { name: config.name, expiresAt }
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
        expiresAt: b.expiresAt
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
