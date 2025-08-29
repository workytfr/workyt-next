"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, GripVertical } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Section {
    _id?: string;
    title: string;
    order: number;
}

interface SectionManagerProps {
    courseId: string;
    session: any;
    onError?: (error: any) => void;
}

// Composant de section sortable
function SortableSection({ section, index, onUpdate, onRemove }: {
    section: Section;
    index: number;
    onUpdate: (index: number, title: string) => void;
    onRemove: (index: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section._id || `temp-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        background: isDragging ? "#e0e0e0" : "#f3f3f3",
        padding: "8px",
        borderRadius: "4px",
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2">
            {/* Drag handle distinct */}
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-gray-700 font-medium">{index + 1}.</span>
            <Input
                value={section.title || ""}
                onChange={(e) => onUpdate(index, e.target.value)}
                placeholder={`Section ${index + 1}`}
                onBlur={() => {
                    if (!section.title || section.title.trim() === "") {
                        console.warn("Le titre de la section ne peut pas être vide");
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        if (!section.title || section.title.trim() === "") {
                            e.preventDefault();
                        }
                    }
                }}
            />
            <Button 
                type="button" 
                onClick={() => onRemove(index)} 
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                variant="ghost"
                size="sm"
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
}

export default function SectionManager({ courseId, session, onError }: SectionManagerProps) {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Gestion d'erreur locale
    const [error, setError] = useState<string | null>(null);

    // Capteurs pour le drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fonction de gestion d'erreur locale
    const handleError = (error: any, context: string) => {
        console.error(`Erreur dans ${context}:`, error);
        setError(`Une erreur est survenue dans ${context}. Veuillez réessayer.`);
        if (onError) {
            onError(error);
        }
        setTimeout(() => setError(null), 5000);
    };

    // Fonction de validation des sections
    const validateSections = (sectionsToValidate: any[]): boolean => {
        try {
            if (!Array.isArray(sectionsToValidate)) {
                return false;
            }
            
            return sectionsToValidate.every(section => 
                section && 
                typeof section === 'object' && 
                'title' in section && 
                typeof section.title === 'string'
            );
        } catch (error) {
            console.error("Erreur lors de la validation des sections:", error);
            return false;
        }
    };

    // Charger les sections existantes
    useEffect(() => {
        const fetchSections = async () => {
            if (!courseId) return;
            
            setLoading(true);
            try {
                const res = await fetch(`/api/sections?courseId=${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    console.log("Données reçues de l'API:", data);
                    
                    // Extraire la propriété 'sections' de la réponse
                    if (data && data.sections && Array.isArray(data.sections)) {
                        setSections(data.sections);
                    } else if (Array.isArray(data)) {
                        // Fallback si la réponse est directement un tableau
                        setSections(data);
                    } else {
                        console.error("Les données reçues ne sont pas dans le bon format:", data);
                        setSections([]);
                    }
                } else {
                    console.error("Erreur lors du chargement des sections:", res.status, res.statusText);
                    setSections([]);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des sections :", error);
                setSections([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSections();
    }, [courseId]);

    // Ajouter une nouvelle section (uniquement locale)
    const addSection = () => {
        try {
            if (!Array.isArray(sections)) {
                setSections([]);
            }
            setSections(prev => [...(prev || []), { title: "", order: (prev?.length || 0) + 1 }]);
        } catch (error) {
            console.error("Erreur lors de l'ajout de la section:", error);
            handleError(error, "ajout de section");
        }
    };

    // Modifier une section localement
    const updateSection = (index: number, title: string) => {
        try {
            if (!Array.isArray(sections)) return;
            const updatedSections = [...sections];
            if (updatedSections[index]) {
                updatedSections[index].title = title;
                setSections(updatedSections);
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la section:", error);
            handleError(error, "mise à jour de section");
        }
    };

    // Supprimer une section
    const removeSection = async (index: number) => {
        try {
            if (!Array.isArray(sections)) return;
            
            const sectionToDelete = sections[index];
            if (!sectionToDelete) return;

            if (sectionToDelete._id) {
                try {
                    const res = await fetch(`/api/sections/${sectionToDelete._id}`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    });

                    if (!res.ok) {
                        console.error("Erreur lors de la suppression de la section :", await res.text());
                        return;
                    }
                } catch (error) {
                    console.error("Erreur réseau :", error);
                    return;
                }
            }

            // Mise à jour locale après suppression
            try {
                let updatedSections = sections.filter((_, i) => i !== index);
                updatedSections = updatedSections.map((section, i) => ({ ...section, order: i + 1 }));
                setSections(updatedSections);
            } catch (error) {
                console.error("Erreur lors de la mise à jour de l'état local:", error);
                handleError(error, "mise à jour de l'état local");
            }
        } catch (error) {
            console.error("Erreur lors de la suppression de la section:", error);
            handleError(error, "suppression de section");
        }
    };

    // Sauvegarder les sections dans l'API
    const saveSections = async () => {
        if (!Array.isArray(sections)) {
            handleError(new Error("Sections n'est pas un tableau"), "sauvegarde des sections");
            return;
        }
        
        setSaving(true);
        try {
            const res = await fetch("/api/sections", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ courseId, sections }),
            });

            if (res.ok) {
                try {
                    console.log("Sections enregistrées avec succès !");
                    // Recharger les sections après sauvegarde
                    const data = await res.json();
                    if (data && data.sections && Array.isArray(data.sections)) {
                        setSections(data.sections);
                    }
                } catch (error) {
                    console.error("Erreur lors de l'enregistrement des sections:", error);
                    handleError(error, "enregistrement des sections");
                }
            } else {
                console.error("Erreur lors de l'enregistrement des sections :", await res.text());
                handleError(new Error("Erreur lors de l'enregistrement des sections"), "sauvegarde des sections");
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
            handleError(error, "sauvegarde des sections");
        } finally {
            setSaving(false);
        }
    };

    // Gestion du Drag & Drop
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            try {
                if (!Array.isArray(sections)) {
                    handleError(new Error("Sections n'est pas un tableau"), "drag & drop");
                    return;
                }

                const oldIndex = sections.findIndex(section => (section._id || `temp-${sections.indexOf(section)}`) === active.id);
                const newIndex = sections.findIndex(section => (section._id || `temp-${sections.indexOf(section)}`) === over?.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const reorderedSections = arrayMove(sections, oldIndex, newIndex);
                    
                    // Mettre à jour l'ordre localement
                    const newOrderedSections = reorderedSections.map((section, index) => ({
                        ...section,
                        order: index + 1,
                    }));

                    setSections(newOrderedSections);

                    // Sauvegarder le nouvel ordre des sections
                    try {
                        const res = await fetch("/api/sections", {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${session.accessToken}`,
                            },
                            body: JSON.stringify({ sections: newOrderedSections }),
                        });

                        if (!res.ok) {
                            console.error("Erreur lors de la mise à jour de l'ordre des sections :", await res.text());
                            handleError(new Error("Erreur lors de la mise à jour de l'ordre des sections"), "drag & drop");
                        }
                    } catch (error) {
                        console.error("Erreur réseau :", error);
                        handleError(error, "drag & drop");
                    }
                }
            } catch (error) {
                console.error("Erreur lors du drag & drop:", error);
                handleError(error, "drag & drop");
            }
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold">Sections du cours</h2>

            {loading ? (
                <p className="text-gray-500">Chargement des sections...</p>
            ) : !sections || !Array.isArray(sections) ? (
                <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">
                    <p>Erreur : Les sections ne sont pas chargées correctement.</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                        Recharger la page
                    </button>
                </div>
            ) : sections.length === 0 ? (
                <div className="text-gray-500 p-4 border border-gray-300 rounded bg-gray-50">
                    <p>Aucune section trouvée pour ce cours.</p>
                    <p className="text-sm">Cliquez sur &quot;Ajouter une section&quot; pour commencer.</p>
                </div>
            ) : !validateSections(sections) ? (
                <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">
                    <p>Erreur : Format des sections invalide.</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                        Recharger la page
                    </button>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={sections.map(section => section._id || `temp-${sections.indexOf(section)}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {sections.map((section, index) => (
                                <SortableSection
                                    key={section._id || `temp-${index}`}
                                    section={section}
                                    index={index}
                                    onUpdate={updateSection}
                                    onRemove={removeSection}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <div className="flex gap-2">
                <Button 
                    type="button" 
                    onClick={() => {
                        try {
                            addSection();
                        } catch (error) {
                            handleError(error, "ajout de section");
                        }
                    }} 
                    className="mt-2 flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" /> Ajouter une section
                </Button>

                <Button 
                    type="button" 
                    onClick={() => {
                        try {
                            saveSections();
                        } catch (error) {
                            handleError(error, "sauvegarde des sections");
                        }
                    }} 
                    className="mt-2 flex items-center gap-1" 
                    disabled={saving}
                >
                    {saving ? "Enregistrement..." : "Valider les sections"}
                </Button>
            </div>

            {/* Affichage de l'erreur locale */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setError(null)}
                                className="inline-flex text-red-400 hover:text-red-600"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
