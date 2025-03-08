import dbConnect from "../src/lib/mongodb";
import Course from "../src/models/Course";

async function main() {
    try {
        // 1) Connexion à la base
        await dbConnect();

        // 2) Mise à jour : pour tout cours qui n'a pas "sections",
        // on ajoute un tableau vide.
        const result = await Course.updateMany(
            { sections: { $exists: false } },
            { $set: { sections: [] } }
        );

        console.log("Documents mis à jour :", result.modifiedCount);

        // 3) Fin du script
        process.exit(0);
    } catch (err) {
        console.error("Erreur lors de la mise à jour des cours :", err);
        process.exit(1);
    }
}

main();
