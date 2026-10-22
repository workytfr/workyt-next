import { jsonLd } from "@/lib/jsonLd";
import React, { Suspense } from "react";
import ForumPageClient from "./_components/ForumPageClient";
import QuestionCard, { type ForumQuestion } from "./_components/QuestionCard";
import { Metadata } from "next";
import { PAGE_CONTAINER, Eyebrow } from "@/components/wk/primitives";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import { buildIdSlug } from "@/utils/slugify";

export const metadata: Metadata = {
    title: { absolute: "Forum d'entraide scolaire | Workyt" },
    description: "Posez vos questions et obtenez de l'aide de la communauté Workyt. Forum d'entraide scolaire gratuit pour collégiens et lycéens : mathématiques, physique, français, histoire et plus.",
    keywords: "forum entraide scolaire, aide devoirs, questions réponses, mathématiques, physique, français, lycée, collège, bac, brevet",
    openGraph: {
        title: "Forum d'entraide scolaire | Workyt",
        description: "Posez vos questions et obtenez de l'aide de la communauté Workyt. Forum d'entraide scolaire gratuit.",
        url: "https://workyt.fr/forum",
        siteName: "Workyt",
        type: "website",
        locale: "fr_FR",
        images: [
            {
                url: "https://workyt.fr/default-thumbnail.png",
                width: 1200,
                height: 630,
                alt: "Forum Workyt",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Forum d'entraide scolaire | Workyt",
        description: "Posez vos questions et obtenez de l'aide de la communauté Workyt.",
        creator: "@workyt_fr",
    },
    alternates: {
        canonical: "https://workyt.fr/forum",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export const revalidate = 600;

/** Dernières questions, même forme que GET /api/forum/questions. */
async function getRecentQuestions(): Promise<ForumQuestion[]> {
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout DB")), 5000)),
        ]);
        const questions: any[] = await Question.find({})
            .populate({ path: "user", select: "username points image" })
            .sort({ createdAt: -1 })
            .limit(12)
            .lean();
        const counts = await Answer.aggregate([
            { $match: { question: { $in: questions.map((q) => q._id) } } },
            { $group: { _id: "$question", count: { $sum: 1 } } },
        ]);
        const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
        return JSON.parse(
            JSON.stringify(questions.map((q) => ({ ...q, answerCount: countMap.get(String(q._id)) ?? 0 }))),
        );
    } catch (err) {
        console.error("/forum getRecentQuestions DB error:", err);
        return [];
    }
}

/**
 * Rendu serveur du forum. ForumPageClient lit les filtres dans l'URL
 * (useSearchParams) : sur une page pré-rendue, tout ce qui est sous son
 * Suspense n'existe que côté navigateur. Le fallback ci-dessous est donc ce que
 * reçoivent Google et le premier affichage : en-tête + dernières questions,
 * avec de vrais liens, avant que la version interactive prenne le relais.
 */
function ForumServerFallback({ questions }: { questions: ForumQuestion[] }) {
    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                <div className={`${PAGE_CONTAINER} relative pb-12 pt-12 md:pb-16 md:pt-16`}>
                    <Eyebrow>Forum d&apos;entraide</Eyebrow>
                    <h1 className="font-serif-display mt-5 text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.92]">
                        Une question ?
                        <br />
                        <span className="italic text-[rgba(26,21,18,0.45)]">La communauté répond</span>
                        <span className="text-[var(--wk-accent)]">.</span>
                    </h1>
                    <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                        Pose ta question, aide les autres et gagne des points. Et si tu bloques souvent, un
                        bénévole de l&apos;association peut t&apos;accompagner personnellement.
                    </p>
                </div>
            </header>
            <section aria-label="Dernières questions" className={`${PAGE_CONTAINER} py-8 md:py-10`}>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                    {questions.map((q) => (
                        <QuestionCard key={q._id} q={q} />
                    ))}
                </div>
            </section>
        </div>
    );
}

export default async function ForumPage() {
    const questions = await getRecentQuestions();

    const collectionLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Forum d'entraide scolaire | Workyt",
        url: "https://workyt.fr/forum",
        inLanguage: "fr",
        isPartOf: { "@type": "WebSite", name: "Workyt", url: "https://workyt.fr" },
        hasPart: questions.map((q) => ({
            "@type": "DiscussionForumPosting",
            headline: q.title,
            url: `https://workyt.fr/forum/${buildIdSlug(q._id, q.title)}`,
            datePublished: q.createdAt,
        })),
    };

    return (
        <>
            {/* Titres saisis par les élèves : on échappe « < » pour qu'un titre ne
                puisse pas fermer la balise <script> (XSS). */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd(collectionLd) }}
            />
            <Suspense fallback={<ForumServerFallback questions={questions} />}>
                <ForumPageClient />
            </Suspense>
        </>
    );
}
