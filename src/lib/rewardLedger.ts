import Gem from "@/models/Gem";
import MushroomInventory from "@/models/MushroomInventory";
import MushroomTransaction from "@/models/MushroomTransaction";

/**
 * Crédits atomiques ($inc + upsert). Le schéma précédent — findOne, balance += x,
 * save() — perdait un gain sur deux quand deux récompenses arrivaient en même
 * temps, et deux créations simultanées du document levaient une erreur E11000.
 */
export async function creditGems(userId: unknown, amount: number): Promise<void> {
    if (!(amount > 0)) return;
    await Gem.findOneAndUpdate(
        { user: userId },
        { $inc: { balance: amount, totalEarned: amount }, $setOnInsert: { totalSpent: 0 } },
        { upsert: true, setDefaultsOnInsert: true },
    );
}

export async function creditMushrooms(userId: unknown, amount: number, source: string): Promise<void> {
    if (!(amount > 0)) return;
    await MushroomInventory.findOneAndUpdate(
        { user: userId },
        { $inc: { balance: amount, totalEarned: amount }, $setOnInsert: { totalUsed: 0 } },
        { upsert: true, setDefaultsOnInsert: true },
    );
    await MushroomTransaction.create({ user: userId, type: "earn", amount, source });
}
