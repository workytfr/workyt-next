"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Scroll, Loader2, Check, Gift, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Quest {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  progress: number;
  target: number;
  status: 'in_progress' | 'completed' | 'claimed';
  rewards: Array<{ type: string; amount?: number; chestType?: string }>;
}

const TYPE_CONFIG = {
  daily: { label: 'Jour', xp: 15, emoji: '☀️' },
  weekly: { label: 'Semaine', xp: 40, emoji: '📅' },
  monthly: { label: 'Mois', xp: 80, emoji: '🌙' }
} as const;

/**
 * « Missions de Guilde » : les quêtes affichées en ligne sur la page
 * /recompenses, avec rappel du bonus d'XP héros (lien RPG ↔ quêtes).
 */
export default function GuildQuests() {
  const { data: session } = useSession();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchQuests = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/quests');
      if (res.ok) {
        const data = await res.json();
        setQuests(data.quests || []);
      }
    } catch {
      // silencieux : la section est un bonus d'affichage
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) fetchQuests();
    else setLoading(false);
  }, [session, fetchQuests]);

  const claim = async (questId: string) => {
    if (claiming) return;
    setClaiming(questId);
    try {
      const res = await fetch(`/api/quests/${questId}/claim`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la réclamation');
        return;
      }
      const parts = (data.rewards || []).map((r: any) => {
        if (r.type === 'points') return `${r.amount} points`;
        if (r.type === 'gems') return `${r.amount} diamants`;
        if (r.type === 'mushrooms') return `${r.amount} champignons`;
        if (r.type === 'chest') return `un coffre ${r.chestType || 'commun'}`;
        return null;
      }).filter(Boolean);
      toast.success(`🏆 Mission accomplie ! +${parts.join(', ') || 'récompenses'} · +XP héros`);
      await fetchQuests();
    } catch {
      toast.error('Erreur lors de la réclamation');
    } finally {
      setClaiming(null);
    }
  };

  if (!session || loading || quests.length === 0) return null;

  const active = quests.filter(q => q.status !== 'claimed');

  return (
    <div className="mt-6 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Scroll className="w-5 h-5 text-amber-700" />
        <h3 className="font-extrabold text-amber-900">Missions de Guilde</h3>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
          <Sparkles className="w-3 h-3" /> XP héros en bonus
        </span>
      </div>

      <div className="space-y-2">
        {active.map((quest) => {
          const cfg = TYPE_CONFIG[quest.type] || TYPE_CONFIG.daily;
          const pct = Math.min((quest.progress / quest.target) * 100, 100);
          const done = quest.status === 'completed';

          return (
            <div
              key={quest.id}
              className={cn(
                'rounded-xl border p-3 bg-white/70 transition-all',
                done ? 'border-green-300 shadow-[0_0_10px_rgba(34,197,94,0.25)]' : 'border-amber-100'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-base shrink-0">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{quest.name}</p>
                    <span className="shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      +{cfg.xp} XP
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{quest.description}</p>
                </div>
                {done ? (
                  <button
                    onClick={() => claim(quest.id)}
                    disabled={claiming === quest.id}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold shadow hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {claiming === quest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Réclamer</span>}
                  </button>
                ) : (
                  <span className="shrink-0 text-xs font-bold text-gray-500">
                    {quest.progress}/{quest.target}
                  </span>
                )}
              </div>
              {/* Barre de progression */}
              <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', done ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}

        {active.length === 0 && (
          <p className="text-sm text-amber-800 text-center py-3 flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-green-600" /> Toutes les missions sont accomplies. La guilde est fière de toi ! 🎉
          </p>
        )}
      </div>
    </div>
  );
}
