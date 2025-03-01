"use client";

import { Button } from "@/components/ui/button";

interface IExercise {
    _id: string;
    sectionId: string;
    title: string;
    content: string;
    correction: {
        text: string;
        image?: string | null;
    };
    difficulty: string;
    image?: string;
}

interface ExerciseDetailProps {
    exercise: IExercise;
    onClose: () => void;
}

export default function ExerciseDetail({ exercise, onClose }: ExerciseDetailProps) {
    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-4">{exercise.title}</h2>
            <div className="mb-6">
                <p className="text-lg">{exercise.content}</p>
            </div>
            {exercise.image && (
                <div className="mb-6">
                    <img src={exercise.image} alt="Illustration de l'exercice" className="w-full object-contain" />
                </div>
            )}
            <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">Correction</h3>
                <p className="mb-4">{exercise.correction.text}</p>
                {exercise.correction.image && (
                    <img src={exercise.correction.image} alt="Illustration de la correction" className="w-full object-contain" />
                )}
            </div>
            <div className="flex justify-end">
                <Button onClick={onClose}>Fermer</Button>
            </div>
        </div>
    );
}
