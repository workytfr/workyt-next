"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HeartHandshake, Inbox, UserCog, Gauge, Loader2 } from "lucide-react";
import { api } from "@/app/suivi/_lib/client";
import MySuivisTab from "./_components/MySuivisTab";
import QueueTab from "./_components/QueueTab";
import ProfileTab from "./_components/ProfileTab";
import AdminTab from "./_components/AdminTab";
import "../styles/dashboard-theme.css";

type TabId = "suivis" | "file" | "profil" | "pilotage";

interface Rights {
    canMentor: boolean;
    canManage: boolean;
}

function SuivisDashboard() {
    const router = useRouter();
    const params = useSearchParams();
    const [rights, setRights] = useState<Rights | null>(null);
    const tab = (params.get("tab") as TabId) || "suivis";

    useEffect(() => {
        api<Rights & { authenticated: boolean }>("/api/suivi")
            .then((d) => setRights({ canMentor: !!d.canMentor, canManage: !!d.canManage }))
            .catch(() => setRights({ canMentor: false, canManage: false }));
    }, []);

    const setTab = useCallback(
        (t: TabId) => router.replace(`/dashboard/suivis${t === "suivis" ? "" : `?tab=${t}`}`, { scroll: false }),
        [router]
    );

    if (!rights) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--dash-accent)]" />
            </div>
        );
    }

    if (!rights.canMentor && !rights.canManage) {
        return (
            <div className="dash-container">
                <div className="dash-empty">
                    <HeartHandshake className="mx-auto mb-3 h-8 w-8 text-[var(--dash-text-tertiary)]" />
                    <p className="dash-empty-title">Espace réservé aux bénévoles accompagnants</p>
                    <p className="dash-empty-text">
                        Demande à un administrateur de t&apos;attribuer la permission « Accompagner des élèves en suivi ».
                    </p>
                </div>
            </div>
        );
    }

    const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
        ...(rights.canMentor
            ? [
                  { id: "suivis" as TabId, label: "Mes suivis", icon: HeartHandshake },
                  { id: "file" as TabId, label: "File d'attente", icon: Inbox },
                  { id: "profil" as TabId, label: "Profil & charte", icon: UserCog },
              ]
            : []),
        ...(rights.canManage ? [{ id: "pilotage" as TabId, label: "Pilotage", icon: Gauge }] : []),
    ];
    const current = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;

    return (
        <div className="dash-container pb-16">
            <div className="dash-main-header">
                <h1 className="dash-main-title">Suivi personnalisé</h1>
                <p className="dash-main-subtitle">
                    Accompagne des élèves dans la durée : un plan, des ressources choisies pour eux, et quelqu&apos;un qui les suit.
                </p>
            </div>

            <div className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--dash-border)]" role="tablist">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={current === t.id}
                        onClick={() => setTab(t.id)}
                        className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                            current === t.id
                                ? "border-[var(--dash-accent)] text-[var(--dash-text)]"
                                : "border-transparent text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]"
                        }`}
                    >
                        <t.icon className="h-4 w-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {current === "suivis" && <MySuivisTab goToQueue={() => setTab("file")} />}
            {current === "file" && <QueueTab goToProfile={() => setTab("profil")} />}
            {current === "profil" && <ProfileTab />}
            {current === "pilotage" && <AdminTab />}
        </div>
    );
}

export default function SuivisDashboardPage() {
    return (
        <Suspense>
            <SuivisDashboard />
        </Suspense>
    );
}
