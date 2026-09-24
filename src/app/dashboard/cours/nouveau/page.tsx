"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Layers,
  FileText,
  Eye,
  CheckCircle,
  Loader2,
  GripVertical,
  Plus,
  Trash2,
  AlertCircle,
  History,
  Wand2,
} from "lucide-react";
import CreationGuide from "./_components/CreationGuide";
import { educationData } from "@/data/educationData";
import { UploadButton } from "@/utils/uploadthing";
import Image from "next/image";
import MDEditor from "@uiw/react-md-editor/nohighlight";
import "@uiw/react-md-editor/markdown-editor.css";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import RichTextEditor from "@/components/ui/RichTextEditorClientWrapper";
import RequiredMark from "@/components/ui/RequiredMark";
import "../../styles/dashboard-theme.css";

// Types
interface Section {
  id: string;
  title: string;
  order: number;
  /** Indication affichée dans le champ vide (plan type) ; jamais envoyée à l'API */
  hint?: string;
}

interface Lesson {
  id: string;
  title: string;
  sectionId: string;
  order: number;
  content?: string;
}

interface CourseData {
  title: string;
  description: string;
  niveau: string;
  matiere: string;
  image: string;
  sections: Section[];
  lessons: Lesson[];
}

const steps = [
  { id: 1, title: "L'essentiel", icon: BookOpen },
  { id: 2, title: "Le plan", icon: Layers },
  { id: 3, title: "Les leçons", icon: FileText },
  { id: 4, title: "Vérifier", icon: Eye },
];

const EMPTY_COURSE: CourseData = {
  title: "",
  description: "",
  niveau: "",
  matiere: "",
  image: "",
  sections: [],
  lessons: [],
};

// Plan type du guide des rédacteurs : découvrir → comprendre → appliquer.
// Ce sont des indications (placeholder), pas des titres : chacun nomme ses sections.
const PLAN_TYPE = [
  "Découvrir la notion (ex. une situation concrète)",
  "Comprendre : définitions et propriétés",
  "Appliquer : méthodes et problèmes",
];

const DRAFT_KEY = "wk-course-draft";

interface Draft {
  savedAt: number;
  step: number;
  data: CourseData;
}

const hasContent = (d: CourseData) =>
  Boolean(d.title.trim() || d.description.trim() || d.sections.length || d.lessons.length);

export default function CreateCoursePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courseData, setCourseData] = useState<CourseData>(EMPTY_COURSE);

  // Brouillon sur cet appareil : un rechargement ou une fausse manip ne fait plus tout perdre
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const draft = raw ? (JSON.parse(raw) as Draft) : null;
      if (draft && hasContent(draft.data)) {
        setPendingDraft(draft);
        return; // on n'écrase rien tant que la personne n'a pas choisi
      }
    } catch {
      /* brouillon illisible ou navigation privée : on repart de zéro */
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady || !hasContent(courseData)) return;
    const savedAt = Date.now();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt, step: currentStep, data: courseData }));
      setDraftSavedAt(savedAt);
    } catch {
      /* quota ou navigation privée : pas de brouillon, pas de blocage */
    }
  }, [courseData, currentStep, draftReady]);

  const restoreDraft = () => {
    if (!pendingDraft) return;
    setCourseData({ ...EMPTY_COURSE, ...pendingDraft.data });
    setCurrentStep(pendingDraft.step || 1);
    setPendingDraft(null);
    setDraftReady(true);
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* rien à faire */
    }
    setPendingDraft(null);
    setDraftReady(true);
  };

  // Validation de l'étape courante
  const validateStep = (): boolean => {
    setError(null);

    switch (currentStep) {
      case 1:
        if (!courseData.title.trim()) {
          setError("Le titre du cours est requis");
          return false;
        }
        if (!courseData.niveau) {
          setError("Le niveau scolaire est requis");
          return false;
        }
        if (!courseData.matiere) {
          setError("La matière est requise");
          return false;
        }
        if (!courseData.description.trim()) {
          setError("La description est requise");
          return false;
        }
        return true;
      case 2:
        if (courseData.sections.length === 0) {
          setError("Ajoutez au moins une section");
          return false;
        }
        if (courseData.sections.some((s) => !s.title.trim())) {
          setError("Toutes les sections doivent avoir un titre");
          return false;
        }
        return true;
      case 3:
        if (courseData.lessons.length > 0) {
          if (courseData.lessons.some((l) => !l.title.trim())) {
            setError("Toutes les leçons doivent avoir un titre");
            return false;
          }
          if (courseData.lessons.some((l) => !l.content || !l.content.trim())) {
            setError("Toutes les leçons doivent avoir un contenu");
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Gestion des sections
  const addSection = () => {
    const newSection: Section = {
      id: `temp-${Date.now()}`,
      title: "",
      order: courseData.sections.length + 1,
    };
    setCourseData({
      ...courseData,
      sections: [...courseData.sections, newSection],
    });
  };

  // Trois sections vides, avec le plan type du guide en indication
  const usePlanType = () => {
    setCourseData({
      ...courseData,
      sections: PLAN_TYPE.map((hint, i) => ({
        id: `temp-${Date.now()}-${i}`,
        title: "",
        order: i + 1,
        hint,
      })),
    });
  };

  const updateSection = (id: string, title: string) => {
    setCourseData({
      ...courseData,
      sections: courseData.sections.map((s) =>
        s.id === id ? { ...s, title } : s
      ),
    });
  };

  const removeSection = (id: string) => {
    const updatedSections = courseData.sections
      .filter((s) => s.id !== id)
      .map((s, index) => ({ ...s, order: index + 1 }));
    setCourseData({
      ...courseData,
      sections: updatedSections,
      lessons: courseData.lessons.filter((l) => l.sectionId !== id),
    });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === courseData.sections.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updatedSections = [...courseData.sections];
    const [movedSection] = updatedSections.splice(index, 1);
    updatedSections.splice(newIndex, 0, movedSection);

    setCourseData({
      ...courseData,
      sections: updatedSections.map((s, i) => ({ ...s, order: i + 1 })),
    });
  };

  // Gestion des leçons
  const addLesson = (sectionId: string) => {
    const sectionLessons = courseData.lessons.filter(
      (l) => l.sectionId === sectionId
    );
    const newLesson: Lesson = {
      id: `temp-lesson-${Date.now()}`,
      title: "",
      sectionId,
      order: sectionLessons.length + 1,
    };
    setCourseData({
      ...courseData,
      lessons: [...courseData.lessons, newLesson],
    });
  };

  const updateLesson = (id: string, updates: Partial<Lesson>) => {
    setCourseData({
      ...courseData,
      lessons: courseData.lessons.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    });
  };

  const removeLesson = (id: string) => {
    const lesson = courseData.lessons.find((l) => l.id === id);
    if (!lesson) return;

    const updatedLessons = courseData.lessons
      .filter((l) => l.id !== id)
      .map((l) =>
        l.sectionId === lesson.sectionId && l.order > lesson.order
          ? { ...l, order: l.order - 1 }
          : l
      );

    setCourseData({
      ...courseData,
      lessons: updatedLessons,
    });
  };

  // Soumission finale
  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      // 1. Créer le cours
      const courseRes = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          title: courseData.title,
          description: courseData.description,
          niveau: courseData.niveau,
          matiere: courseData.matiere,
          image: courseData.image,
        }),
      });

      if (!courseRes.ok) {
        const errData = await courseRes.json();
        throw new Error(errData.error || "Erreur lors de la création du cours");
      }

      const course = await courseRes.json();

      // 2. Créer les sections
      for (const section of courseData.sections) {
        const sectionRes = await fetch("/api/sections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({
            courseId: course._id,
            title: section.title,
            order: section.order,
          }),
        });

        if (sectionRes.ok) {
          const createdSection = await sectionRes.json();

          // 3. Créer les leçons pour cette section
          const sectionLessons = courseData.lessons.filter(
            (l) => l.sectionId === section.id
          );
          for (const lesson of sectionLessons) {
            const formData = new FormData();
            formData.append("sectionId", createdSection._id);
            formData.append("title", lesson.title);
            formData.append("content", lesson.content || "");

            await fetch("/api/lessons", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session?.accessToken}`,
              },
              body: formData,
            });
          }
        }
      }

      // Cours créé : le brouillon n'a plus lieu d'être
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* rien à faire */
      }

      // Redirection vers la gestion du cours
      router.push(`/dashboard/cours/${course._id}/gestion`);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setSaving(false);
    }
  };

  // Rendu des étapes
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="dash-form-group">
              <label className="dash-label">
                Titre du cours <RequiredMark />
              </label>
              <input
                type="text"
                className="dash-input"
                placeholder="Ex. : Les fonctions affines"
                value={courseData.title}
                onChange={(e) =>
                  setCourseData({ ...courseData, title: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="dash-form-group">
                <label className="dash-label">
                  Niveau scolaire <RequiredMark />
                </label>
                <select
                  className="dash-input"
                  value={courseData.niveau}
                  onChange={(e) =>
                    setCourseData({ ...courseData, niveau: e.target.value })
                  }
                >
                  <option value="">Choisis un niveau</option>
                  {educationData.levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dash-form-group">
                <label className="dash-label">
                  Matière <RequiredMark />
                </label>
                <select
                  className="dash-input"
                  value={courseData.matiere}
                  onChange={(e) =>
                    setCourseData({ ...courseData, matiere: e.target.value })
                  }
                >
                  <option value="">Choisis une matière</option>
                  {educationData.subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="dash-form-group">
              <label className="dash-label">Description <RequiredMark /></label>
              <div className="border border-[#e6e0d6] rounded-lg overflow-hidden" data-color-mode="light">
                <MDEditor
                  value={courseData.description}
                  onChange={(value) =>
                    setCourseData({ ...courseData, description: value || "" })
                  }
                  height={320}
                  previewOptions={{
                    remarkPlugins: [remarkMath],
                    rehypePlugins: [rehypeKatex],
                  }}
                />
              </div>
              <p className="text-sm text-[#97938e] mt-2">
                Ce que l&apos;élève saura faire à la fin du cours, en une ou deux phrases.
              </p>
            </div>

            <div className="dash-form-group">
              <label className="dash-label">Image de couverture</label>
              <div className="border-2 border-dashed border-[#e6e0d6] rounded-xl p-6 text-center hover:border-[#ff6a1a] transition-colors">
                {courseData.image ? (
                  <div className="relative">
                    <Image
                      src={courseData.image}
                      alt="Aperçu"
                      width={400}
                      height={200}
                      className="mx-auto rounded-lg object-cover"
                    />
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <UploadButton
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) => {
                          if (res && res.length > 0) {
                            setCourseData({
                              ...courseData,
                              image: res[0].url,
                            });
                          }
                        }}
                        onUploadError={(error: Error) => {
                          setError(`Erreur d'upload: ${error.message}`);
                        }}
                      />
                      <button
                        onClick={() =>
                          setCourseData({ ...courseData, image: "" })
                        }
                        className="dash-button dash-button-secondary dash-button-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-[#f5efe3] rounded-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-[#c9c3bb]" />
                    </div>
                    <div>
                      <UploadButton
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) => {
                          if (res && res.length > 0) {
                            setCourseData({
                              ...courseData,
                              image: res[0].url,
                            });
                          }
                        }}
                        onUploadError={(error: Error) => {
                          setError(`Erreur d'upload: ${error.message}`);
                        }}
                      />
                    </div>
                    <p className="text-sm text-[#97938e]">
                      PNG, JPG jusqu&apos;à 4 Mo
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1a1512]">
                  Le plan du cours
                </h3>
                <p className="text-sm text-[#6b625c]">
                  Une section = une étape de l&apos;apprentissage. Utilise les flèches pour changer l&apos;ordre.
                </p>
              </div>
              <button onClick={addSection} className="dash-button dash-button-primary dash-button-sm">
                <Plus className="w-4 h-4" />
                Ajouter une section
              </button>
            </div>

            {courseData.sections.length === 0 ? (
              <div className="dash-empty border-2 border-dashed border-[#e6e0d6] rounded-xl">
                <div className="dash-empty-icon">
                  <Layers className="w-8 h-8" />
                </div>
                <h4 className="dash-empty-title">Aucune section</h4>
                <p className="dash-empty-text">
                  Pars du plan type (découvrir → comprendre → appliquer) ou crée tes sections une par une.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={usePlanType} className="dash-button dash-button-primary dash-button-sm rounded-full">
                    <Wand2 className="w-4 h-4" />
                    Partir du plan type
                  </button>
                  <button type="button" onClick={addSection} className="dash-button dash-button-secondary dash-button-sm rounded-full">
                    <Plus className="w-4 h-4" />
                    Ajouter une section
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {courseData.sections.map((section, index) => (
                  <div
                    key={section.id}
                    className="flex items-center gap-3 p-4 bg-[#f5efe3] rounded-xl group"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveSection(index, "up")}
                        disabled={index === 0}
                        className="p-1 hover:bg-white rounded disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4 -rotate-90" />
                      </button>
                      <button
                        onClick={() => moveSection(index, "down")}
                        disabled={index === courseData.sections.length - 1}
                        className="p-1 hover:bg-white rounded disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </button>
                    </div>
                    <GripVertical className="w-5 h-5 text-[#c9c3bb]" />
                    <span className="w-8 h-8 bg-[#ff6a1a] text-white rounded-lg flex items-center justify-center text-sm font-medium">
                      {section.order}
                    </span>
                    <input
                      type="text"
                      className="flex-1 dash-input bg-white"
                      placeholder={section.hint ?? `Titre de la section ${index + 1}`}
                      value={section.title}
                      onChange={(e) => updateSection(section.id, e.target.value)}
                    />
                    <button
                      onClick={() => removeSection(section.id)}
                      className="p-2 text-[#c2272d] hover:bg-[#fdecec] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#1a1512]">
                Les leçons
              </h3>
              <p className="text-sm text-[#6b625c]">
                Facultatif maintenant : tu peux aussi écrire les leçons plus tard, depuis la gestion du cours.
              </p>
            </div>

            {courseData.sections.length === 0 ? (
              <div className="p-4 bg-[#fff4e0] border border-[#ffd58a] rounded-xl">
                <p className="text-sm text-[#9a5d00]">
                  Crée d&apos;abord tes sections à l&apos;étape précédente.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {courseData.sections.map((section) => {
                  const sectionLessons = courseData.lessons.filter(
                    (l) => l.sectionId === section.id
                  );

                  return (
                    <div key={section.id} className="dash-card">
                      <div className="dash-card-header bg-[#f5efe3]">
                        <div className="flex items-center gap-3">
                          <Layers className="w-5 h-5 text-[#ff6a1a]" />
                          <h4 className="font-semibold text-[#1a1512]">
                            {section.title || `Section ${section.order}`}
                          </h4>
                          <span className="text-sm text-[#97938e]">
                            {sectionLessons.length} leçon{sectionLessons.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <button
                          onClick={() => addLesson(section.id)}
                          className="dash-button dash-button-primary dash-button-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter une leçon
                        </button>
                      </div>
                      <div className="dash-card-body">
                        {sectionLessons.length === 0 ? (
                          <p className="text-sm text-[#97938e] text-center py-4">
                            Aucune leçon dans cette section
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {sectionLessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="border border-[#e6e0d6] rounded-lg overflow-hidden"
                              >
                                {/* En-tête de la leçon */}
                                <div className="flex items-center gap-3 p-3 bg-[#f5efe3] group">
                                  <FileText className="w-5 h-5 text-[#ff6a1a]" />
                                  <input
                                    type="text"
                                    className="flex-1 dash-input bg-white"
                                    placeholder="Titre de la leçon"
                                    value={lesson.title}
                                    onChange={(e) =>
                                      updateLesson(lesson.id, {
                                        title: e.target.value,
                                      })
                                    }
                                  />
                                  <button
                                    onClick={() => removeLesson(lesson.id)}
                                    className="p-1.5 text-[#c2272d] hover:bg-[#fdecec] rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                {/* Éditeur de contenu */}
                                <div className="p-3">
                                  <label className="dash-label mb-2 flex items-center gap-1">
                                    Contenu <RequiredMark />
                                  </label>
                                  <RichTextEditor
                                    content={lesson.content || ""}
                                    onChange={(value: string) =>
                                      updateLesson(lesson.id, {
                                        content: value || "",
                                      })
                                    }
                                  />
                                  {!lesson.content?.trim() && (
                                    <p className="text-xs text-[#c2272d] mt-1">
                                      Le contenu est obligatoire
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#1a1512]">
                Vérifier avant de créer
              </h3>
              <p className="text-sm text-[#6b625c]">
                Relis le plan comme un élève. Le cours ne sera visible qu&apos;après relecture par un Correcteur.
              </p>
            </div>

            <div className="dash-card overflow-hidden">
              {courseData.image && (
                <div className="h-48 relative">
                  <Image
                    src={courseData.image}
                    alt={courseData.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="dash-badge dash-badge-primary">
                    {courseData.matiere}
                  </span>
                  <span className="dash-badge">{courseData.niveau}</span>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1512] mb-2">
                  {courseData.title}
                </h2>
                {courseData.description && (
                  <div className="prose prose-sm max-w-none text-[#6b625c] mb-6" data-color-mode="light">
                    <MDEditor.Markdown
                      source={courseData.description}
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    />
                  </div>
                )}

                <div className="border-t border-[#e6e0d6] pt-4">
                  <h4 className="font-semibold text-[#1a1512] mb-3">
                    Structure du cours
                  </h4>
                  <div className="space-y-2">
                    {courseData.sections.map((section) => {
                      const sectionLessons = courseData.lessons.filter(
                        (l) => l.sectionId === section.id
                      );
                      return (
                        <div
                          key={section.id}
                          className="p-3 bg-[#f5efe3] rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-[#ff6a1a] text-white rounded text-xs flex items-center justify-center">
                              {section.order}
                            </span>
                            <span className="font-medium text-[#1a1512]">
                              {section.title}
                            </span>
                            <span className="text-sm text-[#97938e] ml-auto">
                              {sectionLessons.length} leçon
                              {sectionLessons.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          {sectionLessons.length > 0 && (
                            <div className="mt-2 ml-8 space-y-1">
                              {sectionLessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="text-sm text-[#6b625c] flex items-center gap-2"
                                >
                                  <FileText className="w-3 h-3" />
                                  {lesson.title || "Sans titre"}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="dash-main-title">Créer un nouveau cours</h1>
          <p className="dash-main-subtitle">
            Quatre étapes, du sujet au plan. Le guide à droite t&apos;accompagne à chacune.
          </p>
        </div>
        {draftSavedAt && (
          <span className="text-xs text-[#97938e]">
            Brouillon enregistré sur cet appareil à{" "}
            {new Date(draftSavedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Brouillon retrouvé : on propose de reprendre là où on s'était arrêté */}
      {pendingDraft && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#ffd2b8] bg-[#fff4ec] p-4 sm:flex-row sm:items-center">
          <History className="h-5 w-5 shrink-0 text-[#c24a0a]" />
          <p className="flex-1 text-sm text-[#1a1512]">
            Tu avais commencé un cours
            {pendingDraft.data.title.trim() ? <> : <b>« {pendingDraft.data.title.trim()} »</b></> : null}
            {" "}({new Date(pendingDraft.savedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}).
            Tu veux le reprendre ?
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={discardDraft} className="dash-button dash-button-secondary dash-button-sm rounded-full">
              Recommencer
            </button>
            <button type="button" onClick={restoreDraft} className="dash-button dash-button-primary dash-button-sm rounded-full">
              Reprendre
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      {/* Wizard */}
      <div className="dash-wizard">
        {/* Progress bar */}
        <div className="dash-wizard-header">
          <div className="dash-wizard-steps">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`dash-wizard-step ${
                    currentStep === step.id
                      ? "active"
                      : currentStep > step.id
                      ? "completed"
                      : ""
                  }`}
                >
                  <div className="dash-wizard-step-number">
                    {currentStep > step.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="dash-wizard-step-label hidden sm:inline">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`dash-wizard-step-connector ${
                      currentStep > step.id ? "completed" : ""
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="dash-wizard-content">
          {error && (
            <div className="mb-6 p-4 bg-[#fdecec] border border-[#f5c2c4] rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#c2272d] flex-shrink-0" />
              <p className="text-sm text-[#c2272d]">{error}</p>
            </div>
          )}

          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="dash-wizard-footer">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || saving}
            className="dash-button dash-button-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </button>

          {currentStep < steps.length ? (
            <button onClick={nextStep} className="dash-button dash-button-primary">
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="dash-button dash-button-primary"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Créer le cours
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Guide du rédacteur : suit l'étape en cours (sous le formulaire sur mobile) */}
      <div className="lg:sticky lg:top-24 flex flex-col">
        <CreationGuide step={currentStep} course={courseData} />
      </div>
      </div>
    </div>
  );
}
