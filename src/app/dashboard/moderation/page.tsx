'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, XCircle, Clock, Flag, MessageSquare, ExternalLink, Shield, Trash2, Search, Filter, AlertTriangle, FileText, BookOpen, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import '../styles/dashboard-theme.css';
import ProfileAvatar from '@/components/ui/profile';

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
    questionId?: string;
}

interface ModerationStats {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
}

const STATUS_COLORS = {
    en_attente: 'bg-amber-100 text-amber-800 border-amber-200',
    en_cours: 'bg-blue-100 text-blue-800 border-blue-200',
    resolu: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejete: 'bg-red-100 text-red-800 border-red-200'
};

const STATUS_LABELS = {
    en_attente: 'En attente',
    en_cours: 'En cours',
    resolu: 'Résolu',
    rejete: 'Rejeté'
};

const REASON_LABELS: Record<string, string> = {
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

const CONTENT_TYPE_LABELS: Record<string, string> = {
    revision: 'Fiche de révision',
    course: 'Cours',
    forum_answer: 'Réponse forum',
    forum_question: 'Question forum'
};

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
    revision: <FileText className="w-4 h-4" />,
    course: <BookOpen className="w-4 h-4" />,
    forum_answer: <MessageSquare className="w-4 h-4" />,
    forum_question: <MessageSquare className="w-4 h-4" />
};

export default function ModerationPage() {
    const { data: session } = useSession();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [moderatorNotes, setModeratorNotes] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [reasonFilter, setReasonFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState<ModerationStats | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const isAdmin = session?.user?.role === 'Admin';
    const isModerator = session?.user?.role === 'Modérateur' || isAdmin;

    // Fetch reports with filters
    const fetchReports = useCallback(async () => {
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
                let filteredReports = data.reports;
                
                // Apply type filter client-side
                if (typeFilter !== 'all') {
                    filteredReports = filteredReports.filter(
                        (r: Report) => r.reportedContent.type === typeFilter
                    );
                }
                
                // Apply reason filter client-side
                if (reasonFilter !== 'all') {
                    filteredReports = filteredReports.filter(
                        (r: Report) => r.reason === reasonFilter
                    );
                }
                
                // Apply search filter
                if (searchQuery.trim()) {
                    const query = searchQuery.toLowerCase();
                    filteredReports = filteredReports.filter(
                        (r: Report) => 
                            r.description.toLowerCase().includes(query) ||
                            r.reporter.username.toLowerCase().includes(query) ||
                            REASON_LABELS[r.reason]?.toLowerCase().includes(query)
                    );
                }
                
                // Apply sorting
                filteredReports.sort((a: Report, b: Report) => {
                    switch (sortBy) {
                        case 'newest':
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        case 'oldest':
                            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                        case 'updated':
                            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                        default:
                            return 0;
                    }
                });
                
                setReports(filteredReports);
                setTotalPages(data.pagination.pages);
                
                // Calculate stats
                const allReports = data.reports;
                setStats({
                    total: allReports.length,
                    pending: allReports.filter((r: Report) => r.status === 'en_attente').length,
                    inProgress: allReports.filter((r: Report) => r.status === 'en_cours').length,
                    resolved: allReports.filter((r: Report) => r.status === 'resolu').length,
                    rejected: allReports.filter((r: Report) => r.status === 'rejete').length
                });
            } else {
                toast.error('Erreur lors du chargement des signalements');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors du chargement des signalements');
        } finally {
            setLoading(false);
        }
    }, [currentPage, statusFilter, typeFilter, reasonFilter, sortBy, searchQuery]);

    useEffect(() => {
        if (session?.accessToken) {
            fetchReports();
        }
    }, [fetchReports, session]);

    const handleStatusUpdate = async (reportId: string, newStatus: string) => {
        try {
            setActionLoading(true);
            const response = await fetch(`/api/reports/${reportId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    moderatorNotes: moderatorNotes
                }),
            });

            if (response.ok) {
                toast.success(`Signalement ${newStatus === 'resolu' ? 'résolu' : newStatus === 'rejete' ? 'rejeté' : 'mis à jour'} avec succès`);
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
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteContent = async () => {
        if (!reportToDelete) return;
        
        try {
            setActionLoading(true);
            const { type, id } = reportToDelete.reportedContent;
            
            // Determine API endpoint based on content type
            let endpoint = '';
            switch (type) {
                case 'revision':
                    endpoint = `/api/fiches/${id}`;
                    break;
                case 'forum_question':
                    endpoint = `/api/forum/questions/${id}`;
                    break;
                case 'forum_answer':
                    endpoint = `/api/forum/answers/${id}`;
                    break;
                default:
                    toast.error('Type de contenu non supporté pour la suppression');
                    return;
            }
            
            if (!endpoint) {
                toast.error('Impossible de supprimer ce type de contenu');
                return;
            }
            
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`
                }
            });
            
            if (response.ok) {
                toast.success('Contenu supprimé avec succès');
                // Also resolve the report
                await handleStatusUpdate(reportToDelete._id, 'resolu');
                setDeleteDialogOpen(false);
                setReportToDelete(null);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la suppression du contenu');
        } finally {
            setActionLoading(false);
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
                return questionId ? `/forum/${questionId}` : `/forum`;
            default:
                return '#';
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

    const openDeleteDialog = (report: Report) => {
        setReportToDelete(report);
        setDeleteDialogOpen(true);
    };

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, typeFilter, reasonFilter, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="dash-main-header">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="dash-main-title mb-0">Modération</h1>
                        <p className="dash-main-subtitle">
                            Gérez les signalements de contenu et modérez la plateforme
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="dash-stat-grid">
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon warning">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{stats.pending}</div>
                            <div className="dash-stat-label">En attente</div>
                        </div>
                    </div>
                    
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon info">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{stats.inProgress}</div>
                            <div className="dash-stat-label">En cours</div>
                        </div>
                    </div>
                    
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon success">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{stats.resolved}</div>
                            <div className="dash-stat-label">Résolus</div>
                        </div>
                    </div>
                    
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon primary">
                            <Flag className="w-6 h-6" />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{stats.total}</div>
                            <div className="dash-stat-label">Total</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="dash-card">
                <div className="dash-card-header">
                    <h3 className="dash-card-title flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filtres et recherche
                    </h3>
                </div>
                <div className="dash-card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 dash-input"
                            />
                        </div>
                        
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="dash-input">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="en_attente">En attente</SelectItem>
                                <SelectItem value="en_cours">En cours</SelectItem>
                                <SelectItem value="resolu">Résolu</SelectItem>
                                <SelectItem value="rejete">Rejeté</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="dash-input">
                                <SelectValue placeholder="Type de contenu" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les types</SelectItem>
                                <SelectItem value="revision">Fiche de révision</SelectItem>
                                <SelectItem value="course">Cours</SelectItem>
                                <SelectItem value="forum_question">Question forum</SelectItem>
                                <SelectItem value="forum_answer">Réponse forum</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Select value={reasonFilter} onValueChange={setReasonFilter}>
                            <SelectTrigger className="dash-input">
                                <SelectValue placeholder="Motif" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les motifs</SelectItem>
                                {Object.entries(REASON_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="dash-input">
                                <SelectValue placeholder="Trier par" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Plus récent</SelectItem>
                                <SelectItem value="oldest">Plus ancien</SelectItem>
                                <SelectItem value="updated">Dernière mise à jour</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Reports Table */}
            <div className="dash-card">
                <div className="dash-card-header">
                    <h3 className="dash-card-title">Signalements</h3>
                    <span className="text-sm text-gray-500">
                        {reports.length} résultat{reports.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div className="dash-card-body p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f97316]"></div>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="dash-empty py-12">
                            <div className="dash-empty-icon">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h3 className="dash-empty-title">Aucun signalement</h3>
                            <p className="dash-empty-text">
                                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || reasonFilter !== 'all'
                                    ? 'Aucun résultat ne correspond à vos filtres.'
                                    : 'Il n\'y a actuellement aucun signalement à traiter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Motif</th>
                                        <th>Signalé par</th>
                                        <th>Date</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => (
                                        <tr key={report._id} className="group">
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">
                                                        {CONTENT_TYPE_ICONS[report.reportedContent.type]}
                                                    </span>
                                                    <span className="text-sm font-medium">
                                                        {CONTENT_TYPE_LABELS[report.reportedContent.type]}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-sm text-gray-600">
                                                    {REASON_LABELS[report.reason] || report.reason}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <ProfileAvatar 
                                                        username={report.reporter.username}
                                                        userId={report.reporter._id}
                                                        size="small"
                                                        showPoints={false}
                                                    />
                                                    <span className="text-sm">@{report.reporter.username}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                                                </span>
                                            </td>
                                            <td>
                                                <Badge className={`${STATUS_COLORS[report.status]} text-xs`}>
                                                    {getStatusIcon(report.status)}
                                                    <span className="ml-1">{STATUS_LABELS[report.status]}</span>
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={getContentLink(
                                                            report.reportedContent.type, 
                                                            report.reportedContent.id, 
                                                            report.questionId
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                className="h-8 px-3 text-[#f97316] hover:text-[#ea580c] hover:bg-orange-50"
                                                                onClick={() => {
                                                                    setSelectedReport(report);
                                                                    setModeratorNotes(report.moderatorNotes || '');
                                                                }}
                                                            >
                                                                Voir
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl">
                                                            <DialogHeader>
                                                                <DialogTitle className="flex items-center gap-2">
                                                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                                                    Détails du signalement
                                                                </DialogTitle>
                                                            </DialogHeader>
                                                            
                                                            <div className="space-y-6">
                                                                {/* Content Info */}
                                                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                                                    <div>
                                                                        <label className="text-xs font-medium text-gray-500 uppercase">Type de contenu</label>
                                                                        <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                                                                            {CONTENT_TYPE_ICONS[report.reportedContent.type]}
                                                                            {CONTENT_TYPE_LABELS[report.reportedContent.type]}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-medium text-gray-500 uppercase">Motif</label>
                                                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                                                            {REASON_LABELS[report.reason] || report.reason}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Link to content */}
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Lien vers le contenu</label>
                                                                    <Link 
                                                                        href={getContentLink(
                                                                            report.reportedContent.type, 
                                                                            report.reportedContent.id, 
                                                                            report.questionId
                                                                        )}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-2 text-sm text-[#f97316] hover:text-[#ea580c] bg-orange-50 px-4 py-2 rounded-lg hover:bg-orange-100 transition-colors"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4" />
                                                                        Ouvrir le contenu signalé
                                                                    </Link>
                                                                </div>
                                                                
                                                                {/* Description */}
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Description du signalement</label>
                                                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                                            {report.description}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Reporter Info */}
                                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                                    <ProfileAvatar 
                                                                        username={report.reporter.username}
                                                                        userId={report.reporter._id}
                                                                        size="small"
                                                                        showPoints={false}
                                                                    />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            Signalé par {report.reporter.name} (@{report.reporter.username})
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            Le {new Date(report.createdAt).toLocaleString('fr-FR')}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Moderator Notes */}
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                                        Notes du modérateur
                                                                    </label>
                                                                    <Textarea
                                                                        value={moderatorNotes}
                                                                        onChange={(e) => setModeratorNotes(e.target.value)}
                                                                        placeholder="Ajoutez vos notes sur ce signalement..."
                                                                        className="min-h-[100px]"
                                                                    />
                                                                </div>

                                                                {/* Actions */}
                                                                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                                                                    {report.status !== 'rejete' && (
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => handleStatusUpdate(report._id, 'rejete')}
                                                                            disabled={actionLoading}
                                                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                                                        >
                                                                            <XCircle className="w-4 h-4 mr-2" />
                                                                            Rejeter
                                                                        </Button>
                                                                    )}
                                                                    
                                                                    {/* Bouton suppression uniquement pour les signalements actifs (en_attente ou en_cours) et uniquement si le contenu est signalé */}
                                                                    {report.reportedContent.type !== 'course' && 
                                                                     (report.status === 'en_attente' || report.status === 'en_cours') && (
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => openDeleteDialog(report)}
                                                                            disabled={actionLoading}
                                                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                                                        >
                                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                                            Supprimer le contenu
                                                                        </Button>
                                                                    )}
                                                                    
                                                                    <div className="flex-1"></div>
                                                                    
                                                                    {report.status !== 'en_cours' && report.status !== 'resolu' && (
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => handleStatusUpdate(report._id, 'en_cours')}
                                                                            disabled={actionLoading}
                                                                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                                        >
                                                                            <AlertCircle className="w-4 h-4 mr-2" />
                                                                            En cours
                                                                        </Button>
                                                                    )}
                                                                    
                                                                    {report.status !== 'resolu' && (
                                                                        <Button
                                                                            onClick={() => handleStatusUpdate(report._id, 'resolu')}
                                                                            disabled={actionLoading}
                                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                        >
                                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                                            Résoudre
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {!loading && reports.length > 0 && totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                Précédent
                            </Button>
                            <span className="text-sm text-gray-500">
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
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Confirmer la suppression
                        </DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce contenu ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {reportToDelete && (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-sm text-red-800">
                                <strong>Type :</strong> {CONTENT_TYPE_LABELS[reportToDelete.reportedContent.type]}
                            </p>
                            <p className="text-sm text-red-800 mt-1">
                                <strong>Motif du signalement :</strong> {REASON_LABELS[reportToDelete.reason]}
                            </p>
                        </div>
                    )}
                    
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteContent}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Suppression...' : 'Supprimer définitivement'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
