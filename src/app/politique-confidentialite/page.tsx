import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Politique de confidentialité | Workyt",
    description:
        "Politique de confidentialité de Workyt : quelles données nous collectons, pourquoi, et comment exercer tes droits RGPD. Asso loi 1901, sans tracking commercial.",
    alternates: { canonical: "https://workyt.fr/politique-confidentialite" },
    openGraph: {
        title: "Politique de confidentialité | Workyt",
        description: "Comment Workyt traite tes données personnelles dans le respect du RGPD.",
        url: "https://workyt.fr/politique-confidentialite",
        siteName: "Workyt",
        type: "website",
        locale: "fr_FR",
    },
    robots: { index: true, follow: true },
};

export default function PolitiqueConfidentialitePage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <nav aria-label="Fil d'Ariane" className="mb-6 text-sm text-gray-500">
                <Link href="/" className="hover:text-orange-500">Accueil</Link>
                {" › "}
                <span className="text-gray-900">Politique de confidentialité</span>
            </nav>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
                Politique de confidentialité
            </h1>
            <p className="text-sm text-gray-500 mb-8">
                Dernière mise à jour : août 2026
            </p>

            <section className="prose prose-gray max-w-none">
                <h2>Notre engagement</h2>
                <p>
                    Workyt est une association loi 1901 à but non lucratif. Nous traitons
                    tes données personnelles dans le strict respect du{" "}
                    <strong>Règlement Général sur la Protection des Données (RGPD)</strong>.
                    Nous ne vendons jamais tes données, nous ne les transmettons pas à des
                    annonceurs, nous n'utilisons aucun cookie publicitaire.
                </p>

                <h2>Responsable du traitement</h2>
                <p>
                    Le responsable du traitement est l'association Workyt. Pour toute
                    question relative à tes données ou à ce document :{" "}
                    <a href="mailto:admin@workyt.fr" className="text-orange-500 hover:underline">admin@workyt.fr</a>.
                </p>

                <h2>Quelles données nous collectons</h2>
                <h3>Lors de l'inscription</h3>
                <ul>
                    <li>Nom d'utilisateur (pseudo)</li>
                    <li>Adresse email</li>
                    <li>Mot de passe (chiffré, jamais stocké en clair)</li>
                    <li>Niveau scolaire et matières (facultatif)</li>
                </ul>

                <h3>Lors de l'utilisation du site</h3>
                <ul>
                    <li>Contenus que tu publies (questions, réponses, fiches, cours)</li>
                    <li>Interactions (likes, commentaires, badges)</li>
                </ul>

                <h2>Pourquoi nous collectons ces données</h2>
                <ul>
                    <li><strong>Te fournir le service :</strong> compte utilisateur, sauvegarde de tes contributions, gamification.</li>
                    <li><strong>Modération :</strong> détecter et empêcher les abus.</li>
                    <li><strong>Notifications :</strong> t'informer des réponses à tes questions (uniquement si tu l'as activé).</li>
                </ul>

                <h2>Sur quelle base légale</h2>
                <p>
                    Le RGPD impose que chaque traitement repose sur une base légale
                    précise. Voici les nôtres, traitement par traitement :
                </p>
                <ul>
                    <li>
                        <strong>Ton compte, tes contributions, ta progression et la
                        gamification</strong> — exécution du contrat (article 6.1.b).
                        Sans ces données, le service ne peut pas fonctionner : il n&apos;y a
                        rien à te demander d&apos;accepter, c&apos;est le service lui-même.
                    </li>
                    <li>
                        <strong>Modération et sécurité</strong> — intérêt légitime
                        (article 6.1.f). Nous avons un intérêt légitime à garder le site
                        sûr pour un public en grande partie mineur.
                    </li>
                    <li>
                        <strong>Notifications par email</strong> — consentement
                        (article 6.1.a). Tu les actives, tu les désactives, quand tu veux.
                    </li>
                    <li>
                        <strong>Newsletter</strong> — consentement (article 6.1.a). Tu
                        peux le retirer à tout moment, via le lien de désinscription
                        présent dans chaque email.
                    </li>
                    <li>
                        <strong>Cookies de session</strong> — strictement nécessaires au
                        fonctionnement du site, donc dispensés de consentement. Nous
                        n&apos;en posons aucun autre.
                    </li>
                    <li>
                        <strong>Logs techniques</strong> — intérêt légitime : diagnostic
                        des pannes et détection des abus.
                    </li>
                </ul>
                <p>
                    Retirer un consentement n&apos;a aucun effet sur ce qui a été fait
                    avant, et ne te fait jamais perdre l&apos;accès au site : seules les
                    fonctions concernées s&apos;arrêtent.
                </p>

                <h2>Si tu as moins de 15 ans</h2>
                <p>
                    Workyt s&apos;adresse aux collégiens et aux lycéens : une grande
                    partie de nos membres sont mineurs, et c&apos;est assumé. Voici ce que
                    ça change.
                </p>
                <p>
                    <strong>Pour ton compte et l&apos;usage du site</strong>, aucune
                    autorisation parentale n&apos;est requise : la base légale est
                    l&apos;exécution du contrat, pas le consentement.
                </p>
                <p>
                    <strong>Pour la newsletter</strong>, c&apos;est différent. En France,
                    la majorité numérique est fixée à 15 ans : en dessous de cet âge, un
                    consentement doit être donné avec un titulaire de l&apos;autorité
                    parentale. L&apos;inscription à la newsletter est donc réservée aux
                    membres de <strong>15 ans ou plus</strong>. Si tu as moins de 15 ans et
                    que tu souhaites la recevoir, un de tes parents peut nous écrire.
                </p>
                <p>
                    <strong>Ce qui est visible par les autres</strong> : ton pseudo et ce
                    que tu publies (questions, réponses, fiches, commentaires). Ton adresse
                    email n&apos;est jamais affichée. Nous te recommandons de{" "}
                    <strong>ne jamais publier d&apos;information personnelle</strong> —
                    nom complet, établissement, adresse, numéro de téléphone, comptes de
                    réseaux sociaux — ni dans tes contributions, ni dans ta biographie de
                    profil.
                </p>
                <p>
                    <strong>Workyt ne propose aucune messagerie privée.</strong> Aucun
                    membre ne peut t&apos;écrire en privé : tous les échanges se font
                    publiquement, là où ils peuvent être vus et signalés.
                </p>
                <p>
                    <strong>Si quelque chose ne va pas</strong>, utilise le bouton de
                    signalement présent sur les contenus, ou écris directement à{" "}
                    <a href="mailto:admin@workyt.fr" className="text-orange-500 hover:underline">
                        admin@workyt.fr
                    </a>
                    . Nous traitons en priorité tout signalement de harcèlement ou de
                    contenu inapproprié.
                </p>

                <h3>Aux parents</h3>
                <p>
                    En tant que titulaire de l&apos;autorité parentale, tu peux exercer
                    l&apos;ensemble des droits ci-dessous au nom de ton enfant : demander
                    l&apos;accès à ses données, leur rectification, ou la suppression de
                    son compte. Écris à{" "}
                    <a href="mailto:admin@workyt.fr" className="text-orange-500 hover:underline">
                        admin@workyt.fr
                    </a>{" "}
                    en indiquant le pseudo de ton enfant. Nous pourrons te demander un
                    justificatif de l&apos;autorité parentale avant d&apos;agir — c&apos;est
                    une protection pour l&apos;enfant, pas une formalité.
                </p>

                <h2>Tes droits RGPD</h2>
                <p>Conformément au RGPD, tu disposes des droits suivants :</p>
                <ul>
                    <li><strong>Accès :</strong> obtenir une copie de tes données.</li>
                    <li><strong>Rectification :</strong> corriger des données inexactes.</li>
                    <li><strong>Suppression :</strong> demander la suppression de ton compte et de tes données.</li>
                    <li><strong>Portabilité :</strong> recevoir tes données dans un format réutilisable.</li>
                    <li><strong>Opposition :</strong> t'opposer au traitement.</li>
                    <li><strong>Limitation :</strong> demander la limitation du traitement.</li>
                </ul>
                <p>
                    Pour exercer ces droits, écris à{" "}
                    <a href="mailto:admin@workyt.fr" className="text-orange-500 hover:underline">admin@workyt.fr</a>.
                    Nous répondons dans un délai maximum de 30 jours.
                </p>

                <h2>Cookies utilisés</h2>
                <ul>
                    <li><strong>Cookies de session :</strong> nécessaires à l'authentification (durée : session).</li>
                    <li><strong>Préférences :</strong> mémorisation de tes choix d'affichage (durée : 1 an).</li>
                </ul>
                <p>
                    Workyt n&apos;utilise <strong>aucun cookie publicitaire</strong>, aucun
                    pixel de tracking commercial, et <strong>aucun outil de mesure
                    d&apos;audience</strong>.
                </p>

                <h2>Conservation des données</h2>
                <ul>
                    <li>Compte actif : tant que tu utilises Workyt.</li>
                    <li>Compte inactif : 3 ans après la dernière connexion, puis anonymisation.</li>
                    <li>Logs techniques : 12 mois.</li>
                </ul>

                <h2>Sous-traitants</h2>
                <p>Pour faire fonctionner Workyt, nous utilisons :</p>
                <ul>
                    <li><strong>youss.dev</strong> (hébergement du site et du blog, en France)</li>
                    <li><strong>Cloudflare</strong> (DNS, CDN et protection DDoS en amont de l&apos;hébergeur)</li>
                    <li><strong>Sliplane</strong> (hébergement de la base de données, en Allemagne)</li>
                    <li><strong>Cloudflare R2</strong> (stockage des fichiers déposés)</li>
                    <li><strong>UploadThing</strong> (téléversement de fichiers depuis l&apos;éditeur)</li>
                    <li><strong>Mailchimp</strong> (envoi d&apos;emails — uniquement si tu t&apos;es inscrit)</li>
                </ul>

                <h2>Où sont hébergées tes données</h2>
                <p>
                    Le site, ainsi que le blog{" "}
                    <a href="https://blog.workyt.fr" className="text-orange-500 hover:underline" target="_blank" rel="noopener noreferrer">
                        blog.workyt.fr
                    </a>{" "}
                    et sa propre base de données, sont hébergés par YDev Services
                    (youss.dev) sur des serveurs situés{" "}
                    <strong>à Paris, en France</strong>.
                </p>
                <p>
                    La base de données principale du site est hébergée par Sliplane,{" "}
                    <strong>en Allemagne</strong>. Tout cela reste donc au sein de
                    l&apos;Union européenne.
                </p>
                <p>
                    En revanche, certains prestataires listés ci-dessus sont établis aux
                    États-Unis ou y disposent d&apos;infrastructures — notamment{" "}
                    <strong>Cloudflare</strong>, <strong>UploadThing</strong> et{" "}
                    <strong>Mailchimp</strong>. Les données qui transitent par eux
                    peuvent être traitées hors de l&apos;Union européenne, dans le cadre
                    des garanties prévues par le RGPD (clauses contractuelles types ou
                    certification au Data Privacy Framework selon le prestataire).
                </p>
                <p>
                    Pour toute question sur un transfert précis, écris-nous à{" "}
                    <a href="mailto:admin@workyt.fr" className="text-orange-500 hover:underline">
                        admin@workyt.fr
                    </a>
                    .
                </p>

                <h2>Réclamations</h2>
                <p>
                    Si tu estimes que tes droits ne sont pas respectés, tu peux saisir
                    la <a href="https://www.cnil.fr/fr/plaintes" className="text-orange-500 hover:underline" target="_blank" rel="noopener">CNIL</a>.
                </p>
            </section>
        </main>
    );
}
