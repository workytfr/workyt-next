"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  School,
  BookOpen,
  Target,
} from "lucide-react";

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

export default function ProfilScolairePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [levelsConfig, setLevelsConfig] = useState<LevelsConfig | null>(null);
  
  // Champs du formulaire
  const [selectedCycle, setSelectedCycle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>([]);
  const [dailyStudyTime, setDailyStudyTime] = useState(45);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  // Charger la config et le profil existant
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/connexion");
      return;
    }

    // Charger config
    fetch("/api/curriculum/levels")
      .then((r) => r.json())
      .then((data) => setLevelsConfig(data))
      .catch(console.error);

    // Charger profil existant
    fetch("/api/student-profile", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.exists && data.profile) {
          const p = data.profile;
          setSelectedCycle(p.cycle || "");
          setSelectedLevel(p.currentGrade || "");
          setSelectedTrack(p.track || "");
          setSelectedSpecialities(p.specialities || []);
          if (p.options?.[0]) setSelectedCategory(p.options[0]);
          if (p.preferences) {
            setDailyStudyTime(p.preferences.dailyStudyTime || 45);
            setReminderEnabled(p.preferences.reminderEnabled !== false);
          }
        }
        setLoading(false);
        // Activer le reset des champs après le chargement initial
        setTimeout(() => setInitialLoaded(true), 100);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setInitialLoaded(true);
      });
  }, [session, status, router]);

  // Reset fields when cycle changes (but not on initial load)
  const [initialLoaded, setInitialLoaded] = useState(false);
  useEffect(() => {
    if (!initialLoaded) return;
    setSelectedLevel("");
    setSelectedTrack("");
    setSelectedSpecialities([]);
    setSelectedCategory("");
  }, [selectedCycle]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    setSaving(true);
    setSaved(false);

    const body = {
      currentGrade: selectedLevel,
      cycle: selectedCycle,
      track: selectedTrack || undefined,
      specialities: selectedSpecialities.length > 0 ? selectedSpecialities : undefined,
      options: selectedCategory ? [selectedCategory] : undefined,
      preferences: {
        dailyStudyTime,
        reminderEnabled,
      },
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
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/progression"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à ma progression
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-orange-500" />
            Mon Profil Scolaire
          </h1>
          <p className="text-gray-500 mt-1">
            Configurez votre niveau pour personnaliser votre expérience
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Niveau */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <School className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Niveau scolaire</h2>
                <p className="text-sm text-gray-500">Votre classe actuelle</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Cycle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Je suis en... <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  required
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
                    required
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
                    required
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
                    required
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spécialités
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {getAvailableSpecialities().map((spec) => (
                      <label
                        key={spec.value}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
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
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedSpecialities.length}/3 spécialités sélectionnées
                  </p>
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
                    required
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
                    required
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filière <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
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
          </div>

          {/* Section Préférences */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Préférences d'étude</h2>
                <p className="text-sm text-gray-500">Personnalisez votre expérience</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Temps d'étude quotidien */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temps d'étude quotidien visé
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="15"
                    value={dailyStudyTime}
                    onChange={(e) => setDailyStudyTime(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700 w-20 text-right">
                    {dailyStudyTime} min
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recommandation : 45-60 minutes pour un élève du secondaire
                </p>
              </div>

              {/* Notifications */}
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Activer les rappels</p>
                  <p className="text-xs text-gray-500">Recevoir des notifications pour les révisions</p>
                </div>
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving || !selectedLevel}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Enregistré !
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>

          {!selectedLevel && (
            <p className="text-sm text-amber-600 text-center">
              Veuillez sélectionner votre niveau pour enregistrer
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
