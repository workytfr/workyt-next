"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Gift, Loader2, ChevronLeft, ChevronRight, Check, Lock, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

const themeConfig: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  christmas: { emoji: '🎄', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  newyear: { emoji: '🎆', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  chinese_newyear: { emoji: '🐉', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  eastern: { emoji: '🏜️', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  indian: { emoji: '🪔', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  japanese: { emoji: '🌸', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
  canadian: { emoji: '🍁', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  french_civil: { emoji: '🇫🇷', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  french_cultural: { emoji: '🎭', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  default: { emoji: '', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
};

const monthNames = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];

const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const Calendar: React.FC = () => {
  const { data: session } = useSession();
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const currentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { year, month, firstDay, lastDay };
  }, []);

  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const loadCalendar = useCallback(async () => {
    try {
      setLoading(true);
      const startStr = formatDateLocal(currentMonth.firstDay);
      const endStr = formatDateLocal(currentMonth.lastDay);
      const response = await fetch(`/api/calendar/data?startDate=${startStr}&endDate=${endStr}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setDays(data.days.map((day: any) => {
        const dateObj = new Date(day.date);
        return { ...day, date: formatDateLocal(dateObj) };
      }));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    if (session) loadCalendar();
  }, [session, loadCalendar]);

  const claimReward = async (date: string) => {
    if (!session) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const claimDate = new Date(date);
    claimDate.setHours(0, 0, 0, 0);

    if (claimDate.getTime() !== today.getTime()) {
      toast.error('Vous ne pouvez reclamer que la recompense du jour meme');
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
        toast.error(error.error || 'Erreur lors de la reclamation');
        return;
      }

      const result = await response.json();
      let rewardText = '';
      if (result.rewardType === 'chest') {
        const chestName = result.chestType === 'rare' ? 'rare' : 'commun';
        if (result.chestReward) {
          if (result.chestReward.rewardType === 'gems') rewardText = `${result.chestReward.amount} diamant${result.chestReward.amount > 1 ? 's' : ''} du coffre ${chestName}`;
          else if (result.chestReward.rewardType === 'points') rewardText = `${result.chestReward.amount} point${result.chestReward.amount > 1 ? 's' : ''} du coffre ${chestName}`;
          else rewardText = `un cosmetique du coffre ${chestName}`;
        } else {
          rewardText = `un coffre ${chestName}`;
        }
      } else if (result.rewardType === 'gems') {
        rewardText = `${result.amount} diamant${result.amount > 1 ? 's' : ''}`;
      } else {
        rewardText = `${result.amount} point${result.amount > 1 ? 's' : ''}`;
      }

      toast.success(`Vous avez gagne ${rewardText}`);
      await loadCalendar();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setClaiming(null);
    }
  };

  const calendarGrid = useMemo(() => {
    const firstDayRaw = currentMonth.firstDay.getDay();
    const firstDayOfWeek = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
    const daysInMonth = currentMonth.lastDay.getDate();
    const grid: (CalendarDay | null)[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.year, currentMonth.month, day);
      const dateStr = formatDateLocal(date);
      const dayData = days.find(d => d.date === dateStr);
      grid.push(dayData || {
        date: dateStr,
        reward: { type: 'points', amount: 3 },
        theme: 'default',
        isSpecial: false,
        claimed: false
      });
    }

    return grid;
  }, [days, currentMonth]);

  const todayStr = formatDateLocal(new Date());

  const isToday = (dateStr: string) => dateStr === todayStr;
  const isPast = (dateStr: string) => dateStr < todayStr;
  const isFuture = (dateStr: string) => dateStr > todayStr;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {monthNames[currentMonth.month]} {currentMonth.year}
            </h2>
            <p className="text-xs text-gray-500">Reclamez votre recompense du jour</p>
          </div>
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden sm:block">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {dayHeaders.map((d, i) => (
            <div key={i} className="text-center text-xs font-semibold text-gray-400 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarGrid.map((day, index) => {
            if (!day) return <div key={`e-${index}`} className="aspect-square" />;
            return (
              <DayCell
                key={day.date}
                day={day}
                isToday={isToday(day.date)}
                isPast={isPast(day.date)}
                isFuture={isFuture(day.date)}
                claiming={claiming === day.date}
                canClaim={!!session && !day.claimed && isToday(day.date)}
                onClaim={() => claimReward(day.date)}
              />
            );
          })}
        </div>
      </div>

      {/* Mobile List */}
      <div className="sm:hidden space-y-2">
        {calendarGrid.filter((d): d is CalendarDay => d !== null).map((day) => (
          <DayRow
            key={day.date}
            day={day}
            isToday={isToday(day.date)}
            isPast={isPast(day.date)}
            isFuture={isFuture(day.date)}
            claiming={claiming === day.date}
            canClaim={!!session && !day.claimed && isToday(day.date)}
            onClaim={() => claimReward(day.date)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Aujourd&apos;hui</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Reclame</span>
        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-500" /> Special</span>
      </div>
    </div>
  );
};

/* ---- Desktop Cell ---- */
function DayCell({ day, isToday: today, isPast: past, isFuture: future, claiming, canClaim, onClaim }: {
  day: CalendarDay; isToday: boolean; isPast: boolean; isFuture: boolean;
  claiming: boolean; canClaim: boolean; onClaim: () => void;
}) {
  const theme = themeConfig[day.theme] || themeConfig.default;
  const dayNum = new Date(day.date).getDate();

  return (
    <div
      className={cn(
        "relative aspect-square rounded-xl border p-1.5 flex flex-col transition-all",
        today && "ring-2 ring-orange-400 ring-offset-1 border-orange-300 bg-orange-50",
        day.claimed && !today && "bg-green-50/50 border-green-200",
        !day.claimed && past && "opacity-40",
        future && "opacity-50",
        day.isSpecial && !today && !day.claimed && `${theme.bg} ${theme.border}`,
        !today && !day.isSpecial && !day.claimed && !past && "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm",
      )}
    >
      {/* Top row: day number + status */}
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-sm font-bold leading-none",
          today ? "text-orange-600" : day.isSpecial ? theme.color : "text-gray-700"
        )}>
          {dayNum}
        </span>
        {day.claimed && <Check className="w-3.5 h-3.5 text-green-500" />}
        {day.isSpecial && !day.claimed && <Sparkles className="w-3 h-3 text-yellow-500" />}
        {!day.claimed && past && <Lock className="w-3 h-3 text-gray-300" />}
      </div>

      {/* Center: reward + theme emoji */}
      <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
        {day.isSpecial && theme.emoji && (
          <span className="text-lg leading-none">{theme.emoji}</span>
        )}
        <RewardBadge reward={day.reward} small />
      </div>

      {/* Bottom: claim button or special name */}
      <div className="mt-auto">
        {canClaim ? (
          <button
            onClick={onClaim}
            disabled={claiming}
            className="w-full py-1 text-[10px] font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-md transition-all disabled:opacity-50"
          >
            {claiming ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'Reclamer'}
          </button>
        ) : day.isSpecial && day.specialName ? (
          <p className="text-[9px] text-center font-medium text-gray-500 truncate">{day.specialName}</p>
        ) : null}
      </div>
    </div>
  );
}

/* ---- Mobile Row ---- */
function DayRow({ day, isToday: today, isPast: past, isFuture: future, claiming, canClaim, onClaim }: {
  day: CalendarDay; isToday: boolean; isPast: boolean; isFuture: boolean;
  claiming: boolean; canClaim: boolean; onClaim: () => void;
}) {
  const theme = themeConfig[day.theme] || themeConfig.default;
  const date = new Date(day.date);
  const dayNum = date.getDate();
  const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()];

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-all",
      today && "ring-2 ring-orange-400 border-orange-300 bg-orange-50",
      day.claimed && !today && "bg-green-50/50 border-green-200",
      !day.claimed && past && "opacity-40",
      future && "opacity-50",
      day.isSpecial && !today && !day.claimed && `${theme.bg} ${theme.border}`,
      !today && !day.isSpecial && !day.claimed && !past && "bg-white border-gray-200",
    )}>
      {/* Date */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0",
        today ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700"
      )}>
        <span className="text-lg font-bold leading-none">{dayNum}</span>
        <span className="text-[10px] font-medium leading-none mt-0.5">{dayName}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {day.isSpecial && theme.emoji && <span className="text-base">{theme.emoji}</span>}
          {day.isSpecial && day.specialName ? (
            <span className="text-sm font-semibold text-gray-900 truncate">{day.specialName}</span>
          ) : (
            <span className="text-sm text-gray-500">
              {today ? "Aujourd'hui" : past ? 'Passe' : 'A venir'}
            </span>
          )}
        </div>
        <div className="mt-0.5">
          <RewardBadge reward={day.reward} />
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {day.claimed ? (
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
        ) : canClaim ? (
          <Button
            size="sm"
            onClick={onClaim}
            disabled={claiming}
            className="h-9 px-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs font-semibold rounded-full border-0"
          >
            {claiming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gift className="h-3.5 w-3.5" />}
          </Button>
        ) : past ? (
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Lock className="w-4 h-4 text-gray-300" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---- Reward Badge ---- */
function RewardBadge({ reward, small }: { reward: CalendarDay['reward']; small?: boolean }) {
  const imgSize = small ? 12 : 14;
  const textClass = small ? 'text-[10px]' : 'text-xs';

  if (reward.type === 'chest') {
    return (
      <div className="flex items-center gap-1">
        <Image src={`/coffre/${reward.chestType || 'common'}_f.png`} alt="" width={imgSize + 4} height={imgSize + 4} className="object-contain" />
        <span className={cn(textClass, 'font-semibold text-gray-600 capitalize')}>{reward.chestType === 'rare' ? 'Rare' : 'Coffre'}</span>
      </div>
    );
  }

  if (reward.type === 'gems') {
    return (
      <div className="flex items-center gap-1">
        <Image src="/badge/diamond.png" alt="" width={imgSize} height={imgSize} className="object-contain" />
        <span className={cn(textClass, 'font-semibold text-blue-600')}>{reward.amount}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Image src="/badge/points.png" alt="" width={imgSize} height={imgSize} className="object-contain" />
      <span className={cn(textClass, 'font-semibold text-gray-600')}>{reward.amount}</span>
    </div>
  );
}

export default Calendar;
