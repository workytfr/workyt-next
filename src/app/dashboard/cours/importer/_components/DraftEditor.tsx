"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  Eye,
} from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditorClientWrapper";

export interface LessonDraft {
  title: string;
  content: string;
  order: number;
}

export interface SectionDraft {
  title: string;
  order: number;
  lessons: LessonDraft[];
  collapsed?: boolean;
}

export interface QuestionDraft {
  question: string;
  questionType: string;
  answerSelectionType: "single" | "multiple";
  answers: string[];
  correctAnswer: any;
  explanation?: string;
  point: number;
}

export interface QuizDraft {
  sectionIndex: number;
  title: string;
  description?: string;
  questions: QuestionDraft[];
  collapsed?: boolean;
}

export interface CourseDraft {
  title: string;
  matiere: string;
  niveau: string;
  description?: string;
  sections: SectionDraft[];
  quizzes: QuizDraft[];
}

interface Props {
  draft: CourseDraft;
  setDraft: (d: CourseDraft) => void;
  /** Bandeau « comment le fichier a été lu » + avertissements */
  summary: React.ReactNode;
  saving: boolean;
  error: string;
  onBack: () => void;
  onConfirm: () => void;
}

const reorder = <T extends { order: number }>(list: T[]) => list.forEach((x, i) => (x.order = i + 1));

export default function DraftEditor({ draft, setDraft, summary, saving, error, onBack, onConfirm }: Props) {
  // Une seule leçon en édition à la fois : un éditeur par leçon serait trop lourd
  const [editing, setEditing] = useState<string | null>(null);

  const totalLessons = draft.sections.reduce((n, s) => n + s.lessons.length, 0);
  const totalQuestions = draft.quizzes.reduce((n, q) => n + q.questions.length, 0);

  /* --- sections --- */
  const updateSection = (si: number, updates: Partial<SectionDraft>) => {
    const sections = [...draft.sections];
    sections[si] = { ...sections[si], ...updates };
    setDraft({ ...draft, sections });
  };
  const removeSection = (si: number) => {
    const sections = draft.sections.filter((_, i) => i !== si);
    reorder(sections);
    const quizzes = draft.quizzes
      .filter((q) => q.sectionIndex !== si)
      .map((q) => ({ ...q, sectionIndex: q.sectionIndex > si ? q.sectionIndex - 1 : q.sectionIndex }));
    setDraft({ ...draft, sections, quizzes });
  };
  const moveSection = (si: number, dir: -1 | 1) => {
    const target = si + dir;
    if (target < 0 || target >= draft.sections.length) return;
    const sections = [...draft.sections];
    [sections[si], sections[target]] = [sections[target], sections[si]];
    reorder(sections);
    const quizzes = draft.quizzes.map((q) =>
      q.sectionIndex === si ? { ...q, sectionIndex: target } : q.sectionIndex === target ? { ...q, sectionIndex: si } : q
    );
    setDraft({ ...draft, sections, quizzes });
  };
  const addSection = () =>
    setDraft({
      ...draft,
      sections: [...draft.sections, { title: "Nouvelle section", order: draft.sections.length + 1, lessons: [] }],
    });

  /* --- leçons --- */
  const updateLesson = (si: number, li: number, updates: Partial<LessonDraft>) => {
    const sections = [...draft.sections];
    const lessons = [...sections[si].lessons];
    lessons[li] = { ...lessons[li], ...updates };
    sections[si] = { ...sections[si], lessons };
    setDraft({ ...draft, sections });
  };
  const removeLesson = (si: number, li: number) => {
    const sections = [...draft.sections];
    const lessons = sections[si].lessons.filter((_, i) => i !== li);
    reorder(lessons);
    sections[si] = { ...sections[si], lessons };
    setDraft({ ...draft, sections });
  };
  const moveLesson = (si: number, li: number, dir: -1 | 1) => {
    const target = li + dir;
    const sections = [...draft.sections];
    const lessons = [...sections[si].lessons];
    if (target < 0 || target >= lessons.length) return;
    [lessons[li], lessons[target]] = [lessons[target], lessons[li]];
    reorder(lessons);
    sections[si] = { ...sections[si], lessons };
    setDraft({ ...draft, sections });
  };
  const addLesson = (si: number) => {
    const sections = [...draft.sections];
    sections[si] = {
      ...sections[si],
      lessons: [...sections[si].lessons, { title: "Nouvelle leçon", content: "", order: sections[si].lessons.length + 1 }],
    };
    setDraft({ ...draft, sections });
    setEditing(`${si}-${sections[si].lessons.length - 1}`);
  };

  /* --- quiz --- */
  const removeQuiz = (qi: number) => setDraft({ ...draft, quizzes: draft.quizzes.filter((_, i) => i !== qi) });
  const removeQuestion = (qi: number, idx: number) => {
    const quizzes = [...draft.quizzes];
    quizzes[qi] = { ...quizzes[qi], questions: quizzes[qi].questions.filter((_, i) => i !== idx) };
    setDraft({ ...draft, quizzes });
  };
  const toggleQuiz = (qi: number) => {
    const quizzes = [...draft.quizzes];
    quizzes[qi] = { ...quizzes[qi], collapsed: !quizzes[qi].collapsed };
    setDraft({ ...draft, quizzes });
  };

  const iconBtn = "rounded-full p-1.5 text-[#6b625c] hover:bg-[#f5efe3] hover:text-[#1a1512] disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1.5 text-sm text-[#6b625c] hover:text-[#1a1512]">
            <ArrowLeft className="h-4 w-4" />
            Changer de fichier
          </button>
          <h1 className="dash-main-title">Relire le brouillon</h1>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#97938e]">
            {draft.sections.length} section{draft.sections.length > 1 ? "s" : ""} · {totalLessons} leçon
            {totalLessons > 1 ? "s" : ""}
            {draft.quizzes.length > 0 && ` · ${draft.quizzes.length} quiz · ${totalQuestions} questions`}
          </p>
        </div>
      </div>

      {summary}

      {/* Infos du cours */}
      <div className="dash-card p-5 space-y-4">
        <div className="dash-form-group">
          <label className="dash-label" htmlFor="draft-title">Titre du cours</label>
          <input
            id="draft-title"
            className="dash-input"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </div>
        <div className="dash-form-group">
          <label className="dash-label" htmlFor="draft-desc">Description</label>
          <textarea
            id="draft-desc"
            className="dash-input"
            rows={2}
            value={draft.description || ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Ce que l'élève saura faire à la fin du cours"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-[#f5c2c4] bg-[#fdecec] px-4 py-3 text-sm text-[#c2272d]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Sections */}
      {draft.sections.map((section, si) => {
        const quizzes = draft.quizzes.map((q, qi) => ({ ...q, qi })).filter((q) => q.sectionIndex === si);
        return (
          <div key={si} className="dash-card">
            <div className="flex items-center gap-3 bg-[#f5efe3] px-4 py-3">
              <button type="button" onClick={() => updateSection(si, { collapsed: !section.collapsed })} className={iconBtn} aria-label="Replier">
                <ChevronRight className={`h-4 w-4 transition-transform ${section.collapsed ? "" : "rotate-90"}`} />
              </button>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1a1512] font-serif-display text-base text-[#fdfaf4]">
                {si + 1}
              </span>
              <input
                value={section.title}
                onChange={(e) => updateSection(si, { title: e.target.value })}
                aria-label="Titre de la section"
                className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 font-serif-display text-lg text-[#1a1512] outline-none hover:border-[#e6e0d6] focus:border-[#ff6a1a] focus:bg-white"
              />
              <span className="hidden text-xs text-[#6b625c] sm:inline">
                {section.lessons.length} leçon{section.lessons.length > 1 ? "s" : ""}
              </span>
              <button type="button" onClick={() => moveSection(si, -1)} disabled={si === 0} className={iconBtn} title="Monter">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => moveSection(si, 1)} disabled={si === draft.sections.length - 1} className={iconBtn} title="Descendre">
                <ChevronDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => removeSection(si)} className="rounded-full p-1.5 text-[#c2272d] hover:bg-[#fdecec]" title="Supprimer la section">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {!section.collapsed && (
              <div className="divide-y divide-[#e6e0d6] border-t border-[#e6e0d6]">
                {section.lessons.length === 0 && (
                  <p className="px-5 py-4 text-sm text-[#97938e]">Aucune leçon dans cette section.</p>
                )}
                {section.lessons.map((lesson, li) => {
                  const key = `${si}-${li}`;
                  const isEditing = editing === key;
                  return (
                    <div key={key} className={li % 2 ? "bg-[#fdfaf4]" : "bg-white"}>
                      <div className="flex items-center gap-2 px-4 py-2.5 sm:px-5">
                        <FileText className="h-4 w-4 shrink-0 text-[#2f86b3]" />
                        <input
                          value={lesson.title}
                          onChange={(e) => updateLesson(si, li, { title: e.target.value })}
                          aria-label="Titre de la leçon"
                          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 font-medium text-[#1a1512] outline-none hover:border-[#e6e0d6] focus:border-[#ff6a1a] focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setEditing(isEditing ? null : key)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                            isEditing ? "bg-[#1a1512] text-[#fdfaf4]" : "text-[#6b625c] hover:bg-[#f5efe3] hover:text-[#1a1512]"
                          }`}
                        >
                          {isEditing ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                          {isEditing ? "Aperçu" : "Modifier"}
                        </button>
                        <button type="button" onClick={() => moveLesson(si, li, -1)} disabled={li === 0} className={iconBtn} title="Monter">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => moveLesson(si, li, 1)} disabled={li === section.lessons.length - 1} className={iconBtn} title="Descendre">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => removeLesson(si, li)} className="rounded-full p-1.5 text-[#c2272d] hover:bg-[#fdecec]" title="Supprimer la leçon">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="px-4 pb-4 sm:px-5">
                        {isEditing ? (
                          <RichTextEditor content={lesson.content} onChange={(v: string) => updateLesson(si, li, { content: v })} />
                        ) : lesson.content.replace(/<[^>]*>/g, "").trim() ? (
                          <div
                            className="wk-draft-preview prose prose-sm max-w-none rounded-2xl border border-[#e6e0d6] bg-white px-4 py-3 max-h-72 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: lesson.content }}
                          />
                        ) : (
                          <p className="text-sm text-[#97938e]">Leçon vide.</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="px-4 py-3 sm:px-5">
                  <button
                    type="button"
                    onClick={() => addLesson(si)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d6cec2] py-2 text-sm text-[#6b625c] hover:border-[#ff6a1a] hover:text-[#c24a0a]"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une leçon
                  </button>
                </div>

                {/* Quiz proposés par l'IA pour cette section */}
                {quizzes.length > 0 && (
                  <div className="space-y-2 bg-[#fdfaf4] px-4 py-3 sm:px-5">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a5d00]">
                      <Trophy className="h-3.5 w-3.5" />
                      Quiz proposés · à vérifier
                    </p>
                    {quizzes.map(({ qi, ...quiz }) => (
                      <div key={qi} className="overflow-hidden rounded-2xl border border-[#ffd58a] bg-white">
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ffb547] text-[#1a1512]">
                            <Trophy className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1a1512]">{quiz.title}</span>
                          <span className="text-xs text-[#6b625c]">
                            {quiz.questions.length} question{quiz.questions.length > 1 ? "s" : ""}
                          </span>
                          <button type="button" onClick={() => toggleQuiz(qi)} className={iconBtn} aria-label="Voir les questions">
                            <ChevronRight className={`h-4 w-4 transition-transform ${quiz.collapsed ? "" : "rotate-90"}`} />
                          </button>
                          <button type="button" onClick={() => removeQuiz(qi)} className="rounded-full p-1.5 text-[#c2272d] hover:bg-[#fdecec]" title="Supprimer le quiz">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {!quiz.collapsed && (
                          <ol className="divide-y divide-[#f0e9dc] border-t border-[#ffd58a]">
                            {quiz.questions.map((q, idx) => (
                              <li key={idx} className="flex items-start gap-2 px-3 py-2 text-xs">
                                <span className="w-5 shrink-0 text-right text-[#97938e]">{idx + 1}.</span>
                                <span className="shrink-0 rounded bg-[#f5efe3] px-1.5 py-0.5 text-[10px] font-medium text-[#6b625c]">
                                  {q.questionType}
                                </span>
                                <span className="min-w-0 flex-1 text-[#1a1512]">{q.question}</span>
                                <span className="shrink-0 text-[#97938e]">{q.point} pt</span>
                                <button type="button" onClick={() => removeQuestion(qi, idx)} className="shrink-0 text-[#c9c3bb] hover:text-[#c2272d]" aria-label="Supprimer la question">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addSection}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-[#d6cec2] py-3 text-[#6b625c] hover:border-[#ff6a1a] hover:text-[#c24a0a]"
      >
        <Plus className="h-5 w-5" />
        Ajouter une section
      </button>

      {/* Barre d'action collée en bas */}
      <div className="sticky bottom-0 -mx-2 flex flex-col-reverse gap-2 border-t border-[#e6e0d6] bg-[rgba(253,250,244,0.95)] px-2 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#6b625c]">
          Le cours sera créé « En attente de vérification » : un Correcteur le relira avant publication.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onBack} className="dash-button dash-button-secondary rounded-full">
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving || draft.sections.length === 0 || !draft.title.trim()}
            className="dash-button dash-button-primary rounded-full disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? "Création…" : "Créer le cours"}
          </button>
        </div>
      </div>
    </div>
  );
}
