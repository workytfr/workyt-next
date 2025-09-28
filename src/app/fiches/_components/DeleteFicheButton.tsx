"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TrashIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteFicheButtonProps {
    ficheId: string;
    ficheTitle: string;
    isCreator: boolean;
    isAdmin: boolean;
}

export default function DeleteFicheButton({ 
    ficheId, 
    ficheTitle, 
    isCreator, 
    isAdmin 
}: DeleteFicheButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        
        try {
            const response = await fetch(`/api/fiches/${ficheId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Rediriger vers la page des fiches après suppression
                router.push('/fiches');
                router.refresh();
            } else {
                throw new Error(data.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la fiche:', error);
            alert('Erreur lors de la suppression de la fiche. Veuillez réessayer.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Ne pas afficher le bouton si l'utilisateur n'a pas les permissions
    if (!isCreator && !isAdmin) {
        return null;
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={isDeleting}
                    className="flex items-center gap-2"
                >
                    <TrashIcon className="h-4 w-4" />
                    {isDeleting ? "Suppression..." : "Supprimer"}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        Supprimer la fiche
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer la fiche <strong>&ldquo;{ficheTitle}&rdquo;</strong> ?
                        <br />
                        <br />
                        <span className="text-red-600 font-medium">
                            Cette action est irréversible et supprimera :
                        </span>
                        <ul className="list-disc list-inside mt-2 text-sm">
                            <li>La fiche et tout son contenu</li>
                            <li>Tous les fichiers attachés du cloud storage</li>
                            <li>Tous les commentaires associés</li>
                            <li>Vos points seront réduits de 10 points</li>
                        </ul>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
