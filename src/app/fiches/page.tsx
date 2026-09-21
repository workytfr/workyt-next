import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PAGE_CONTAINER, Eyebrow } from "@/components/wk/primitives";
import { subjectToSlug } from "@/utils/subjectSlug";
import { FicheActions } from "./_components/ficheUi";
import dbConnect from "@/lib/mongodb";
import Revision from "@/models/Revision";
import { buildIdSlug } from "@/utils/slugify";
import FichesPageClient from "./_components/FichesPageClient";

export const metadata: Metadata = {
    title: "Fiches de révision gratuites | Brevet, Bac, examens | Workyt",
    description:
        "Toutes les fiches de révision gratuites de la communauté Workyt : mathématiques, français, SVT, physique-chimie, histoire-géographie, SES, philosophie. Brevet, Bac, examens du supérieur — révise sans pub.",
    keywords:
        "fiches de révision, révision brevet, révision bac, fiches gratuites, mathématiques, physique, français, histoire, SVT, SES, philosophie, lycée, collège",
    alternates: { canonical: "https://workyt.fr/fiches" },
    openGraph: {
        title: "Fiches de révision gratuites | Workyt",
        description: "Fiches de révision gratuites par la communauté Workyt pour réussir Brevet, Bac et examens.",
        url: "https://workyt.fr/fiches",
        siteName: "Workyt",
        type: "website",
        locale: "fr_FR",
        images: [{ url: "https://workyt.fr/workytfiche.png", width: 1200, height: 630, alt: "Fiches de révision Workyt" }],
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt_fr",
        title: "Fiches de révision gratuites | Workyt",
        description: "Fiches de révision gratuites pour Brevet, Bac et examens.",
        images: ["https://workyt.fr/workytfiche.png"],
    },
    robots: { index: true, follow: true },
};

export const revalidate = 3600;

async function getRecentFiches() {
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout DB")), 5000)),
        ]);
        return await Revision.find({})
            .select("_id title slug content subject level createdAt updatedAt")
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(12)
            .lean();
    } catch (err) {
        console.error("/fiches getRecentFiches DB error:", err);
        return [];
    }
}

export default async function FichesPage() {
    const recentFiches = await getRecentFiches();

    const collectionLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Fiches de révision gratuites | Workyt",
        url: "https://workyt.fr/fiches",
        description:
            "Catalogue des fiches de révision gratuites de la communauté Workyt. Brevet, Bac et examens du supérieur.",
        inLanguage: "fr",
        isPartOf: { "@type": "WebSite", name: "Workyt", url: "https://workyt.fr" },
        publisher: {
            "@type": "Organization",
            name: "Workyt",
            url: "https://workyt.fr",
            logo: { "@type": "ImageObject", url: "https://workyt.fr/apple-touch-icon.png" },
        },
        hasPart: recentFiches.map((f: any) => ({
            "@type": "LearningResource",
            name: f.title,
            url: `https://workyt.fr/fiches/${buildIdSlug(f._id.toString(), f.slug || f.title)}`,
            inLanguage: "fr",
            educationalLevel: f.level,
            about: { "@type": "Thing", name: f.subject },
            isAccessibleForFree: true,
        })),
    };

    const popular = [
        "Mathématiques",
        "Sciences de la Vie et de la Terre (SVT)",
        "Physique-Chimie",
        "Français",
        "Histoire-Géographie",
        "Philosophie",
    ];

    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />

            {/* En-tête — rendu côté serveur pour Googlebot */}
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                <div className={`${PAGE_CONTAINER} relative grid grid-cols-1 gap-10 pb-12 pt-12 md:pb-16 md:pt-16 lg:grid-cols-12 lg:items-end`}>
                    <div className="lg:col-span-7">
                        <Eyebrow>Fiches de révision</Eyebrow>
                        <h1 className="font-serif-display mt-5 text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.92]">
                            Fiches de révision
                            <br />
                            <span className="italic text-[rgba(26,21,18,0.45)]">gratuites</span>
                            <span className="text-[var(--wk-accent)]">.</span>
                        </h1>
                        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                            Synthèses, méthodes, formules : tout ce qu&apos;il faut pour le Brevet, le Bac et les examens du
                            supérieur. Rédigées et relues par la communauté de l&apos;association. Sans pub, sans abonnement.
                        </p>
                        <nav aria-label="Matières populaires" className="mt-6 flex flex-wrap gap-2">
                            {popular.map((s) => (
                                <Link
                                    key={s}
                                    href={`/fiches/matiere/${subjectToSlug(s)}`}
                                    className="wk-chip !py-1.5 transition hover:border-[var(--wk-accent)] hover:text-[#c24a0a]"
                                >
                                    {s}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="lg:col-span-5">
                        <FicheActions />
                    </div>
                </div>
            </header>

            {/* Catalogue interactif (filtres / recherche côté client) */}
            <Suspense fallback={null}>
                <FichesPageClient />
            </Suspense>
        </div>
    );
}
