"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Check, FileText, Loader2, Trophy, Upload, BookOpen, Info } from "lucide-react";
import { educationData } from "@/data/educationData";
import MascotLoader from "@/components/ui/MascotLoader";
import RequiredMark from "@/components/ui/RequiredMark";
import DraftEditor, { type CourseDraft, type QuizDraft } from "./DraftEditor";
import { HowItWorks, ImportTutorialDialog, MODES, type ImportMode } from "./ImportTutorial";
import { METHOD_LABEL, readWithFoxy, type FoxyResult } from "../_lib/foxy";

type Step = "form" | "generating" | "editing";

const QUIZ_TYPES = ["QCM", "Vrai/Faux", "Réponse courte", "Texte à trous", "Classement", "Glisser-déposer", "Slider", "Code"];

const MAX_SIZE = 20 * 1024 * 1024;

export default function CourseImporter() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<ImportMode>(params.get("mode") === "ia" ? "ia" : "foxy");
  const [step, setStep] = useState<Step>("form");
  const [title, setTitle] = useState("");
  const [matiere, setMatiere] = useState("");
  const [niveau, setNiveau] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<CourseDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [useWorkytV1, setUseWorkytV1] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // MaitreRenard AI
  const [generateQuizzes, setGenerateQuizzes] = useState(true);
  const [allowedTypes, setAllowedTypes] = useState<string[]>(QUIZ_TYPES.slice(0, 6));
  const [progressStep, setProgressStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [pdfPages, setPdfPages] = useState<number | null>(null);
  // Contrôle serveur : part du texte du PDF gardée / part de mots qui n'y étaient pas
  const [iaCheck, setIaCheck] = useState<{ kept: number; added: number; truncated: boolean } | null>(null);

  // Foxy
  const [foxyReport, setFoxyReport] = useState<FoxyResult["report"] | null>(null);

  const role = (session?.user as any)?.role;
  const canImport = role === "Admin" || role === "Rédacteur" || role === "Correcteur";
  const m = MODES[mode];

  const switchMode = (next: ImportMode) => {
    setMode(next);
    setError("");
    // Un .docx choisi pour Foxy n'est pas lisible par MaitreRenard AI
    if (next === "ia" && file && !file.name.toLowerCase().endsWith(".pdf")) setFile(null);
    router.replace(`/dashboard/cours/importer?mode=${next}`, { scroll: false });
  };

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    const name = f.name.toLowerCase();
    const ok = mode === "ia" ? name.endsWith(".pdf") : name.endsWith(".pdf") || name.endsWith(".docx");
    if (!ok) {
      setError(
        mode === "ia"
          ? "MaitreRenard AI lit uniquement les PDF. Pour un fichier Word, utilise Foxy."
          : name.endsWith(".doc")
          ? "Ancien format Word (.doc) : ouvre-le et enregistre-le en .docx."
          : "Foxy lit les fichiers Word (.docx) et PDF."
      );
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("Le fichier ne doit pas dépasser 20 Mo.");
      return;
    }
    setFile(f);
    setError("");
  };

  const ready = Boolean(title.trim() && matiere && niveau && file && (mode === "foxy" || !generateQuizzes || allowedTypes.length));

  /* ---------------- Foxy : lecture dans le navigateur ---------------- */
  const runFoxy = async () => {
    if (!file) return;
    setStep("generating");
    try {
      const result = await readWithFoxy(file);
      if (result.sections.length === 0) {
        setError(result.report.warnings[0] || "Foxy n'a trouvé aucun contenu dans ce fichier.");
        setStep("form");
        return;
      }
      setFoxyReport(result.report);
      setDraft({
        // Le titre saisi prime ; sinon celui trouvé dans le document
        title: title.trim() || result.suggestedTitle || "",
        matiere,
        niveau,
        description: "",
        sections: result.sections,
        quizzes: [],
      });
      setStep("editing");
    } catch (e: any) {
      console.error("Foxy :", e);
      setError(
        e?.name === "PasswordException"
          ? "Ce PDF est protégé par un mot de passe : retire la protection puis réessaie."
          : "Foxy n'a pas réussi à lire ce fichier. S'il vient de Word, réessaie avec le .docx."
      );
      setStep("form");
    }
  };

  /* ---------------- MaitreRenard AI : génération côté serveur ---------------- */
  const runIa = async () => {
    if (!file) return;
    setStep("generating");
    setProgressStep(1);
    setProgressMessage("Démarrage…");

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("title", title.trim());
    formData.append("matiere", matiere);
    formData.append("niveau", niveau);
    formData.append("generateQuizzes", String(generateQuizzes));
    if (generateQuizzes) formData.append("allowedTypes", allowedTypes.join(","));

    try {
      const accessToken = (session as any)?.accessToken;
      const res = await fetch("/api/cours/generate", {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: "include",
        body: formData,
      });

      if (!res.ok || !res.body) {
        let msg = "Erreur réseau. Réessaie.";
        try {
          const json = JSON.parse(await res.text());
          msg = json.error?.message || json.message || msg;
        } catch {
          if (res.status === 401) msg = "Session expirée : reconnecte-toi.";
        }
        setError(msg);
        setStep("form");
        return;
      }

      // Flux SSE : progress… puis done ou error
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const raw = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          let type = "";
          let data = "";
          for (const line of raw.split("\n")) {
            if (line.startsWith("event: ")) type = line.slice(7).trim();
            else if (line.startsWith("data: ")) data = line.slice(6);
          }
          if (data) {
            try {
              const payload = JSON.parse(data);
              if (type === "progress") {
                setProgressStep(payload.step);
                setProgressMessage(payload.message);
              } else if (type === "done") {
                setDraft({
                  ...payload.draft,
                  quizzes: (payload.draft.quizzes || []).map((q: QuizDraft) => ({ ...q, collapsed: true })),
                });
                setPdfPages(payload.pdfInfo?.pages ?? null);
                setIaCheck(
                  payload.fidelity
                    ? { ...payload.fidelity, truncated: Boolean(payload.pdfInfo?.truncated) }
                    : null
                );
                setStep("editing");
              } else if (type === "error") {
                setError(payload.message || "Erreur lors de la génération.");
                setStep("form");
              }
            } catch {
              /* données SSE malformées ignorées */
            }
          }
          boundary = buffer.indexOf("\n\n");
        }
      }
    } catch {
      setError("Erreur réseau. Réessaie.");
      setStep("form");
    }
  };

  const start = () => {
    if (!ready) {
      setError("Remplis le titre, la matière, le niveau et choisis un fichier.");
      return;
    }
    setError("");
    setFoxyReport(null);
    if (mode === "foxy") void runFoxy();
    else void runIa();
  };

  /* ---------------- Création du cours (même API pour les deux) ---------------- */
  const confirm = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/cours/generate/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({
          ...draft,
          sections: draft.sections.map(({ collapsed: _c, ...s }) => s),
          quizzes: draft.quizzes.map(({ collapsed: _c, ...q }) => q),
          useWorkytV1,
        }),
      });
      const data = await res.json();
      if (data.success && data.courseId) {
        router.push(`/dashboard/cours/${data.courseId}/gestion`);
      } else {
        setError(data.message || "Erreur lors de la création du cours.");
      }
    } catch {
      setError("Erreur réseau. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  /* ================================================================== */

  if (session && !canImport) {
    return (
      <div className="dash-card mx-auto max-w-md p-8 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-[#c9c3bb]" />
        <h2 className="font-serif-display text-xl text-[#1a1512]">Accès réservé</h2>
        <p className="mt-1 text-sm text-[#6b625c]">L&apos;import de cours est ouvert aux Rédacteurs, Correcteurs et Admins.</p>
      </div>
    );
  }

  /* ---------- Étape : génération ---------- */
  if (step === "generating") {
    const iaSteps = [
      "Authentification",
      "Extraction du PDF",
      "Envoi à l'IA",
      "Analyse de la réponse",
      "Structuration du cours",
      ...(generateQuizzes ? ["Génération des quiz"] : []),
    ];
    return (
      <div className="dash-card mx-auto max-w-lg p-8">
        <div className="mb-6 text-center">
          <MascotLoader message={mode === "foxy" ? "Foxy range ton document…" : "MaitreRenard AI prépare ton cours…"} size="lg" />
          <p className="mt-1 text-sm text-[#6b625c]">
            {mode === "foxy" ? "Quelques secondes : tout se passe sur ton ordinateur." : "Cela peut prendre une à plusieurs minutes."}
          </p>
        </div>
        {mode === "ia" && (
          <>
            <ol className="mb-6 space-y-3">
              {iaSteps.map((label, i) => {
                const num = i + 1;
                const done = progressStep > num;
                const active = progressStep === num;
                return (
                  <li key={label} className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-medium ${
                        done ? "bg-[#7ed957] text-[#1a1512]" : active ? "bg-[#ff6a1a] text-white" : "bg-[#f5efe3] text-[#97938e]"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : num}
                    </span>
                    <span className={`text-sm ${done || active ? "font-medium text-[#1a1512]" : "text-[#97938e]"}`}>{label}</span>
                  </li>
                );
              })}
            </ol>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#f5efe3]">
              <div
                className="h-full rounded-full bg-[#ff6a1a] transition-all duration-700"
                style={{ width: `${(progressStep / iaSteps.length) * 100}%` }}
              />
            </div>
            <p className="min-h-[20px] text-center text-sm text-[#6b625c]">{progressMessage}</p>
          </>
        )}
      </div>
    );
  }

  /* ---------- Étape : brouillon ---------- */
  if (step === "editing" && draft) {
    const summary =
      mode === "foxy" && foxyReport ? (
        <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a1512] text-[#ffb547]">
              <m.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-[#1a1512]">
                Foxy a lu ton fichier grâce à <b>{METHOD_LABEL[foxyReport.method]}</b>
                {foxyReport.pages ? ` (${foxyReport.pages} pages)` : ""}.
                {foxyReport.blocks > 0 && (
                  <> Il a reconnu <b>{foxyReport.blocks} bloc{foxyReport.blocks > 1 ? "s" : ""} pédagogique{foxyReport.blocks > 1 ? "s" : ""}</b>.</>
                )}
              </p>
              {foxyReport.warnings.map((w) => (
                <p key={w} className="flex gap-2 text-sm text-[#9a5d00]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {w}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <IaSummary pages={pdfPages} check={iaCheck} hasQuizzes={draft.quizzes.length > 0} />
      );

    return (
      <DraftEditor
        draft={draft}
        setDraft={setDraft}
        summary={summary}
        saving={saving}
        error={error}
        onBack={() => setStep("form")}
        onConfirm={confirm}
      />
    );
  }

  /* ---------- Étape : formulaire ---------- */
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="dash-main-title">Importer un cours</h1>
          <p className="dash-main-subtitle">
            Pars d&apos;un document déjà écrit : tu relis le brouillon avant de créer le cours.
          </p>
        </div>
        <button type="button" onClick={() => setTutorialOpen(true)} className="dash-button dash-button-secondary rounded-full">
          <BookOpen className="h-4 w-4" />
          Tutoriel
        </button>
      </div>

      {/* Choix de l'outil */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2" role="radiogroup" aria-label="Outil d'import">
        {(Object.keys(MODES) as ImportMode[]).map((key) => {
          const mm = MODES[key];
          const active = mode === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => switchMode(key)}
              className={`flex items-start gap-4 rounded-3xl border bg-white p-5 text-left transition-all ${
                active
                  ? "border-[#1a1512] shadow-[0_0_0_3px_rgba(255,106,26,0.18)]"
                  : "border-[rgba(26,21,18,0.08)] hover:border-[#d6cec2]"
              }`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: mm.tile, color: mm.ink }}>
                <mm.icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-serif-display text-xl text-[#1a1512]">{mm.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                      key === "foxy" ? "bg-[#ecfdf5] text-[#065f46]" : "bg-[#fff4ec] text-[#c24a0a]"
                    }`}
                  >
                    {key === "foxy" ? "Sans IA" : "IA"}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-snug text-[#6b625c]">{mm.tagline}</span>
                <span className="mt-2 block text-xs font-medium text-[#97938e]">{mm.formats}</span>
              </span>
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? "border-[#ff6a1a] bg-[#ff6a1a] text-white" : "border-[#d6cec2]"
                }`}
              >
                {active && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* Formulaire */}
        <div className="dash-card space-y-5 p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-[#f5c2c4] bg-[#fdecec] px-4 py-3 text-sm text-[#c2272d]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="dash-form-group">
            <label className="dash-label" htmlFor="imp-title">
              Titre du cours <RequiredMark />
            </label>
            <input
              id="imp-title"
              className="dash-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. : Les fonctions affines"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="dash-form-group">
              <label className="dash-label" htmlFor="imp-matiere">
                Matière <RequiredMark />
              </label>
              <select id="imp-matiere" className="dash-input" value={matiere} onChange={(e) => setMatiere(e.target.value)}>
                <option value="">Choisis une matière</option>
                {educationData.subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="dash-form-group">
              <label className="dash-label" htmlFor="imp-niveau">
                Niveau <RequiredMark />
              </label>
              <select id="imp-niveau" className="dash-input" value={niveau} onChange={(e) => setNiveau(e.target.value)}>
                <option value="">Choisis un niveau</option>
                {educationData.levels.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fichier : clic ou glisser-déposer */}
          <div className="dash-form-group">
            <span className="dash-label">
              Fichier ({m.formats}) <RequiredMark />
            </span>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className={`cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${
                dragging
                  ? "border-[#ff6a1a] bg-[#fff4ec]"
                  : file
                  ? "border-[#1a1512]/20 bg-[#fdfaf4]"
                  : "border-[#d6cec2] hover:border-[#ff6a1a] hover:bg-[#fff4ec]/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={m.accept}
                className="hidden"
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6ec1e4] text-[#1a1512]">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-medium text-[#1a1512]">{file.name}</span>
                    <span className="block text-xs text-[#6b625c]">
                      {(file.size / (1024 * 1024)).toFixed(1)} Mo · clique pour changer
                    </span>
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-3 h-9 w-9 text-[#97938e]" />
                  <p className="text-sm font-medium text-[#1a1512]">Clique ou glisse ton fichier ici</p>
                  <p className="mt-1 text-xs text-[#97938e]">{m.formats} · 20 Mo maximum</p>
                </>
              )}
            </div>
            {mode === "foxy" && (
              <p className="mt-2 text-xs text-[#6b625c]">
                Tu as le fichier Word d&apos;origine ? Préfère le .docx : Foxy y lit les titres exactement.
              </p>
            )}
          </div>

          {/* Options MaitreRenard AI : quiz */}
          {mode === "ia" && (
            <div className={`overflow-hidden rounded-2xl border ${generateQuizzes ? "border-[#ffd58a] bg-[#fff4e0]/50" : "border-[#e6e0d6]"}`}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={generateQuizzes}
                  onChange={(e) => setGenerateQuizzes(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#ff6a1a]"
                />
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ffb547] text-[#1a1512]">
                  <Trophy className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-[#1a1512]">Proposer des quiz par section</span>
                  <span className="block text-xs text-[#6b625c]">5 à 8 questions par section, à vérifier avant de créer le cours.</span>
                </span>
              </label>
              {generateQuizzes && (
                <div className="border-t border-[#ffd58a] px-4 pb-4 pt-3">
                  <p className="mb-2 text-xs font-medium text-[#6b625c]">Types de questions autorisés</p>
                  <div className="flex flex-wrap gap-2">
                    {QUIZ_TYPES.map((t) => {
                      const on = allowedTypes.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAllowedTypes((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            on ? "border-[#1a1512] bg-[#1a1512] text-[#fdfaf4]" : "border-[#e6e0d6] bg-white text-[#6b625c] hover:border-[#d6cec2]"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  {allowedTypes.length === 0 && (
                    <p className="mt-2 text-xs text-[#c2272d]">Choisis au moins un type de question.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Migration depuis l'ancienne version (Admin) */}
          {role === "Admin" && (
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e6e0d6] bg-[#fdfaf4] p-3">
              <input
                type="checkbox"
                checked={useWorkytV1}
                onChange={(e) => setUseWorkytV1(e.target.checked)}
                className="h-4 w-4 rounded accent-[#ff6a1a]"
              />
              <span>
                <span className="block text-sm font-medium text-[#1a1512]">Attribuer à Workyt V1</span>
                <span className="block text-xs text-[#6b625c]">Pour un cours qui vient de l&apos;ancienne version du site.</span>
              </span>
            </label>
          )}

          <button
            type="button"
            onClick={start}
            disabled={!ready}
            className="dash-button dash-button-primary w-full justify-center rounded-full py-3 text-base disabled:opacity-50"
          >
            <m.icon className="h-5 w-5" />
            {mode === "foxy" ? "Ranger avec Foxy" : "Générer avec MaitreRenard AI"}
          </button>
        </div>

        <div className="lg:sticky lg:top-24">
          <HowItWorks mode={mode} onOpenTutorial={() => setTutorialOpen(true)} />
        </div>
      </div>

      <ImportTutorialDialog open={tutorialOpen} onOpenChange={setTutorialOpen} initialTab={mode === "foxy" ? "choisir" : "ia"} />
    </div>
  );
}

/** Bandeau du brouillon MaitreRenard AI : ce que l'IA avait le droit de faire, et le contrôle de fidélité. */
function IaSummary({
  pages,
  check,
  hasQuizzes,
}: {
  pages: number | null;
  check: { kept: number; added: number; truncated: boolean } | null;
  hasQuizzes: boolean;
}) {
  // Seuils calibrés : une simple correction des fautes reste loin en dessous
  const lost = check && check.kept < 85;
  const rewritten = check && check.added > 20;
  const faithful = check && !lost && !rewritten && !check.truncated;

  return (
    <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff6a1a] text-white">
          <Info className="h-5 w-5" />
        </span>
        <div className="min-w-0 space-y-1.5 text-sm">
          <p className="text-[#1a1512]">
            Brouillon de <b>MaitreRenard AI</b>
            {pages ? ` (${pages} pages)` : ""} : ton texte est gardé tel quel, seules les fautes ont été corrigées.
          </p>
          {faithful && (
            <p className="flex gap-2 text-[#065f46]">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              Contrôle de fidélité : {check.kept} % des mots du PDF sont dans le brouillon, rien n&apos;a été réécrit.
            </p>
          )}
          {lost && (
            <p className="flex gap-2 text-[#9a5d00]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Seulement {check.kept} % des mots du PDF se retrouvent dans le brouillon : l&apos;IA a peut-être résumé ou oublié des
              passages. Compare avec ton PDF.
            </p>
          )}
          {rewritten && (
            <p className="flex gap-2 text-[#9a5d00]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {check.added} % des mots du brouillon ne sont pas dans le PDF : l&apos;IA a peut-être reformulé. Relis chaque leçon, ou
              utilise Foxy qui garde le texte à l&apos;identique.
            </p>
          )}
          {check?.truncated && (
            <p className="flex gap-2 text-[#9a5d00]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              PDF très long : seul le début (100 000 caractères) a été traité. Importe la suite dans un second temps.
            </p>
          )}
          {hasQuizzes && <p className="text-[#6b625c]">Les quiz, eux, sont écrits par l&apos;IA : vérifie chaque bonne réponse.</p>}
        </div>
      </div>
    </div>
  );
}
