"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  BarChart3,
  BookOpen,
  Target,
  Loader2,
  GraduationCap,
  ArrowRight,
  Lightbulb,
  Sparkles,
  Play,
  X,
  HelpCircle,
} from "lucide-react";

type CompetencyStatus = "not_started" | "in_progress" | "failed" | "mastered";

interface SkillProgress {
  skillId: string;
  description: string;
  difficulty: number;
  keywords: string[];
  status: CompetencyStatus;
  bestScore: number;
  lastScore: number;
  revisionCount: number;
  lastReviewed: string | null;
  nextReview: string | null;
  srsLevel: number;
}

interface ChapterData {
  nodeId: string;
  theme: string;
  chapter: string;
  subChapter?: string;
  level: string;
  estimatedHours: number;
  examFrequency: number;
  skills: SkillProgress[];
  stats: {
    total: number;
    mastered: number;
    inProgress: number;
    failed: number;
    notStarted: number;
    completionPercent: number;
  };
}

interface GlobalStats {
  totalSkills: number;
  mastered: number;
  inProgress: number;
  failed: number;
  notStarted: number;
  completionPercent: number;
}

interface LevelsConfig {
  [key: string]: {
    label: string;
    levels?: { value: string; label: string }[];
    subjects?: string[];
    commonSubjects?: string[];
    tracks?: { value: string; label: string }[];
    specialities?: { value: string; label: string }[];
    techTracks?: { value: string; label: string }[];
    proTracks?: { value: string; label: string }[];
    categories?: {
      key: string;
      label: string;
      levels: { value: string; label: string }[];
      tracks: { value: string; label: string }[];
    }[];
  };
}

const STATUS_CONFIG: Record<
  CompetencyStatus,
  { label: string; color: string; bgColor: string; borderColor: string; icon: typeof CheckCircle2 }
> = {
  mastered: {
    label: "Maîtrisé",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: CheckCircle2,
  },
  in_progress: {
    label: "En cours",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: Clock,
  },
  failed: {
    label: "À revoir",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: XCircle,
  },
  not_started: {
    label: "Non fait",
    color: "text-gray-400",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: Circle,
  },
};

// Étapes du tutoriel
const TUTORIAL_STEPS = [
  {
    title: "Suivez vos compétences",
    description: "Visualisez toutes les compétences du programme officiel de votre niveau. Chaque compétence est classée par thème et chapitre.",
    icon: Target,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    title: "Marquez votre progression",
    description: "Les compétences passent de 'Non fait' → 'En cours' → 'Maîtrisé'. Faites des quiz pour valider vos acquis !",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Révision espacée intelligente",
    description: "Le système SRS vous rappelle de réviser au bon moment pour ne jamais oublier. J+1, J+3, J+7, J+14...",
    icon: Clock,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  {
    title: "Identifiez vos lacunes",
    description: "Les compétences 'À revoir' sont celles où vous avez eu des difficultés. Concentrez-vous dessus !",
    icon: Lightbulb,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
];

export default function ProgressionClient() {
  const { data: session, status: sessionStatus } = useSession();
  const [themes, setThemes] = useState<Record<string, ChapterData[]>>({});
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [levelsConfig, setLevelsConfig] = useState<LevelsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Champs pour la configuration du profil
  const [selectedCycle, setSelectedCycle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>([]);

  // Filtres
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCycleFilter, setSelectedCycleFilter] = useState("");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState("");
  const [profileSubjects, setProfileSubjects] = useState<string[]>([]);

  // Thèmes ouverts
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());

  // Charger la config des niveaux
  useEffect(() => {
    fetch("/api/curriculum/levels")
      .then((r) => r.json())
      .then(setLevelsConfig)
      .catch(console.error);
  }, []);

  // Charger les matières adaptées au profil de l'utilisateur
  useEffect(() => {
    if (!session?.accessToken) return;
    fetch("/api/curriculum/subjects", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.subjects && data.subjects.length > 0) {
          setProfileSubjects(data.subjects);
          // Sélectionner la première matière par défaut
          if (!selectedSubject) {
            setSelectedSubject(data.subjects.includes("mathematiques") ? "mathematiques" : data.subjects[0]);
          }
        }
      })
      .catch(console.error);
  }, [session?.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Charger le profil académique
  useEffect(() => {
    if (!session?.accessToken) return;
    fetch("/api/student-profile", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const profileExists = data.exists && data.profile?.currentGrade;
        setHasProfile(profileExists);
        if (data.profile) {
          setSelectedCycleFilter(data.profile.cycle || "");
          setSelectedLevelFilter(data.profile.currentGrade || "");
          // Pré-remplir le formulaire si profil existe mais incomplet
          if (!profileExists && data.profile.cycle) {
            setSelectedCycle(data.profile.cycle);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [session?.accessToken]);

  const fetchCompetencies = useCallback(async () => {
    if (!session?.accessToken || !selectedSubject) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ subject: selectedSubject });
      if (selectedLevelFilter) params.set("level", selectedLevelFilter);
      if (selectedCycleFilter) params.set("cycle", selectedCycleFilter);

      const res = await fetch(`/api/competencies?${params}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setThemes(data.themes || {});
        setGlobalStats(data.globalStats || null);
        setExpandedThemes(new Set(Object.keys(data.themes || {})));
      }
    } catch (error) {
      console.error("Erreur chargement compétences:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, selectedSubject, selectedLevelFilter, selectedCycleFilter]);

  useEffect(() => {
    if (hasProfile) {
      fetchCompetencies();
    }
  }, [fetchCompetencies, hasProfile]);

  // Reset fields when cycle changes
  useEffect(() => {
    setSelectedLevel("");
    setSelectedTrack("");
    setSelectedSpecialities([]);
    setSelectedCategory("");
  }, [selectedCycle]);

  const toggleTheme = (theme: string) => {
    setExpandedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(theme)) next.delete(theme);
      else next.add(theme);
      return next;
    });
  };

  // Utiliser les matières filtrées par le profil, ou fallback sur la config statique
  const allSubjects = profileSubjects.length > 0
    ? profileSubjects
    : levelsConfig
      ? [
          ...new Set(
            Object.values(levelsConfig).flatMap(
              (c: any) => c.subjects || c.commonSubjects || []
            )
          ),
        ]
      : [];

  // Helpers pour le formulaire de setup
  const getAvailableLevels = () => {
    if (!levelsConfig || !selectedCycle) return [];
    const config = levelsConfig[selectedCycle];
    if (!config) return [];
    if (selectedCycle === 'superieur' && config.categories && selectedCategory) {
      const category = config.categories.find(c => c.key === selectedCategory);
      return category?.levels || [];
    }
    return config.levels || [];
  };

  const getAvailableTracks = () => {
    if (!levelsConfig || !selectedCycle) return [];
    const config = levelsConfig[selectedCycle];
    if (!config) return [];
    if (selectedCycle === 'superieur' && config.categories && selectedCategory) {
      const category = config.categories.find(c => c.key === selectedCategory);
      return category?.tracks || [];
    }
    return config.tracks || [];
  };

  const getAvailableSpecialities = () => {
    if (!levelsConfig || selectedCycle !== 'lycee') return [];
    const config = levelsConfig['lycee'];
    if (!config || selectedLevel === '2nde') return [];
    if (selectedTrack !== 'generale') return [];
    return config.specialities || [];
  };

  const getTechTracks = () => {
    if (!levelsConfig || selectedCycle !== 'lycee') return [];
    return levelsConfig['lycee']?.techTracks || [];
  };

  const getProTracks = () => {
    if (!levelsConfig || selectedCycle !== 'lycee') return [];
    return levelsConfig['lycee']?.proTracks || [];
  };

  const handleSaveProfile = async () => {
    if (!session?.accessToken || !selectedLevel) return;
    
    setSavingProfile(true);
    const body = {
      currentGrade: selectedLevel,
      cycle: selectedCycle,
      track: selectedTrack || undefined,
      specialities: selectedSpecialities.length > 0 ? selectedSpecialities : undefined,
      options: selectedCategory ? [selectedCategory] : undefined,
    };

    try {
      const res = await fetch("/api/student-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setProfileSaved(true);
        setHasProfile(true);
        setShowSetup(false);
        // Mettre à jour les filtres
        setSelectedCycleFilter(selectedCycle);
        setSelectedLevelFilter(selectedLevel);
        // Recharger les matières adaptées au nouveau profil
        try {
          const subjectsRes = await fetch("/api/curriculum/subjects", {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          });
          const subjectsData = await subjectsRes.json();
          if (subjectsData.subjects?.length > 0) {
            setProfileSubjects(subjectsData.subjects);
            setSelectedSubject(subjectsData.subjects.includes("mathematiques") ? "mathematiques" : subjectsData.subjects[0]);
          }
        } catch (e) {
          console.error("Erreur rechargement matières:", e);
        }
      }
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <GraduationCap className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Ma Progression</h1>
        <p className="text-gray-500 mb-6">
          Connectez-vous pour suivre votre progression par compétence.
        </p>
        <Link
          href="/connexion"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          Se connecter
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header avec bouton tutoriel */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="w-8 h-8 text-orange-500" />
            Ma Progression
          </h1>
          <p className="text-gray-500 mt-1">
            Suivez votre maîtrise des compétences du programme officiel
          </p>
        </div>
        {hasProfile && (
          <button
            onClick={() => setShowTutorial(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Comment ça marche ?</span>
          </button>
        )}
      </div>

      {/* Profile setup prompt ou Formulaire intégré */}
      {hasProfile === false && !showSetup && (
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 text-lg">
                Complétez votre profil scolaire
              </h3>
              <p className="text-amber-700 mt-1">
                Votre classe actuelle n'est pas renseignée. Configurez votre niveau pour découvrir 
                votre grille de compétences personnalisée.
              </p>
            </div>
            <button
              onClick={() => setShowSetup(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm hover:shadow-md"
            >
              Configurer maintenant
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Aperçu des avantages */}
          <div className="mt-4 pt-4 border-t border-amber-200/60 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Grille de compétences officielle</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Suivi de progression personnalisé</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Révisions adaptées à votre niveau</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de configuration intégré */}
      {hasProfile === false && showSetup && (
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Configuration rapide</h2>
                <p className="text-sm text-gray-500">Quelques questions pour personnaliser votre expérience</p>
              </div>
            </div>
            <button
              onClick={() => setShowSetup(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Cycle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Je suis en... <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="">Sélectionnez...</option>
                <option value="cycle3">Collège (6ème)</option>
                <option value="cycle4">Collège (5ème - 4ème - 3ème)</option>
                <option value="lycee">Lycée</option>
                <option value="superieur">Études Supérieures</option>
              </select>
            </div>

            {/* Catégorie pour supérieur */}
            {selectedCycle === 'superieur' && levelsConfig?.superieur?.categories && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de formation <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">Sélectionnez...</option>
                  {levelsConfig.superieur.categories.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Niveau précis */}
            {selectedCycle && (selectedCycle !== 'superieur' || selectedCategory) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau précis <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">Sélectionnez...</option>
                  {getAvailableLevels().map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filière lycée */}
            {selectedCycle === 'lycee' && selectedLevel && selectedLevel !== '2nde' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filière <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTrack}
                  onChange={(e) => {
                    setSelectedTrack(e.target.value);
                    setSelectedSpecialities([]);
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">Sélectionnez...</option>
                  {levelsConfig?.lycee?.tracks?.map((track) => (
                    <option key={track.value} value={track.value}>
                      {track.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Spécialités lycée général */}
            {selectedCycle === 'lycee' && selectedTrack === 'generale' && selectedLevel !== '2nde' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialités (max 3)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getAvailableSpecialities().map((spec) => (
                    <label
                      key={spec.value}
                      className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={spec.value}
                        checked={selectedSpecialities.includes(spec.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (selectedSpecialities.length < 3) {
                              setSelectedSpecialities([...selectedSpecialities, spec.value]);
                            }
                          } else {
                            setSelectedSpecialities(selectedSpecialities.filter(s => s !== spec.value));
                          }
                        }}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{spec.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Série technologique */}
            {selectedCycle === 'lycee' && selectedTrack === 'technologique' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Série technologique <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSpecialities[0] || ''}
                  onChange={(e) => setSelectedSpecialities([e.target.value])}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">Sélectionnez...</option>
                  {getTechTracks().map((track) => (
                    <option key={track.value} value={track.value}>
                      {track.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filière professionnelle */}
            {selectedCycle === 'lycee' && selectedTrack === 'professionnelle' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filière professionnelle <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSpecialities[0] || ''}
                  onChange={(e) => setSelectedSpecialities([e.target.value])}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">Sélectionnez...</option>
                  {getProTracks().map((track) => (
                    <option key={track.value} value={track.value}>
                      {track.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filière supérieur */}
            {selectedCycle === 'superieur' && selectedCategory && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filière <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">Sélectionnez...</option>
                  {getAvailableTracks().map((track) => (
                    <option key={track.value} value={track.value}>
                      {track.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || !selectedLevel}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : profileSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Enregistré !
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Commencer à apprendre
                </>
              )}
            </button>
            <button
              onClick={() => setShowSetup(false)}
              className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium"
            >
              Annuler
            </button>
          </div>

          {!selectedLevel && (
            <p className="text-sm text-amber-600 text-center mt-3">
              Veuillez sélectionner votre niveau pour continuer
            </p>
          )}
        </div>
      )}

      {/* Tutoriel Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                  Comment fonctionne la progression ?
                </h2>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Vidéo placeholder */}
              <div className="aspect-video bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <p className="text-orange-800 font-medium">Tutoriel vidéo à venir</p>
                  <p className="text-sm text-orange-600">2 minutes pour tout comprendre</p>
                </div>
              </div>

              {/* Étapes */}
              <div className="space-y-4">
                {TUTORIAL_STEPS.map((step, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-xl bg-gray-50">
                    <div className={`w-12 h-12 ${step.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                      <step.icon className={`w-6 h-6 ${step.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <span className="w-6 h-6 bg-gray-200 rounded-full text-xs flex items-center justify-center text-gray-600">
                          {index + 1}
                        </span>
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Conseils */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  💡 Conseil pro
                </h4>
                <p className="text-sm text-blue-700">
                  Commencez par les compétences marquées "Exam &gt; 70%" - ce sont celles qui tombent le plus souvent aux contrôles !
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setShowTutorial(false)}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                J'ai compris, c'est parti !
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal (visible uniquement si profil configuré) */}
      {hasProfile && (
        <>
          {/* Filtres */}
          <div className="mb-6 flex flex-wrap gap-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              {allSubjects.map((s) => (
                <option key={s} value={s}>
                  {(s as string).charAt(0).toUpperCase() + (s as string).slice(1).replace(/-/g, " ")}
                </option>
              ))}
            </select>

            {selectedCycleFilter && levelsConfig?.[selectedCycleFilter] && (
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="">Tous les niveaux</option>
                {levelsConfig[selectedCycleFilter].levels?.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Global stats */}
          {globalStats && globalStats.totalSkills > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              <StatCard
                label="Total"
                value={globalStats.totalSkills}
                icon={<BookOpen className="w-4 h-4" />}
                color="text-gray-600"
                bgColor="bg-gray-50"
              />
              <StatCard
                label="Maîtrisé"
                value={globalStats.mastered}
                icon={<CheckCircle2 className="w-4 h-4" />}
                color="text-emerald-600"
                bgColor="bg-emerald-50"
              />
              <StatCard
                label="En cours"
                value={globalStats.inProgress}
                icon={<Clock className="w-4 h-4" />}
                color="text-amber-600"
                bgColor="bg-amber-50"
              />
              <StatCard
                label="À revoir"
                value={globalStats.failed}
                icon={<XCircle className="w-4 h-4" />}
                color="text-red-500"
                bgColor="bg-red-50"
              />
              <StatCard
                label="Non fait"
                value={globalStats.notStarted}
                icon={<Circle className="w-4 h-4" />}
                color="text-gray-400"
                bgColor="bg-gray-50"
              />
            </div>
          )}

          {/* Global progress bar */}
          {globalStats && globalStats.totalSkills > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progression globale
                </span>
                <span className="text-sm font-bold text-orange-600">
                  {globalStats.completionPercent}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full flex">
                  {globalStats.mastered > 0 && (
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${(globalStats.mastered / globalStats.totalSkills) * 100}%`,
                      }}
                    />
                  )}
                  {globalStats.inProgress > 0 && (
                    <div
                      className="bg-amber-400 transition-all duration-500"
                      style={{
                        width: `${(globalStats.inProgress / globalStats.totalSkills) * 100}%`,
                      }}
                    />
                  )}
                  {globalStats.failed > 0 && (
                    <div
                      className="bg-red-400 transition-all duration-500"
                      style={{
                        width: `${(globalStats.failed / globalStats.totalSkills) * 100}%`,
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Legend color="bg-emerald-500" label="Maîtrisé" />
                <Legend color="bg-amber-400" label="En cours" />
                <Legend color="bg-red-400" label="À revoir" />
                <Legend color="bg-gray-200" label="Non fait" />
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : Object.keys(themes).length === 0 ? (
            <div className="text-center py-20">
              <BarChart3 className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">
                Aucune compétence trouvée
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Les programmes pour cette matière n&apos;ont pas encore été importés.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(themes).map(([theme, chapters]) => {
                const themeStats = chapters.reduce(
                  (acc, ch) => ({
                    total: acc.total + ch.stats.total,
                    mastered: acc.mastered + ch.stats.mastered,
                  }),
                  { total: 0, mastered: 0 }
                );
                const themePercent =
                  themeStats.total > 0
                    ? Math.round((themeStats.mastered / themeStats.total) * 100)
                    : 0;

                return (
                  <div
                    key={theme}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white"
                  >
                    {/* Theme header */}
                    <button
                      onClick={() => toggleTheme(theme)}
                      className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      {expandedThemes.has(theme) ? (
                        <ChevronDown className="w-5 h-5 text-orange-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <BookOpen className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold text-gray-900 flex-1 text-left">
                        {theme}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">
                          {themePercent}%
                        </span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${themePercent}%` }}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Chapters */}
                    {expandedThemes.has(theme) && (
                      <div className="border-t border-gray-100">
                        {chapters.map((chapter) => (
                          <ChapterCard key={chapter.nodeId} chapter={chapter} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChapterCard({ chapter }: { chapter: ChapterData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-50 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
        <span className="text-sm font-medium text-gray-800 flex-1 text-left">
          {chapter.chapter}
        </span>
        <span className="text-xs text-gray-400 mr-2">{chapter.level}</span>
        {chapter.examFrequency > 70 && (
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
            Exam {chapter.examFrequency}%
          </span>
        )}
        <span className="text-xs font-medium text-gray-500 w-10 text-right">
          {chapter.stats.completionPercent}%
        </span>
        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${chapter.stats.completionPercent}%` }}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-1">
          {chapter.skills.map((skill) => (
            <SkillRow key={skill.skillId} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkillRow({ skill }: { skill: SkillProgress }) {
  const config = STATUS_CONFIG[skill.status];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${config.borderColor} ${config.bgColor} transition-colors`}
    >
      <Icon className={`w-5 h-5 ${config.color} shrink-0`} />
      <span className="flex-1 text-sm text-gray-800">{skill.description}</span>
      {skill.bestScore > 0 && (
        <span className={`text-xs font-bold ${config.color}`}>{skill.bestScore}%</span>
      )}
      {skill.revisionCount > 0 && (
        <span className="text-xs text-gray-400">{skill.revisionCount}x</span>
      )}
      {skill.nextReview && new Date(skill.nextReview) <= new Date() && (
        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
          Révision due
        </span>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-xl p-4 text-center`}>
      <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
