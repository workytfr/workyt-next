"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { educationData } from "@/data/educationData";
import { DEFAULT_MAX_ACTIVE, HELP_LINES } from "@/lib/mentorship/config";
import { api, ApiError } from "@/app/suivi/_lib/client";
import { CHARTER, ChipPicker } from "./ProfileTab";

/**
 * Premier passage d'un bénévole sur « Suivis » : la charte et ses matières,
 * en une seule étape. Tant que la charte n'est pas acceptée, il ne peut
 * prendre aucun suivi : autant la lui montrer tout de suite.
 */
export default function OnboardingTab({ onDone, onSkip }: { onDone: () => void; onSkip?: () => void }) {
    const [subjects, setSubjects] = useState<string[]>([]);
    const [levels, setLevels] = useState<string[]>([]);
    const [accept, setAccept] = useState(false);
    const [adult, setAdult] = useState(false);
    const [saving, setSaving] = useState(false);

    const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
        set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

    const submit = async () => {
        setSaving(true);
        try {
            await api("/api/suivi/mentor", {
                method: "PUT",
                json: { status: "available", maxActive: DEFAULT_MAX_ACTIVE, subjects, levels, acceptCharter: true, adultDeclared: adult },
            });
            toast.success("Charte acceptée — bienvenue parmi les bénévoles accompagnants !");
            onDone();
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="text-center">
                <HeartHandshake className="mx-auto h-8 w-8 text-[var(--dash-accent)]" />
                <h2 className="mt-2 text-xl font-semibold">Avant ton premier suivi</h2>
                <p className="mt-1 text-sm text-[var(--dash-text-secondary)]">
                    Lis la charte et choisis les matières où tu veux aider. Tu pourras tout modifier plus tard dans « Profil &amp; charte ».
                </p>
            </div>

            {/* ─── 1. Charte ─── */}
            <section className="dash-card p-6">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[var(--dash-accent)]" />
                    <h3 className="text-lg font-semibold">1. La charte du bénévole accompagnant</h3>
                </div>
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--dash-text-secondary)]">
                    {CHARTER.map((c) => (
                        <li key={c}>{c}</li>
                    ))}
                </ol>
                <div className="mt-4 rounded-xl bg-[var(--dash-bg-secondary)] p-3 text-xs text-[var(--dash-text-secondary)]">
                    <strong>Lignes d&apos;écoute à transmettre si besoin :</strong> {HELP_LINES.map((h) => h.name).join(" · ")}
                </div>
            </section>

            {/* ─── 2. Spécialités ─── */}
            <section className="dash-card space-y-6 p-6">
                <h3 className="text-lg font-semibold">2. Mes spécialités</h3>
                <ChipPicker
                    label="Matières"
                    hint="Aucune sélection = toutes les matières."
                    options={educationData.subjects}
                    selected={subjects}
                    onToggle={(v) => toggle(subjects, setSubjects, v)}
                />
                <ChipPicker
                    label="Niveaux"
                    hint="Aucune sélection = tous les niveaux."
                    options={educationData.levels}
                    selected={levels}
                    onToggle={(v) => toggle(levels, setLevels, v)}
                />
            </section>

            {/* ─── 3. Engagement ─── */}
            <section className="dash-card space-y-2.5 p-6">
                <label className="flex items-start gap-2.5 text-sm">
                    <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 accent-[var(--dash-accent)]" />
                    J&apos;ai lu la charte et je m&apos;engage à la respecter.
                </label>
                <label className="flex items-start gap-2.5 text-sm">
                    <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 accent-[var(--dash-accent)]" />
                    Je certifie être majeur·e.
                </label>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button type="button" disabled={!accept || !adult || saving} onClick={submit} className="dash-button dash-button-primary disabled:opacity-50">
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Accepter la charte et commencer
                    </button>
                    {onSkip && (
                        <button type="button" onClick={onSkip} className="dash-button dash-button-secondary">
                            Plus tard
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}
