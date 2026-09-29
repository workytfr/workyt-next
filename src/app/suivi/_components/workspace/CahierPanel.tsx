"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BookMarked, CircleHelp, Printer, Search } from "lucide-react";
import { plainText } from "@/lib/mentorship/plainText";
import { formatDate, type Message, type MentorshipDetail } from "../../_lib/client";
import { BlockCard, SUIVI_BLOCKS, blockDef } from "../blocks";

/**
 * Le cahier du suivi : tous les blocs envoyés par le bénévole (définitions,
 * méthodes, exemples…), rangés pour réviser, et imprimables en PDF.
 */
export default function CahierPanel({ detail, messages }: { detail: MentorshipDetail; messages: Message[] }) {
    const isStudent = detail.viewer === "student";
    const [type, setType] = useState<string>("all");
    const [query, setQuery] = useState("");
    const [printing, setPrinting] = useState(false);

    const blocks = useMemo(() => messages.filter((m) => m.kind === "block" && m.status === "visible"), [messages]);
    const confused = useMemo(
        () => new Set(messages.filter((m) => m.kind === "confused" && m.meta?.replyTo).map((m) => m.meta!.replyTo!)),
        [messages]
    );

    const counts = useMemo(() => {
        const c = new Map<string, number>();
        for (const b of blocks) {
            const t = blockDef(b.meta?.blockType).type;
            c.set(t, (c.get(t) || 0) + 1);
        }
        return c;
    }, [blocks]);

    const q = plainText(query).toLowerCase();
    const shown = blocks.filter((b) => {
        if (type === "review" && !confused.has(b.id)) return false;
        if (type !== "all" && type !== "review" && blockDef(b.meta?.blockType).type !== type) return false;
        if (!q) return true;
        return plainText(`${b.meta?.blockTitle || ""} ${b.text}`).toLowerCase().includes(q);
    });

    // Impression : le cahier seul, dans un conteneur posé à la racine de la page
    useEffect(() => {
        if (!printing) return;
        document.body.classList.add("wk-print-cahier");
        const done = () => {
            document.body.classList.remove("wk-print-cahier");
            setPrinting(false);
        };
        window.addEventListener("afterprint", done, { once: true });
        // Laisser le temps aux formules de s'afficher avant d'ouvrir l'impression
        const t = setTimeout(() => window.print(), 150);
        return () => {
            clearTimeout(t);
            window.removeEventListener("afterprint", done);
            document.body.classList.remove("wk-print-cahier");
        };
    }, [printing]);

    if (blocks.length === 0) {
        return (
            <div className="py-6 text-center">
                <BookMarked className="mx-auto h-7 w-7 text-[rgba(26,21,18,0.3)]" />
                <h3 className="font-serif-display mt-3 text-2xl">Le cahier est vide</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-[rgba(26,21,18,0.6)]">
                    {isStudent
                        ? "Les définitions, méthodes et exemples que ton bénévole t'envoie s'y rangeront automatiquement, pour réviser."
                        : "Envoie des blocs depuis la conversation (bouton « Bloc ») : ils s'y rangeront pour que l'élève révise."}
                </p>
            </div>
        );
    }

    const chip = (id: string, label: React.ReactNode) => (
        <button
            key={id}
            type="button"
            onClick={() => setType(id)}
            aria-pressed={type === id}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                type === id ? "border-[var(--wk-ink)] bg-[var(--wk-ink)] text-white" : "border-[rgba(26,21,18,0.12)] bg-white text-[rgba(26,21,18,0.7)]"
            }`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif-display text-2xl">Cahier du suivi</h3>
                <button type="button" onClick={() => setPrinting(true)} className="wk-chip !py-1.5 text-xs" title="Imprimer ou enregistrer en PDF">
                    <Printer className="h-3.5 w-3.5" /> PDF
                </button>
            </div>
            <p className="mt-1 text-xs text-[rgba(26,21,18,0.55)]">
                {blocks.length} bloc{blocks.length > 1 ? "s" : ""} envoyé{blocks.length > 1 ? "s" : ""} par {isStudent ? "ton bénévole" : "toi"} · pour réviser
            </p>

            <label className="mt-3 flex items-center gap-2 rounded-full border border-[rgba(26,21,18,0.12)] bg-white px-3.5 py-2 text-sm focus-within:border-[var(--wk-accent)]">
                <Search className="h-3.5 w-3.5 shrink-0 text-[rgba(26,21,18,0.45)]" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher dans le cahier…" className="min-w-0 flex-1 bg-transparent outline-none" />
            </label>

            <div className="-mx-1 mt-2.5 flex flex-wrap gap-1 px-1">
                {chip("all", `Tout · ${blocks.length}`)}
                {confused.size > 0 &&
                    chip(
                        "review",
                        <>
                            <CircleHelp className="h-3 w-3" /> À revoir · {blocks.filter((b) => confused.has(b.id)).length}
                        </>
                    )}
                {SUIVI_BLOCKS.filter((b) => counts.get(b.type)).map((b) => chip(b.type, `${b.label} · ${counts.get(b.type)}`))}
            </div>

            <ul className="mt-4 space-y-3">
                {shown.map((b) => (
                    <li key={b.id}>
                        <BlockCard
                            id={b.id}
                            type={b.meta?.blockType}
                            title={b.meta?.blockTitle}
                            text={b.text}
                            hideHint={isStudent}
                            showHintNote={!isStudent}
                            footer={
                                <p className="mt-2 flex items-center gap-2 text-[11px] text-[rgba(26,21,18,0.45)]">
                                    {formatDate(b.createdAt, { day: "numeric", month: "short" })}
                                    {confused.has(b.id) && (
                                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                                            <CircleHelp className="h-3 w-3" /> à revoir
                                        </span>
                                    )}
                                </p>
                            }
                        />
                    </li>
                ))}
                {shown.length === 0 && <li className="py-4 text-center text-sm text-[rgba(26,21,18,0.55)]">Aucun bloc ne correspond.</li>}
            </ul>

            {printing &&
                createPortal(
                    <div id="wk-cahier-print">
                        <h1 className="font-serif-display text-3xl">Cahier du suivi · {detail.subject}</h1>
                        <p className="mb-6 mt-1 text-sm text-[rgba(26,21,18,0.6)]">
                            {detail.level} · {detail.student?.username}
                            {detail.mentor ? ` avec ${detail.mentor.username}` : ""} · Workyt
                        </p>
                        <div className="space-y-4">
                            {shown.map((b) => (
                                // À l'impression, tout est déplié, indices compris
                                <BlockCard key={b.id} type={b.meta?.blockType} title={b.meta?.blockTitle} text={b.text} />
                            ))}
                        </div>
                    </div>,
                    document.body
                )}

            <style jsx global>{`
                #wk-cahier-print {
                    display: none;
                }
                @media print {
                    body.wk-print-cahier > *:not(#wk-cahier-print) {
                        display: none !important;
                    }
                    body.wk-print-cahier #wk-cahier-print {
                        display: block;
                        padding: 0 4mm;
                        color: #1a1512;
                    }
                    body.wk-print-cahier #wk-cahier-print .wk-block {
                        break-inside: avoid;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}
