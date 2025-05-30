"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Calendar, Trophy, Star, Target, Image, Clock, Gift, Sparkles, Users, BookOpen, Shield, AlertTriangle } from 'lucide-react';
import { useSession, signIn } from "next-auth/react";

export default function CreateRewardPage() {
    const { data: session, status } = useSession();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [method, setMethod] = useState('highestPoints');
    const [category, setCategory] = useState('');
    const [prize, setPrize] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const methodOptions = [
        { value: 'highestPoints', label: 'Plus de points gagnés', icon: Star, color: 'text-yellow-500' },
        { value: 'mostRevisions', label: 'Plus de fiches créées', icon: BookOpen, color: 'text-blue-500' },
        { value: 'mostRevisionsInCategory', label: 'Fiches créées dans une catégorie', icon: Target, color: 'text-green-500' }
    ];

    // Vérification si l'utilisateur est admin
    const isAdmin = session?.user?.role === 'Admin' || session?.user?.isAdmin === true;

    // Si pas de session, afficher le bouton de connexion
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="text-gray-600">Chargement...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <Shield className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800">Connexion requise</h3>
                            <p className="text-gray-600">Vous devez être connecté pour accéder à cette page.</p>
                            <Button
                                onClick={() => signIn()}
                                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                            >
                                Se connecter
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Si l'utilisateur n'est pas admin
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-red-800">Accès refusé</h3>
                            <p className="text-gray-600">
                                Cette page est réservée aux administrateurs. Vous n&apos;avez pas les permissions nécessaires pour créer des récompenses.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                <Shield className="w-4 h-4" />
                                <span>Droits administrateur requis</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!title || !startDate || !endDate || !prize) {
            setError('Veuillez remplir les champs obligatoires.');
            return;
        }
        if (new Date(startDate) >= new Date(endDate)) {
            setError('La date de début doit être antérieure à la date de fin.');
            return;
        }
        if (method === 'mostRevisionsInCategory' && !category) {
            setError('Veuillez spécifier une catégorie pour cette méthode.');
            return;
        }

        setLoading(true);

        try {
            // Appel API réel
            const response = await fetch('/api/recompenses', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: session?.accessToken ? `Bearer ${session.accessToken}` : '',
                },
                body: JSON.stringify({
                    title,
                    description,
                    imageUrl: imageUrl || undefined, // Ne pas envoyer une chaîne vide
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                    method,
                    category: method === 'mostRevisionsInCategory' ? category : undefined,
                    prize
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la création');
            }

            setIsSubmitted(true);

            // Reset form après succès
            setTimeout(() => {
                setIsSubmitted(false);
                setTitle('');
                setDescription('');
                setImageUrl('');
                setStartDate('');
                setEndDate('');
                setMethod('highestPoints');
                setCategory('');
                setPrize('');
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    const selectedMethod = methodOptions.find(opt => opt.value === method);
    const SelectedIcon = selectedMethod?.icon || Star;

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md animate-in zoom-in-50 duration-500">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                                <Trophy className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-green-800">Récompense créée !</h3>
                            <p className="text-gray-600">Votre événement récompense a été créé avec succès.</p>
                            <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8 animate-in slide-in-from-top duration-500">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4 shadow-lg">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Créer un événement Récompense
                    </h1>
                    <p className="text-gray-600 mt-2">Motivez votre communauté avec des récompenses attractives</p>

                    {/* Badge administrateur */}
                    <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        <Shield className="w-4 h-4" />
                        <span>Mode Administrateur</span>
                    </div>
                </div>

                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm animate-in slide-in-from-bottom duration-700">
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            Détails de la récompense
                        </CardTitle>
                        <CardDescription>
                            Configurez votre événement pour engager votre communauté
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {error && (
                            <Alert className="mb-6 border-red-200 bg-red-50 animate-in slide-in-from-top duration-300">
                                <AlertDescription className="text-red-800">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-purple-500" />
                                    Titre *
                                </Label>
                                <Input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                                    placeholder="Nom de votre événement récompense"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-500" />
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="resize-none transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                                    rows={3}
                                    placeholder="Décrivez votre événement récompense..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="imageUrl" className="text-sm font-medium flex items-center gap-2">
                                    <Image className="w-4 h-4 text-green-500" />
                                    Image URL
                                </Label>
                                <Input
                                    id="imageUrl"
                                    type="url"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                                    placeholder="https://exemple.com/image.jpg"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate" className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-orange-500" />
                                        Date de début *
                                    </Label>
                                    <Input
                                        id="startDate"
                                        type="datetime-local"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate" className="text-sm font-medium flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-red-500" />
                                        Date de fin *
                                    </Label>
                                    <Input
                                        id="endDate"
                                        type="datetime-local"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <SelectedIcon className={`w-4 h-4 ${selectedMethod?.color}`} />
                                    Méthode de récompense *
                                </Label>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger className="transition-all duration-200 hover:shadow-md">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {methodOptions.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <SelectItem key={option.value} value={option.value}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`w-4 h-4 ${option.color}`} />
                                                        {option.label}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {method === 'mostRevisionsInCategory' && (
                                <div className="space-y-2 animate-in slide-in-from-top duration-300">
                                    <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
                                        <Target className="w-4 h-4 text-green-500" />
                                        Catégorie *
                                    </Label>
                                    <Input
                                        id="category"
                                        type="text"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                                        placeholder="Nom de la catégorie"
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="prize" className="text-sm font-medium flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                    Prix *
                                </Label>
                                <Input
                                    id="prize"
                                    type="text"
                                    value={prize}
                                    onChange={e => setPrize(e.target.value)}
                                    className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                                    placeholder="Description du prix à gagner"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed h-12"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Création en cours...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Créer la récompense
                                    </div>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}