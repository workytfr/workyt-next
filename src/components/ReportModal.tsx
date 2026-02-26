'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { AlertCircle, Flag } from 'lucide-react';
import { toast } from 'sonner';

interface ReportModalProps {
    contentId: string;
    contentType: 'revision' | 'course' | 'forum_answer' | 'forum_question';
    questionId?: string; // ID de la question parente (pour les réponses forum)
    trigger?: React.ReactNode;
}

const REPORT_REASONS = {
    erreur_contenu: 'Erreur de contenu',
    langage_inapproprie: 'Langage inapproprié',
    contenu_incomprehensible: 'Contenu incompréhensible',
    contenu_illisible: 'Contenu illisible',
    spam: 'Spam',
    harcelement: 'Harcèlement',
    contenu_offensant: 'Contenu offensant',
    violation_droits: 'Violation des droits d\'auteur',
    autre: 'Autre'
};

export default function ReportModal({ contentId, contentType, questionId, trigger }: ReportModalProps) {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<string>('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ne pas afficher le modal si l'utilisateur n'est pas connecté
    if (!session) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!session) {
            toast.error('Vous devez être connecté pour signaler du contenu');
            return;
        }
        
        if (!reason || !description.trim()) {
            toast.error('Veuillez sélectionner un motif et fournir une description');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reportedContent: {
                        type: contentType,
                        id: contentId
                    },
                    reason,
                    description: description.trim(),
                    questionId: contentType === 'forum_answer' ? questionId : undefined
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Signalement envoyé avec succès');
                setOpen(false);
                setReason('');
                setDescription('');
            } else {
                toast.error(data.error || 'Erreur lors de l\'envoi du signalement');
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du signalement:', error);
            toast.error('Erreur lors de l\'envoi du signalement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const defaultTrigger = (
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Flag className="w-4 h-4 mr-2" />
            Signaler
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Signaler du contenu
                    </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Motif du signalement *
                        </label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un motif" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(REPORT_REASONS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Description détaillée *
                        </label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Décrivez le problème rencontré..."
                            className="min-h-[100px]"
                            maxLength={1000}
                        />
                        <p className="text-xs text-muted-foreground">
                            {description.length}/1000 caractères
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !reason || !description.trim()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? 'Envoi...' : 'Envoyer le signalement'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
