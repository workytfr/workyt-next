"use client";

import { useState, useEffect, useCallback } from "react";
import { List, X } from "lucide-react";
import "./styles/notion-theme.css";

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface LessonTableOfContentsProps {
    items: TocItem[];
}

export function extractHeadings(html: string): TocItem[] {
    const items: TocItem[] = [];
    const regex = /<h([23])\s[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
        const level = parseInt(match[1]);
        const id = match[2];
        const text = match[3].replace(/<[^>]*>/g, '').trim();
        if (text && id) {
            items.push({ id, text, level });
        }
    }

    return items;
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

export function addHeadingIds(html: string): string {
    const slugCounts = new Map<string, number>();

    return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (match, level, attrs, content) => {
        if (attrs.includes('id="')) return match;

        const text = content.replace(/<[^>]*>/g, '').trim();
        let slug = slugify(text);

        const count = slugCounts.get(slug) || 0;
        slugCounts.set(slug, count + 1);
        if (count > 0) slug += `-${count}`;

        return `<h${level}${attrs} id="${slug}">${content}</h${level}>`;
    });
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
                className="fixed z-40 right-4 bottom-20 lg:bottom-6 p-2 bg-white/80 backdrop-blur-sm border border-[#e3e2e0] text-[#9ca3af] rounded-lg shadow-sm hover:text-[#6b6b6b] hover:shadow-md transition-all"
                aria-label="Sommaire de la leçon"
            >
                {isOpen ? <X className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="fixed right-4 bottom-32 lg:bottom-16 z-50 w-64 max-h-[55vh] bg-white border border-[#e3e2e0] rounded-xl shadow-lg overflow-y-auto notion-scrollbar">
                        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-[#e3e2e0] px-4 py-2.5">
                            <span className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide">Sur cette page</span>
                        </div>
                        <ul className="p-2 space-y-0.5">
                            {items.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => scrollTo(item.id)}
                                        className={`w-full text-left text-xs py-1.5 px-3 rounded-md transition-colors ${
                                            item.level === 3 ? 'pl-6 text-[#9ca3af]' : 'text-[#6b6b6b]'
                                        } ${
                                            activeId === item.id
                                                ? 'bg-[#fff7ed] text-[#f97316] font-medium'
                                                : 'hover:bg-[#f7f6f3]'
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
