"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    FileCheck,
    Loader2,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    User,
} from "lucide-react";
import "../../dashboard/styles/dashboard-theme.css";

interface Submission {
    _id: string;
    userId: { _id: string; username: string; image?: string };
    courseId: { _id: string; title: string };
    evaluationId: { _id: string; title: string; type: string; duration: number };
    type: string;
    submittedAt: string;
    timeSpent: number;
    status: string;
    grade?: number;
}

export default function EvaluationCorrectionsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchSubmissions = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(true);

        const params = new URLSearchParams();
        if (filterStatus) params.set("status", filterStatus);
        params.set("page", String(page));
        params.set("limit", "20");

        try {
            const res = await fetch(`/api/submissions?${params}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data.submissions || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error("Erreur chargement soumissions:", err);
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken, filterStatus, page]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const min = Math.floor(diff / 60000);
        if (min < 60) return `il y a ${min} min`;
        const h = Math.floor(min / 60);
        if (h < 24) return `il y a ${h}h`;
        return `il y a ${Math.floor(h / 24)}j`;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#37352f] flex items-center gap-2">
                        <FileCheck className="w-7 h-7 text-[#f97316]" />
                        Corrections d'évaluations
                    </h1>
                    <p className="text-sm text-[#6b6b6b] mt-1">
                        {submissions.length} soumission(s)
                    </p>
                </div>
            </div>

            {/* Filtres */}
            <div className="dash-card mb-6">
                <div className="dash-card-body">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-[#6b6b6b]" />
                        <span className="text-sm font-medium text-[#37352f]">Filtres</span>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                            className="dash-input"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="pending_review">En attente</option>
                            <option value="graded">Corrigées</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
                </div>
            ) : submissions.length === 0 ? (
                <div className="dash-empty">
                    <FileCheck className="dash-empty-icon" />
                    <h3 className="dash-empty-title">Aucune soumission</h3>
                    <p className="text-sm text-[#6b6b6b]">
                        Les évaluations soumises apparaîtront ici.
                    </p>
                </div>
            ) : (
                <div className="dash-card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#e3e2e0]">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] uppercase">Élève</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] uppercase">Cours</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] uppercase">Évaluation</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] uppercase">Soumis</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] uppercase">Temps</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] uppercase">Statut</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#6b6b6b] uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((sub) => (
                                    <tr key={sub._id} className="border-b border-[#e3e2e0] hover:bg-[#f7f6f3] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                                <span className="text-sm text-[#37352f] font-medium">
                                                    {sub.userId?.username || "Inconnu"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#37352f]">
                                            {sub.courseId?.title || "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-[#37352f]">{sub.evaluationId?.title || "-"}</span>
                                            <span className="ml-1.5 text-xs text-[#9ca3af]">
                                                ({sub.type === "form" ? "Form" : "PDF"})
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[#6b6b6b]">
                                            {timeAgo(sub.submittedAt)}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[#6b6b6b]">
                                            {Math.round(sub.timeSpent / 60)} min
                                        </td>
                                        <td className="px-4 py-3">
                                            {sub.status === "pending_review" ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                                                    <Clock className="w-3 h-3" /> En attente
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                                                    <CheckCircle2 className="w-3 h-3" /> {sub.grade}/20
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => router.push(`/dashboard/evaluations/${sub._id}`)}
                                                className="dash-button dash-button-primary dash-button-sm"
                                            >
                                                {sub.status === "pending_review" ? "Corriger" : "Voir"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 py-4 border-t border-[#e3e2e0]">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="dash-button dash-button-secondary dash-button-sm disabled:opacity-50"
                            >
                                Précédent
                            </button>
                            <span className="text-sm text-[#6b6b6b]">{page}/{totalPages}</span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                className="dash-button dash-button-secondary dash-button-sm disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
