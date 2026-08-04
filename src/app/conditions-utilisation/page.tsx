import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Conditions d'utilisation | Workyt",
    description:
        "Conditions générales d'utilisation de Workyt : services proposés, système de points et de badges, certification des fiches, règles du forum, modération et responsabilités.",
    alternates: { canonical: "https://workyt.fr/conditions-utilisation" },
    openGraph: {
        title: "Conditions d'utilisation | Workyt",
        description:
            "Règles d'usage de la plateforme Workyt : services, gamification, certification des contenus et modération.",
        url: "https://workyt.fr/conditions-utilisation",
        siteName: "Workyt",
        type: "website",
        locale: "fr_FR",
    },
    robots: { index: true, follow: true },
};

export default function ConditionsUtilisationPage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <nav aria-label="Fil d'Ariane" className="mb-6 text-sm text-gray-500">
                <Link href="/" className="hover:text-orange-500">
                    Accueil
                </Link>
                {" › "}
                <span className="text-gray-900">Conditions d&apos;utilisation</span>
            </nav>

            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
                Conditions d&apos;utilisation
            </h1>
            <p className="mb-8 text-sm text-gray-500">
                Dernière mise à jour : août 2026. Pour les informations sur
                l&apos;éditeur et l&apos;hébergeur, voir les{" "}
                <Link href="/mentions-legales" className="text-orange-500 hover:underline">
                    mentions légales
                </Link>
                . Pour le traitement des données, voir la{" "}
                <Link
                    href="/politique-confidentialite"
                    className="text-orange-500 hover:underline"
                >
                    politique de confidentialité
                </Link>
                .
            </p>

            <section className="prose prose-gray max-w-none">
                <h2>Acceptation des conditions</h2>
                <p>
                    L&apos;utilisation du site <strong>workyt.fr</strong> implique
                    l&apos;acceptation des présentes conditions. Elles peuvent être
                    modifiées à tout moment ; les utilisateurs sont invités à les
                    consulter régulièrement. Les modifications importantes sont
                    annoncées sur la plateforme.
                </p>
                <p>
                    Le site est normalement accessible en permanence. Une interruption
                    pour maintenance technique reste possible ; Workyt s&apos;efforce
                    alors de prévenir à l&apos;avance.
                </p>

                <h2>Services proposés</h2>
                <p>Workyt met à disposition, gratuitement et sans publicité :</p>
                <ul>
                    <li>
                        <strong>Cours et leçons :</strong> contenu éducatif structuré par
                        matière et par niveau
                    </li>
                    <li>
                        <strong>Fiches de révision :</strong> ressources créées par les
                        bénévoles et la communauté
                    </li>
                    <li>
                        <strong>Forum d&apos;entraide :</strong> questions-réponses avec
                        validation communautaire
                    </li>
                    <li>
                        <strong>Exercices et quiz :</strong> évaluations interactives
                    </li>
                    <li>
                        <strong>Points, badges et gemmes :</strong> gamification de la
                        participation
                    </li>
                    <li>
                        <strong>Certificats :</strong> attestations de participation et de
                        réussite
                    </li>
                </ul>
                <p>
                    Workyt s&apos;efforce de fournir des informations aussi exactes que
                    possible, sans pouvoir garantir l&apos;absence d&apos;omissions ou
                    d&apos;inexactitudes. Les contenus sont donnés à titre indicatif et
                    peuvent évoluer.
                </p>

                <h2>Compte utilisateur</h2>
                <p>
                    La consultation des cours, des fiches et du forum ne nécessite pas de
                    compte. Un compte est requis pour publier une fiche, poser une
                    question, suivre sa progression et accumuler des points.
                </p>
                <p>
                    L&apos;utilisateur est responsable de la confidentialité de ses
                    identifiants et des actions effectuées depuis son compte.
                </p>

                <h2>Points et gamification</h2>
                <p>
                    Le système de points récompense la contribution à la plateforme :
                </p>
                <ul>
                    <li>
                        <strong>Création d&apos;une fiche :</strong> 10 points
                    </li>
                    <li>
                        <strong>Like reçu sur une fiche :</strong> 5 points
                    </li>
                    <li>
                        <strong>Réponse validée sur le forum :</strong> points variables
                        selon la difficulté de la question
                    </li>
                    <li>
                        <strong>Réussite à un quiz :</strong> points selon la performance
                    </li>
                </ul>
                <p>
                    Les points servent à poser des questions sur le forum et à progresser
                    dans les niveaux. Les gemmes obtenues permettent uniquement de
                    personnaliser son profil : elles n&apos;achètent aucun contenu et ne
                    confèrent aucun avantage pédagogique. Aucun élément de gamification
                    n&apos;est convertible en argent et aucun ne peut être acheté.
                </p>

                <h2>Badges</h2>
                <p>
                    Les badges sont attribués automatiquement, selon des critères
                    identiques pour tous : progression (cours terminés, quiz réussis),
                    engagement (fiches créées, participation au forum), performance
                    (réponses validées) et contributions exceptionnelles. Ils existent en
                    quatre raretés : commun, rare, épique et légendaire.
                </p>

                <h2>Certification des fiches</h2>
                <ul>
                    <li>
                        <strong>Certifiée :</strong> rédigée par un bénévole de
                        l&apos;association
                    </li>
                    <li>
                        <strong>Vérifiée :</strong> rédigée par un membre de la communauté
                        puis relue par un bénévole
                    </li>
                    <li>
                        <strong>Non certifiée :</strong> rédigée par un membre de la
                        communauté, en attente de relecture
                    </li>
                </ul>
                <p>
                    Le statut est affiché sur chaque fiche. La certification est un
                    processus continu et ne constitue pas une garantie absolue
                    d&apos;exactitude.
                </p>

                <h2>Forum d&apos;entraide</h2>
                <p>
                    Poser une question engage des points. La communauté répond, et
                    l&apos;auteur de la question peut valider la réponse qui l&apos;a
                    aidé — ce qui crédite son auteur. Les échanges sont modérés.
                </p>
                <p>
                    Les questions et réponses publiées sur le forum sont{" "}
                    <strong>visibles publiquement</strong>. N&apos;y publie pas
                    d&apos;informations personnelles (nom complet, adresse, téléphone,
                    établissement précis).
                </p>

                <h2>Certificats et attestations</h2>
                <p>
                    Workyt délivre des certificats de participation, des certificats de
                    bénévolat et des attestations de réussite, générés automatiquement et
                    téléchargeables en PDF. Ces documents attestent d&apos;une activité
                    sur la plateforme ; ils ne constituent pas un diplôme et n&apos;ont
                    aucune valeur officielle reconnue par l&apos;Éducation nationale.
                </p>

                <h2>Règles de publication</h2>
                <p>
                    En publiant sur Workyt, l&apos;utilisateur s&apos;engage à ne pas
                    diffuser de contenu illicite, haineux, injurieux, diffamatoire,
                    pornographique, ni de contenu protégé par le droit d&apos;auteur sans
                    autorisation. Le partage de sujets d&apos;examen non publics et
                    l&apos;incitation à la triche sont interdits.
                </p>
                <p>
                    Concernant les fichiers déposés : l&apos;utilisateur est responsable
                    de leur contenu. Évite de téléverser des images contenant des données
                    de géolocalisation (EXIF GPS), qui restent extractibles par les
                    visiteurs.
                </p>

                <h2>Modération et sanctions</h2>
                <ul>
                    <li>
                        <strong>Modération automatique :</strong> détection du spam et des
                        contenus manifestement inappropriés
                    </li>
                    <li>
                        <strong>Modération humaine :</strong> une équipe examine les
                        contenus signalés
                    </li>
                    <li>
                        <strong>Signalement :</strong> tout utilisateur peut signaler un
                        contenu
                    </li>
                    <li>
                        <strong>Sanctions :</strong> progressives, de l&apos;avertissement
                        à la suppression du compte
                    </li>
                </ul>
                <p>
                    Workyt se réserve le droit de retirer sans préavis tout contenu
                    contrevenant à la loi française ou aux présentes conditions, et de
                    mettre en cause la responsabilité de son auteur.
                </p>

                <h2>Propriété intellectuelle</h2>
                <p>
                    Les éléments du site (textes, images, graphismes, logo, code) sont
                    protégés au titre du droit d&apos;auteur. Toute reproduction ou
                    exploitation non autorisée est interdite et constitue une contrefaçon
                    au sens des articles L.335-2 et suivants du Code de la propriété
                    intellectuelle. Pour toute demande :{" "}
                    <a
                        href="mailto:admin@workyt.fr"
                        className="text-orange-500 hover:underline"
                    >
                        admin@workyt.fr
                    </a>
                    .
                </p>
                <p>
                    <strong>Contenu des utilisateurs :</strong> tu conserves tes droits
                    sur ce que tu crées (fiches, réponses). En le publiant, tu accordes à
                    Workyt une licence non exclusive et gratuite de diffusion de ce
                    contenu dans le cadre des services de la plateforme.
                </p>

                <h2>Limitations de responsabilité</h2>
                <p>
                    Le site nécessite un navigateur récent et l&apos;activation de
                    JavaScript. Workyt ne peut être tenue responsable des dommages
                    matériels liés à l&apos;utilisation du site, ni des dommages indirects
                    consécutifs à son usage.
                </p>
                <p>
                    <strong>Contenu éducatif :</strong> malgré les efforts de relecture,
                    l&apos;exactitude de l&apos;ensemble des contenus ne peut être
                    garantie. Recoupe tes sources, en particulier avant une épreuve.
                </p>
                <p>
                    Le site contient des liens vers des sites tiers dont Workyt ne
                    contrôle pas le contenu et n&apos;assume pas la responsabilité.
                </p>

                <h2>Mineurs</h2>
                <p>
                    Workyt s&apos;adresse notamment à un public scolaire. Conformément à
                    l&apos;article 45 de la loi Informatique et Libertés, un mineur de
                    moins de <strong>15 ans</strong> ne peut consentir seul au traitement
                    de ses données : le consentement est donné conjointement avec celui
                    du titulaire de l&apos;autorité parentale.
                </p>
                <p>
                    Les parents et responsables légaux sont invités à accompagner
                    l&apos;usage de la plateforme par les plus jeunes. Pour toute demande
                    concernant le compte d&apos;un mineur, écris à{" "}
                    <a
                        href="mailto:admin@workyt.fr"
                        className="text-orange-500 hover:underline"
                    >
                        admin@workyt.fr
                    </a>
                    .
                </p>

                <h2>Données personnelles</h2>
                <p>
                    Le traitement des données est décrit dans la{" "}
                    <Link
                        href="/politique-confidentialite"
                        className="text-orange-500 hover:underline"
                    >
                        politique de confidentialité
                    </Link>
                    . En résumé : Workyt traite les informations de profil, les points,
                    les badges et l&apos;historique d&apos;activité pour faire
                    fonctionner la plateforme, n&apos;affiche aucune publicité et ne
                    revend aucune donnée.
                </p>
                <p>
                    <strong>Droits :</strong> accès, rectification, effacement,
                    portabilité et opposition s&apos;exercent à{" "}
                    <a
                        href="mailto:admin@workyt.fr"
                        className="text-orange-500 hover:underline"
                    >
                        admin@workyt.fr
                    </a>
                    . En cas de suppression de compte, les contenus publiés peuvent être
                    conservés sous forme anonymisée afin de préserver la cohérence des
                    discussions du forum.
                </p>

                <h2>Droit applicable</h2>
                <p>
                    Les présentes conditions sont soumises au droit français. En cas de
                    litige, et à défaut de résolution amiable, les tribunaux français
                    sont compétents.
                </p>
            </section>
        </main>
    );
}
