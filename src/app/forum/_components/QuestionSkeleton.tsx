import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const QuestionSkeleton = () => {
    return (
        <div className="w-full max-w-5xl p-6 bg-white shadow-md rounded-lg">
            {/* Header (Avatar, Nom, Date) */}
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex flex-col space-y-2">
                    <Skeleton className="w-32 h-4 rounded-md" />
                    <Skeleton className="w-20 h-3 rounded-md" />
                </div>
            </div>

            {/* Titre de la question */}
            <Skeleton className="w-3/4 h-6 mt-4 rounded-md" />

            {/* Contenu de la question */}
            <Skeleton className="w-full h-16 mt-4 rounded-md" />
            <Skeleton className="w-2/3 h-4 mt-2 rounded-md" />

            {/* Bouton "Répondre" */}
            <Skeleton className="w-24 h-10 mt-6 rounded-md" />
        </div>
    );
};

const AnswerSkeleton = () => {
    return (
        <div className="w-full max-w-5xl mt-6">
            <h3 className="text-xl font-semibold">Réponses (chargement...)</h3>
            {[...Array(3)].map((_, index) => (
                <div key={index} className="mt-4 p-4 bg-gray-50 rounded-md shadow">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="w-32 h-4 rounded-md" />
                    </div>
                    <Skeleton className="w-full h-12 mt-2 rounded-md" />
                    <Skeleton className="w-2/3 h-4 mt-2 rounded-md" />
                </div>
            ))}
        </div>
    );
};

export { QuestionSkeleton, AnswerSkeleton };
