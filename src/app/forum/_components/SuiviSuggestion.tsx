"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartHandshake, ArrowRight, X } from "lucide-react";

interface Suggestion {
    suggest: boolean;
    reason?: "unanswered" | "recurring";
    subject?: string;
    level?: string;
}

/**
 * La passerelle forum → suivi, montrée à l'auteur d'une question quand le
 * forum ne suffit plus : question restée sans réponse, ou plusieurs questions
 * dans la même matière (le signe d'un blocage plus large qu'un exercice).
 * L'API décide ; ce composant ne fait qu'afficher, et peut être masqué.
 */
export default function SuiviSuggestion({ questionId }: { questionId: string }) {
    const [data, setData] = useState<Suggestion | null>(null);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        let alive = true;
        fetch(`/api/suivi/suggestion?questionId=${encodeURIComponent(questionId)}`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => alive && j?.data && setData(j.data))
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [questionId]);

    if (!data?.suggest || hidden) return null;

    const href = `/suivi?subject=${encodeURIComponent(data.subject || "")}&level=${encodeURIComponent(data.level || "")}#demande`;

    return (
        <div className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.1)] bg-[var(--wk-paper)] p-5 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--wk-accent)] text-white">
                <HeartHandshake className="h-6 w-6" />
            </span>
            <div className="flex-1 pr-6">
                <p className="font-semibold text-[var(--wk-ink)]">
                    {data.reason === "unanswered"
                        ? "Pas encore de réponse ? Un bénévole peut t'accompagner."
                        : `Tu bloques souvent en ${data.subject} ? Fais-toi accompagner.`}
                </p>
                <p className="mt-0.5 text-sm text-[rgba(26,21,18,0.65)]">
                    Un bénévole de l&apos;association te suit pendant quelques semaines, avec un plan et des exercices choisis pour toi. Gratuit.
                </p>
            </div>
            <Link href={href} className="wk-btn-ink shrink-0 justify-center !py-2.5 text-sm">
                Demander un suivi <ArrowRight className="h-4 w-4" />
            </Link>
            <button
                type="button"
                onClick={() => setHidden(true)}
                className="absolute right-3 top-3 text-[rgba(26,21,18,0.35)] hover:text-[var(--wk-ink)]"
                aria-label="Masquer"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
