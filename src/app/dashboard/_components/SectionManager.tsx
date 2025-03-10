"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface Section {
    _id?: string;
    title: string;
    order: number;
}

interface SectionManagerProps {
    courseId: string;
    session: any;
}

export default function SectionManager({ courseId, session }: SectionManagerProps) {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Charger les sections existantes
    useEffect(() => {
        const fetchSections = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/sections?courseId=${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSections(data);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des sections :", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSections();
    }, [courseId]);

    // Ajouter une nouvelle section (uniquement locale)
    const addSection = () => {
        setSections([...sections, { title: "", order: sections.length + 1 }]);
    };

    // Modifier une section localement
    const updateSection = (index: number, title: string) => {
        const updatedSections = [...sections];
        updatedSections[index].title = title;
        setSections(updatedSections);
    };

    // Supprimer une section
    const removeSection = async (index: number) => {
        const sectionToDelete = sections[index];

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
        let updatedSections = sections.filter((_, i) => i !== index);
        updatedSections = updatedSections.map((section, i) => ({ ...section, order: i + 1 }));
        setSections(updatedSections);
    };

    // Sauvegarder les sections dans l'API
    const saveSections = async () => {
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
                console.log("Sections enregistrées avec succès !");
            } else {
                console.error("Erreur lors de l'enregistrement des sections :", await res.text());
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
        } finally {
            setSaving(false);
        }
    };

    // Gestion du Drag & Drop
    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const reorderedSections = Array.from(sections);
        const [movedSection] = reorderedSections.splice(result.source.index, 1);
        reorderedSections.splice(result.destination.index, 0, movedSection);

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
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold">Sections du cours</h2>

            {loading ? (
                <p className="text-gray-500">Chargement des sections...</p>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="sections">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                {sections.map((section, index) => (
                                    <Draggable key={section._id || index} draggableId={String(section._id || index)} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                style={{
                                                    ...provided.draggableProps.style,
                                                    background: snapshot.isDragging ? "#e0e0e0" : "#f3f3f3",
                                                    padding: "8px",
                                                    borderRadius: "4px",
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                {/* Drag handle distinct */}
                                                <div {...provided.dragHandleProps} className="cursor-grab">
                                                    <GripVertical className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <span className="text-gray-700 font-medium">{index + 1}.</span>
                                                <Input
                                                    value={section.title}
                                                    onChange={(e) => updateSection(index, e.target.value)}
                                                    placeholder={`Section ${index + 1}`}
                                                />
                                                <Button type="button" onClick={() => removeSection(index)} className="text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}

            <div className="flex gap-2">
                <Button type="button" onClick={addSection} className="mt-2 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Ajouter une section
                </Button>

                <Button type="button" onClick={saveSections} className="mt-2 flex items-center gap-1" disabled={saving}>
                    {saving ? "Enregistrement..." : "Valider les sections"}
                </Button>
            </div>
        </div>
    );
}
