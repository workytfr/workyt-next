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
                Dernière mise à jour : avril 2026
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
                    <li>Données techniques anonymes (navigateur, type d'appareil) via Umami</li>
                </ul>

                <h2>Pourquoi nous collectons ces données</h2>
                <ul>
                    <li><strong>Te fournir le service :</strong> compte utilisateur, sauvegarde de tes contributions, gamification.</li>
                    <li><strong>Améliorer la plateforme :</strong> mesure d'audience anonyme via Umami pour comprendre quelles pages sont utiles.</li>
                    <li><strong>Modération :</strong> détecter et empêcher les abus.</li>
                    <li><strong>Notifications :</strong> t'informer des réponses à tes questions (uniquement si tu l'as activé).</li>
                </ul>

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
                    <li><strong>Mesure d'audience anonyme</strong> via Umami : comptage des visiteurs sans tracking individuel.</li>
                </ul>
                <p>
                    Workyt n'utilise <strong>aucun cookie publicitaire</strong>, aucun
                    pixel de tracking commercial.
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
                    <li><strong>Vercel</strong> (hébergement)</li>
                    <li><strong>Cloudflare</strong> (CDN, protection DDoS)</li>
                    <li><strong>MongoDB Atlas</strong> (base de données)</li>
                    <li><strong>Cloudflare R2</strong> (stockage de fichiers)</li>
                    <li><strong>Umami</strong> (mesure d'audience anonyme)</li>
                    <li><strong>Mailchimp</strong> (envoi d'emails — uniquement si tu t'es inscrit)</li>
                </ul>

                <h2>Réclamations</h2>
                <p>
                    Si tu estimes que tes droits ne sont pas respectés, tu peux saisir
                    la <a href="https://www.cnil.fr/fr/plaintes" className="text-orange-500 hover:underline" target="_blank" rel="noopener">CNIL</a>.
                </p>
            </section>
        </main>
    );
}
