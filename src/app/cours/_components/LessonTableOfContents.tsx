"use client";

import { useState, useEffect, useCallback } from "react";
import { List, X } from "lucide-react";
import type { TocItem } from "@/lib/lessonHtml";
import "./styles/notion-theme.css";

interface LessonTableOfContentsProps {
    items: TocItem[];
}

export default function LessonTableOfContents({ items }: LessonTableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>("");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (items.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter(e => e.isIntersecting);
                if (visible.length > 0) {
                    setActiveId(visible[0].target.id);
                }
            },
            { rootMargin: "-10% 0px -70% 0px", threshold: 0 }
        );

        items.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [items]);

    const scrollTo = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveId(id);
            setIsOpen(false);
        }
    }, []);

    if (items.length === 0) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed z-40 right-4 bottom-20 lg:bottom-6 p-2 bg-white/80 backdrop-blur-sm border border-[#e8dfd0] text-[#8f857b] rounded-lg shadow-sm hover:text-[#6b625a] hover:shadow-md transition-all"
                aria-label="Sommaire de la leçon"
            >
                {isOpen ? <X className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="fixed right-4 bottom-32 lg:bottom-16 z-50 w-64 max-h-[55vh] bg-white border border-[#e8dfd0] rounded-xl shadow-lg overflow-y-auto notion-scrollbar">
                        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-[#e8dfd0] px-4 py-2.5">
                            <span className="text-xs font-medium text-[#8f857b] uppercase tracking-wide">Sur cette page</span>
                        </div>
                        <ul className="p-2 space-y-0.5">
                            {items.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => scrollTo(item.id)}
                                        className={`w-full text-left text-xs py-1.5 px-3 rounded-md transition-colors ${
                                            item.level === 3 ? 'pl-6 text-[#8f857b]' : 'text-[#6b625a]'
                                        } ${
                                            activeId === item.id
                                                ? 'bg-[#fff1e6] text-[#ff6a1a] font-medium'
                                                : 'hover:bg-[#f5efe3]'
                                        }`}
                                    >
                                        <span className="line-clamp-2">{item.text}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}
