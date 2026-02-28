"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
    FileText, MessageCircle, Sparkles, ChevronUp, ChevronDown,
    Heart, CheckCircle, Clock, HelpCircle, Award, ExternalLink
} from "lucide-react";

interface RelatedFiche {
    id: string;
    revisionId: string;
    title: string;
    likes: number;
    status: string;
    author: string;
    createdAt: string;
    relevanceScore?: number;
}

interface RelatedQuestion {
    id: string;
    title: string;
    points: number;
    status: string;
    answersCount: number;
    createdAt: string;
    relevanceScore?: number;
}

interface RelatedData {
    fiches: RelatedFiche[];
    questions: RelatedQuestion[];
}

interface RelatedContentPanelProps {
    courseId: string;
}

function ficheStatusConfig(status: string) {
    switch (status) {
        case "Certifiée":
            return { icon: Award, color: "text-amber-600", bg: "bg-amber-50", label: "Certifiée" };
        case "Vérifiée":
            return { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", label: "Vérifiée" };
        default:
            return { icon: Clock, color: "text-gray-400", bg: "bg-gray-50", label: "Non certifiée" };
    }
}

function questionStatusConfig(status: string) {
    switch (status) {
        case "Résolue":
            return { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Résolue" };
        case "Validée":
            return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Validée" };
        default:
            return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "En attente" };
    }
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days}j`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)}sem`;
    if (days < 365) return `Il y a ${Math.floor(days / 30)}mois`;
    return `Il y a ${Math.floor(days / 365)}an`;
}

export default function RelatedContentPanel({ courseId }: RelatedContentPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<RelatedData | null>(null);
    const [activeTab, setActiveTab] = useState<"fiches" | "forum">("fiches");

    useEffect(() => {
        fetch(`/api/cours/${courseId}/related`)
            .then(r => r.json())
            .then(res => {
                if (res.success) setData(res.data);
            })
            .catch(() => {});
    }, [courseId]);

    const fichesCount = data?.fiches.length || 0;
    const questionsCount = data?.questions.length || 0;
    const totalItems = fichesCount + questionsCount;

    // Rien à afficher
    if (data && totalItems === 0) return null;

    return (
        <div className="border-t border-[#e3e2e0] flex-shrink-0">
            {/* Toggle bar */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#f0efec] transition-colors group"
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
                    <span className="text-xs font-medium text-[#37352f]">
                        Ressources liées
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!data && (
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                    )}
                    {data && totalItems > 0 && (
                        <span className="text-[10px] font-medium text-[#9ca3af] bg-[#e3e2e0] px-1.5 py-0.5 rounded-full">
                            {totalItems}
                        </span>
                    )}
                    {isOpen
                        ? <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af]" />
                        : <ChevronUp className="w-3.5 h-3.5 text-[#9ca3af]" />
                    }
                </div>
            </button>

            {/* Panel déroulant */}
            {isOpen && data && (
                <div className="bg-white border-t border-[#e3e2e0]">
                    {/* Onglets */}
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab("fiches")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                                activeTab === "fiches"
                                    ? "border-[#f97316] text-[#f97316] bg-[#fff7ed]"
                                    : "border-transparent text-[#9ca3af] hover:text-[#6b6b6b] hover:bg-[#f7f6f3]"
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Fiches
                            {fichesCount > 0 && (
                                <span className={`text-[9px] px-1 py-0.5 rounded-full ${
                                    activeTab === "fiches" ? "bg-[#f97316] text-white" : "bg-[#e3e2e0] text-[#6b6b6b]"
                                }`}>
                                    {fichesCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("forum")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                                activeTab === "forum"
                                    ? "border-[#3b82f6] text-[#3b82f6] bg-[#eff6ff]"
                                    : "border-transparent text-[#9ca3af] hover:text-[#6b6b6b] hover:bg-[#f7f6f3]"
                            }`}
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Forum
                            {questionsCount > 0 && (
                                <span className={`text-[9px] px-1 py-0.5 rounded-full ${
                                    activeTab === "forum" ? "bg-[#3b82f6] text-white" : "bg-[#e3e2e0] text-[#6b6b6b]"
                                }`}>
                                    {questionsCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Contenu */}
                    <div className="max-h-64 overflow-y-auto notion-scrollbar">
                        {activeTab === "fiches" && (
                            <>
                                {fichesCount === 0 ? (
                                    <EmptyState
                                        icon={<FileText className="w-5 h-5 text-[#d1d5db]" />}
                                        text="Aucune fiche pour ce cours"
                                        linkText="Parcourir les fiches"
                                        linkHref="/fiches"
                                    />
                                ) : (
                                    <div className="p-2 space-y-1">
                                        {data.fiches.map((f) => {
                                            const status = ficheStatusConfig(f.status);
                                            const StatusIcon = status.icon;
                                            return (
                                                <Link
                                                    key={f.id}
                                                    href={`/fiches/${f.id}`}
                                                    className="block p-2.5 rounded-lg hover:bg-[#f7f6f3] transition-colors group"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${status.bg}`}>
                                                            <StatusIcon className={`w-3 h-3 ${status.color}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] font-medium text-[#37352f] line-clamp-2 leading-tight group-hover:text-[#f97316] transition-colors">
                                                                {f.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] text-[#9ca3af]">
                                                                    {f.author}
                                                                </span>
                                                                <span className="text-[10px] text-[#d1d5db]">·</span>
                                                                <span className="flex items-center gap-0.5 text-[10px] text-[#9ca3af]">
                                                                    <Heart className="w-2.5 h-2.5" />
                                                                    {f.likes}
                                                                </span>
                                                                <span className="text-[10px] text-[#d1d5db]">·</span>
                                                                <span className="text-[10px] text-[#9ca3af]">
                                                                    {timeAgo(f.createdAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ExternalLink className="w-3 h-3 text-[#d1d5db] group-hover:text-[#9ca3af] flex-shrink-0 mt-0.5" />
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                        <Link
                                            href="/fiches"
                                            className="flex items-center justify-center gap-1 py-2 text-[10px] font-medium text-[#f97316] hover:bg-[#fff7ed] rounded-lg transition-colors"
                                        >
                                            Voir toutes les fiches
                                            <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === "forum" && (
                            <>
                                {questionsCount === 0 ? (
                                    <EmptyState
                                        icon={<MessageCircle className="w-5 h-5 text-[#d1d5db]" />}
                                        text="Aucune question pour ce cours"
                                        linkText="Parcourir le forum"
                                        linkHref="/forum"
                                    />
                                ) : (
                                    <div className="p-2 space-y-1">
                                        {data.questions.map((q) => {
                                            const status = questionStatusConfig(q.status);
                                            return (
                                                <Link
                                                    key={q.id}
                                                    href={`/forum/${q.id}`}
                                                    className="block p-2.5 rounded-lg hover:bg-[#f7f6f3] transition-colors group"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                                                            q.status === "Résolue" ? "bg-emerald-50" : "bg-blue-50"
                                                        }`}>
                                                            {q.status === "Résolue"
                                                                ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                                : <HelpCircle className="w-3 h-3 text-blue-500" />
                                                            }
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] font-medium text-[#37352f] line-clamp-2 leading-tight group-hover:text-[#3b82f6] transition-colors">
                                                                {q.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${status.bg} ${status.color} ${status.border} border`}>
                                                                    {status.label}
                                                                </span>
                                                                <span className="flex items-center gap-0.5 text-[10px] text-[#9ca3af]">
                                                                    <MessageCircle className="w-2.5 h-2.5" />
                                                                    {q.answersCount}
                                                                </span>
                                                                <span className="text-[10px] text-[#d1d5db]">·</span>
                                                                <span className="text-[10px] font-medium text-amber-600">
                                                                    {q.points} pts
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ExternalLink className="w-3 h-3 text-[#d1d5db] group-hover:text-[#9ca3af] flex-shrink-0 mt-0.5" />
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                        <Link
                                            href="/forum"
                                            className="flex items-center justify-center gap-1 py-2 text-[10px] font-medium text-[#3b82f6] hover:bg-[#eff6ff] rounded-lg transition-colors"
                                        >
                                            Voir toutes les questions
                                            <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function EmptyState({ icon, text, linkText, linkHref }: {
    icon: React.ReactNode;
    text: string;
    linkText: string;
    linkHref: string;
}) {
    return (
        <div className="py-6 px-4 text-center">
            <div className="flex justify-center mb-2">{icon}</div>
            <p className="text-[11px] text-[#9ca3af] mb-2">{text}</p>
            <Link
                href={linkHref}
                className="text-[10px] font-medium text-[#f97316] hover:underline"
            >
                {linkText}
            </Link>
        </div>
    );
}
