"use client";

import { useState } from "react";
import {
    Info, ChevronDown, BookOpen, MessageCircleQuestion, FileCheck,
    Users, MoveHorizontal, Sparkles,
} from "lucide-react";
import { COLUMNS, PRIORITIES, BOARDS } from "@/lib/kanban";

/**
 * Panneau d'explication de l'organisation du Kanban : équipes, colonnes,
 * code couleur des priorités, icônes de liaison, assignation.
 */
export default function BoardLegend() {
    const [open, setOpen] = useState(false);

    return (
        <div className="mb-6 border border-gray-200 rounded-2xl bg-white overflow-hidden">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Info className="w-4 h-4 text-purple-500" />
                    Comment fonctionne le Kanban&nbsp;?
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="px-5 pb-5 pt-1 space-y-5 text-sm text-gray-600 border-t border-gray-100">
                    {/* Équipes */}
                    <div>
                        <p className="font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-gray-400" /> Un tableau par équipe
                        </p>
                        <p className="text-gray-500 mb-2">
                            Chaque rôle dispose de son propre tableau. Vous voyez celui de votre équipe&nbsp;;
                            les administrateurs peuvent basculer entre tous les tableaux.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {BOARDS.map((b) => (
                                <span
                                    key={b.id}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: `${b.color}1a`, color: b.color }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                                    {b.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Colonnes */}
                    <div>
                        <p className="font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <MoveHorizontal className="w-4 h-4 text-gray-400" /> Les colonnes (le flux de travail)
                        </p>
                        <p className="text-gray-500 mb-2">
                            Faites glisser une carte d&apos;une colonne à l&apos;autre au fur et à mesure de l&apos;avancement.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            {COLUMNS.map((c, i) => (
                                <span key={c.id} className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                        {c.label}
                                    </span>
                                    {i < COLUMNS.length - 1 && <span className="text-gray-300">→</span>}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Priorités */}
                    <div>
                        <p className="font-semibold text-gray-700 mb-1.5">Priorité (la pastille de couleur)</p>
                        <div className="flex flex-wrap gap-3">
                            {PRIORITIES.map((p) => (
                                <span key={p.id} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                    {p.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Liaisons */}
                    <div>
                        <p className="font-semibold text-gray-700 mb-1.5">Liaison (relier une carte à un contenu)</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                            <span className="inline-flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Un cours
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <MessageCircleQuestion className="w-3.5 h-3.5 text-purple-500" /> Une question du forum
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <FileCheck className="w-3.5 h-3.5 text-purple-500" /> Une évaluation à corriger
                            </span>
                        </div>
                        <p className="text-gray-500 mt-1.5">
                            Une carte sans liaison reste une tâche libre (ex&nbsp;: «&nbsp;Gérer les candidatures&nbsp;»).
                        </p>
                    </div>

                    {/* Auto-création */}
                    <div>
                        <p className="font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-indigo-500" /> Cartes automatiques
                        </p>
                        <p className="text-gray-500">
                            Certaines cartes (badge <span className="text-indigo-600 font-medium">Auto</span>) sont
                            générées à partir du travail en attente : évaluations à corriger et cours à vérifier
                            (Correcteurs), questions du forum sans réponse (Helpeurs), questions à valider (Modérateurs).
                            Le bouton <span className="font-medium">Synchroniser</span> les met à jour&nbsp;; une fois la
                            source traitée, la carte passe automatiquement en «&nbsp;Terminé&nbsp;».
                        </p>
                    </div>

                    {/* Assignation */}
                    <div>
                        <p className="font-semibold text-gray-700 mb-1.5">Assignation</p>
                        <p className="text-gray-500">
                            Les avatars en bas d&apos;une carte indiquent les personnes responsables.
                            Cliquez sur un avatar pour ouvrir le profil du membre.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
