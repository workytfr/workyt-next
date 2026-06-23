"use client";

import { useMemo, useState } from "react";
import { X, Plus, Trash2, Loader2, Wand2, FileJson, ListTree, AlertCircle, CheckCircle2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types de brouillon (builder)                                       */
/* ------------------------------------------------------------------ */
interface SkillDraft { description: string; difficulty: number; keywords: string }
interface ChapterDraft { name: string; subChapter: string; estimatedHours: number; examFrequency: number; skills: SkillDraft[] }
interface ThemeDraft { name: string; chapters: ChapterDraft[] }

interface ImportResult { message: string; created: number; updated: number; errors: string[] }

interface AddProgramModalProps {
    token?: string;
    onClose: () => void;
    onImported: (result: ImportResult) => void;
}

const CYCLES = [
    { value: "cycle3", label: "Cycle 3" },
    { value: "cycle4", label: "Cycle 4" },
    { value: "lycee", label: "Lycée" },
    { value: "superieur", label: "Supérieur" },
];

const CYCLE_CODE: Record<string, string> = { cycle3: "C3", cycle4: "C4", lycee: "LYC", superieur: "SUP" };

const newSkill = (): SkillDraft => ({ description: "", difficulty: 2, keywords: "" });
const newChapter = (): ChapterDraft => ({ name: "", subChapter: "", estimatedHours: 0, examFrequency: 0, skills: [newSkill()] });
const newTheme = (): ThemeDraft => ({ name: "", chapters: [newChapter()] });

const slug = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 6) || "SUBJ";

export default function AddProgramModal({ token, onClose, onImported }: AddProgramModalProps) {
    const [tab, setTab] = useState<"builder" | "json">("builder");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* En-tête commun */
    const [cycle, setCycle] = useState("cycle4");
    const [level, setLevel] = useState("");
    const [subject, setSubject] = useState("");
    const [version, setVersion] = useState("2025-2026");
    const [sourceReference, setSourceReference] = useState("");

    /* Builder */
    const [themes, setThemes] = useState<ThemeDraft[]>([newTheme()]);

    /* JSON tab */
    const [jsonText, setJsonText] = useState("");

    const totalSkills = themes.reduce((a, t) => a + t.chapters.reduce((b, c) => b + c.skills.length, 0), 0);

    /* ---- mutateurs builder ---- */
    const patchTheme = (ti: number, patch: Partial<ThemeDraft>) =>
        setThemes((prev) => prev.map((t, i) => (i === ti ? { ...t, ...patch } : t)));
    const patchChapter = (ti: number, ci: number, patch: Partial<ChapterDraft>) =>
        setThemes((prev) => prev.map((t, i) => i !== ti ? t : { ...t, chapters: t.chapters.map((c, j) => (j === ci ? { ...c, ...patch } : c)) }));
    const patchSkill = (ti: number, ci: number, si: number, patch: Partial<SkillDraft>) =>
        setThemes((prev) => prev.map((t, i) => i !== ti ? t : { ...t, chapters: t.chapters.map((c, j) => j !== ci ? c : { ...c, skills: c.skills.map((s, k) => (k === si ? { ...s, ...patch } : s)) }) }));

    const addTheme = () => setThemes((p) => [...p, newTheme()]);
    const removeTheme = (ti: number) => setThemes((p) => (p.length <= 1 ? p : p.filter((_, i) => i !== ti)));
    const addChapter = (ti: number) => patchTheme(ti, { chapters: [...themes[ti].chapters, newChapter()] });
    const removeChapter = (ti: number, ci: number) => patchTheme(ti, { chapters: themes[ti].chapters.filter((_, i) => i !== ci) });
    const addSkill = (ti: number, ci: number) => patchChapter(ti, ci, { skills: [...themes[ti].chapters[ci].skills, newSkill()] });
    const removeSkill = (ti: number, ci: number, si: number) => patchChapter(ti, ci, { skills: themes[ti].chapters[ci].skills.filter((_, i) => i !== si) });

    /* ---- construction du payload depuis le builder ---- */
    const buildPayload = () => {
        const subjCode = slug(subject);
        return {
            version,
            cycle,
            level,
            subject: subject.trim().toLowerCase().replace(/\s+/g, "-"),
            sourceReference: sourceReference || undefined,
            themes: themes.map((t, ti) => ({
                name: t.name.trim(),
                order: ti + 1,
                chapters: t.chapters.map((c, ci) => ({
                    name: c.name.trim(),
                    subChapter: c.subChapter.trim() || undefined,
                    estimatedHours: c.estimatedHours || 0,
                    examFrequency: c.examFrequency || 0,
                    skills: c.skills
                        .filter((s) => s.description.trim())
                        .map((s, si) => ({
                            id: `${CYCLE_CODE[cycle]}-${subjCode}-T${ti + 1}C${ci + 1}-${String(si + 1).padStart(2, "0")}`,
                            description: s.description.trim(),
                            difficulty: s.difficulty,
                            keywords: s.keywords.split(",").map((k) => k.trim()).filter(Boolean),
                        })),
                })),
            })),
        };
    };

    const validateBuilder = (): string | null => {
        if (!level.trim()) return "Indique le niveau (ex. 4eme).";
        if (!subject.trim()) return "Indique la matière (ex. anglais).";
        if (themes.some((t) => !t.name.trim())) return "Chaque thème doit avoir un nom.";
        if (themes.some((t) => t.chapters.some((c) => !c.name.trim()))) return "Chaque chapitre doit avoir un nom.";
        if (totalSkills === 0) return "Ajoute au moins une compétence.";
        if (themes.some((t) => t.chapters.some((c) => c.skills.every((s) => !s.description.trim()))))
            return "Chaque chapitre doit avoir au moins une compétence renseignée.";
        return null;
    };

    /* ---- aperçu / validation JSON ---- */
    const jsonPreview = useMemo(() => {
        if (!jsonText.trim()) return null;
        try {
            const p = JSON.parse(jsonText);
            if (!p.cycle || !p.level || !p.subject || !Array.isArray(p.themes)) {
                return { ok: false, msg: "Champs requis manquants : cycle, level, subject, themes." };
            }
            const chapters = p.themes.reduce((a: number, t: any) => a + (t.chapters?.length || 0), 0);
            const skills = p.themes.reduce((a: number, t: any) => a + (t.chapters || []).reduce((b: number, c: any) => b + (c.skills?.length || 0), 0), 0);
            return { ok: true, themes: p.themes.length, chapters, skills, subject: p.subject, level: p.level };
        } catch (e: any) {
            return { ok: false, msg: "JSON invalide : " + e.message };
        }
    }, [jsonText]);

    /* ---- import ---- */
    const doImport = async (payload: any) => {
        setBusy(true);
        setError(null);
        try {
            const res = await fetch("/api/curriculum/import", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (!res.ok) { setError(result.error || "Erreur d'import."); return; }
            onImported(result);
            onClose();
        } catch (e: any) {
            setError(e.message || "Erreur réseau.");
        } finally {
            setBusy(false);
        }
    };

    const handleSubmit = () => {
        if (tab === "builder") {
            const err = validateBuilder();
            if (err) { setError(err); return; }
            doImport(buildPayload());
        } else {
            if (!jsonPreview?.ok) { setError(jsonPreview && "msg" in jsonPreview ? (jsonPreview as any).msg : "JSON invalide."); return; }
            doImport(JSON.parse(jsonText));
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
            <div className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-[#37352f]">
                        <Wand2 className="h-5 w-5 text-[#f97316]" /> Créer un programme
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
                </div>

                {/* Onglets */}
                <div className="flex gap-1 border-b border-gray-100 px-5 pt-2">
                    {([["builder", "Builder", ListTree], ["json", "Coller un JSON", FileJson]] as const).map(([key, label, Icon]) => (
                        <button
                            key={key}
                            onClick={() => { setTab(key); setError(null); }}
                            className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium ${tab === key ? "border-b-2 border-[#f97316] text-[#f97316]" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <Icon className="h-4 w-4" /> {label}
                        </button>
                    ))}
                </div>

                {/* En-tête commun (cycle/niveau/matière) */}
                <div className="grid grid-cols-2 gap-3 border-b border-gray-100 px-5 py-3 sm:grid-cols-5">
                    <div>
                        <label className="dash-label mb-1 block text-xs">Cycle</label>
                        <select value={cycle} onChange={(e) => setCycle(e.target.value)} className="dash-input w-full text-sm">
                            {CYCLES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="dash-label mb-1 block text-xs">Niveau</label>
                        <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="4eme" className="dash-input w-full text-sm" />
                    </div>
                    <div>
                        <label className="dash-label mb-1 block text-xs">Matière</label>
                        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="anglais" className="dash-input w-full text-sm" />
                    </div>
                    <div>
                        <label className="dash-label mb-1 block text-xs">Version</label>
                        <input value={version} onChange={(e) => setVersion(e.target.value)} className="dash-input w-full text-sm" />
                    </div>
                    <div>
                        <label className="dash-label mb-1 block text-xs">Source (BO…)</label>
                        <input value={sourceReference} onChange={(e) => setSourceReference(e.target.value)} placeholder="optionnel" className="dash-input w-full text-sm" />
                    </div>
                </div>

                {/* Corps */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {tab === "builder" ? (
                        <div className="space-y-4">
                            {themes.map((theme, ti) => (
                                <div key={ti} className="rounded-xl border border-gray-200 bg-gray-50/40">
                                    <div className="flex items-center gap-2 border-b border-gray-100 p-3">
                                        <span className="text-xs font-bold text-[#f97316]">Thème {ti + 1}</span>
                                        <input
                                            value={theme.name}
                                            onChange={(e) => patchTheme(ti, { name: e.target.value })}
                                            placeholder="Nom du thème (ex. Grammaire)"
                                            className="dash-input flex-1 text-sm font-medium"
                                        />
                                        {themes.length > 1 && (
                                            <button onClick={() => removeTheme(ti)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                        )}
                                    </div>
                                    <div className="space-y-3 p-3">
                                        {theme.chapters.map((chap, ci) => (
                                            <div key={ci} className="rounded-lg border border-gray-200 bg-white">
                                                <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-2.5">
                                                    <input value={chap.name} onChange={(e) => patchChapter(ti, ci, { name: e.target.value })} placeholder="Chapitre (ex. Les temps du passé)" className="dash-input min-w-[180px] flex-1 text-sm" />
                                                    <input type="number" value={chap.estimatedHours} onChange={(e) => patchChapter(ti, ci, { estimatedHours: parseInt(e.target.value) || 0 })} title="Heures estimées" className="dash-input w-16 text-sm" placeholder="h" />
                                                    <input type="number" value={chap.examFrequency} onChange={(e) => patchChapter(ti, ci, { examFrequency: parseInt(e.target.value) || 0 })} title="Fréquence examen %" className="dash-input w-16 text-sm" placeholder="%" />
                                                    {theme.chapters.length > 1 && (
                                                        <button onClick={() => removeChapter(ti, ci)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                                    )}
                                                </div>
                                                <div className="space-y-1.5 p-2.5">
                                                    {chap.skills.map((sk, si) => (
                                                        <div key={si} className="flex items-center gap-2">
                                                            <input value={sk.description} onChange={(e) => patchSkill(ti, ci, si, { description: e.target.value })} placeholder="Compétence (ex. Conjuguer le prétérit)" className="dash-input flex-1 text-sm" />
                                                            <select value={sk.difficulty} onChange={(e) => patchSkill(ti, ci, si, { difficulty: parseInt(e.target.value) })} className="dash-input w-14 text-sm" title="Difficulté 1-5">
                                                                {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}
                                                            </select>
                                                            <input value={sk.keywords} onChange={(e) => patchSkill(ti, ci, si, { keywords: e.target.value })} placeholder="mots-clés, séparés, par virgules" className="dash-input w-40 text-xs" />
                                                            {chap.skills.length > 1 && (
                                                                <button onClick={() => removeSkill(ti, ci, si)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button onClick={() => addSkill(ti, ci)} className="mt-1 text-xs font-medium text-[#f97316] hover:underline">+ Compétence</button>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => addChapter(ti)} className="text-xs font-medium text-[#6b6b6b] hover:text-[#f97316]">+ Chapitre</button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addTheme} className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-[#f97316] hover:border-[#f97316]">
                                <Plus className="h-4 w-4" /> Ajouter un thème
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500">Colle ici un programme au format JSON (même structure que les fichiers <code>src/data/curricula</code>). Le cycle/niveau/matière de l'en-tête ne sont pas utilisés dans cet onglet (ils viennent du JSON).</p>
                            <textarea
                                value={jsonText}
                                onChange={(e) => setJsonText(e.target.value)}
                                rows={16}
                                placeholder='{ "version": "2025-2026", "cycle": "cycle4", "level": "4eme", "subject": "anglais", "themes": [ … ] }'
                                className="dash-input w-full font-mono text-xs"
                            />
                            {jsonPreview && (
                                jsonPreview.ok ? (
                                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {(jsonPreview as any).subject} · {(jsonPreview as any).level} — {(jsonPreview as any).themes} thèmes · {(jsonPreview as any).chapters} chapitres · {(jsonPreview as any).skills} compétences
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                        <AlertCircle className="h-4 w-4" /> {(jsonPreview as any).msg}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                    {error ? (
                        <p className="text-sm text-red-600">{error}</p>
                    ) : (
                        <span className="text-xs text-gray-400">
                            {tab === "builder" ? `${themes.length} thème(s) · ${totalSkills} compétence(s) — les IDs sont générés automatiquement` : "L'import met à jour les chapitres existants (upsert)."}
                        </span>
                    )}
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Annuler</button>
                        <button onClick={handleSubmit} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-50">
                            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Import…</> : "Créer le programme"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
