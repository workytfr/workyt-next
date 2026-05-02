import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GraduationCap } from "lucide-react";
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

    return (
        <div className="min-h-screen bg-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />

            {/* Hero — entièrement SSR pour Googlebot */}
            <header className="border-b border-gray-100">
                <div className="max-w-[1400px] mx-auto px-6 pt-12 pb-10 sm:pt-16 sm:pb-14">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium mb-4">
                            <GraduationCap className="w-3.5 h-3.5" />
                            Bibliothèque pédagogique
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                            Cours gratuits, collège, lycée et supérieur
                        </h1>
                        <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-4">
                            Workyt est une asso loi 1901 100 % bénévole. Ses cours sont rédigés
                            et relus par des bénévoles, structurés en chapitres avec exercices,
                            quiz et fiches associées. Sans pub, sans abonnement, sans collecte
                            de données — juste de la pédagogie.
                        </p>
                        <p className="text-sm text-gray-500">
                            Parcours par matière :{" "}
                            <Link href="/cours/matiere/mathematiques" className="text-orange-500 hover:underline">Mathématiques</Link>,{" "}
                            <Link href="/cours/matiere/francais" className="text-orange-500 hover:underline">Français</Link>,{" "}
                            <Link href="/cours/matiere/physique-chimie" className="text-orange-500 hover:underline">Physique-Chimie</Link>,{" "}
                            <Link href="/cours/matiere/sciences-de-la-vie-et-de-la-terre-svt" className="text-orange-500 hover:underline">SVT</Link>,{" "}
                            <Link href="/cours/matiere/histoire-geographie" className="text-orange-500 hover:underline">Histoire-Géographie</Link>,{" "}
                            <Link href="/cours/matiere/anglais" className="text-orange-500 hover:underline">Anglais</Link>.
                        </p>
                    </div>
                </div>
            </header>

            {/* Catalogue interactif (filtres client) */}
            <Suspense fallback={null}>
                <CoursesPageClient />
            </Suspense>
        </div>
    );
}
