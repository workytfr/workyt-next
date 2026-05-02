import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Mentions légales | Workyt",
    description:
        "Mentions légales du site Workyt : éditeur (asso loi 1901), hébergeur, propriété intellectuelle et obligations légales.",
    alternates: { canonical: "https://workyt.fr/mentions-legales" },
    openGraph: {
        title: "Mentions légales | Workyt",
        description: "Informations légales obligatoires du site workyt.fr.",
        url: "https://workyt.fr/mentions-legales",
        siteName: "Workyt",
        type: "website",
        locale: "fr_FR",
    },
    robots: { index: true, follow: true },
};

export default function MentionsLegalesPage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <nav aria-label="Fil d'Ariane" className="mb-6 text-sm text-gray-500">
                <Link href="/" className="hover:text-orange-500">Accueil</Link>
                {" › "}
                <span className="text-gray-900">Mentions légales</span>
            </nav>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-8">
                Mentions légales
            </h1>

            <section className="prose prose-gray max-w-none">
                <h2>Éditeur du site</h2>
                <p>
                    Le site <strong>workyt.fr</strong> est édité par l'association{" "}
                    <strong>Workyt</strong>, association loi 1901 à but non lucratif déclarée
                    en préfecture en mars 2022.
                </p>
                <ul>
                    <li><strong>Nom :</strong> Workyt</li>
                    <li><strong>Forme juridique :</strong> Association loi du 1er juillet 1901</li>
                    <li><strong>Date de création :</strong> mars 2020 (déclaration officielle en mars 2022)</li>
                    <li>
                        <strong>Annonce officielle :</strong>{" "}
                        <a
                            href="https://www.journal-officiel.gouv.fr/pages/associations-detail-annonce/?q.id=id:202200100800"
                            className="text-orange-500 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Journal Officiel — id 202200100800
                        </a>
                    </li>
                    <li><strong>Email :</strong> <a href="mailto:admin@workyt.fr" className="text-orange-500 hover:underline">admin@workyt.fr</a></li>
                </ul>

                <h2>Hébergement</h2>
                <p>
                    Le site est hébergé sur les infrastructures de Vercel et Cloudflare.
                </p>
                <ul>
                    <li><strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
                    <li><strong>Cloudflare, Inc.</strong> — 101 Townsend St, San Francisco, CA 94107, USA</li>
                </ul>

                <h2>Propriété intellectuelle</h2>
                <p>
                    Le contenu publié sur Workyt (cours, fiches, réponses au forum) est créé
                    par les bénévoles et la communauté. Sauf mention contraire, l'ensemble
                    des éléments du site (textes, images, design, code) est protégé au titre
                    du droit d'auteur. Toute reproduction, redistribution ou exploitation
                    commerciale sans autorisation préalable est interdite.
                </p>
                <p>
                    Les contributions des bénévoles sont mises à disposition à des fins
                    d'usage pédagogique gratuit. Pour tout autre usage, merci de nous
                    contacter à <a href="mailto:admin@workyt.fr" className="text-orange-500 hover:underline">admin@workyt.fr</a>.
                </p>

                <h2>Données personnelles</h2>
                <p>
                    Workyt traite les données personnelles de ses utilisateurs dans le respect
                    du RGPD. Pour plus de détails, consulte notre{" "}
                    <Link href="/politique-confidentialite" className="text-orange-500 hover:underline">
                        politique de confidentialité
                    </Link>.
                </p>

                <h2>Cookies</h2>
                <p>
                    Le site utilise un nombre minimal de cookies, uniquement à des fins
                    techniques (session, authentification) ou de mesure d'audience anonyme
                    (Umami). Aucun cookie publicitaire ou de tracking commercial.
                </p>

                <h2>Signaler un contenu</h2>
                <p>
                    Tout contenu publié par la communauté est modéré. Pour signaler un
                    contenu inapproprié, utilise le bouton "Signaler" présent sur chaque
                    page, ou contacte-nous à{" "}
                    <a href="mailto:admin@workyt.fr" className="text-orange-500 hover:underline">admin@workyt.fr</a>.
                </p>
            </section>
        </main>
    );
}
