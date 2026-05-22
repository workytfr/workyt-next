"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Trash2,
    Search,
    Loader2,
    AlertTriangle,
    Check,
    ArrowLeft,
    HardDrive,
    History,
} from "lucide-react";

interface CleanupResult {
    dryRun: boolean;
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    scanned: number;
    referenced: number;
    orphans: number;
    deleted: number;
    bytesFreed: number;
    skippedRecent: number;
    sampleOrphans: string[];
    errors: string[];
}

interface CleanupLog {
    _id: string;
    runAt: string;
    dryRun: boolean;
    durationMs: number;
    scanned: number;
    referenced: number;
    orphans: number;
    deleted: number;
    bytesFreed: number;
    skippedRecent: number;
    triggeredBy: "cron" | "admin";
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function CleanupR2Page() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [scanResult, setScanResult] = useState<CleanupResult | null>(null);
    const [deleteResult, setDeleteResult] = useState<CleanupResult | null>(null);
    const [recentLogs, setRecentLogs] = useState<CleanupLog[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/");
        if (session && (session.user as any)?.role !== "Admin") router.push("/dashboard");
    }, [session, status, router]);

    useEffect(() => {
        if (status !== "authenticated") return;
        const token = (session as any)?.accessToken;
        if (!token) return;
        fetch("/api/admin/cleanup-r2", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data?.recentLogs) setRecentLogs(data.recentLogs);
            })
            .catch(() => {});
    }, [session, status]);

    const runScan = async (dryRun: boolean) => {
        const token = (session as any)?.accessToken;
        if (!token) return;
        setBusy(true);
        setError(null);
        if (dryRun) setScanResult(null);
        else setDeleteResult(null);

        try {
            const res = await fetch("/api/admin/cleanup-r2", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ dryRun }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur");
            if (dryRun) setScanResult(data);
            else {
                setDeleteResult(data);
                setConfirmDelete(false);
                setScanResult(null);
            }
        } catch (err: any) {
            setError(err?.message ?? "Erreur");
        } finally {
            setBusy(false);
        }
    };

    if (status === "loading" || (session && (session.user as any)?.role !== "Admin")) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 max-w-4xl">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-6"
                >
                    <ArrowLeft size={16} /> Retour au dashboard
                </Link>

                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 text-red-700">
                            <HardDrive size={20} />
                        </span>
                        <h1 className="text-3xl font-bold">Nettoyage R2</h1>
                    </div>
                    <p className="text-gray-600">
                        Détecte et supprime les fichiers stockés sur Cloudflare R2 qui ne sont plus référencés
                        dans la base de données. Les fichiers récents (moins de 7 jours) sont protégés.
                    </p>
                </header>

                {/* Actions */}
                <section className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Search size={18} className="text-orange-600" /> Étape 1 — Scanner
                    </h2>
                    <p className="text-sm text-gray-600">
                        Lance un scan en mode <b>dry-run</b> : compte les orphelins sans rien supprimer.
                        Ça permet de vérifier que la détection est correcte avant de passer à la suppression.
                    </p>
                    <button
                        type="button"
                        onClick={() => runScan(true)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-medium"
                    >
                        {busy ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        Lancer un scan (dry-run)
                    </button>

                    {scanResult && <ResultBlock result={scanResult} />}
                </section>

                {/* Suppression */}
                {scanResult && scanResult.orphans > 0 && (
                    <section className="bg-white border-2 border-red-200 rounded-xl p-6 mb-6 space-y-4">
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            <Trash2 size={18} className="text-red-600" /> Étape 2 — Supprimer
                        </h2>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 inline-flex items-start gap-2">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                            <div>
                                <b>Action irréversible.</b> {scanResult.orphans} fichier{scanResult.orphans > 1 ? "s" : ""} seront
                                définitivement supprimés de R2 (~{formatBytes(scanResult.bytesFreed)} libérés).
                            </div>
                        </div>

                        {!confirmDelete ? (
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                disabled={busy}
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-medium"
                            >
                                <Trash2 size={16} /> Supprimer les orphelins
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => runScan(false)}
                                    disabled={busy}
                                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-medium"
                                >
                                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Je confirme — supprimer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(false)}
                                    disabled={busy}
                                    className="inline-flex items-center gap-2 text-gray-600 hover:text-black px-3 py-2.5"
                                >
                                    Annuler
                                </button>
                            </div>
                        )}

                        {deleteResult && (
                            <div className="mt-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 inline-flex items-center gap-2">
                                    <Check size={16} />
                                    Suppression terminée — <b>{deleteResult.deleted}</b> fichiers supprimés,
                                    {" "}<b>{formatBytes(deleteResult.bytesFreed)}</b> libérés.
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-6 inline-flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
                    </div>
                )}

                {/* Historique */}
                <section className="bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                        <History size={18} className="text-gray-600" /> Historique
                    </h2>
                    {recentLogs.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Aucun nettoyage encore effectué.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 uppercase border-b">
                                <tr>
                                    <th className="text-left py-2">Date</th>
                                    <th className="text-left py-2">Mode</th>
                                    <th className="text-right py-2">Scannés</th>
                                    <th className="text-right py-2">Orphelins</th>
                                    <th className="text-right py-2">Supprimés</th>
                                    <th className="text-right py-2">Libérés</th>
                                    <th className="text-left py-2">Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLogs.map((log) => (
                                    <tr key={log._id} className="border-b border-gray-100">
                                        <td className="py-2">{formatDate(log.runAt)}</td>
                                        <td className="py-2">
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded ${
                                                    log.dryRun
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {log.dryRun ? "dry-run" : "actif"}
                                            </span>
                                        </td>
                                        <td className="py-2 text-right">{log.scanned}</td>
                                        <td className="py-2 text-right">{log.orphans}</td>
                                        <td className="py-2 text-right">{log.deleted}</td>
                                        <td className="py-2 text-right">{formatBytes(log.bytesFreed)}</td>
                                        <td className="py-2 text-xs text-gray-500">{log.triggeredBy}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
        </div>
    );
}

function ResultBlock({ result }: { result: CleanupResult }) {
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Scannés" value={result.scanned.toLocaleString("fr-FR")} />
                <Stat label="Référencés" value={result.referenced.toLocaleString("fr-FR")} />
                <Stat label="Orphelins" value={result.orphans.toLocaleString("fr-FR")} highlight />
                <Stat label="À libérer" value={formatBytes(result.bytesFreed)} highlight />
            </div>
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                Durée : {(result.durationMs / 1000).toFixed(1)} s · Récents protégés : {result.skippedRecent}
                {result.errors.length > 0 && (
                    <span className="ml-2 text-red-600">· {result.errors.length} erreurs</span>
                )}
            </div>
            {result.sampleOrphans.length > 0 && (
                <details className="text-xs pt-2 border-t border-gray-200">
                    <summary className="cursor-pointer text-gray-600 hover:text-black">
                        Voir un échantillon ({result.sampleOrphans.length} clés)
                    </summary>
                    <ul className="mt-2 space-y-0.5 font-mono text-gray-600 max-h-48 overflow-y-auto">
                        {result.sampleOrphans.map((k) => (
                            <li key={k}>{k}</li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
            <div className={`font-semibold ${highlight ? "text-orange-600 text-lg" : "text-gray-900"}`}>
                {value}
            </div>
        </div>
    );
}
