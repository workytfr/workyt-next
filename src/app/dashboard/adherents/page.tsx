"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    IdCard, Users, CalendarDays, Loader2, Plus, Check, Lock, RotateCcw, Ban, Trash2, AlertCircle,
} from "lucide-react";
import { MEMBERSHIP_TYPES, membershipTypeLabel, MAX_CONSECUTIVE_ABSENCES } from "@/lib/membership";

interface Member {
    _id: string;
    memberNumber: string;
    type: string;
    status: string;
    consecutiveAbsences: number;
    joinedAt: string;
    userId?: { _id: string; name?: string; username?: string; email?: string };
}

interface Assembly {
    _id: string;
    title: string;
    date: string;
    attendees: string[];
    closed: boolean;
}

export default function AdherentsAdminPage() {
    const { data: session, status } = useSession();
    const isAdmin = (session?.user as any)?.role === "Admin";

    const [tab, setTab] = useState<"members" | "assemblies">("members");
    const [members, setMembers] = useState<Member[]>([]);
    const [stats, setStats] = useState({ total: 0, actifs: 0, suspendus: 0 });
    const [assemblies, setAssemblies] = useState<Assembly[]>([]);
    const [loading, setLoading] = useState(true);

    // Création d'AG
    const [agTitle, setAgTitle] = useState("");
    const [agDate, setAgDate] = useState("");
    const [creating, setCreating] = useState(false);

    // Pointage
    const [openAg, setOpenAg] = useState<string | null>(null);
    const [attendeeSet, setAttendeeSet] = useState<Set<string>>(new Set());
    const [savingAg, setSavingAg] = useState(false);
    const [msg, setMsg] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const [m, a] = await Promise.all([
            fetch("/api/admin/adherents").then((r) => r.json()),
            fetch("/api/admin/assemblies").then((r) => r.json()),
        ]);
        setMembers(m.members || []);
        setStats(m.stats || { total: 0, actifs: 0, suspendus: 0 });
        setAssemblies(a.assemblies || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (status === "authenticated" && isAdmin) load();
        else if (status !== "loading") setLoading(false);
    }, [status, isAdmin, load]);

    const setStatus = async (id: string, newStatus: "actif" | "suspendu") => {
        await fetch(`/api/admin/adherents/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        load();
    };

    const createAg = async () => {
        if (!agTitle.trim() || !agDate) return;
        setCreating(true);
        await fetch("/api/admin/assemblies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: agTitle, date: agDate }),
        });
        setAgTitle("");
        setAgDate("");
        setCreating(false);
        load();
    };

    const openPointage = (ag: Assembly) => {
        if (openAg === ag._id) {
            setOpenAg(null);
            return;
        }
        setOpenAg(ag._id);
        setAttendeeSet(new Set(ag.attendees || []));
        setMsg("");
    };

    const toggleAttendee = (userId: string) => {
        setAttendeeSet((prev) => {
            const n = new Set(prev);
            if (n.has(userId)) n.delete(userId); else n.add(userId);
            return n;
        });
    };

    const saveAttendance = async (ag: Assembly, close: boolean) => {
        if (close && !confirm("Clôturer l'AG ? Les absences seront comptabilisées et les adhérents à 3 absences consécutives seront suspendus.")) return;
        setSavingAg(true);
        setMsg("");
        const res = await fetch(`/api/admin/assemblies/${ag._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attendees: Array.from(attendeeSet), close }),
        });
        const data = await res.json();
        setSavingAg(false);
        if (!res.ok) { setMsg(data.error || "Erreur"); return; }
        if (close) {
            setMsg(`AG clôturée · ${data.suspended || 0} adhérent(s) suspendu(s).`);
            setOpenAg(null);
        } else {
            setMsg("Pointage enregistré.");
        }
        load();
    };

    if (status === "loading" || loading) {
        return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
    }
    if (!isAdmin) {
        return (
            <div className="max-w-md mx-auto text-center py-32 px-6">
                <Lock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Accès restreint</h2>
                <p className="text-gray-500">Seuls les administrateurs gèrent les adhérents.</p>
            </div>
        );
    }

    const activeMembers = members.filter((m) => m.status === "actif");

    return (
        <div className="px-4 sm:px-6 lg:px-8 pb-12 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-1">
                <IdCard className="w-6 h-6 text-orange-500" />
                <h1 className="text-2xl font-bold text-gray-800">Adhérents</h1>
            </div>
            <p className="text-sm text-gray-400 mb-6">Gestion des adhésions et pointage des Assemblées Générales.</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <StatCard label="Adhérents" value={stats.total} color="#1a1512" />
                <StatCard label="Actifs" value={stats.actifs} color="#10b981" />
                <StatCard label="Suspendus" value={stats.suspendus} color="#ef4444" />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5">
                <button onClick={() => setTab("members")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === "members" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
                    <Users className="w-4 h-4" /> Adhérents
                </button>
                <button onClick={() => setTab("assemblies")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === "assemblies" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
                    <CalendarDays className="w-4 h-4" /> Assemblées
                </button>
            </div>

            {msg && (
                <div className="mb-4 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-700">{msg}</div>
            )}

            {/* Liste adhérents */}
            {tab === "members" && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {members.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-12">Aucun adhérent pour le moment.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="text-left px-4 py-2.5">Adhérent</th>
                                    <th className="text-left px-4 py-2.5">N°</th>
                                    <th className="text-left px-4 py-2.5">Statut asso</th>
                                    <th className="text-center px-4 py-2.5">Absences</th>
                                    <th className="text-center px-4 py-2.5">État</th>
                                    <th className="text-right px-4 py-2.5">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {members.map((m) => {
                                    const info = MEMBERSHIP_TYPES[m.type as keyof typeof MEMBERSHIP_TYPES];
                                    return (
                                        <tr key={m._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium text-gray-800">{m.userId?.name || m.userId?.username || "—"}</div>
                                                <div className="text-xs text-gray-400">{m.userId?.email}</div>
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{m.memberNumber}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: info?.soft, color: info?.color }}>
                                                    {membershipTypeLabel(m.type)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className={m.consecutiveAbsences >= MAX_CONSECUTIVE_ABSENCES - 1 ? "text-red-500 font-semibold" : "text-gray-500"}>
                                                    {m.consecutiveAbsences}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                {m.status === "actif" ? (
                                                    <span className="text-xs font-medium text-emerald-600">Actif</span>
                                                ) : (
                                                    <span className="text-xs font-medium text-red-500">Suspendu</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                {m.status === "actif" ? (
                                                    <button onClick={() => setStatus(m._id, "suspendu")} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-500">
                                                        <Ban className="w-3.5 h-3.5" /> Suspendre
                                                    </button>
                                                ) : (
                                                    <button onClick={() => setStatus(m._id, "actif")} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600">
                                                        <RotateCcw className="w-3.5 h-3.5" /> Réactiver
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Assemblées */}
            {tab === "assemblies" && (
                <div className="space-y-5">
                    {/* Création */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Nouvelle Assemblée Générale</p>
                        <div className="flex flex-wrap gap-2">
                            <input value={agTitle} onChange={(e) => setAgTitle(e.target.value)} placeholder="Titre (ex. AG ordinaire 2026)" className="flex-1 min-w-[200px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                            <input type="date" value={agDate} onChange={(e) => setAgDate(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                            <button onClick={createAg} disabled={creating || !agTitle.trim() || !agDate} className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50">
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer
                            </button>
                        </div>
                    </div>

                    {/* Liste AG */}
                    {assemblies.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Aucune AG enregistrée.</p>
                    ) : (
                        assemblies.map((ag) => (
                            <div key={ag._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <CalendarDays className="w-4 h-4 text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">{ag.title}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(ag.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                                            {" · "}{ag.attendees?.length || 0} présent(s)
                                        </p>
                                    </div>
                                    {ag.closed ? (
                                        <span className="text-xs font-medium text-gray-400 inline-flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Clôturée</span>
                                    ) : (
                                        <button onClick={() => openPointage(ag)} className="text-sm font-medium text-orange-600 hover:text-orange-700">
                                            {openAg === ag._id ? "Fermer" : "Pointer les présents"}
                                        </button>
                                    )}
                                </div>

                                {openAg === ag._id && !ag.closed && (
                                    <div className="border-t border-gray-100 p-4">
                                        {activeMembers.length === 0 ? (
                                            <p className="text-xs text-gray-400">Aucun adhérent actif à pointer.</p>
                                        ) : (
                                            <div className="grid sm:grid-cols-2 gap-1.5 mb-4">
                                                {activeMembers.map((m) => {
                                                    const uid = m.userId?._id || "";
                                                    const on = attendeeSet.has(uid);
                                                    return (
                                                        <button key={m._id} onClick={() => toggleAttendee(uid)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all ${on ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                                                            <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${on ? "bg-emerald-500 text-white" : "border border-gray-300"}`}>
                                                                {on && <Check className="w-3 h-3" />}
                                                            </span>
                                                            <span className="truncate">{m.userId?.name || m.userId?.username}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs text-gray-400">{attendeeSet.size} sélectionné(s)</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => saveAttendance(ag, false)} disabled={savingAg} className="text-sm rounded-xl border border-gray-200 px-3 py-1.5 text-gray-600 hover:border-gray-300 disabled:opacity-50">
                                                    Enregistrer
                                                </button>
                                                <button onClick={() => saveAttendance(ag, true)} disabled={savingAg} className="inline-flex items-center gap-1.5 text-sm rounded-xl bg-gray-800 text-white px-3 py-1.5 disabled:opacity-50">
                                                    {savingAg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Clôturer l&apos;AG
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> À la clôture, les absents voient leur compteur augmenter ; {MAX_CONSECUTIVE_ABSENCES} absences consécutives = suspension.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
        </div>
    );
}
