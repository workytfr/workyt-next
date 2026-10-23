"use client";

import Link from "next/link";
import { ChevronRight, HeartHandshake, MessageCircle } from "lucide-react";
import CourseEvaluation from "../CourseEvaluation";
import CourseCompetencies from "../CourseCompetencies";
import CourseFichesSection from "../CourseFichesSection";
import type { Curriculum } from "../courseLinks";

/** Onglet « Ressources » : tout ce qui accompagne le cours sans en faire partie */
export default function CourseResources({ curriculum }: { curriculum: Curriculum }) {
    const helpQs = new URLSearchParams({ subject: curriculum.matiere, level: curriculum.niveau });

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                    href={`/forum?contextType=lesson&courseId=${curriculum._id}`}
                    className="group flex items-center gap-4 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[rgba(26,21,18,0.2)]"
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--wk-paper-2)]">
                        <MessageCircle className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block font-semibold">Les questions du forum</span>
                        <span className="block text-sm text-[rgba(26,21,18,0.6)]">Sélectionne un passage d&apos;une leçon pour poser la tienne.</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.35)] transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                    href={`/suivi?${helpQs}#demande`}
                    className="group flex items-center gap-4 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[var(--wk-accent)]"
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--wk-accent)] text-white">
                        <HeartHandshake className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block font-semibold">Besoin d&apos;être accompagné ?</span>
                        <span className="block text-sm text-[rgba(26,21,18,0.6)]">Un bénévole te suit sur ce cours.</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.35)] transition group-hover:translate-x-0.5" />
                </Link>
            </div>

            <CourseEvaluation courseId={curriculum._id} />
            <CourseCompetencies courseId={curriculum._id} />
            <CourseFichesSection
                courseId={curriculum._id}
                courseTitle={curriculum.title}
                courseMatiere={curriculum.matiere}
                courseNiveau={curriculum.niveau}
            />
        </div>
    );
}
