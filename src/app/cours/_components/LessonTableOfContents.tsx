"use client";

import { useState, useEffect, useCallback } from "react";
import { List, X } from "lucide-react";
import type { TocItem } from "@/lib/lessonHtml";
import "./styles/notion-theme.css";

/** Titre de la leçon actuellement à l'écran */
function useActiveHeading(items: TocItem[]) {
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        if (items.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length > 0) setActiveId(visible[0].target.id);
            },
            { rootMargin: "-10% 0px -70% 0px", threshold: 0 }
        );
        items.forEach((item) => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [items]);

    const scrollTo = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveId(id);
    }, []);

    return { activeId, scrollTo };
}

function TocList({ items, activeId, onPick }: { items: TocItem[]; activeId: string; onPick: (id: string) => void }) {
    return (
        <ul className="space-y-0.5">
            {items.map((item) => {
                const active = activeId === item.id;
                return (
                    <li key={item.id}>
                        <button
                            onClick={() => onPick(item.id)}
                            className={`w-full border-l-2 py-1.5 pr-2 text-left text-[13px] leading-snug transition-colors ${
                                item.level === 3 ? "pl-6" : "pl-3"
                            } ${
                                active
                                    ? "border-[var(--wk-accent)] font-semibold text-[var(--wk-ink)]"
                                    : "border-transparent text-[rgba(26,21,18,0.6)] hover:text-[var(--wk-ink)]"
                            }`}
                        >
                            <span className="line-clamp-2">{item.text}</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

/** « Sur cette page », intégré à la colonne de droite (grand écran) */
export function LessonTocInline({ items }: { items: TocItem[] }) {
    const { activeId, scrollTo } = useActiveHeading(items);
    if (items.length === 0) return null;
    return (
        <nav aria-label="Sur cette page">
            <p className="font-mono-ui mb-2 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">Sur cette page</p>
            <TocList items={items} activeId={activeId} onPick={scrollTo} />
        </nav>
    );
}

/** « Sur cette page », en bouton flottant (tablette et mobile) */
export default function LessonTableOfContents({ items }: { items: TocItem[] }) {
    const { activeId, scrollTo } = useActiveHeading(items);
    const [isOpen, setIsOpen] = useState(false);

    if (items.length === 0) return null;

    return (
        <div className="relative xl:hidden print:hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed z-40 right-4 bottom-20 p-2 bg-white/80 backdrop-blur-sm border border-[#e8dfd0] text-[#8f857b] rounded-lg shadow-sm hover:text-[#6b625a] hover:shadow-md transition-all"
                aria-label="Sommaire de la leçon"
            >
                {isOpen ? <X className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="fixed right-4 bottom-32 z-50 w-64 max-h-[55vh] bg-white border border-[#e8dfd0] rounded-xl shadow-lg overflow-y-auto notion-scrollbar p-3">
                        <p className="font-mono-ui mb-2 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">Sur cette page</p>
                        <TocList
                            items={items}
                            activeId={activeId}
                            onPick={(id) => {
                                scrollTo(id);
                                setIsOpen(false);
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
