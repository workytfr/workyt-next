// Compte de test pour essayer « Se connecter avec Workyt » en LOCAL.
// Refuse toute base qui n'est pas sur la machine (jamais la production).
//   MONGODB_URI=mongodb://127.0.0.1:27018/workyt-test node scripts/oidc-dev-user.mjs
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI || "";
const host = (() => {
    try {
        return new URL(uri.replace(/^mongodb(\+srv)?:\/\//, "http://")).hostname;
    } catch {
        return "";
    }
})();
if (!["127.0.0.1", "localhost"].includes(host)) {
    console.error(`Refusé : base non locale (« ${host || "aucune"} »).`);
    process.exit(1);
}

await mongoose.connect(uri);
const users = mongoose.connection.collection("users");
const password = await bcrypt.hash("motdepasse-test", 10);
const now = new Date();
for (const u of [
    { email: "admin.test@workyt.local", username: "nadir_test", name: "Nadir Test", role: "Admin", isAdmin: true },
    { email: "eleve.test@workyt.local", username: "eleve_test", name: "Élève Test", role: "Apprenti", isAdmin: false },
]) {
    await users.updateOne({ email: u.email }, { $set: { ...u, password, verified: true, points: 20, badges: [], bio: "", updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
}
// Repart de zéro : l'écran d'autorisation s'affichera de nouveau
const ids = (await users.find({ email: /@workyt\.local$/ }).project({ _id: 1 }).toArray()).map((u) => u._id);
await mongoose.connection.collection("oauthconsents").deleteMany({ user: { $in: ids } });
console.log("Comptes de test prêts (mot de passe : motdepasse-test), autorisations effacées.");
await mongoose.disconnect();
