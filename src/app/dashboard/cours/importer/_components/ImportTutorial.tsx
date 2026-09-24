"use client";

import { useState } from "react";
import { Check, X, Shuffle, Sparkles, FileType2, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type ImportMode = "foxy" | "ia";

/** Les deux outils, présentés avec les mêmes mots partout (cartes, tutoriel). */
export const MODES: Record<
  ImportMode,
  { name: string; tagline: string; icon: typeof Shuffle; tile: string; ink: string; accept: string; formats: string }
> = {
  foxy: {
    name: "Foxy le Réorganisateur",
    tagline: "Range ton document tel que tu l'as écrit. Sans IA, instantané : rien n'est réécrit.",
    icon: Shuffle,
    tile: "#1a1512",
    ink: "#ffb547",
    accept: ".docx,.pdf",
    formats: "Word (.docx) ou PDF",
  },
  ia: {
    name: "MaitreRenard AI",
    tagline: "L'IA découpe un PDF en sections et leçons et corrige les fautes, sans réécrire ton texte. Peut aussi proposer des quiz.",
    icon: Sparkles,
    tile: "#ff6a1a",
    ink: "#ffffff",
    accept: ".pdf",
    formats: "PDF",
  },
};

interface Step {
  title: string;
  text: string;
}

const HOW: Record<ImportMode, { steps: Step[]; good: string[]; bad: string[] }> = {
  foxy: {
    steps: [
      {
        title: "Il lit la structure de ton fichier",
        text: "Word : les styles « Titre 1 » deviennent des sections, « Titre 2 » des leçons. PDF : Foxy cherche le sommaire intégré, sinon les titres écrits plus gros, sinon « Chapitre 1 », « I. », « A. ».",
      },
      {
        title: "Il reconnaît les blocs pédagogiques",
        text: "Un paragraphe qui commence par « Définition : », « Propriété », « Théorème », « Exemple », « Remarque » ou « Attention » devient le bloc correspondant du site.",
      },
      {
        title: "Tu relis et tu ajustes",
        text: "Rien n'est envoyé avant ta validation. Renomme, déplace, supprime, corrige le texte d'une leçon, puis crée le cours.",
      },
    ],
    good: [
      "Un fichier Word avec des styles de titre : le résultat est exact.",
      "Ton texte est gardé mot pour mot.",
      "Instantané, gratuit, le fichier reste sur ton ordinateur.",
    ],
    bad: [
      "Ne crée pas de quiz.",
      "PDF scanné (des photos de pages) : illisible.",
      "PDF sans titres visibles : tout arrive dans une seule leçon.",
    ],
  },
  ia: {
    steps: [
      {
        title: "Le texte du PDF est extrait",
        text: "Seul le texte est gardé : la mise en forme (gras, tailles, couleurs) est perdue à cette étape.",
      },
      {
        title: "L'IA découpe et corrige les fautes",
        text: "Elle recopie ton texte mot pour mot, corrige seulement l'orthographe, les accords et la ponctuation, retrouve les sections et les leçons et encadre les blocs pédagogiques. Elle ne reformule rien et n'ajoute rien.",
      },
      {
        title: "Un contrôle vérifie la fidélité",
        text: "Le site compare les mots du PDF et ceux du brouillon. Si l'IA a résumé ou réécrit un passage, tu es prévenu. Les quiz, eux, sont écrits par l'IA : vérifie chaque bonne réponse.",
      },
    ],
    good: [
      "Corrige les fautes d'orthographe sans toucher à ton style.",
      "Utile pour un PDF sans titres clairs.",
      "Propose des quiz prêts à relire.",
    ],
    bad: [
      "Prend une à plusieurs minutes.",
      "Une IA peut quand même se tromper : le contrôle de fidélité te le signale.",
      "PDF uniquement, 20 Mo maximum.",
    ],
  },
};

/** Panneau compact « Comment ça marche », à côté du formulaire. */
export function HowItWorks({ mode, onOpenTutorial }: { mode: ImportMode; onOpenTutorial: () => void }) {
  const how = HOW[mode];
  const m = MODES[mode];
  return (
    <aside className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white overflow-hidden">
      <div className="bg-[#fdfaf4] border-b border-[#e6e0d6] px-5 py-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c24a0a]">Comment ça marche</span>
        <h3 className="font-serif-display text-xl leading-tight text-[#1a1512] mt-1">{m.name}</h3>
      </div>
      <div className="px-5 py-4 space-y-5">
        <ol className="space-y-3">
          {how.steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#1a1512] font-serif-display text-sm text-[#fdfaf4]">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#1a1512]">{s.title}</span>
                <span className="block text-sm text-[#6b625c] leading-snug mt-0.5">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <ProsCons good={how.good} bad={how.bad} />
        <button
          type="button"
          onClick={onOpenTutorial}
          className="dash-button dash-button-secondary dash-button-sm w-full justify-center rounded-full"
        >
          <BookOpen className="h-4 w-4" />
          Voir le tutoriel complet
        </button>
      </div>
    </aside>
  );
}

function ProsCons({ good, bad }: { good: string[]; bad: string[] }) {
  return (
    <ul className="space-y-2">
      {good.map((g) => (
        <li key={g} className="flex gap-2 text-sm text-[#1a1512] leading-snug">
          <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#3f8a1f]" strokeWidth={2.5} />
          <span>{g}</span>
        </li>
      ))}
      {bad.map((b) => (
        <li key={b} className="flex gap-2 text-sm text-[#6b625c] leading-snug">
          <X className="w-4 h-4 mt-0.5 shrink-0 text-[#c2272d]" strokeWidth={2.5} />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

type TutorialTab = "choisir" | "word" | "foxy" | "ia";

const TABS: { id: TutorialTab; label: string }[] = [
  { id: "choisir", label: "Lequel choisir ?" },
  { id: "word", label: "Préparer son Word" },
  { id: "foxy", label: "Foxy" },
  { id: "ia", label: "MaitreRenard AI" },
];

/** Tutoriel complet, en popup. */
export function ImportTutorialDialog({
  open,
  onOpenChange,
  initialTab = "choisir",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: TutorialTab;
}) {
  const [tab, setTab] = useState<TutorialTab>(initialTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName="dash-dialog-overlay" className="dash-dialog max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="dash-dialog-header">
          <DialogTitle>Tutoriel · Importer un cours</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-[#1a1512] text-[#fdfaf4]" : "text-[#6b625c] hover:bg-[#f5efe3] hover:text-[#1a1512]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="text-sm text-[#1a1512] leading-relaxed">
          {tab === "choisir" && (
            <div className="space-y-4">
              <p className="text-[#6b625c]">
                Les deux outils créent un <b className="text-[#1a1512]">brouillon</b> que tu relis avant de créer le cours. Le cours
                créé reste « En attente de vérification » jusqu&apos;à la relecture par un Correcteur.
              </p>
              <div className="overflow-hidden rounded-2xl border border-[#e6e0d6]">
                <table className="w-full text-sm">
                  <thead className="bg-[#fdfaf4] text-left">
                    <tr>
                      <th className="px-3 py-2 font-semibold" />
                      <th className="px-3 py-2 font-semibold">Foxy</th>
                      <th className="px-3 py-2 font-semibold">MaitreRenard AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6e0d6]">
                    {[
                      ["Fichiers", "Word (.docx), PDF", "PDF"],
                      ["IA", "Non", "Oui"],
                      ["Ton texte", "Gardé mot pour mot", "Gardé, fautes corrigées"],
                      ["Durée", "Quelques secondes", "Une à plusieurs minutes"],
                      ["Quiz", "Non (à ajouter ensuite)", "Oui, proposés par section"],
                      ["Idéal pour", "Un cours bien titré", "Un PDF sans titres clairs"],
                    ].map(([k, a, b], i) => (
                      <tr key={k} className={i % 2 ? "bg-[#fdfaf4]" : "bg-white"}>
                        <td className="px-3 py-2 font-medium">{k}</td>
                        <td className="px-3 py-2">{a}</td>
                        <td className="px-3 py-2">{b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Tip>
                Tu as le fichier Word d&apos;origine ? Utilise <b>Foxy avec le .docx</b> : c&apos;est le résultat le plus fidèle.
              </Tip>
            </div>
          )}

          {tab === "word" && (
            <div className="space-y-4">
              <p className="text-[#6b625c]">
                Foxy lit les <b className="text-[#1a1512]">styles</b> de Word, pas la taille ou la couleur du texte. Deux minutes de
                préparation donnent un import parfait.
              </p>
              <ol className="space-y-3">
                {[
                  ["Le titre du cours", "Style « Titre » (facultatif) : Foxy le propose comme titre du cours."],
                  ["Chaque chapitre", "Style « Titre 1 » : il devient une section."],
                  ["Chaque leçon", "Style « Titre 2 » : il devient une leçon de la section au-dessus."],
                  ["Les sous-parties", "Style « Titre 3 » : il reste un sous-titre dans la leçon."],
                  ["Les blocs", "Commence le paragraphe par « Définition : », « Propriété : », « Exemple : »…"],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#ff6a1a] font-serif-display text-sm text-white">
                      {i + 1}
                    </span>
                    <span>
                      <b>{t}</b> — <span className="text-[#6b625c]">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="rounded-2xl border border-[#e6e0d6] bg-[#fdfaf4] p-4 font-mono text-[13px] leading-relaxed">
                <div className="text-[#c24a0a]">Titre 1 · Découvrir la notion</div>
                <div className="pl-4 text-[#2f86b3]">Titre 2 · Une situation concrète</div>
                <div className="pl-8 text-[#6b625c]">Texte normal…</div>
                <div className="pl-8 text-[#6b625c]">Définition : une fonction affine est…</div>
                <div className="text-[#c24a0a]">Titre 1 · Définition et représentation</div>
                <div className="pl-4 text-[#2f86b3]">Titre 2 · La droite représentative</div>
              </div>
              <Tip>
                Dans Word : onglet <b>Accueil › Styles</b>. Dans Google Docs : menu <b>Format › Styles de paragraphe</b>, puis{" "}
                <b>Fichier › Télécharger › Microsoft Word (.docx)</b>.
              </Tip>
            </div>
          )}

          {tab === "foxy" && <ModeTutorial mode="foxy" />}
          {tab === "ia" && <ModeTutorial mode="ia" />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModeTutorial({ mode }: { mode: ImportMode }) {
  const m = MODES[mode];
  const how = HOW[mode];
  const Icon = m.icon;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: m.tile, color: m.ink }}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="font-serif-display text-xl">{m.name}</div>
          <div className="text-[#6b625c]">{m.tagline}</div>
        </div>
      </div>
      <ol className="space-y-3">
        {how.steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#1a1512] font-serif-display text-sm text-[#fdfaf4]">
              {i + 1}
            </span>
            <span>
              <b>{s.title}</b>
              <span className="block text-[#6b625c]">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <ProsCons good={how.good} bad={how.bad} />
      {mode === "foxy" && (
        <Tip icon={<FileType2 className="h-4 w-4" />}>
          Après l&apos;import, Foxy t&apos;indique <b>comment il a lu ton fichier</b> (styles Word, sommaire du PDF, taille des
          caractères…) et ce qu&apos;il faut vérifier.
        </Tip>
      )}
    </div>
  );
}

function Tip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-2xl bg-[#fff4ec] px-4 py-3 text-[#1a1512]">
      <span className="mt-0.5 text-[#c24a0a]">{icon ?? <BookOpen className="h-4 w-4" />}</span>
      <span>{children}</span>
    </div>
  );
}
