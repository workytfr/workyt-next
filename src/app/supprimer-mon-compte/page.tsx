import { Metadata } from "next";
import Link from "next/link";
import DeleteAccountPanel from "./DeleteAccountPanel";

export const metadata: Metadata = {
    title: { absolute: "Supprimer mon compte | Workyt" },
    description:
        "Supprime ton compte Workyt depuis le site ou l'application : ce qui est effacé, ce qui est anonymisé, et comment obtenir de l'aide.",
    alternates: { canonical: "https://workyt.fr/supprimer-mon-compte" },
    openGraph: {
        title: "Supprimer mon compte | Workyt",
        description: "Comment supprimer ton compte Workyt et tes données personnelles.",
        url: "https://workyt.fr/supprimer-mon-compte",
        siteName: "Workyt",
        type: "website",
        locale: "fr_FR",
    },
    robots: { index: true, follow: true },
};

/**
 * Page publique de suppression de compte, celle que Google Play affiche dans
 * la fiche de l'application. Lisible sans être connecté ; la suppression
 * elle-même se fait dans DeleteAccountPanel après connexion.
 */
export default function SupprimerMonComptePage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <nav aria-label="Fil d'Ariane" className="mb-6 text-sm text-gray-500">
                <Link href="/" className="hover:text-orange-500">Accueil</Link>
                {" › "}
                <span className="text-gray-900">Supprimer mon compte</span>
            </nav>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
                Supprimer mon compte Workyt
            </h1>
            <p className="text-gray-600 mb-8">
                Tu peux supprimer ton compte Workyt à tout moment, depuis cette page ou
                depuis l&apos;application mobile Workyt. La
                suppression est <strong>immédiate et définitive</strong> : il n&apos;y a
                pas de délai de rétractation et le compte ne peut pas être restauré.
            </p>

            <section aria-labelledby="etapes" className="mb-8 rounded-3xl bg-[#fdfaf4] p-6 sm:p-7">
                <h2 id="etapes" className="text-xl font-bold text-gray-900">Comment supprimer ton compte</h2>
                <ol className="mt-4 space-y-3 text-sm text-gray-700">
                    <li>
                        <strong>Sur le site :</strong> clique sur « Se connecter pour supprimer mon compte »
                        ci-dessous, connecte-toi, puis tape <span className="font-mono">SUPPRIMER</span> et
                        valide. Tu restes sur cette page pendant toute la démarche.
                    </li>
                    <li>
                        <strong>Dans l&apos;application Workyt :</strong> ouvre l&apos;onglet{" "}
                        <strong>Profil</strong>, puis touche <strong>« Supprimer mon compte »</strong> en bas
                        de l&apos;écran et confirme.
                    </li>
                    <li>
                        <strong>Tu ne peux plus te connecter ?</strong> Écris à{" "}
                        <a href="mailto:admin@workyt.fr" className="text-orange-500 hover:underline">admin@workyt.fr</a>{" "}
                        en indiquant le pseudo du compte : nous le supprimons pour toi.
                    </li>
                </ol>
            </section>

            <DeleteAccountPanel />

            <section className="prose prose-gray max-w-none mt-12">
                <h2>Ce qui est supprimé</h2>
                <ul>
                    <li>Ton compte : pseudo, nom, adresse e-mail, mot de passe, liaison Discord, bio, rôles.</li>
                    <li>Ta photo de profil et ta personnalisation (avatar, couleurs, cadres).</li>
                    <li>Ta progression : cours suivis, quiz, compétences, série, quêtes, ligue, cartes, quiz du jour, calendrier.</li>
                    <li>Ton héros, ton inventaire, tes gemmes, tes champignons, tes points et leur historique.</li>
                    <li>Tes amis, tes défis en cours, tes favoris, ton profil scolaire, tes sessions Pomodoro.</li>
                    <li>Ta place dans ton clan (si tu en étais le capitaine, la place est libérée).</li>
                    <li>Tes notifications, tes appareils enregistrés pour les notifications push, les applications autorisées via « Se connecter avec Workyt ».</li>
                    <li>Tes copies d&apos;évaluation et leurs notes.</li>
                    <li>Si tu étais élève d&apos;un suivi personnalisé : le suivi est clos et vos échanges (messages, pièces jointes, notes) sont effacés.</li>
                    <li>Ton adhésion à l&apos;association, si tu étais adhérent.</li>
                </ul>

                <h2>Ce qui est anonymisé</h2>
                <p>
                    Pour que les discussions des autres membres gardent leur sens, tes
                    contributions publiques restent en ligne, mais elles ne sont plus
                    rattachées à toi : elles apparaissent sous le nom{" "}
                    <strong>« Utilisateur supprimé »</strong>, un compte commun qui ne
                    permet pas de remonter jusqu&apos;à toi.
                </p>
                <ul>
                    <li>Tes questions et réponses sur le forum.</li>
                    <li>Tes fiches de révision et tes commentaires.</li>
                    <li>Les cours, leçons, exercices et quiz que tu as rédigés ou corrigés (bénévoles).</li>
                    <li>Tes messages dans le tchat de clan (effacé de toute façon chaque nuit).</li>
                    <li>Si tu étais bénévole d&apos;un suivi : tes suivis en cours repassent dans la file pour qu&apos;un autre bénévole les reprenne, et tes messages restent visibles par l&apos;élève sous le nom « Utilisateur supprimé ».</li>
                    <li>Tes défis terminés, dans l&apos;historique de tes anciens adversaires.</li>
                </ul>
                <p>
                    Les « j&apos;aime » que tu as donnés sont retirés. Attention : le texte
                    de tes contributions n&apos;est pas modifié. Si tu y as écrit ton nom ou
                    d&apos;autres informations personnelles, supprime ces contenus avant
                    de supprimer ton compte, ou écris-nous pour que nous le fassions.
                </p>

                <h2>Besoin d&apos;aide ?</h2>
                <p>
                    Tu n&apos;arrives plus à te connecter, ou tu es parent et souhaites
                    supprimer le compte de ton enfant ? Écris à{" "}
                    <a href="mailto:admin@workyt.fr" className="text-orange-500 hover:underline">admin@workyt.fr</a>{" "}
                    en indiquant le pseudo du compte. Nous répondons dans un délai maximum
                    de 30 jours. Pour en savoir plus sur tes données, consulte notre{" "}
                    <Link href="/politique-confidentialite" className="text-orange-500 hover:underline">
                        politique de confidentialité
                    </Link>
                    .
                </p>
            </section>
        </main>
    );
}
