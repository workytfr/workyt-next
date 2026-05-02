import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FileText } from "lucide-react";
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

    return (
        <div className="min-h-screen bg-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />

            {/* Hero SSR pour Googlebot */}
            <header className="border-b border-gray-100 bg-gradient-to-b from-orange-50/30 to-white">
                <div className="max-w-[1400px] mx-auto px-6 pt-12 pb-10 sm:pt-16 sm:pb-14">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 text-xs font-medium mb-4">
                            <FileText className="w-3.5 h-3.5" />
                            Bibliothèque de révisions
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                            Fiches de révision gratuites
                        </h1>
                        <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-4">
                            Synthèses, méthodes, formules — tout ce qu'il faut pour le Brevet, le
                            Bac et les examens du supérieur. Les fiches sont rédigées et relues
                            par les bénévoles de l'asso Workyt. Gratuit, sans pub, sans
                            abonnement.
                        </p>
                        <p className="text-sm text-gray-500">
                            Parcours par matière :{" "}
                            <Link href="/fiches/matiere/mathematiques" className="text-orange-500 hover:underline">Mathématiques</Link>,{" "}
                            <Link href="/fiches/matiere/sciences-de-la-vie-et-de-la-terre-svt" className="text-orange-500 hover:underline">SVT</Link>,{" "}
                            <Link href="/fiches/matiere/physique-chimie" className="text-orange-500 hover:underline">Physique-Chimie</Link>,{" "}
                            <Link href="/fiches/matiere/francais" className="text-orange-500 hover:underline">Français</Link>,{" "}
                            <Link href="/fiches/matiere/histoire-geographie" className="text-orange-500 hover:underline">Histoire-Géographie</Link>,{" "}
                            <Link href="/fiches/matiere/philosophie" className="text-orange-500 hover:underline">Philosophie</Link>.
                        </p>
                    </div>
                </div>
            </header>

            {/* Catalogue interactif (filtres / recherche client) */}
            <Suspense fallback={null}>
                <FichesPageClient />
            </Suspense>
        </div>
    );
}
