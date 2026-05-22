"use client";

import { memo, useState } from "react";
import {
    BookOpen,
    ListChecks,
    Languages,
    PenSquare,
    Network,
    FilePlus,
    Lightbulb,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { FICHE_TEMPLATES, PEDAGOGY_TIPS, type FicheTemplate } from "./ficheTemplates";

const ICONS = { BookOpen, ListChecks, Languages, PenSquare, Network, FilePlus } as const;

interface TemplatePickerProps {
    onPick: (template: FicheTemplate) => void;
}

function TemplatePickerComponent({ onPick }: TemplatePickerProps) {
    const [tipsOpen, setTipsOpen] = useState(false);

    return (
        <div className="space-y-5">
            <div>
                <h4 className="font-semibold text-base">Choisis un modèle pour démarrer</h4>
                <p className="text-sm text-gray-600 mt-1">
                    Chaque modèle suit une structure éprouvée pour bien mémoriser.
                    Tu peux ensuite tout modifier librement.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FICHE_TEMPLATES.map((tpl) => {
                    const Icon = (ICONS as any)[tpl.icon] ?? BookOpen;
                    return (
                        <button
                            key={tpl.id}
                            type="button"
                            onClick={() => onPick(tpl)}
                            className="text-left p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/40 transition-colors group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange-100 text-orange-700 group-hover:bg-orange-200 transition-colors">
                                    <Icon size={18} />
                                </span>
                                <span className="font-semibold text-sm">{tpl.label}</span>
                            </div>
                            <p className="text-xs text-gray-600 leading-snug">{tpl.description}</p>
                            {tpl.bestFor.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {tpl.bestFor.map((b, i) => (
                                        <span
                                            key={i}
                                            className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                                        >
                                            {b}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="rounded-xl border border-orange-100 bg-orange-50/60 overflow-hidden">
                <button
                    type="button"
                    onClick={() => setTipsOpen((v) => !v)}
                    className="w-full flex items-center justify-between p-4 hover:bg-orange-50 transition-colors"
                    aria-expanded={tipsOpen}
                >
                    <span className="flex items-center gap-2">
                        <Lightbulb size={18} className="text-orange-600" />
                        <span className="font-semibold text-sm">
                            Comment faire une fiche qui marche vraiment ?
                        </span>
                    </span>
                    {tipsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {tipsOpen && (
                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PEDAGOGY_TIPS.map((tip, i) => (
                            <div key={i} className="bg-white rounded-lg p-3 border border-orange-100">
                                <p className="text-sm font-semibold text-orange-700 mb-1">
                                    {i + 1}. {tip.title}
                                </p>
                                <p className="text-xs text-gray-700 leading-relaxed">{tip.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const TemplatePicker = memo(TemplatePickerComponent);
export default TemplatePicker;
