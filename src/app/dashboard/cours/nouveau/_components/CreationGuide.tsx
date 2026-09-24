"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Circle, Compass, Lightbulb, X, ChevronDown, AlertTriangle } from "lucide-react";

/**
 * Guide du rédacteur, à côté de chaque étape de « Créer un nouveau cours ».
 * Le contenu reprend le Guide des Rédacteurs & Correcteurs (docs/guide-redacteurs) :
 * même vocabulaire, mêmes règles, même exemple (« Les fonctions affines », 3e).
 */

interface GuideCourse {
  title: string;
  description: string;
  niveau: string;
  matiere: string;
  image: string;
  sections: { id: string; title: string }[];
  lessons: { id: string; title: string; sectionId: string; content?: string }[];
}

type CheckState = "ok" | "todo" | "warn";

interface LiveCheck {
  label: string;
  state: CheckState;
  /** Précision affichée sous le libellé (pourquoi ce n'est pas encore bon) */
  detail?: string;
}

interface StepGuide {
  eyebrow: string;
  title: string;
  intro: string;
  checks: (c: GuideCourse) => LiveCheck[];
  dos: string[];
  donts: string[];
  example?: { label: string; lines: string[] };
}

// « Chapitre 4 », « Maths 3e », « Cours n°2 » : titres introuvables dans la recherche
const VAGUE_TITLE = /^(chapitre|cours|le[çc]on|partie|section)\s*(n[°o]\s*)?\d+\b|^(maths?|fran[çc]ais|histoire|physique|svt|anglais)\s+\d/i;
const VAGUE_SECTION = /^(section|partie|chapitre)\s*\d*\s*$/i;

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const GUIDES: Record<number, StepGuide> = {
  1: {
    eyebrow: "Étape 1 · L'essentiel",
    title: "De quoi parle ton cours ?",
    intro:
      "Ces informations servent aux élèves pour trouver ton cours et savoir s'il est pour eux. La description dit ce que l'élève saura faire à la fin.",
    checks: (c) => {
      const title = c.title.trim();
      const desc = stripHtml(c.description);
      return [
        {
          label: "Un titre précis",
          state: !title ? "todo" : VAGUE_TITLE.test(title) || title.length < 6 ? "warn" : "ok",
          detail:
            title && (VAGUE_TITLE.test(title) || title.length < 6)
              ? "Donne le nom de la notion plutôt qu'un numéro de chapitre."
              : undefined,
        },
        { label: "La matière et le niveau", state: c.matiere && c.niveau ? "ok" : "todo" },
        {
          label: "Une description qui dit ce que l'élève saura faire",
          state: !desc ? "todo" : desc.length < 60 ? "warn" : "ok",
          detail: desc && desc.length < 60 ? "Une ou deux phrases de plus : qu'est-ce que l'élève saura faire ?" : undefined,
        },
      ];
    },
    dos: [
      "Le nom de la notion : on sait tout de suite de quoi ça parle.",
      "Une description courte, tournée vers l'élève : « Comprendre…, savoir…, utiliser… ».",
    ],
    donts: ["« Chapitre 4 », « Maths 3e », « Cours n°2 » : introuvables dans la recherche."],
    example: {
      label: "Exemple",
      lines: [
        "Titre : Les fonctions affines",
        "Mathématiques · Troisième (3ème)",
        "Description : Comprendre ce qu'est une fonction affine, la représenter et l'utiliser pour résoudre des problèmes.",
      ],
    },
  },
  2: {
    eyebrow: "Étape 2 · Le plan",
    title: "Découper le cours en étapes",
    intro:
      "Un cours est organisé comme un livre : les sections sont ses chapitres. Chaque section correspond à une étape de l'apprentissage.",
    checks: (c) => {
      const n = c.sections.length;
      const untitled = c.sections.filter((s) => !s.title.trim()).length;
      const vague = c.sections.filter((s) => VAGUE_SECTION.test(s.title.trim())).length;
      return [
        {
          label: "3 à 5 sections",
          state: n === 0 ? "todo" : n >= 3 && n <= 5 ? "ok" : "warn",
          detail:
            n > 0 && n < 3
              ? `${n} pour l'instant : un cours complet en a en général au moins 3.`
              : n > 5
              ? `${n} sections : ce cours pourrait peut-être être découpé en deux.`
              : undefined,
        },
        {
          label: "Chaque section a un titre",
          state: n === 0 ? "todo" : untitled === 0 ? "ok" : "todo",
          detail: untitled > 0 ? `${untitled} sans titre.` : undefined,
        },
        {
          label: "Des titres qui disent ce que l'élève apprend",
          state: n === 0 || untitled === n ? "todo" : vague === 0 ? "ok" : "warn",
          detail: vague > 0 ? "« Partie 1 » ne dit rien : nomme ce qu'on y apprend." : undefined,
        },
      ];
    },
    dos: [
      "Un plan qui suit l'apprentissage : découvrir → comprendre → appliquer.",
      "Un doute sur le plan ? Poste-le dans #📝・cours-suggestion avant d'écrire.",
    ],
    donts: ["Des titres vagues comme « Partie 1 » ou « Suite »."],
    example: {
      label: "Plan des fonctions affines",
      lines: [
        "1. Découvrir la notion (un abonnement de téléphone)",
        "2. Définition et représentation graphique",
        "3. Lire et calculer le coefficient directeur",
      ],
    },
  },
  3: {
    eyebrow: "Étape 3 · Les leçons",
    title: "Écrire pour un élève du niveau visé",
    intro:
      "Une idée principale par leçon : mieux vaut trois leçons courtes qu'une très longue. Écris comme tu expliquerais à voix haute. Tu peux aussi ajouter les leçons plus tard, depuis la gestion du cours.",
    checks: (c) => {
      const lessons = c.lessons;
      const incomplete = lessons.filter((l) => !l.title.trim() || !stripHtml(l.content || "")).length;
      const emptySections = c.sections.filter((s) => !lessons.some((l) => l.sectionId === s.id)).length;
      // Un bloc Définition ou Propriété sans aucun bloc Exemple dans la même leçon
      const noExample = lessons.filter((l) => {
        const html = l.content || "";
        return /blocktype="(definition|propriete)"/.test(html) && !/blocktype="exemple"/.test(html);
      }).length;
      return [
        {
          label: "Chaque leçon a un titre et un contenu",
          state: lessons.length === 0 ? "todo" : incomplete === 0 ? "ok" : "todo",
          detail: incomplete > 0 ? `${incomplete} leçon${incomplete > 1 ? "s" : ""} à compléter.` : undefined,
        },
        {
          label: "Un exemple après chaque définition ou propriété",
          state: lessons.length === 0 ? "todo" : noExample === 0 ? "ok" : "warn",
          detail:
            noExample > 0
              ? `${noExample} leçon${noExample > 1 ? "s ont" : " a"} une définition sans bloc Exemple.`
              : undefined,
        },
        {
          label: "Au moins une leçon par section",
          state: lessons.length === 0 ? "todo" : emptySections === 0 ? "ok" : "warn",
          detail:
            emptySections > 0
              ? `${emptySections} section${emptySections > 1 ? "s" : ""} sans leçon (possible, à compléter plus tard).`
              : undefined,
        },
      ];
    },
    dos: [
      "Tape « / » dans l'éditeur pour insérer un bloc : Définition, Exemple, Attention…",
      "Des blocs pour l'essentiel, du texte normal pour l'explication.",
      "Formules : $f(x) = 2x$ dans le texte, $$\\frac{a}{b}$$ centré.",
    ],
    donts: [
      "Une leçon entièrement en blocs : plus rien ne ressort.",
      "Copier un manuel ou un site : le contenu doit être original.",
    ],
    example: {
      label: "Le test du « petit frère »",
      lines: [
        "Relis ta leçon comme un élève qui n'a jamais vu la notion. Un mot non expliqué, une étape de calcul qui manque : c'est là qu'il décrochera.",
      ],
    },
  },
  4: {
    eyebrow: "Étape 4 · Vérifier",
    title: "Avant de créer le cours",
    intro:
      "Relis le plan comme un élève. Une fois créé, le cours reste « En attente de vérification » : il n'est pas visible tant qu'un Correcteur ne l'a pas relu.",
    checks: (c) => [
      ...GUIDES[1].checks(c).filter((k) => k.state !== "ok").map((k) => ({ ...k, label: `Infos · ${k.label}` })),
      ...GUIDES[2].checks(c).filter((k) => k.state !== "ok").map((k) => ({ ...k, label: `Plan · ${k.label}` })),
      ...GUIDES[3].checks(c).filter((k) => k.state === "warn").map((k) => ({ ...k, label: `Leçons · ${k.label}` })),
    ],
    dos: [
      "Ensuite, depuis la gestion du cours : ajoute exercices et quiz après chaque notion importante.",
      "Annonce ton cours dans #📝・cours-suggestion : les Helpeurs peuvent proposer fiche, exercices et quiz.",
      "Quand les leçons sont prêtes, signale-les dans #📝・cours-en-attente pour la relecture.",
    ],
    donts: [],
  },
};

const STATE_STYLE: Record<CheckState, { icon: ReactNode; tile: string }> = {
  ok: { icon: <Check className="w-3 h-3" strokeWidth={3} />, tile: "bg-[#7ed957] text-[#1a1512]" },
  warn: { icon: <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />, tile: "bg-[#ffb547] text-[#1a1512]" },
  todo: { icon: <Circle className="w-2.5 h-2.5" strokeWidth={3} />, tile: "bg-[#f5efe3] text-[#97938e]" },
};

const HIDDEN_KEY = "wk-course-guide-hidden";

export default function CreationGuide({ step, course }: { step: number; course: GuideCourse }) {
  const guide = GUIDES[step];
  const [hidden, setHidden] = useState(false);

  // Lu après le montage : la page est aussi rendue côté serveur, sans localStorage
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- préférence navigateur, lue une fois
      if (localStorage.getItem(HIDDEN_KEY) === "1") setHidden(true);
    } catch {
      /* navigation privée */
    }
  }, []);

  const toggle = () => {
    setHidden((h) => {
      try {
        localStorage.setItem(HIDDEN_KEY, h ? "0" : "1");
      } catch {
        /* navigation privée */
      }
      return !h;
    });
  };

  if (!guide) return null;

  const checks = guide.checks(course);
  const done = checks.filter((c) => c.state === "ok").length;

  if (hidden) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="dash-button dash-button-secondary dash-button-sm rounded-full self-start"
      >
        <Compass className="w-4 h-4 text-[#ff6a1a]" />
        Afficher le guide
      </button>
    );
  }

  return (
    <aside className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white overflow-hidden" aria-label="Guide du rédacteur">
      {/* En-tête papier */}
      <div className="bg-[#fdfaf4] border-b border-[#e6e0d6] px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c24a0a]">
            {guide.eyebrow}
          </span>
          <button
            type="button"
            onClick={toggle}
            className="p-1 rounded-full text-[#97938e] hover:text-[#1a1512] hover:bg-[#f5efe3]"
            title="Masquer le guide"
            aria-label="Masquer le guide"
          >
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
        <h3 className="font-serif-display text-xl leading-tight text-[#1a1512] mt-1">{guide.title}</h3>
        <p className="text-sm text-[#6b625c] mt-2 leading-relaxed">{guide.intro}</p>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Vérifications en direct */}
        {checks.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#97938e]">
                {step === 4 ? "À revoir" : "Où tu en es"}
              </span>
              {step !== 4 && (
                <span className="text-xs font-medium text-[#6b625c] tabular-nums">
                  {done}/{checks.length}
                </span>
              )}
            </div>
            <ul className="space-y-2.5">
              {checks.map((c) => (
                <li key={c.label} className="flex gap-2.5">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${STATE_STYLE[c.state].tile}`}
                  >
                    {STATE_STYLE[c.state].icon}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm ${c.state === "ok" ? "text-[#6b625c]" : "text-[#1a1512] font-medium"}`}>
                      {c.label}
                    </span>
                    {c.detail && <span className="block text-xs text-[#6b625c] mt-0.5">{c.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          step === 4 && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-[#ecfdf5] px-3 py-2.5 text-sm text-[#065f46]">
              <Check className="w-4 h-4" strokeWidth={3} />
              Tout est prêt, tu peux créer le cours.
            </div>
          )
        )}

        {/* Conseils */}
        {(guide.dos.length > 0 || guide.donts.length > 0) && (
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#97938e]">
              {step === 4 ? "Et après" : "Conseils"}
            </span>
            <ul className="mt-2 space-y-2">
              {guide.dos.map((d) => (
                <li key={d} className="flex gap-2 text-sm text-[#1a1512] leading-snug">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#3f8a1f]" strokeWidth={2.5} />
                  <span>{d}</span>
                </li>
              ))}
              {guide.donts.map((d) => (
                <li key={d} className="flex gap-2 text-sm text-[#6b625c] leading-snug">
                  <X className="w-4 h-4 mt-0.5 shrink-0 text-[#c2272d]" strokeWidth={2.5} />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Exemple */}
        {guide.example && (
          <div className="rounded-2xl bg-[#fdfaf4] border border-[#e6e0d6] p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7ed957] text-[#1a1512]">
                <Lightbulb className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3f8a1f]">
                {guide.example.label}
              </span>
            </div>
            <div className="space-y-1">
              {guide.example.lines.map((l) => (
                <p key={l} className="text-sm text-[#1a1512] leading-snug">
                  {l}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
