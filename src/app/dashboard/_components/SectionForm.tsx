'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface Section {
    _id?: string;
    title: string;
    order: number;
    courseId: string;
}

interface Course {
    _id: string;
    title: string;
}

interface SectionFormProps {
    section?: Section | null;
    courses: Course[];
    onSuccess: (section: Section) => void;
    onCancel: () => void;
}

export default function SectionForm({ section, courses, onSuccess, onCancel }: SectionFormProps) {
    const [title, setTitle] = useState(section?.title || '');
    const [courseId, setCourseId] = useState(section?.courseId || '');
    const [order, setOrder] = useState(section?.order || 1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (section) {
            setTitle(section.title);
            setCourseId(section.courseId);
            setOrder(section.order);
        }
    }, [section]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title || !courseId) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setIsSubmitting(true);
        try {
            const sectionData = {
                title,
                courseId,
                order: parseInt(order.toString())
            };

            const url = section?._id ? `/api/sections/${section._id}` : '/api/sections';
            const method = section?._id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sectionData),
            });

            if (response.ok) {
                const savedSection = await response.json();
                onSuccess(savedSection);
            } else {
                const error = await response.json();
                alert(error.error || 'Erreur lors de la sauvegarde');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde de la section');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="title">Titre de la section *</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titre de la section..."
                    required
                />
            </div>

            <div>
                <Label htmlFor="courseId">Cours *</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un cours" />
                    </SelectTrigger>
                    <SelectContent>
                        {courses.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
                                {course.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="order">Ordre</Label>
                <Input
                    id="order"
                    type="number"
                    min="1"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value))}
                    placeholder="Ordre de la section..."
                />
            </div>

            <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting || !title || !courseId}>
                    {isSubmitting ? 'Sauvegarde...' : (section ? 'Mettre à jour' : 'Créer')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Annuler
                </Button>
            </div>
        </form>
    );
} 