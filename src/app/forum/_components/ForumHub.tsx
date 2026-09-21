import Link from "next/link";
import { ChevronRight, CalendarDays, MessageCircleQuestion } from "lucide-react";
import { educationData } from "@/data/educationData";
import { buildIdSlug } from "@/utils/slugify";
import { subjectToSlug, levelToSlug } from "@/utils/subjectSlug";
import { FORUM_CONTAINER, Eyebrow, EntryChoice, SuiviPromoCard, StatusChip, SubjectLabel, plainExcerpt } from "./forumUi";

export interface HubQuestion {
    _id: { toString(): string } | string;
    title: string;
    slug?: string;
    subject?: string;
    classLevel?: string;
    status?: string;
    description?: { whatIDid?: string; whatINeed?: string };
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

/**
 * Page « hub » du forum, par matière ou par niveau (composant serveur, rendu
 * statique régénéré toutes les 30 min). Même langage visuel que la liste
 * principale, et maillage vers les autres matières / niveaux pour le SEO.
 */
export default function ForumHub({
    kind,
    label,
    questions,
}: {
    kind: "matiere" | "niveau";
    label: string;
    questions: HubQuestion[];
}) {
    const isSubject = kind === "matiere";
    const subject = isSubject ? label : undefined;
    const level = isSubject ? undefined : label;

    const askQs = new URLSearchParams();
    if (subject) askQs.set("subject", subject);
    if (level) askQs.set("classLevel", level);

    const others = isSubject
        ? educationData.subjects.filter((s) => s !== label).map((s) => ({ label: s, href: `/forum/matiere/${subjectToSlug(s)}` }))
        : educationData.levels.filter((l) => l !== label).map((l) => ({ label: l, href: `/forum/niveau/${levelToSlug(l)}` }));

    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                <div className={`${FORUM_CONTAINER} relative pb-12 pt-8 md:pb-16`}>
                    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-sm text-[rgba(26,21,18,0.55)]">
                        <Link href="/" className="hover:text-[var(--wk-accent)]">Accueil</Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <Link href="/forum" className="hover:text-[var(--wk-accent)]">Forum</Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="text-[var(--wk-ink)]">{label}</span>
                    </nav>

                    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-7">
                            <Eyebrow>{isSubject ? "Forum par matière" : "Forum par niveau"}</Eyebrow>
                            <h1 className="font-serif-display mt-5 text-[clamp(2.4rem,5.5vw,4.25rem)] leading-[0.95]">
                                {isSubject ? "Questions de " : "Questions "}
                                <span className="italic text-[rgba(26,21,18,0.45)]">{isSubject ? label : `niveau ${label}`}</span>
                                <span className="text-[var(--wk-accent)]">.</span>
                            </h1>
                            <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                                Bloqué sur un exercice {isSubject ? <>de <strong>{label}</strong></> : <>de <strong>{label}</strong></>} ? La
                                communauté Workyt répond gratuitement. Parcours les questions déjà posées, pose la tienne — ou fais-toi
                                accompagner par un bénévole.
                            </p>
                        </div>
                        <div className="lg:col-span-5">
                            <EntryChoice askHref={`/forum/creer?${askQs}`} subject={subject} level={level} />
                        </div>
                    </div>
                </div>
            </header>

            <div className={`${FORUM_CONTAINER} py-10`}>
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <section aria-label={`Questions ${label}`} className="min-w-0">
                        <p className="mb-5 text-sm text-[rgba(26,21,18,0.6)]">
                            {questions.length} question{questions.length > 1 ? "s" : ""} récente{questions.length > 1 ? "s" : ""}
                        </p>
                        {questions.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-[rgba(26,21,18,0.18)] bg-white/60 px-6 py-16 text-center">
                                <MessageCircleQuestion className="mx-auto h-8 w-8 text-[rgba(26,21,18,0.3)]" />
                                <p className="font-serif-display mt-4 text-2xl">Aucune question {isSubject ? `de ${label}` : label} pour le moment</p>
                                <p className="mt-2 text-sm text-[rgba(26,21,18,0.6)]">Sois le premier à en poser une !</p>
                            </div>
                        ) : (
                            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                                {questions.map((q, i) => (
                                    <HubItem key={String(q._id)} q={q} withPromo={i === 6} subject={subject} level={level} showSubject={!isSubject} />
                                ))}
                            </ul>
                        )}
                    </section>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="font-mono-ui mb-3 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">
                            {isSubject ? "Autres matières" : "Autres niveaux"}
                        </div>
                        <ul className="flex flex-wrap gap-1.5 lg:max-h-[70vh] lg:overflow-y-auto">
                            {others.map((o) => (
                                <li key={o.href}>
                                    <Link href={o.href} className="wk-chip transition hover:border-[var(--wk-accent)] hover:text-[#c24a0a]">
                                        {o.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function HubItem({
    q,
    withPromo,
    subject,
    level,
    showSubject,
}: {
    q: HubQuestion;
    withPromo: boolean;
    subject?: string;
    level?: string;
    showSubject: boolean;
}) {
    const href = `/forum/${buildIdSlug(String(q._id), q.slug || q.title)}`;
    const excerpt = plainExcerpt(q.description?.whatINeed || q.description?.whatIDid, 180);
    const date = q.createdAt || q.updatedAt;

    return (
        <>
            {withPromo && (
                <li className="col-span-full">
                    <SuiviPromoCard subject={subject} level={level} wide />
                </li>
            )}
            <li className="h-full">
                <Link
                    href={href}
                    className="group flex h-full flex-col rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.09)] sm:p-6"
                >
                    <div className="flex items-center gap-2">
                        {showSubject && q.subject ? (
                            <SubjectLabel subject={q.subject} className="min-w-0" />
                        ) : (
                            q.classLevel && (
                                <span className="rounded-full bg-[var(--wk-paper-2)] px-2 py-0.5 text-[11px] font-semibold text-[rgba(26,21,18,0.7)]">
                                    {q.classLevel}
                                </span>
                            )
                        )}
                        <StatusChip status={q.status} className="ml-auto shrink-0" />
                    </div>
                    <h2 className="font-serif-display mt-4 text-[1.3rem] leading-[1.15] line-clamp-3 group-hover:text-[#c24a0a]">{q.title}</h2>
                    {excerpt && <p className="mt-2.5 text-sm leading-relaxed text-[rgba(26,21,18,0.62)] line-clamp-3">{excerpt}</p>}
                    {date && (
                        <span className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-[rgba(26,21,18,0.5)]">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                    )}
                </Link>
            </li>
        </>
    );
}
