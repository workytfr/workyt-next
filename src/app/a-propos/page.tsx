import { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Heart, Shield, Users, Mail } from "lucide-react";

export const metadata: Metadata = {
    title: "À propos de Workyt — Asso loi 1901 d'entraide scolaire gratuite",
    description:
        "Workyt est une association loi 1901 d'entraide scolaire 100 % bénévole, sans pub, sans abonnement. Née en 2020 pendant le confinement, déclarée en mars 2022, elle aide collégiens et lycéens à apprendre gratuitement.",
    keywords:
        "association Workyt, asso loi 1901, entraide scolaire, bénévoles, mission, soutien scolaire gratuit, Workyt asso",
    alternates: { canonical: "https://workyt.fr/a-propos" },
    openGraph: {
        title: "À propos de Workyt — Asso d'entraide scolaire",
        description: "Mission, histoire et fonctionnement de l'asso loi 1901 derrière Workyt.",
        url: "https://workyt.fr/a-propos",
        siteName: "Workyt",
        type: "website",
        locale: "fr_FR",
        images: [{ url: "https://workyt.fr/default-thumbnail.png", width: 1200, height: 630, alt: "À propos de Workyt" }],
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt_fr",
        title: "À propos de Workyt",
        description: "Asso loi 1901 d'entraide scolaire gratuite, 100 % bénévole.",
    },
    robots: { index: true, follow: true },
};

export default function AProposPage() {
    const aboutLd = {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "À propos de Workyt",
        url: "https://workyt.fr/a-propos",
        inLanguage: "fr",
        isPartOf: { "@type": "WebSite", name: "Workyt", url: "https://workyt.fr" },
        mainEntity: {
            "@type": "EducationalOrganization",
            name: "Workyt",
            alternateName: "Asso Workyt",
            url: "https://workyt.fr",
            logo: { "@type": "ImageObject", url: "https://workyt.fr/apple-touch-icon.png", width: 180, height: 180 },
            description:
                "Association loi 1901 française d'entraide scolaire gratuite, fondée en 2020 et officiellement déclarée en mars 2022. Plateforme 100 % bénévole proposant cours, fiches de révision et forum d'aide aux devoirs pour collégiens, lycéens et étudiants du supérieur.",
            foundingDate: "2020",
            areaServed: { "@type": "Country", "name": "France" },
            inLanguage: "fr",
            isAccessibleForFree: true,
            sameAs: [
                "https://twitter.com/workyt_fr",
                "https://www.instagram.com/workyt/",
                "https://www.linkedin.com/company/workyt",
                "https://dc.gg/workyt",
            ],
            audience: { "@type": "EducationalAudience", educationalRole: "student" },
        },
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: "https://workyt.fr" },
            { "@type": "ListItem", position: 2, name: "À propos", item: "https://workyt.fr/a-propos" },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <main className="mx-auto max-w-3xl px-6 py-12">
                <nav aria-label="Fil d'Ariane" className="mb-6 text-sm text-gray-500">
                    <Link href="/" className="hover:text-orange-500">Accueil</Link>
                    {" › "}
                    <span className="text-gray-900">À propos</span>
                </nav>

                <header className="mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                        À propos de Workyt
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Une asso loi 1901, 100 % bénévole, qui rend l'entraide scolaire
                        accessible à toutes et tous.
                    </p>
                </header>

                <section className="mb-10 prose prose-gray max-w-none">
                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Notre mission</h2>
                    <p>
                        Workyt est une association loi 1901 française qui propose une
                        plateforme d'entraide scolaire <strong>gratuite</strong>,{" "}
                        <strong>sans publicité</strong>, <strong>sans abonnement</strong> et{" "}
                        <strong>sans collecte de données commerciales</strong>. Notre mission :
                        rendre les ressources pédagogiques accessibles à tous les élèves de
                        France, du collège au supérieur, indépendamment de leur situation
                        familiale ou financière.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-3">Notre histoire</h2>
                    <p>
                        Workyt est né en <strong>mars 2020</strong>, pendant le premier
                        confinement Covid-19. Devant la fracture éducative qui s'aggravait,
                        un petit groupe de bénévoles a lancé une plateforme communautaire pour
                        aider les élèves bloqués chez eux.
                    </p>
                    <p>
                        L'initiative a été officiellement déclarée en{" "}
                        <strong>association loi 1901</strong> en{" "}
                        <strong>mars 2022</strong>, formalisant son statut juridique et sa
                        gouvernance non lucrative.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-3">Comment Workyt fonctionne</h2>
                    <p>
                        Workyt s'articule autour de trois pôles, tous gratuits :
                    </p>
                    <ul>
                        <li>
                            <Link href="/cours" className="text-orange-500 hover:underline">
                                Les cours
                            </Link>{" "}
                            — bibliothèque pédagogique structurée en chapitres, par matière et
                            par niveau, rédigée et relue par les bénévoles.
                        </li>
                        <li>
                            <Link href="/fiches" className="text-orange-500 hover:underline">
                                Les fiches de révision
                            </Link>{" "}
                            — synthèses rapides ciblées sur les notions du programme officiel
                            (Bulletin Officiel de l'Éducation Nationale).
                        </li>
                        <li>
                            <Link href="/forum" className="text-orange-500 hover:underline">
                                Le forum d'aide aux devoirs
                            </Link>{" "}
                            — questions/réponses entre élèves et bénévoles, modéré pour
                            garantir la qualité des réponses.
                        </li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-3">Nos engagements</h2>
                    <ul>
                        <li><strong>Gratuit pour toujours</strong> : aucun abonnement, aucun freemium.</li>
                        <li><strong>Zéro pub</strong> : aucune publicité commerciale sur la plateforme.</li>
                        <li><strong>Respect des données</strong> : pas de collecte de données comportementales à des fins commerciales (voir <Link href="/politique-confidentialite" className="text-orange-500 hover:underline">notre politique de confidentialité</Link>).</li>
                        <li><strong>Open et bénévole</strong> : la communauté est ouverte à tous les contributeurs motivés.</li>
                    </ul>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 mb-10">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                        <Heart className="w-5 h-5 text-orange-500 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-1">100 % bénévole</h3>
                        <p className="text-sm text-gray-600">Aucun salarié. L'asso fonctionne uniquement grâce à l'engagement des contributeurs.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                        <Shield className="w-5 h-5 text-orange-500 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-1">Asso loi 1901</h3>
                        <p className="text-sm text-gray-600">Statuts officiels déclarés en mars 2022 en préfecture.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                        <Users className="w-5 h-5 text-orange-500 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-1">Communauté ouverte</h3>
                        <p className="text-sm text-gray-600">Élèves, étudiants, profs, parents — toutes les contributions sont les bienvenues.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                        <GraduationCap className="w-5 h-5 text-orange-500 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-1">Du collège au supérieur</h3>
                        <p className="text-sm text-gray-600">Programmes officiels couverts pour 6e, 5e, 4e, 3e, 2nde, 1re, Tle, BTS, Licence.</p>
                    </div>
                </section>

                <section className="rounded-2xl border border-orange-100 bg-orange-50/50 p-6 mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-orange-500" />
                        Nous contacter
                    </h2>
                    <p className="text-sm text-gray-700 mb-3">
                        Pour toute question, partenariat ou demande presse :
                    </p>
                    <p className="text-sm">
                        <a href="mailto:admin@workyt.fr" className="text-orange-600 font-semibold hover:underline">
                            admin@workyt.fr
                        </a>
                    </p>
                    <p className="text-xs text-gray-500 mt-3">
                        Tu peux aussi nous rejoindre sur{" "}
                        <a href="https://dc.gg/workyt" className="text-orange-500 hover:underline" target="_blank" rel="noopener">Discord</a>,{" "}
                        <a href="https://twitter.com/workyt_fr" className="text-orange-500 hover:underline" target="_blank" rel="noopener">Twitter</a>,{" "}
                        <a href="https://www.instagram.com/workyt/" className="text-orange-500 hover:underline" target="_blank" rel="noopener">Instagram</a> ou{" "}
                        <a href="https://www.linkedin.com/company/workyt" className="text-orange-500 hover:underline" target="_blank" rel="noopener">LinkedIn</a>.
                    </p>
                </section>

                <section className="text-xs text-gray-500 border-t border-gray-100 pt-6">
                    <p>
                        <strong>Statut :</strong> Association loi 1901 (déclaration en mars 2022).
                        <br />
                        <strong>Annonce officielle :</strong>{" "}
                        <a
                            href="https://www.journal-officiel.gouv.fr/pages/associations-detail-annonce/?q.id=id:202200100800"
                            className="text-orange-500 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Voir au Journal Officiel
                        </a>
                        <br />
                        <strong>Siège social :</strong> France.
                    </p>
                </section>
            </main>
        </>
    );
}
