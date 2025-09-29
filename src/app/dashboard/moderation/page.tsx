'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, XCircle, Clock, User, Flag, MessageSquare, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Report {
    _id: string;
    reporter: {
        _id: string;
        name: string;
        username: string;
        email: string;
    };
    reportedContent: {
        type: 'revision' | 'course' | 'forum_answer' | 'forum_question';
        id: string;
    };
    reason: string;
    description: string;
    status: 'en_attente' | 'en_cours' | 'resolu' | 'rejete';
    moderator?: {
        _id: string;
        name: string;
        username: string;
    };
    moderatorNotes?: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    questionId?: string; // ID de la question pour les réponses forum
}

const STATUS_COLORS = {
    en_attente: 'bg-yellow-100 text-yellow-800',
    en_cours: 'bg-blue-100 text-blue-800',
    resolu: 'bg-green-100 text-green-800',
    rejete: 'bg-red-100 text-red-800'
};

const STATUS_LABELS = {
    en_attente: 'En attente',
    en_cours: 'En cours',
    resolu: 'Résolu',
    rejete: 'Rejeté'
};

const REASON_LABELS = {
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

const CONTENT_TYPE_LABELS = {
    revision: 'Fiche de révision',
    course: 'Cours',
    forum_answer: 'Réponse forum',
    forum_question: 'Question forum'
};

export default function ModerationPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [moderatorNotes, setModeratorNotes] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchReports();
    }, [statusFilter, currentPage]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10'
            });
            
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const response = await fetch(`/api/reports?${params}`);
            const data = await response.json();

            if (response.ok) {
                setReports(data.reports);
                setTotalPages(data.pagination.pages);
            } else {
                toast.error('Erreur lors du chargement des signalements');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors du chargement des signalements');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (reportId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/reports/${reportId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    moderatorNotes: moderatorNotes
                }),
            });

            if (response.ok) {
                toast.success('Signalement mis à jour avec succès');
                fetchReports();
                setSelectedReport(null);
                setModeratorNotes('');
            } else {
                const data = await response.json();
                toast.error(data.error || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'en_attente':
                return <Clock className="w-4 h-4" />;
            case 'en_cours':
                return <AlertCircle className="w-4 h-4" />;
            case 'resolu':
                return <CheckCircle className="w-4 h-4" />;
            case 'rejete':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const getContentTypeIcon = (type: string) => {
        switch (type) {
            case 'revision':
                return <Flag className="w-4 h-4" />;
            case 'course':
                return <Flag className="w-4 h-4" />;
            case 'forum_answer':
            case 'forum_question':
                return <MessageSquare className="w-4 h-4" />;
            default:
                return <Flag className="w-4 h-4" />;
        }
    };

    const getContentLink = (type: string, id: string, questionId?: string) => {
        switch (type) {
            case 'revision':
                return `/fiches/${id}`;
            case 'course':
                return `/cours/${id}`;
            case 'forum_question':
                return `/forum/${id}`;
            case 'forum_answer':
                // Pour une réponse, rediriger vers la question associée
                return questionId ? `/forum/${questionId}` : `/forum`;
            default:
                return '#';
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Modération</h1>
                    <p className="text-muted-foreground">
                        Gérez les signalements de contenu
                    </p>
                </div>
            </div>

            <Tabs defaultValue="reports" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="reports">Signalements</TabsTrigger>
                </TabsList>

                <TabsContent value="reports" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filtrer par statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="en_attente">En attente</SelectItem>
                                <SelectItem value="en_cours">En cours</SelectItem>
                                <SelectItem value="resolu">Résolu</SelectItem>
                                <SelectItem value="rejete">Rejeté</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reports.map((report) => (
                                <Card key={report._id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {getContentTypeIcon(report.reportedContent.type)}
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        {CONTENT_TYPE_LABELS[report.reportedContent.type]}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Signalé par {report.reporter.name} (@{report.reporter.username})
                                                    </CardDescription>
                                                    <div className="mt-2">
                                                        <Link 
                                                            href={getContentLink(report.reportedContent.type, report.reportedContent.id, report.questionId)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            Voir le contenu signalé
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={STATUS_COLORS[report.status]}>
                                                    {getStatusIcon(report.status)}
                                                    <span className="ml-1">{STATUS_LABELS[report.status]}</span>
                                                </Badge>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedReport(report);
                                                                setModeratorNotes(report.moderatorNotes || '');
                                                            }}
                                                        >
                                                            Voir détails
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Détails du signalement</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-sm font-medium">Type de contenu</label>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {CONTENT_TYPE_LABELS[report.reportedContent.type]}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium">Motif</label>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {REASON_LABELS[report.reason as keyof typeof REASON_LABELS]}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="text-sm font-medium">Lien vers le contenu</label>
                                                                <div className="mt-1">
                                                                    <Link 
                                                                        href={getContentLink(report.reportedContent.type, report.reportedContent.id, report.questionId)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-3 py-2 rounded-md"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4" />
                                                                        Ouvrir le contenu signalé dans un nouvel onglet
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                            
                                                            <div>
                                                                <label className="text-sm font-medium">Description</label>
                                                                <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                                                                    {report.description}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <label className="text-sm font-medium">Notes du modérateur</label>
                                                                <Textarea
                                                                    value={moderatorNotes}
                                                                    onChange={(e) => setModeratorNotes(e.target.value)}
                                                                    placeholder="Ajoutez vos notes..."
                                                                    className="mt-1"
                                                                />
                                                            </div>

                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => handleStatusUpdate(report._id, 'rejete')}
                                                                >
                                                                    Rejeter
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleStatusUpdate(report._id, 'resolu')}
                                                                >
                                                                    Résoudre
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            {report.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                            <span>Créé le {new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                                            {report.moderator && (
                                                <span>Modéré par {report.moderator.name}</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {reports.length === 0 && (
                                <Card>
                                    <CardContent className="flex items-center justify-center py-8">
                                        <p className="text-muted-foreground">Aucun signalement trouvé</p>
                                    </CardContent>
                                </Card>
                            )}

                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Précédent
                                    </Button>
                                    <span className="flex items-center px-3 text-sm text-muted-foreground">
                                        Page {currentPage} sur {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Suivant
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
