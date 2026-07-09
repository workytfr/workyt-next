"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Layers,
  FileText,
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Save,
  X,
  Trophy,
  Dumbbell,
  HelpCircle,
  Users,
} from "lucide-react";
import MDEditor from "@uiw/react-md-editor/nohighlight";
import "@uiw/react-md-editor/markdown-editor.css";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UploadButton } from "@/utils/uploadthing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LessonForm from "@/app/dashboard/_components/LessonForm";
import QuizForm from "@/app/dashboard/_components/QuizForm";
import ExerciseForm from "@/app/dashboard/_components/ExerciceForm";
import type { ILesson } from "@/models/Lesson";
import ProfileAvatar from "@/components/ui/profile";
import AuthorReassign from "@/components/ui/AuthorReassign";
import MascotLoader from "@/components/ui/MascotLoader";
import { getRoleIconPath } from "@/lib/roleIcon";
import { educationData } from "@/data/educationData";
import "../../../styles/dashboard-theme.css";

// Types
interface Course {
  _id: string;
  title: string;
  description: string;
  niveau: string;
  matiere: string;
  status: string;
  image?: string;
  authors?: Array<{ _id: string; name: string }>;
}

interface SectionResource {
  _id: string;
  title: string;
}

interface SectionQuiz extends SectionResource {
  questions?: { _id?: string }[];
}

interface SectionExercise extends SectionResource {
  author?: string;
}

interface Section {
  _id: string;
  title: string;
  order: number;
  courseId: string;
  lessons?: Lesson[];
  exercises?: SectionExercise[];
  quizzes?: SectionQuiz[];
}

interface Contributor {
  _id: string;
  name: string;
  username: string;
  role: string;
  points: number;
  contributions?: { lessons: number; exercises: number; quizzes: number };
}

interface Lesson {
  _id: string;
  title: string;
  order: number;
  content?: string;
  sectionId: string;
}

type Tab = "structure" | "content" | "settings";

// --- Composant Section sortable ---
function SortableSection({
  section,
  index,
  children,
  isExpanded,
  onToggle,
  onAddLesson,
  onDelete,
}: {
  section: Section;
  index: number;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  onAddLesson: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lessons = section.lessons || [];

  return (
    <div ref={setNodeRef} style={style} className="dash-card">
      <div
        className="dash-card-header bg-[#f7f6f3] cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-[#6b6b6b]" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[#6b6b6b]" />
          )}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-5 h-5 text-[#bfbfbf] hover:text-[#6b6b6b] transition-colors" />
          </div>
          <span className="w-8 h-8 bg-[#f97316] text-white rounded-lg flex items-center justify-center text-sm font-medium">
            {index + 1}
          </span>
          <div className="flex-1">
            <h3 className="font-semibold text-[#37352f]">{section.title}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md bg-[#eff6ff] text-[#2563eb]">
                <FileText className="w-3 h-3" />
                {lessons.length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md bg-[#fffbeb] text-[#d97706]">
                <Trophy className="w-3 h-3" />
                {(section.quizzes || []).length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md bg-[#ecfdf5] text-[#059669]">
                <Dumbbell className="w-3 h-3" />
                {(section.exercises || []).length}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddLesson();
            }}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Ajouter une leçon"
          >
            <Plus className="w-4 h-4 text-[#6b6b6b]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
      {isExpanded && <div className="dash-card-body">{children}</div>}
    </div>
  );
}

// --- Composant Leçon sortable ---
function SortableLesson({
  lesson,
  index,
  onEdit,
  onDelete,
  canDelete,
  adminSlot,
}: {
  lesson: Lesson;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
  adminSlot?: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lesson._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border border-[#e3e2e0] rounded-lg group hover:border-[#f97316] transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-[#bfbfbf] hover:text-[#6b6b6b] transition-colors" />
      </div>
      <span className="w-6 h-6 bg-[#f7f6f3] text-[#6b6b6b] rounded text-xs flex items-center justify-center">
        {index + 1}
      </span>
      <FileText className="w-4 h-4 text-[#6b6b6b]" />
      <span className="flex-1 text-[#37352f]">{lesson.title}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {adminSlot}
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-[#f7f6f3] rounded"
          title="Éditer"
        >
          <Edit2 className="w-4 h-4 text-[#6b6b6b]" />
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 rounded"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}

// --- Composant principal ---
export default function CourseManagementPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("structure");
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // État pour l'édition
  const [editingCourse, setEditingCourse] = useState(false);
  const [editedCourse, setEditedCourse] = useState<Course | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // État pour les formulaires inline
  const [addingSectionTitle, setAddingSectionTitle] = useState<string | null>(null);
  const [addingLessonSection, setAddingLessonSection] = useState<string | null>(null);
  const [addingLessonTitle, setAddingLessonTitle] = useState("");
  const [operationLoading, setOperationLoading] = useState<string | null>(null);

  // État pour l'édition d'une leçon (Dialog + LessonForm, même logique que les quizz)
  const [editingLesson, setEditingLesson] = useState<ILesson | null>(null);
  const [editingLessonSectionId, setEditingLessonSectionId] = useState<string | null>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(false);

  // État pour l'édition d'un quiz
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [quizSectionId, setQuizSectionId] = useState<string | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // État pour l'édition d'un exercice
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any | null>(null);
  const [exerciseSectionId, setExerciseSectionId] = useState<string | null>(null);
  const [loadingExercise, setLoadingExercise] = useState(false);

  // Auteurs & contributeurs (onglet Paramètres)
  const [authors, setAuthors] = useState<Contributor[]>([]);
  const [correctors, setCorrectors] = useState<Contributor[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loadingContributors, setLoadingContributors] = useState(false);

  // Capteurs pour le drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Charger le cours et ses données
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseRes = await fetch(`/api/courses/${id}`);
        if (!courseRes.ok) throw new Error("Cours non trouvé");
        const courseData = await courseRes.json();
        const course = courseData.cours || courseData;
        setCourse(course);
        setEditedCourse(course);

        const sectionsRes = await fetch(`/api/sections?courseId=${id}&limit=100`);
        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          setSections(sectionsData.sections || []);
          setExpandedSections(
            (sectionsData.sections || []).map((s: Section) => s._id)
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseData();
    }
  }, [id]);

  // Charger auteurs & contributeurs à l'ouverture de l'onglet Paramètres
  useEffect(() => {
    if (activeTab !== "settings" || !id || !session?.accessToken) return;
    if (authors.length > 0 || correctors.length > 0 || contributors.length > 0 || loadingContributors)
      return;

    const fetchContributors = async () => {
      setLoadingContributors(true);
      try {
        const res = await fetch(`/api/courses/${id}/contributors`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAuthors(data.authors || []);
          setCorrectors(data.correctors || []);
          setContributors(data.contributors || []);
        }
      } catch {
        // silencieux : la section auteurs reste vide
      } finally {
        setLoadingContributors(false);
      }
    };

    fetchContributors();
  }, [activeTab, id, session?.accessToken]);

  // Recharge auteurs & contributeurs (ex: après réassignation d'auteur par un admin)
  const reloadContributors = async () => {
    if (!id || !session?.accessToken) return;
    setLoadingContributors(true);
    try {
      const res = await fetch(`/api/courses/${id}/contributors`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuthors(data.authors || []);
        setCorrectors(data.correctors || []);
        setContributors(data.contributors || []);
      }
    } catch {
      // silencieux
    } finally {
      setLoadingContributors(false);
    }
  };

  // Sauvegarder les modifications du cours
  const saveCourse = async () => {
    if (!editedCourse) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          title: editedCourse.title,
          description: editedCourse.description,
          niveau: editedCourse.niveau,
          matiere: editedCourse.matiere,
          image: editedCourse.image,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedCourse = data.course || data;
        setCourse(updatedCourse);
        setEditingCourse(false);
        showSuccess("Cours mis à jour avec succès");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Ajouter une section (formulaire inline)
  const submitAddSection = async () => {
    if (addingSectionTitle === null || !addingSectionTitle.trim()) {
      setError("Le titre de la section est requis");
      return;
    }

    setOperationLoading("addSection");
    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          courseId: id,
          title: addingSectionTitle.trim(),
          order: sections.length + 1,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'ajout de la section");
      }

      const data = await res.json();
      const newSection = data.section || data;
      setSections([...sections, newSection]);
      setExpandedSections([...expandedSections, newSection._id]);
      setAddingSectionTitle(null);
      showSuccess("Section ajoutée");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOperationLoading(null);
    }
  };

  // Supprimer une section
  const deleteSection = async (sectionId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette section ?")) return;

    setOperationLoading(`deleteSection-${sectionId}`);
    try {
      const res = await fetch(`/api/sections/${sectionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        setSections(sections.filter((s) => s._id !== sectionId));
        showSuccess("Section supprimée");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOperationLoading(null);
    }
  };

  // Ajouter une leçon (formulaire inline)
  const submitAddLesson = async (sectionId: string) => {
    if (!addingLessonTitle.trim()) {
      setError("Le titre de la leçon est requis");
      return;
    }

    const loadingKey = `addLesson-${sectionId}`;
    setOperationLoading(loadingKey);
    try {
      const formData = new FormData();
      formData.append("sectionId", sectionId);
      formData.append("title", addingLessonTitle.trim());
      formData.append("content", "");

      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'ajout de la leçon");
      }

      const newLesson = await res.json();
      setSections(
        sections.map((s) =>
          s._id === sectionId
            ? { ...s, lessons: [...(s.lessons || []), newLesson] }
            : s
        )
      );
      setAddingLessonSection(null);
      setAddingLessonTitle("");
      showSuccess("Leçon ajoutée");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOperationLoading(null);
    }
  };

  // Supprimer une leçon
  const deleteLesson = async (lessonId: string, sectionId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette leçon ?")) return;

    setOperationLoading(`deleteLesson-${lessonId}`);
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        setSections(
          sections.map((s) =>
            s._id === sectionId
              ? {
                  ...s,
                  lessons: (s.lessons || []).filter((l) => l._id !== lessonId),
                }
              : s
          )
        );
        showSuccess("Leçon supprimée");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOperationLoading(null);
    }
  };

  // Ouvrir l'éditeur de leçon : charger le contenu complet puis ouvrir le Dialog
  const openLessonEditor = async (lessonId: string, sectionId: string) => {
    setEditingLessonSectionId(sectionId);
    setLessonDialogOpen(true);
    setLoadingLesson(true);
    setEditingLesson(null);
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Impossible de charger la leçon");
      }
      const lesson = await res.json();
      setEditingLesson(lesson);
    } catch (err: any) {
      setError(err.message);
      setLessonDialogOpen(false);
    } finally {
      setLoadingLesson(false);
    }
  };

  // Après sauvegarde d'une leçon : mettre à jour le titre dans la structure
  const handleLessonSaved = (updated: ILesson) => {
    const updatedId = String(updated._id);
    setSections((prev) =>
      prev.map((s) =>
        s._id === editingLessonSectionId
          ? {
              ...s,
              lessons: (s.lessons || []).map((l) =>
                l._id === updatedId ? { ...l, title: updated.title } : l
              ),
            }
          : s
      )
    );
    setLessonDialogOpen(false);
    setEditingLesson(null);
    setEditingLessonSectionId(null);
    showSuccess("Leçon mise à jour");
  };

  // --- QUIZ ---
  const openQuizCreator = (sectionId: string) => {
    setQuizSectionId(sectionId);
    setEditingQuiz(null);
    setQuizDialogOpen(true);
  };

  const openQuizEditor = async (quizId: string, sectionId: string) => {
    setQuizSectionId(sectionId);
    setEditingQuiz(null);
    setQuizDialogOpen(true);
    setLoadingQuiz(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Impossible de charger le quiz");
      }
      const data = await res.json();
      setEditingQuiz(data.quiz || data);
    } catch (err: any) {
      setError(err.message);
      setQuizDialogOpen(false);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSaveQuiz = async (quizData: any) => {
    try {
      const isEdit = !!editingQuiz?._id;
      const res = await fetch(
        isEdit ? `/api/quizzes/${editingQuiz._id}` : "/api/quizzes",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify(quizData),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la sauvegarde du quiz");
      }
      const data = await res.json();
      const saved = data.quiz || data;
      setSections((prev) =>
        prev.map((s) =>
          s._id === quizSectionId
            ? {
                ...s,
                quizzes: isEdit
                  ? (s.quizzes || []).map((q) =>
                      q._id === saved._id ? { ...q, title: saved.title } : q
                    )
                  : [...(s.quizzes || []), { _id: saved._id, title: saved.title }],
              }
            : s
        )
      );
      setQuizDialogOpen(false);
      setEditingQuiz(null);
      setQuizSectionId(null);
      showSuccess(isEdit ? "Quiz mis à jour" : "Quiz créé");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteQuiz = async (quizId: string, sectionId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce quiz ?")) return;
    setOperationLoading(`deleteQuiz-${quizId}`);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la suppression");
      }
      setSections((prev) =>
        prev.map((s) =>
          s._id === sectionId
            ? { ...s, quizzes: (s.quizzes || []).filter((q) => q._id !== quizId) }
            : s
        )
      );
      showSuccess("Quiz supprimé");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOperationLoading(null);
    }
  };

  // --- EXERCICE ---
  const openExerciseCreator = (sectionId: string) => {
    setExerciseSectionId(sectionId);
    setEditingExercise(null);
    setExerciseDialogOpen(true);
  };

  const openExerciseEditor = async (exerciseId: string, sectionId: string) => {
    setExerciseSectionId(sectionId);
    setEditingExercise(null);
    setExerciseDialogOpen(true);
    setLoadingExercise(true);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Impossible de charger l'exercice");
      }
      const exercise = await res.json();
      setEditingExercise(exercise);
    } catch (err: any) {
      setError(err.message);
      setExerciseDialogOpen(false);
    } finally {
      setLoadingExercise(false);
    }
  };

  const handleExerciseSuccess = (saved: any) => {
    const isEdit = !!editingExercise?._id;
    setSections((prev) =>
      prev.map((s) =>
        s._id === exerciseSectionId
          ? {
              ...s,
              exercises: isEdit
                ? (s.exercises || []).map((ex) =>
                    ex._id === saved._id ? { ...ex, title: saved.title } : ex
                  )
                : [
                    ...(s.exercises || []),
                    { _id: saved._id, title: saved.title, author: String(saved.author || userId) },
                  ],
            }
          : s
      )
    );
    setExerciseDialogOpen(false);
    setEditingExercise(null);
    setExerciseSectionId(null);
    showSuccess(isEdit ? "Exercice mis à jour" : "Exercice créé");
  };

  const deleteExercise = async (exerciseId: string, sectionId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet exercice ?")) return;
    setOperationLoading(`deleteExercise-${exerciseId}`);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la suppression");
      }
      setSections((prev) =>
        prev.map((s) =>
          s._id === sectionId
            ? { ...s, exercises: (s.exercises || []).filter((ex) => ex._id !== exerciseId) }
            : s
        )
      );
      showSuccess("Exercice supprimé");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOperationLoading(null);
    }
  };

  // Drag & Drop : réorganiser les sections
  const handleSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s._id === active.id);
    const newIndex = sections.findIndex((s) => s._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i + 1,
    }));
    setSections(reordered);

    try {
      await fetch("/api/sections/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ sections: reordered }),
      });
    } catch {
      setError("Erreur lors de la réorganisation des sections");
    }
  };

  // Drag & Drop : réorganiser les leçons dans une section
  const handleLessonDragEnd = async (sectionId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const section = sections.find((s) => s._id === sectionId);
    if (!section?.lessons) return;

    const lessons = section.lessons;
    const oldIndex = lessons.findIndex((l) => l._id === active.id);
    const newIndex = lessons.findIndex((l) => l._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedLessons = arrayMove(lessons, oldIndex, newIndex).map((l, i) => ({
      ...l,
      order: i + 1,
    }));

    setSections(
      sections.map((s) =>
        s._id === sectionId ? { ...s, lessons: reorderedLessons } : s
      )
    );

    try {
      await fetch("/api/lessons/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ lessons: reorderedLessons }),
      });
    } catch {
      setError("Erreur lors de la réorganisation des leçons");
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(
      expandedSections.includes(sectionId)
        ? expandedSections.filter((id) => id !== sectionId)
        : [...expandedSections, sectionId]
    );
  };

  // Afficher un message de succès temporaire
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Rendu du statut
  const renderStatus = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      publie: { label: "Publié", className: "dash-badge-success" },
      en_attente_publication: {
        label: "En attente",
        className: "dash-badge-warning",
      },
      en_attente_verification: {
        label: "À vérifier",
        className: "dash-badge-info",
      },
      annule: { label: "Annulé", className: "dash-badge-danger" },
    };

    const config = statusConfig[status] || {
      label: status,
      className: "dash-badge",
    };

    return <span className={`dash-badge ${config.className}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-[#37352f]">
          {error || "Cours non trouvé"}
        </h2>
        <Link
          href="/dashboard/cours"
          className="dash-button dash-button-primary mt-4 inline-flex"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour aux cours
        </Link>
      </div>
    );
  }

  if (!course) return null;

  // Statistiques globales du cours (pour les cartes colorées)
  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
  const totalQuizzes = sections.reduce((acc, s) => acc + (s.quizzes?.length || 0), 0);
  const totalQuestions = sections.reduce(
    (acc, s) => acc + (s.quizzes || []).reduce((qAcc, q) => qAcc + (q.questions?.length || 0), 0),
    0
  );
  const totalExercises = sections.reduce((acc, s) => acc + (s.exercises?.length || 0), 0);

  const statCards = [
    { label: "Sections", value: sections.length, icon: Layers, color: "#f97316", bg: "#fff7ed" },
    { label: "Leçons", value: totalLessons, icon: FileText, color: "#2563eb", bg: "#eff6ff" },
    { label: "Quiz", value: totalQuizzes, icon: Trophy, color: "#d97706", bg: "#fffbeb" },
    { label: "Questions", value: totalQuestions, icon: HelpCircle, color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Exercices", value: totalExercises, icon: Dumbbell, color: "#059669", bg: "#ecfdf5" },
  ];

  // Permissions de suppression (alignées sur l'API) — on masque les boutons sinon
  const userRole = session?.user?.role;
  const userId = session?.user?.id;
  const isAdmin = userRole === "Admin";
  const canDeleteLesson = isAdmin; // API leçon : Admin uniquement
  const canDeleteQuiz = isAdmin; // API quiz : Admin uniquement
  const canDeleteExercise = (exercise: SectionExercise) =>
    isAdmin ||
    userRole === "Correcteur" ||
    (userRole === "Rédacteur" && String(exercise.author) === String(userId));

  const roleBadgeClass = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-50 text-red-600 border-red-200";
      case "Correcteur":
        return "bg-purple-50 text-purple-600 border-purple-200";
      case "Rédacteur":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "Helpeur":
        return "bg-green-50 text-green-600 border-green-200";
      case "Modérateur":
        return "bg-orange-50 text-orange-600 border-orange-200";
      default:
        return "bg-gray-50 text-gray-500 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* En-tête du cours */}
      <div className="dash-card">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/cours"
                className="p-2 hover:bg-[#f7f6f3] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-[#6b6b6b]" />
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {renderStatus(course.status)}
                  <span className="dash-badge">{course.matiere}</span>
                  <span className="dash-badge">{course.niveau}</span>
                </div>
                {editingCourse ? (
                  <input
                    type="text"
                    className="text-2xl font-bold text-[#37352f] bg-[#f7f6f3] border-0 rounded-lg px-3 py-1 w-full"
                    value={editedCourse?.title || ""}
                    onChange={(e) =>
                      setEditedCourse(
                        editedCourse
                          ? { ...editedCourse, title: e.target.value }
                          : null
                      )
                    }
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-[#37352f]">
                    {course.title}
                  </h1>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editingCourse ? (
                <>
                  <button
                    onClick={() => {
                      setEditingCourse(false);
                      setEditedCourse(course);
                    }}
                    className="dash-button dash-button-secondary dash-button-sm"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveCourse}
                    disabled={saving}
                    className="dash-button dash-button-primary dash-button-sm"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Sauvegarder
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/cours/${course._id}`}
                    target="_blank"
                    title={course.status === "publie" ? "Voir le cours en ligne" : "Prévisualiser (cours non publié)"}
                    className="dash-button dash-button-secondary dash-button-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {course.status === "publie" ? "Voir" : "Prévisualiser"}
                  </Link>
                  <button
                    onClick={() => setEditingCourse(true)}
                    className="dash-button dash-button-primary dash-button-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>
                </>
              )}
            </div>
          </div>

          {editingCourse && editedCourse && (
            <div className="mt-4 space-y-4 border-t border-[#e3e2e0] pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="dash-label">Matière</label>
                  <select
                    className="dash-input"
                    value={editedCourse.matiere}
                    onChange={(e) =>
                      setEditedCourse({ ...editedCourse, matiere: e.target.value })
                    }
                  >
                    {editedCourse.matiere &&
                      !educationData.subjects.includes(editedCourse.matiere) && (
                        <option value={editedCourse.matiere}>
                          {editedCourse.matiere} (valeur actuelle)
                        </option>
                      )}
                    {educationData.subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="dash-label">Niveau</label>
                  <select
                    className="dash-input"
                    value={editedCourse.niveau}
                    onChange={(e) =>
                      setEditedCourse({ ...editedCourse, niveau: e.target.value })
                    }
                  >
                    {editedCourse.niveau &&
                      !educationData.levels.includes(editedCourse.niveau) && (
                        <option value={editedCourse.niveau}>
                          {editedCourse.niveau} (valeur actuelle)
                        </option>
                      )}
                    {educationData.levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="dash-label">Description</label>
                <div data-color-mode="light">
                <MDEditor
                  value={editedCourse.description}
                  onChange={(value) =>
                    setEditedCourse({ ...editedCourse, description: value || "" })
                  }
                  height={150}
                  previewOptions={{
                    remarkPlugins: [remarkMath],
                    rehypePlugins: [rehypeKatex],
                  }}
                />
                </div>
              </div>

              {/* Image de couverture */}
              <div>
                <label className="dash-label">Image de couverture</label>
                <div className="border-2 border-dashed border-[#e3e2e0] rounded-xl p-6 text-center hover:border-[#f97316] transition-colors">
                  {editedCourse.image ? (
                    <div className="relative">
                      <Image
                        src={editedCourse.image}
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
                              setEditedCourse({
                                ...editedCourse,
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
                            setEditedCourse({ ...editedCourse, image: "" })
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
                      <div className="w-16 h-16 mx-auto bg-[#f7f6f3] rounded-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-[#bfbfbf]" />
                      </div>
                      <UploadButton
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) => {
                          if (res && res.length > 0) {
                            setEditedCourse({
                              ...editedCourse,
                              image: res[0].url,
                            });
                          }
                        }}
                        onUploadError={(error: Error) => {
                          setError(`Erreur d'upload: ${error.message}`);
                        }}
                      />
                      <p className="text-sm text-[#9ca3af]">
                        PNG, JPG jusqu&apos;à 4MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglets */}
          <div className="flex items-center gap-1 mt-6 border-t border-[#e3e2e0] pt-4">
            {[
              { id: "structure" as Tab, label: "Structure", icon: Layers },
              { id: "content" as Tab, label: "Contenu", icon: FileText },
              { id: "settings" as Tab, label: "Paramètres", icon: Edit2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#fff7ed] text-[#f97316]"
                    : "text-[#6b6b6b] hover:bg-[#f7f6f3]"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Onglet Structure */}
      {activeTab === "structure" && (
        <div className="space-y-4">
          {/* Cartes de statistiques colorées */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="group dash-card p-4 flex items-center gap-3 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                style={{ borderTop: `3px solid ${stat.color}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                  style={{ backgroundColor: stat.bg, color: stat.color }}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-2xl font-bold leading-none tabular-nums"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-[#9ca3af] mt-1 truncate">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#37352f]">
              Structure du cours
            </h2>
            {addingSectionTitle !== null ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="dash-input"
                  placeholder="Titre de la nouvelle section"
                  value={addingSectionTitle}
                  onChange={(e) => setAddingSectionTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitAddSection();
                    if (e.key === "Escape") setAddingSectionTitle(null);
                  }}
                  autoFocus
                />
                <button
                  onClick={submitAddSection}
                  disabled={operationLoading === "addSection"}
                  className="dash-button dash-button-primary dash-button-sm"
                >
                  {operationLoading === "addSection" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setAddingSectionTitle(null)}
                  className="dash-button dash-button-secondary dash-button-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingSectionTitle("")}
                className="dash-button dash-button-primary dash-button-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter une section
              </button>
            )}
          </div>

          {sections.length === 0 ? (
            <div className="dash-empty border-2 border-dashed border-[#e3e2e0] rounded-xl">
              <div className="dash-empty-icon">
                <Layers className="w-8 h-8" />
              </div>
              <h4 className="dash-empty-title">Aucune section</h4>
              <p className="dash-empty-text">
                Ajoutez des sections pour organiser votre cours
              </p>
              <button
                onClick={() => setAddingSectionTitle("")}
                className="dash-button dash-button-primary dash-button-sm mt-4"
              >
                <Plus className="w-4 h-4" />
                Ajouter une section
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext
                items={sections.map((s) => s._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {sections.map((section, index) => {
                    const isExpanded = expandedSections.includes(section._id);
                    const lessons = section.lessons || [];

                    return (
                      <SortableSection
                        key={section._id}
                        section={section}
                        index={index}
                        isExpanded={isExpanded}
                        onToggle={() => toggleSection(section._id)}
                        onAddLesson={() => {
                          setAddingLessonSection(section._id);
                          setAddingLessonTitle("");
                          if (!isExpanded) toggleSection(section._id);
                        }}
                        onDelete={() => deleteSection(section._id)}
                      >
                        <div className="space-y-6">
                        <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-[#6b6b6b]" />
                          <h4 className="text-sm font-semibold text-[#37352f]">Leçons</h4>
                        </div>
                        {lessons.length === 0 && addingLessonSection !== section._id ? (
                          <div className="text-center py-6">
                            <p className="text-sm text-[#9ca3af] mb-3">
                              Aucune leçon dans cette section
                            </p>
                            <button
                              onClick={() => {
                                setAddingLessonSection(section._id);
                                setAddingLessonTitle("");
                              }}
                              className="dash-button dash-button-secondary dash-button-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Ajouter une leçon
                            </button>
                          </div>
                        ) : (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) =>
                              handleLessonDragEnd(section._id, event)
                            }
                          >
                            <SortableContext
                              items={lessons.map((l) => l._id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-2">
                                {lessons.map((lesson, lessonIndex) => (
                                  <SortableLesson
                                    key={lesson._id}
                                    lesson={lesson}
                                    index={lessonIndex}
                                    onEdit={() =>
                                      openLessonEditor(lesson._id, section._id)
                                    }
                                    onDelete={() =>
                                      deleteLesson(lesson._id, section._id)
                                    }
                                    canDelete={canDeleteLesson}
                                    adminSlot={
                                      isAdmin ? (
                                        <AuthorReassign
                                          type="lesson"
                                          id={lesson._id}
                                          accessToken={session?.accessToken}
                                        />
                                      ) : undefined
                                    }
                                  />
                                ))}

                                {/* Formulaire inline ajout leçon */}
                                {addingLessonSection === section._id ? (
                                  <div className="flex items-center gap-2 p-3 border-2 border-dashed border-[#f97316] rounded-lg bg-[#fff7ed]">
                                    <FileText className="w-4 h-4 text-[#f97316]" />
                                    <input
                                      type="text"
                                      className="flex-1 dash-input"
                                      placeholder="Titre de la nouvelle leçon"
                                      value={addingLessonTitle}
                                      onChange={(e) =>
                                        setAddingLessonTitle(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          submitAddLesson(section._id);
                                        if (e.key === "Escape") {
                                          setAddingLessonSection(null);
                                          setAddingLessonTitle("");
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <button
                                      onClick={() =>
                                        submitAddLesson(section._id)
                                      }
                                      disabled={
                                        operationLoading ===
                                        `addLesson-${section._id}`
                                      }
                                      className="dash-button dash-button-primary dash-button-sm"
                                    >
                                      {operationLoading ===
                                      `addLesson-${section._id}` ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setAddingLessonSection(null);
                                        setAddingLessonTitle("");
                                      }}
                                      className="dash-button dash-button-secondary dash-button-sm"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setAddingLessonSection(section._id);
                                      setAddingLessonTitle("");
                                    }}
                                    className="w-full py-2 border-2 border-dashed border-[#e3e2e0] rounded-lg text-sm text-[#6b6b6b] hover:border-[#f97316] hover:text-[#f97316] transition-colors"
                                  >
                                    <Plus className="w-4 h-4 inline mr-2" />
                                    Ajouter une leçon
                                  </button>
                                )}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}
                        </div>

                        {/* Quiz de la section */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-[#6b6b6b]" />
                              <h4 className="text-sm font-semibold text-[#37352f]">Quiz</h4>
                            </div>
                            <button
                              onClick={() => openQuizCreator(section._id)}
                              className="dash-button dash-button-secondary dash-button-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Ajouter un quiz
                            </button>
                          </div>
                          {(section.quizzes || []).length === 0 ? (
                            <p className="text-sm text-[#9ca3af] py-2">
                              Aucun quiz dans cette section
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {(section.quizzes || []).map((quiz) => (
                                <div
                                  key={quiz._id}
                                  className="flex items-center gap-3 p-3 border border-[#e3e2e0] rounded-lg group hover:border-[#d97706] transition-colors"
                                >
                                  <Trophy className="w-4 h-4 text-[#d97706]" />
                                  <span className="flex-1 text-[#37352f]">{quiz.title}</span>
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md bg-[#f5f3ff] text-[#7c3aed]">
                                    <HelpCircle className="w-3 h-3" />
                                    {quiz.questions?.length || 0}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isAdmin && (
                                      <AuthorReassign
                                        type="quiz"
                                        id={quiz._id}
                                        accessToken={session?.accessToken}
                                      />
                                    )}
                                    <button
                                      onClick={() => openQuizEditor(quiz._id, section._id)}
                                      className="p-1.5 hover:bg-[#f7f6f3] rounded"
                                      title="Éditer"
                                    >
                                      <Edit2 className="w-4 h-4 text-[#6b6b6b]" />
                                    </button>
                                    {canDeleteQuiz && (
                                      <button
                                        onClick={() => deleteQuiz(quiz._id, section._id)}
                                        className="p-1.5 hover:bg-red-50 rounded"
                                        title="Supprimer"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Exercices de la section */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="w-4 h-4 text-[#6b6b6b]" />
                              <h4 className="text-sm font-semibold text-[#37352f]">Exercices</h4>
                            </div>
                            <button
                              onClick={() => openExerciseCreator(section._id)}
                              className="dash-button dash-button-secondary dash-button-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Ajouter un exercice
                            </button>
                          </div>
                          {(section.exercises || []).length === 0 ? (
                            <p className="text-sm text-[#9ca3af] py-2">
                              Aucun exercice dans cette section
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {(section.exercises || []).map((exercise) => (
                                <div
                                  key={exercise._id}
                                  className="flex items-center gap-3 p-3 border border-[#e3e2e0] rounded-lg group hover:border-[#059669] transition-colors"
                                >
                                  <Dumbbell className="w-4 h-4 text-[#059669]" />
                                  <span className="flex-1 text-[#37352f]">{exercise.title}</span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isAdmin && (
                                      <AuthorReassign
                                        type="exercise"
                                        id={exercise._id}
                                        accessToken={session?.accessToken}
                                      />
                                    )}
                                    <button
                                      onClick={() => openExerciseEditor(exercise._id, section._id)}
                                      className="p-1.5 hover:bg-[#f7f6f3] rounded"
                                      title="Éditer"
                                    >
                                      <Edit2 className="w-4 h-4 text-[#6b6b6b]" />
                                    </button>
                                    {canDeleteExercise(exercise) && (
                                      <button
                                        onClick={() => deleteExercise(exercise._id, section._id)}
                                        className="p-1.5 hover:bg-red-50 rounded"
                                        title="Supprimer"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        </div>
                      </SortableSection>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {activeTab === "content" && (
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Contenu détaillé</h3>
          </div>
          <div className="dash-card-body">
            <p className="text-[#6b6b6b] mb-4">
              Sélectionnez une leçon dans l&apos;onglet &quot;Structure&quot; pour l&apos;éditer, ou
              utilisez l&apos;éditeur de leçons complet.
            </p>
            <Link
              href="/dashboard/lessons"
              className="dash-button dash-button-primary"
            >
              <FileText className="w-4 h-4" />
              Gérer toutes les leçons
            </Link>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          {/* Auteurs & contributeurs */}
          <div className="dash-card">
            <div className="dash-card-header flex items-center gap-2">
              <Users className="w-4 h-4 text-[#f97316]" />
              <h3 className="dash-card-title">Auteurs &amp; contributeurs</h3>
            </div>
            <div className="dash-card-body space-y-6">
              {loadingContributors ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#f97316]" />
                </div>
              ) : (
                <>
                  {/* Auteurs principaux */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-[#37352f]">
                        Auteurs principaux
                      </h4>
                      {isAdmin && (
                        <AuthorReassign
                          type="course"
                          id={String(id)}
                          accessToken={session?.accessToken}
                          currentAuthorName={authors
                            .map((a) => a.name || a.username)
                            .join(", ")}
                          onChanged={reloadContributors}
                        />
                      )}
                    </div>
                    {authors.length === 0 ? (
                      <p className="text-sm text-[#9ca3af]">Aucun auteur renseigné.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {authors.map((author) => (
                          <div
                            key={author._id}
                            className="flex items-center gap-3 p-3 border border-[#e3e2e0] rounded-xl hover:border-[#f97316] transition-colors"
                          >
                            <ProfileAvatar
                              username={author.username}
                              userId={author._id}
                              size="medium"
                              showPoints={false}
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-[#37352f] truncate">
                                {author.name || author.username}
                              </p>
                              <span
                                className={`inline-flex items-center gap-1 mt-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded border ${roleBadgeClass(
                                  author.role
                                )}`}
                              >
                                {getRoleIconPath(author.role) && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={getRoleIconPath(author.role)!}
                                    alt={author.role}
                                    className="w-3.5 h-3.5 rounded-full"
                                  />
                                )}
                                {author.role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Correcteurs ayant validé des leçons */}
                  {correctors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-[#37352f] mb-1">
                        Correcteurs
                      </h4>
                      <p className="text-xs text-[#9ca3af] mb-3">
                        Ont validé au moins une leçon de ce cours.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {correctors.map((c) => (
                          <div
                            key={c._id}
                            className="flex items-center gap-2 p-2 border border-[#e3e2e0] rounded-lg hover:border-purple-300 transition-colors"
                          >
                            <ProfileAvatar
                              username={c.username}
                              userId={c._id}
                              size="small"
                              showPoints={false}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[#37352f] truncate">
                                {c.name || c.username}
                              </p>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1 py-0.5 rounded border ${roleBadgeClass(
                                  c.role
                                )}`}
                              >
                                {getRoleIconPath(c.role) && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={getRoleIconPath(c.role)!}
                                    alt={c.role}
                                    className="w-3 h-3 rounded-full"
                                  />
                                )}
                                {c.role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contributeurs (leçons / exercices / quiz) */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#37352f] mb-1">
                      Contributeurs
                    </h4>
                    <p className="text-xs text-[#9ca3af] mb-3">
                      Rédacteurs, helpeurs et correcteurs ayant créé des leçons, exercices ou quiz de ce cours.
                    </p>
                    {contributors.length === 0 ? (
                      <p className="text-sm text-[#9ca3af]">Aucun autre contributeur.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {contributors.map((c) => (
                          <div
                            key={c._id}
                            className="flex items-center gap-2 p-2 border border-[#e3e2e0] rounded-lg hover:border-[#f97316] transition-colors"
                          >
                            <ProfileAvatar
                              username={c.username}
                              userId={c._id}
                              size="small"
                              showPoints={false}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-[#37352f] truncate">
                                  {c.name || c.username}
                                </p>
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-1 py-0.5 rounded border ${roleBadgeClass(
                                    c.role
                                  )}`}
                                >
                                  {getRoleIconPath(c.role) && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={getRoleIconPath(c.role)!}
                                      alt={c.role}
                                      className="w-3 h-3 rounded-full"
                                    />
                                  )}
                                  {c.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#9ca3af] truncate">
                                {[
                                  (c.contributions?.lessons || 0) > 0 &&
                                    `${c.contributions?.lessons} leçon${
                                      (c.contributions?.lessons || 0) > 1 ? "s" : ""
                                    }`,
                                  (c.contributions?.exercises || 0) > 0 &&
                                    `${c.contributions?.exercises} exercice${
                                      (c.contributions?.exercises || 0) > 1 ? "s" : ""
                                    }`,
                                  (c.contributions?.quizzes || 0) > 0 &&
                                    `${c.contributions?.quizzes} quiz`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Statut */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Statut du cours</h3>
            </div>
            <div className="dash-card-body">
              <p className="text-sm text-[#6b6b6b]">
                {course.status === "publie"
                  ? "Ce cours est publié et visible par les élèves."
                  : course.status === "en_attente_publication"
                  ? "Ce cours est en attente de publication."
                  : "Ce cours est en cours de rédaction."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dialog d'édition d'une leçon (même logique que les quizz) */}
      <Dialog
        open={lessonDialogOpen}
        onOpenChange={(open) => {
          setLessonDialogOpen(open);
          if (!open) {
            setEditingLesson(null);
            setEditingLessonSectionId(null);
          }
        }}
      >
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 flex flex-col gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>Modifier la leçon</DialogTitle>
          </DialogHeader>
          {loadingLesson || !editingLesson ? (
            <div className="flex items-center justify-center flex-1">
              <MascotLoader message="Chargement de la leçon…" />
            </div>
          ) : (
            <LessonForm
              lesson={editingLesson}
              lockedSectionId={editingLessonSectionId || undefined}
              lockedSectionLabel={
                sections.find((s) => s._id === editingLessonSectionId)?.title
              }
              onSuccess={handleLessonSaved}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition / création d'un quiz */}
      <Dialog
        open={quizDialogOpen}
        onOpenChange={(open) => {
          setQuizDialogOpen(open);
          if (!open) {
            setEditingQuiz(null);
            setQuizSectionId(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Modifier le quiz" : "Ajouter un quiz"}</DialogTitle>
          </DialogHeader>
          {loadingQuiz ? (
            <MascotLoader message="Chargement du quiz…" />
          ) : (
            <QuizForm
              sectionId={quizSectionId || undefined}
              initialData={editingQuiz}
              onSave={handleSaveQuiz}
              onCancel={() => {
                setQuizDialogOpen(false);
                setEditingQuiz(null);
                setQuizSectionId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition / création d'un exercice */}
      <Dialog
        open={exerciseDialogOpen}
        onOpenChange={(open) => {
          setExerciseDialogOpen(open);
          if (!open) {
            setEditingExercise(null);
            setExerciseSectionId(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? "Modifier l'exercice" : "Ajouter un exercice"}
            </DialogTitle>
          </DialogHeader>
          {loadingExercise ? (
            <MascotLoader message="Chargement de l'exercice…" />
          ) : (
            <ExerciseForm
              exercise={editingExercise}
              lockedSectionId={exerciseSectionId || undefined}
              lockedSectionLabel={
                sections.find((s) => s._id === exerciseSectionId)?.title
              }
              onSuccess={handleExerciseSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
