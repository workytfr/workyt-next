"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Upload,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Search,
  Filter,
  Link2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  FileJson,
  X,
} from "lucide-react";
import "../styles/dashboard-theme.css";
import ContentPicker from "@/components/ui/ContentPicker";

interface Skill {
  skillId: string;
  description: string;
  difficulty: number;
  keywords: string[];
}

interface CurriculumNode {
  _id: string;
  nodeId: string;
  version: string;
  cycle: string;
  level: string;
  track?: string;
  subject: string;
  theme: string;
  chapter: string;
  subChapter?: string;
  skills: Skill[];
  estimatedHours: number;
  order: number;
  examFrequency: number;
  coverage: number;
  linkedContent: {
    fiches: any[];
    courses: any[];
    quizzes: any[];
  };
}

interface LevelsConfig {
  [key: string]: {
    label: string;
    levels: { value: string; label: string }[];
    subjects?: string[];
    commonSubjects?: string[];
  };
}

const CYCLE_LABELS: Record<string, string> = {
  cycle3: "Cycle 3",
  cycle4: "Cycle 4",
  lycee: "Lycée",
  superieur: "Supérieur",
};

const DIFFICULTY_COLORS = [
  "",
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-yellow-100 text-yellow-700",
  "bg-orange-100 text-orange-700",
  "bg-red-100 text-red-700",
];

export default function CurriculumAdminPage() {
  const { data: session } = useSession();
  const [nodes, setNodes] = useState<CurriculumNode[]>([]);
  const [levelsConfig, setLevelsConfig] = useState<LevelsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    message: string;
    created: number;
    updated: number;
    errors: string[];
  } | null>(null);

  // Filtres
  const [filterCycle, setFilterCycle] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Thèmes ouverts/fermés
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Tagging modal
  const [taggingNode, setTaggingNode] = useState<CurriculumNode | null>(null);
  const [tagInput, setTagInput] = useState({ ficheId: "", courseId: "", quizId: "" });

  const fetchNodes = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCycle) params.set("cycle", filterCycle);
      if (filterLevel) params.set("level", filterLevel);
      if (filterSubject) params.set("subject", filterSubject);

      const res = await fetch(`/api/curriculum?${params}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes || []);
      }
    } catch (error) {
      console.error("Erreur chargement curriculum:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, filterCycle, filterLevel, filterSubject]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  useEffect(() => {
    fetch("/api/curriculum/levels")
      .then((r) => r.json())
      .then(setLevelsConfig)
      .catch(console.error);
  }, []);

  const handleImportJSON = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImporting(true);
      setImportResult(null);
      try {
        const text = await file.text();
        const payload = JSON.parse(text);

        const res = await fetch("/api/curriculum/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (res.ok) {
          setImportResult(result);
          fetchNodes();
        } else {
          setImportResult({ message: result.error, created: 0, updated: 0, errors: [result.error] });
        }
      } catch (err: any) {
        setImportResult({ message: "Erreur de parsing JSON", created: 0, updated: 0, errors: [err.message] });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm(`Supprimer le noeud ${nodeId} ?`)) return;
    try {
      const res = await fetch(`/api/curriculum/${nodeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (res.ok) {
        setNodes((prev) => prev.filter((n) => n.nodeId !== nodeId));
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const handleTagContent = async (nodeId: string) => {
    const body: Record<string, any> = {};
    if (tagInput.ficheId) body["linkedContent.fiches"] = tagInput.ficheId;
    if (tagInput.courseId) body["linkedContent.courses"] = tagInput.courseId;
    if (tagInput.quizId) body["linkedContent.quizzes"] = tagInput.quizId;

    // Build $addToSet operation
    const updateBody: Record<string, any> = {};
    if (tagInput.ficheId) updateBody["linkedContent.fiches"] = [...(taggingNode?.linkedContent.fiches || []).map((f: any) => f._id || f), tagInput.ficheId];
    if (tagInput.courseId) updateBody["linkedContent.courses"] = [...(taggingNode?.linkedContent.courses || []).map((c: any) => c._id || c), tagInput.courseId];
    if (tagInput.quizId) updateBody["linkedContent.quizzes"] = [...(taggingNode?.linkedContent.quizzes || []).map((q: any) => q._id || q), tagInput.quizId];

    try {
      const res = await fetch(`/api/curriculum/${nodeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(updateBody),
      });
      if (res.ok) {
        setTaggingNode(null);
        setTagInput({ ficheId: "", courseId: "", quizId: "" });
        fetchNodes();
      }
    } catch (error) {
      console.error("Erreur tagging:", error);
    }
  };

  const toggleTheme = (theme: string) => {
    setExpandedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(theme)) next.delete(theme);
      else next.add(theme);
      return next;
    });
  };

  const toggleChapter = (key: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Grouper par theme > chapter
  const grouped = nodes.reduce<Record<string, Record<string, CurriculumNode[]>>>((acc, node) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        node.chapter.toLowerCase().includes(q) ||
        node.theme.toLowerCase().includes(q) ||
        node.skills.some(
          (s) =>
            s.description.toLowerCase().includes(q) ||
            s.keywords.some((k) => k.toLowerCase().includes(q))
        );
      if (!match) return acc;
    }
    if (!acc[node.theme]) acc[node.theme] = {};
    if (!acc[node.theme][node.chapter]) acc[node.theme][node.chapter] = [];
    acc[node.theme][node.chapter].push(node);
    return acc;
  }, {});

  const totalSkills = nodes.reduce((acc, n) => acc + n.skills.length, 0);
  const availableLevels = levelsConfig && filterCycle ? levelsConfig[filterCycle]?.levels || [] : [];
  const availableSubjects = levelsConfig && filterCycle
    ? (levelsConfig[filterCycle] as any)?.subjects || (levelsConfig[filterCycle] as any)?.commonSubjects || []
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#37352f] flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-[#f97316]" />
            Programmes Scolaires
          </h1>
          <p className="text-sm text-[#6b6b6b] mt-1">
            {nodes.length} chapitres &middot; {totalSkills} compétences
          </p>
        </div>
        <button
          onClick={handleImportJSON}
          disabled={importing}
          className="dash-button dash-button-primary flex items-center gap-2"
        >
          {importing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Importer un JSON
        </button>
      </div>

      {/* Import result */}
      {importResult && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            importResult.errors.length > 0
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {importResult.errors.length > 0 ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            <span className="font-medium">{importResult.message}</span>
          </div>
          <p className="text-sm text-[#6b6b6b]">
            {importResult.created} créés, {importResult.updated} mis à jour
            {importResult.errors.length > 0 &&
              `, ${importResult.errors.length} erreurs`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="dash-card mb-6">
        <div className="dash-card-body">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-[#6b6b6b]" />
            <span className="text-sm font-medium text-[#37352f]">Filtres</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={filterCycle}
              onChange={(e) => {
                setFilterCycle(e.target.value);
                setFilterLevel("");
                setFilterSubject("");
              }}
              className="dash-input"
            >
              <option value="">Tous les cycles</option>
              {Object.entries(CYCLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="dash-input"
              disabled={!filterCycle}
            >
              <option value="">Tous les niveaux</option>
              {availableLevels.map((l: any) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="dash-input"
              disabled={!filterCycle}
            >
              <option value="">Toutes les matières</option>
              {(Array.isArray(availableSubjects) ? availableSubjects : []).map((s: string) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dash-input pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tree view */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="dash-empty">
          <FileJson className="dash-empty-icon" />
          <h3 className="dash-empty-title">Aucun programme importé</h3>
          <p className="text-sm text-[#6b6b6b]">
            Importez un fichier JSON depuis le bouton ci-dessus
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([theme, chapters]) => (
            <div key={theme} className="dash-card">
              {/* Theme header */}
              <button
                onClick={() => toggleTheme(theme)}
                className="w-full dash-card-header flex items-center gap-2 cursor-pointer hover:bg-[#f7f6f3] transition-colors"
              >
                {expandedThemes.has(theme) ? (
                  <ChevronDown className="w-5 h-5 text-[#f97316]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#6b6b6b]" />
                )}
                <BookOpen className="w-4 h-4 text-[#f97316]" />
                <span className="font-semibold text-[#37352f]">{theme}</span>
                <span className="text-xs text-[#9ca3af] ml-auto">
                  {Object.keys(chapters).length} chapitres &middot;{" "}
                  {Object.values(chapters)
                    .flat()
                    .reduce((a, n) => a + n.skills.length, 0)}{" "}
                  compétences
                </span>
              </button>

              {expandedThemes.has(theme) && (
                <div className="dash-card-body space-y-2">
                  {Object.entries(chapters).map(([chapter, chapterNodes]) => {
                    const chapterKey = `${theme}::${chapter}`;
                    const allSkills = chapterNodes.flatMap((n) => n.skills);
                    const levels = [...new Set(chapterNodes.map((n) => n.level))];

                    return (
                      <div key={chapterKey} className="border border-[#e3e2e0] rounded-lg">
                        <button
                          onClick={() => toggleChapter(chapterKey)}
                          className="w-full px-4 py-3 flex items-center gap-2 hover:bg-[#f7f6f3] transition-colors"
                        >
                          {expandedChapters.has(chapterKey) ? (
                            <ChevronDown className="w-4 h-4 text-[#6b6b6b]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#6b6b6b]" />
                          )}
                          <span className="font-medium text-sm text-[#37352f]">
                            {chapter}
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            {levels.map((l) => (
                              <span
                                key={l}
                                className="dash-badge text-xs"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-[#9ca3af] ml-auto">
                            {allSkills.length} comp. &middot;{" "}
                            {chapterNodes[0]?.estimatedHours || 0}h &middot; Exam{" "}
                            {chapterNodes[0]?.examFrequency || 0}%
                          </span>
                        </button>

                        {expandedChapters.has(chapterKey) && (
                          <div className="px-4 pb-3 space-y-1">
                            {/* Skills list */}
                            {allSkills.map((skill) => (
                              <div
                                key={skill.skillId}
                                className="flex items-center gap-2 py-1.5 px-3 rounded hover:bg-[#f7f6f3] text-sm"
                              >
                                <span
                                  className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${
                                    DIFFICULTY_COLORS[skill.difficulty]
                                  }`}
                                >
                                  {skill.difficulty}
                                </span>
                                <span className="flex-1 text-[#37352f]">
                                  {skill.description}
                                </span>
                                <code className="text-xs text-[#9ca3af]">
                                  {skill.skillId}
                                </code>
                              </div>
                            ))}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-[#e3e2e0] mt-2">
                              <button
                                onClick={() => setTaggingNode(chapterNodes[0])}
                                className="dash-button dash-button-secondary dash-button-sm flex items-center gap-1"
                              >
                                <Link2 className="w-3 h-3" />
                                Lier du contenu
                              </button>
                              <button
                                onClick={() => handleDeleteNode(chapterNodes[0].nodeId)}
                                className="dash-button dash-button-ghost dash-button-sm flex items-center gap-1 text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                                Supprimer
                              </button>
                              {chapterNodes[0].linkedContent && (
                                <span className="text-xs text-[#9ca3af] ml-auto">
                                  {chapterNodes[0].linkedContent.fiches?.length || 0} fiches,{" "}
                                  {chapterNodes[0].linkedContent.courses?.length || 0} cours,{" "}
                                  {chapterNodes[0].linkedContent.quizzes?.length || 0} quiz
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tagging Modal */}
      {taggingNode && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg text-[#37352f]">
                Lier du contenu
              </h3>
              <button
                onClick={() => {
                  setTaggingNode(null);
                  setTagInput({ ficheId: "", courseId: "", quizId: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#6b6b6b] mb-4">
              {taggingNode.chapter} ({taggingNode.level}) &middot; Recherchez par titre
            </p>

            {/* Contenu déjà lié */}
            {(taggingNode.linkedContent.fiches?.length > 0 ||
              taggingNode.linkedContent.courses?.length > 0 ||
              taggingNode.linkedContent.quizzes?.length > 0) && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-[#6b6b6b]">
                <p className="font-medium mb-1">Déjà lié :</p>
                {taggingNode.linkedContent.fiches?.length > 0 && (
                  <p>{taggingNode.linkedContent.fiches.length} fiche(s)</p>
                )}
                {taggingNode.linkedContent.courses?.length > 0 && (
                  <p>{taggingNode.linkedContent.courses.length} cours</p>
                )}
                {taggingNode.linkedContent.quizzes?.length > 0 && (
                  <p>{taggingNode.linkedContent.quizzes.length} quiz</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="dash-label mb-1.5 block">Fiche de révision</label>
                <ContentPicker
                  contentType="fiche"
                  onSelect={(item) => setTagInput({ ...tagInput, ficheId: item._id })}
                  placeholder="Rechercher une fiche..."
                />
                {tagInput.ficheId && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Fiche sélectionnée
                    <button onClick={() => setTagInput({ ...tagInput, ficheId: "" })} className="text-gray-400 hover:text-red-500 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="dash-label mb-1.5 block">Cours</label>
                <ContentPicker
                  contentType="course"
                  onSelect={(item) => setTagInput({ ...tagInput, courseId: item._id })}
                  placeholder="Rechercher un cours..."
                />
                {tagInput.courseId && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Cours sélectionné
                    <button onClick={() => setTagInput({ ...tagInput, courseId: "" })} className="text-gray-400 hover:text-red-500 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="dash-label mb-1.5 block">Quiz</label>
                <ContentPicker
                  contentType="quiz"
                  onSelect={(item) => setTagInput({ ...tagInput, quizId: item._id })}
                  placeholder="Rechercher un quiz..."
                />
                {tagInput.quizId && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Quiz sélectionné
                    <button onClick={() => setTagInput({ ...tagInput, quizId: "" })} className="text-gray-400 hover:text-red-500 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => handleTagContent(taggingNode.nodeId)}
                disabled={!tagInput.ficheId && !tagInput.courseId && !tagInput.quizId}
                className="dash-button dash-button-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setTaggingNode(null);
                  setTagInput({ ficheId: "", courseId: "", quizId: "" });
                }}
                className="dash-button dash-button-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
