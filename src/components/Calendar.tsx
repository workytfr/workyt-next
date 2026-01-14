"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Calendar as CalendarIcon, Gift, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
} from '@/components/ui/UseToast';

interface CalendarDay {
  date: string;
  reward: { 
    type: 'points' | 'gems' | 'chest'; 
    amount?: number;
    chestType?: 'common' | 'rare';
  };
  theme: string;
  isSpecial: boolean;
  specialName?: string;
  description?: string;
  claimed: boolean;
}

const Calendar: React.FC = () => {
  const { data: session } = useSession();
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  
  // Gestion du Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastDescription, setToastDescription] = useState('');
  const [toastVariant, setToastVariant] = useState<'default' | 'destructive'>('default');

  const showToast = ({ title, description, variant }: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
    setToastMessage(title);
    setToastDescription(description || '');
    setToastVariant(variant || 'default');
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 4000);
  };

  // Calculer le mois actuel
  const currentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0);
    
    return { year, month, firstDay, lastDay };
  }, []);

  const loadCalendar = useCallback(async () => {
    try {
      setLoading(true);
      // Formater les dates en local pour éviter les problèmes de fuseau horaire
      const formatDateLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startStr = formatDateLocal(currentMonth.firstDay);
      const endStr = formatDateLocal(currentMonth.lastDay);
      
      const response = await fetch(`/api/calendar/data?startDate=${startStr}&endDate=${endStr}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      
      const data = await response.json();
      setDays(data.days.map((day: any) => {
        // Convertir la date reçue en format local
        const dateObj = new Date(day.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dayStr = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;
        
        return {
          ...day,
          date: dateStr
        };
      }));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    if (session) {
      loadCalendar();
    }
  }, [session, loadCalendar]);

  const claimReward = async (date: string) => {
    if (!session) {
      showToast({ 
        title: 'Connexion requise', 
        description: 'Vous devez être connecté pour réclamer une récompense',
        variant: 'destructive'
      });
      return;
    }

    // Vérifier que c'est bien aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const claimDate = new Date(date);
    claimDate.setHours(0, 0, 0, 0);
    
    if (claimDate.getTime() !== today.getTime()) {
      showToast({ 
        title: 'Date invalide', 
        description: 'Vous ne pouvez réclamer que la récompense du jour même',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setClaiming(date);
      const response = await fetch('/api/calendar/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });

      if (!response.ok) {
        const error = await response.json();
        showToast({ 
          title: 'Erreur', 
          description: error.error || 'Erreur lors de la réclamation',
          variant: 'destructive'
        });
        return;
      }

      const result = await response.json();
      let rewardText = '';
      
      if (result.rewardType === 'chest') {
        const chestTypeName = result.chestType === 'rare' ? 'rare' : 'commun';
        if (result.chestReward) {
          if (result.chestReward.rewardType === 'gems') {
            rewardText = `${result.chestReward.amount} diamant${result.chestReward.amount > 1 ? 's' : ''} du coffre ${chestTypeName}`;
          } else if (result.chestReward.rewardType === 'points') {
            rewardText = `${result.chestReward.amount} point${result.chestReward.amount > 1 ? 's' : ''} du coffre ${chestTypeName}`;
          } else {
            rewardText = `un cosmétique du coffre ${chestTypeName}`;
          }
        } else {
          rewardText = `un coffre ${chestTypeName}`;
        }
      } else if (result.rewardType === 'gems') {
        rewardText = `${result.amount} diamant${result.amount > 1 ? 's' : ''}`;
      } else {
        rewardText = `${result.amount} point${result.amount > 1 ? 's' : ''}`;
      }
      
      showToast({ 
        title: 'Récompense réclamée ! 🎉', 
        description: `Vous avez gagné ${rewardText}`
      });
      
      // Recharger le calendrier
      await loadCalendar();
    } catch (error) {
      console.error('Erreur:', error);
      showToast({ 
        title: 'Erreur', 
        description: 'Une erreur est survenue lors de la réclamation',
        variant: 'destructive'
      });
    } finally {
      setClaiming(null);
    }
  };

  const getThemeDecoration = (theme: string, isSpecial: boolean) => {
    const decorations: Record<string, { 
      emoji: string; 
      bgColor: string; 
      borderColor: string;
      gradient?: string;
      animation?: string;
    }> = {
      christmas: { 
        emoji: '🎄', 
        bgColor: 'bg-gradient-to-br from-red-50 to-green-50 dark:from-red-950 dark:to-green-950', 
        borderColor: 'border-red-400 dark:border-red-600',
        gradient: 'bg-gradient-to-br from-red-100 to-green-100',
        animation: 'animate-pulse'
      },
      newyear: { 
        emoji: '🎆', 
        bgColor: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950', 
        borderColor: 'border-blue-400 dark:border-blue-600',
        animation: 'animate-bounce'
      },
      chinese_newyear: { 
        emoji: '🐉', 
        bgColor: 'bg-gradient-to-br from-yellow-50 to-red-50 dark:from-yellow-950 dark:to-red-950', 
        borderColor: 'border-yellow-400 dark:border-yellow-600',
        animation: 'animate-pulse'
      },
      eastern: { 
        emoji: '🏜️', 
        bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950', 
        borderColor: 'border-orange-400 dark:border-orange-600'
      },
      indian: { 
        emoji: '🪔', 
        bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950', 
        borderColor: 'border-purple-400 dark:border-purple-600',
        animation: 'animate-pulse'
      },
      japanese: { 
        emoji: '🌸', 
        bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950', 
        borderColor: 'border-pink-400 dark:border-pink-600'
      },
      canadian: { 
        emoji: '🍁', 
        bgColor: 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950', 
        borderColor: 'border-red-400 dark:border-red-600'
      },
      french_civil: { 
        emoji: '🇫🇷', 
        bgColor: 'bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-800', 
        borderColor: 'border-blue-400 dark:border-blue-600'
      },
      french_cultural: { 
        emoji: '🎭', 
        bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950', 
        borderColor: 'border-indigo-400 dark:border-indigo-600'
      },
      default: { 
        emoji: '📅', 
        bgColor: 'bg-gray-50 dark:bg-gray-900', 
        borderColor: 'border-gray-300 dark:border-gray-700'
      }
    };

    return decorations[theme] || decorations.default;
  };

  const getDayNumber = (dateStr: string) => {
    return new Date(dateStr).getDate();
  };

  // Créer un tableau de tous les jours du mois avec des cellules vides pour le début
  const calendarDays = useMemo(() => {
    // Convertir getDay() pour que lundi = 0, mardi = 1, ..., dimanche = 6
    // getDay() retourne: 0 = dimanche, 1 = lundi, 2 = mardi, ..., 6 = samedi
    // On veut: 0 = lundi, 1 = mardi, ..., 6 = dimanche
    const firstDayOfWeekRaw = currentMonth.firstDay.getDay();
    const firstDayOfWeek = firstDayOfWeekRaw === 0 ? 6 : firstDayOfWeekRaw - 1;
    
    const daysInMonth = currentMonth.lastDay.getDate();
    const daysArray: (CalendarDay | null)[] = [];
    
    // Ajouter des cellules vides pour les jours avant le 1er du mois (pour commencer le lundi)
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push(null);
    }
    
    // Ajouter tous les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      // Créer la date en heure locale pour éviter les problèmes de fuseau horaire
      const date = new Date(currentMonth.year, currentMonth.month, day);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      const dayData = days.find(d => d.date === dateStr);
      
      if (dayData) {
        daysArray.push(dayData);
      } else {
        // Créer un jour par défaut si non trouvé
        daysArray.push({
          date: dateStr,
          reward: { type: 'points', amount: 3 },
          theme: 'default',
          isSpecial: false,
          claimed: false
        });
      }
    }
    
    return daysArray;
  }, [days, currentMonth]);

  const isToday = (dateStr: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    return today.toDateString() === date.toDateString();
  };

  const isPast = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isFuture = (dateStr: string) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const date = new Date(dateStr);
    date.setHours(23, 59, 59, 999);
    return date > today;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Noms des mois en français
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <ToastProvider>
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
        <CardHeader className="bg-white/10 dark:bg-black/10 backdrop-blur-md border-b border-white/20">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 dark:bg-white/10 backdrop-blur-sm">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Calendrier Mensuel
              </h2>
              <p className="text-sm text-muted-foreground font-normal">
                {monthNames[currentMonth.month]} {currentMonth.year}
              </p>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-br from-white/40 to-white/20 dark:from-black/40 dark:to-black/20 backdrop-blur-lg">
        {/* En-têtes des jours de la semaine - Commence par lundi */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, idx) => (
            <div
              key={idx}
              className="text-center text-sm font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square rounded-xl bg-transparent"
                />
              );
            }

            const decoration = getThemeDecoration(day.theme, day.isSpecial);
            const dayNumber = getDayNumber(day.date);
            const today = isToday(day.date);
            const past = isPast(day.date);
            const future = isFuture(day.date);
            const canClaim = session && !day.claimed && today && !future;

            return (
              <div
                key={day.date}
                className={cn(
                  "relative aspect-square rounded-xl transition-all overflow-hidden",
                  "backdrop-blur-md border border-white/30 dark:border-white/10",
                  "bg-white/40 dark:bg-black/40",
                  "shadow-lg hover:shadow-xl",
                  "hover:scale-105 hover:z-10",
                  day.claimed && "opacity-70",
                  today && "ring-2 ring-purple-500 ring-offset-2 dark:ring-purple-400",
                  day.isSpecial && "ring-2 ring-yellow-400 dark:ring-yellow-500",
                  future && "opacity-50"
                )}
                style={{
                  background: day.isSpecial 
                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2))'
                    : today
                    ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))'
                    : 'rgba(255, 255, 255, 0.4)'
                }}
              >
                {/* Effet de brillance glassmorphism */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                
                {/* Numéro du jour */}
                <div className={cn(
                  "absolute top-2 z-10",
                  day.claimed ? "left-8" : "left-2"
                )}>
                  <div className={cn(
                    "text-lg font-bold",
                    today && "text-purple-600 dark:text-purple-400",
                    day.isSpecial && "text-yellow-600 dark:text-yellow-400"
                  )}>
                    {dayNumber}
                  </div>
                </div>

                {/* Badge spécial */}
                {day.isSpecial && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="text-lg animate-pulse">⭐</div>
                  </div>
                )}

                {/* Badge réclamé */}
                {day.claimed && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      ✓
                    </div>
                  </div>
                )}

                {/* Contenu central */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  {/* Décoration thématique */}
                  <div className={cn(
                    "text-3xl mb-1 relative",
                    decoration.animation
                  )}>
                    {decoration.emoji}
                  </div>
                  
                  {/* Récompense */}
                  <div className="text-center">
                    {day.reward.type === 'chest' ? (
                      <div className="flex items-center justify-center gap-1">
                        <Image 
                          src={`/coffre/${day.reward.chestType || 'common'}_f.png`}
                          alt={`Coffre ${day.reward.chestType || 'commun'}`}
                          width={20} 
                          height={20} 
                          className="object-contain"
                        />
                        <span className="text-[10px] font-semibold capitalize">
                          {day.reward.chestType === 'rare' ? 'Rare' : 'Commun'}
                        </span>
                      </div>
                    ) : day.reward.type === 'gems' ? (
                      <div className="flex items-center justify-center gap-1">
                        <Image 
                          src="/badge/diamond.png" 
                          alt="Diamants" 
                          width={14} 
                          height={14} 
                          className="object-contain"
                        />
                        <span className="text-xs font-semibold">{day.reward.amount}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <Image 
                          src="/badge/points.png" 
                          alt="Points" 
                          width={14} 
                          height={14} 
                          className="object-contain"
                        />
                        <span className="text-xs font-semibold">{day.reward.amount}</span>
                      </div>
                    )}
                  </div>

                  {/* Nom spécial */}
                  {day.isSpecial && day.specialName && (
                    <div className="text-[10px] font-semibold mt-1 text-center px-1 line-clamp-1">
                      {day.specialName}
                    </div>
                  )}

                  {/* Bouton de réclamation */}
                  {canClaim && (
                    <Button
                      size="sm"
                      className="w-full mt-2 h-6 text-[10px] px-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0"
                      onClick={() => claimReward(day.date)}
                      disabled={claiming === day.date}
                    >
                      {claiming === day.date ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Gift className="h-3 w-3 mr-1" />
                          Réclamer
                        </>
                      )}
                    </Button>
                  )}

                  {/* Indicateur jour passé */}
                  {past && !day.claimed && (
                    <div className="text-[10px] text-center text-muted-foreground mt-1">
                      Raté
                    </div>
                  )}

                  {/* Indicateur futur */}
                  {future && (
                    <div className="text-[10px] text-center text-muted-foreground mt-1">
                      Bientôt
                    </div>
                  )}

                  {/* Message si non connecté */}
                  {!session && today && !day.claimed && (
                    <div className="text-[10px] text-center text-muted-foreground mt-1">
                      Connectez-vous
                    </div>
                  )}
                </div>

                {/* Effets spéciaux pour Noël */}
                {day.theme === 'christmas' && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1 left-1/4 text-[10px] animate-bounce">❄️</div>
                    <div className="absolute top-1 right-1/4 text-[10px] animate-bounce" style={{ animationDelay: '0.5s' }}>❄️</div>
                    <div className="absolute bottom-1 left-1/3 text-[10px] animate-bounce" style={{ animationDelay: '1s' }}>✨</div>
                  </div>
                )}
                
                {/* Effets pour Nouvel An chinois */}
                {day.theme === 'chinese_newyear' && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1 left-1/4 text-[10px]">🏮</div>
                    <div className="absolute top-1 right-1/4 text-[10px]">🏮</div>
                    <div className="absolute bottom-1 left-1/2 text-[10px] animate-pulse">🐲</div>
                  </div>
                )}
                
                {/* Effets pour Fête orientale */}
                {day.theme === 'eastern' && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1 left-1/4 text-[10px]">🏜️</div>
                    <div className="absolute bottom-1 right-1/4 text-[10px]">🐪</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {calendarDays.filter(d => d !== null).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucun jour disponible dans cette période
          </div>
        )}
      </CardContent>
    </Card>
    
    {/* Toast pour les notifications */}
    <ToastViewport>
      <Toast 
        open={toastOpen} 
        onOpenChange={setToastOpen}
        variant={toastVariant}
        className="bg-white/90 backdrop-blur-xl border border-white/30 shadow-xl"
      >
        <ToastTitle className={toastVariant === 'destructive' ? 'text-red-600' : 'text-gray-900'}>
          {toastMessage}
        </ToastTitle>
        {toastDescription && (
          <ToastDescription className="text-gray-600">
            {toastDescription}
          </ToastDescription>
        )}
        <ToastClose />
      </Toast>
    </ToastViewport>
    </ToastProvider>
  );
};

export default Calendar;

