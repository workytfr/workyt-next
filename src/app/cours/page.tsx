import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PAGE_CONTAINER, Eyebrow } from "@/components/wk/primitives";
import { EntryChoice } from "@/app/forum/_components/forumUi";
import { subjectToSlug } from "@/utils/subjectSlug";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import { buildIdSlug } from "@/utils/slugify";
import CoursesPageClient from "./_components/CoursesPageClient";
import "@/app/cours/_components/styles/notion-theme.css";

export const metadata: Metadata = {
    title: "Cours gratuits collège, lycée et supérieur | Workyt",
    description:
        "Bibliothèque pédagogique gratuite : cours de mathématiques, français, SVT, physique-chimie, histoire-géographie, anglais et plus. Du collège au supérieur, par les bénévoles de l'asso Workyt.",
    keywords:
        "cours gratuits, cours en ligne, mathématiques, physique-chimie, SVT, français, histoire-géographie, anglais, collège, lycée, brevet, bac, soutien scolaire",
    alternates: { canonical: "https://workyt.fr/cours" },
    openGraph: {
        title: "Cours gratuits | Workyt",
        description: "Bibliothèque de cours gratuits du collège au supérieur, par les bénévoles de l'asso Workyt.",
        url: "https://workyt.fr/cours",
        siteName: "Workyt",
        type: "website",
        locale: "fr_FR",
        images: [{ url: "https://workyt.fr/workytcours.png", width: 1200, height: 630, alt: "Cours gratuits Workyt" }],
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt_fr",
        creator: "@workyt_fr",
        title: "Cours gratuits | Workyt",
        description: "Bibliothèque de cours gratuits du collège au supérieur sur Workyt.",
        images: ["https://workyt.fr/workytcours.png"],
    },
    robots: { index: true, follow: true },
};

export const revalidate = 3600;

async function getRecentCourses() {
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout DB")), 5000)),
        ]);
        return await Course.find({ status: "publie" })
            .select("_id title slug description matiere niveau updatedAt")
            .sort({ updatedAt: -1 })
            .limit(12)
            .lean();
    } catch (err) {
        console.error("/cours getRecentCourses DB error:", err);
        return [];
    }
}

export default async function CoursesPage() {
    const recentCourses = await getRecentCourses();

    const collectionLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Cours gratuits | Workyt",
        url: "https://workyt.fr/cours",
        description:
            "Bibliothèque pédagogique gratuite de l'asso Workyt. Cours du collège au supérieur, sans pub ni abonnement.",
        inLanguage: "fr",
        isPartOf: { "@type": "WebSite", name: "Workyt", url: "https://workyt.fr" },
        publisher: {
            "@type": "Organization",
            name: "Workyt",
            url: "https://workyt.fr",
            logo: { "@type": "ImageObject", url: "https://workyt.fr/apple-touch-icon.png" },
        },
        hasPart: recentCourses.map((c: any) => ({
            "@type": "Course",
            name: c.title,
            url: `https://workyt.fr/cours/${buildIdSlug(c._id.toString(), c.slug || c.title)}`,
            description: typeof c.description === "string" ? c.description.slice(0, 200) : undefined,
            educationalLevel: c.niveau,
            about: c.matiere,
            inLanguage: "fr",
            isAccessibleForFree: true,
            provider: { "@type": "Organization", name: "Workyt", url: "https://workyt.fr" },
        })),
    };

    const popular = [
        "Mathématiques",
        "Français",
        "Physique-Chimie",
        "Sciences de la Vie et de la Terre (SVT)",
        "Histoire-Géographie",
        "Anglais",
    ];

    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />

            {/* En-tête — entièrement rendu côté serveur pour Googlebot */}
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                <div className={`${PAGE_CONTAINER} relative grid grid-cols-1 gap-10 pb-12 pt-12 md:pb-16 md:pt-16 lg:grid-cols-12 lg:items-end`}>
                    <div className="lg:col-span-7">
                        <Eyebrow>Bibliothèque de cours</Eyebrow>
                        <h1 className="font-serif-display mt-5 text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.92]">
                            Cours gratuits,
                            <br />
                            <span className="italic text-[rgba(26,21,18,0.45)]">du collège au supérieur</span>
                            <span className="text-[var(--wk-accent)]">.</span>
                        </h1>
                        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                            Rédigés et relus par les bénévoles de l&apos;association, structurés en chapitres avec leçons,
                            exercices, quiz et fiches. Sans pub, sans abonnement, sans collecte de données.
                        </p>
                        <nav aria-label="Matières populaires" className="mt-6 flex flex-wrap gap-2">
                            {popular.map((s) => (
                                <Link
                                    key={s}
                                    href={`/cours/matiere/${subjectToSlug(s)}`}
                                    className="wk-chip !py-1.5 transition hover:border-[var(--wk-accent)] hover:text-[#c24a0a]"
                                >
                                    {s}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="lg:col-span-5">
                        <EntryChoice askHref="/forum/creer" />
                    </div>
                </div>
            </header>

            {/* Catalogue interactif (filtres côté client) */}
            <Suspense fallback={null}>
                <CoursesPageClient />
            </Suspense>
        </div>
    );
}
