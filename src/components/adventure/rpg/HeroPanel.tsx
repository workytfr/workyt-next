"use client";

import React, { useState } from 'react';
import { Heart, Sword, Shield, Sparkles, Loader2, Skull } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { EquipmentDef } from '@/lib/equipment';

export interface HeroState {
  level: number;
  xp: number;
  xpForNext: number;
  xpProgress: number;
  hp: number;
  hpMax: number;
  attack: number;
  defense: number;
  dungeonKills: number;
  fainted: boolean;
  equipped: Record<'weapon' | 'armor' | 'amulet', EquipmentDef | null>;
}

interface HeroPanelProps {
  hero: HeroState;
  mushrooms: number;
  onHealed: (hp: number, mushroomsLeft: number) => void;
}

/**
 * Panneau du héros RPG : niveau, HP, XP, stats, équipement, potion champignon.
 */
export default function HeroPanel({ hero, mushrooms, onHealed }: HeroPanelProps) {
  const [healing, setHealing] = useState(false);
  const hpPercent = hero.hpMax > 0 ? (hero.hp / hero.hpMax) * 100 : 0;

  const heal = async () => {
    if (healing) return;
    setHealing(true);
    try {
      const res = await fetch('/api/hero/heal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Impossible de se soigner');
        return;
      }
      toast.success(
        data.boost?.name
          ? `🍄 Potion bue ! PV au maximum + ${data.boost.name} activé !`
          : '🍄 Potion bue ! PV restaurés au maximum !'
      );
      onHealed(data.hp, data.mushroomsLeft);
    } catch {
      toast.error('Erreur lors du soin');
    } finally {
      setHealing(false);
    }
  };

  const slotLabel: Record<string, string> = { weapon: 'Arme', armor: 'Armure', amulet: 'Amulette' };

  return (
    <div className={cn(
      'relative rounded-2xl border-2 p-4 mb-5 bg-gradient-to-r',
      hero.fainted
        ? 'from-gray-200 to-gray-300 border-gray-400'
        : 'from-indigo-100 via-purple-50 to-indigo-100 border-indigo-300'
    )}>
      <div className="flex flex-wrap items-center gap-4">
        {/* Avatar + niveau */}
        <div className="relative shrink-0">
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-md border-2 border-white',
            hero.fainted ? 'bg-gray-400 grayscale' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
          )}>
            {hero.fainted ? '💫' : '🦸'}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-yellow-400 border-2 border-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-extrabold text-yellow-900 shadow">
            {hero.level}
          </div>
        </div>

        {/* Barres HP / XP */}
        <div className="flex-1 min-w-[180px] space-y-2">
          {/* HP — ressource longue : ne se recharge PAS chaque jour */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-0.5">
              <span
                className={cn('flex items-center gap-1', hero.fainted ? 'text-gray-500' : 'text-red-600')}
                title="Tes PV ne se rechargent pas chaque jour. Seule une potion 🍄 les restaure — ou une nuit de repos si tu tombes à 0."
              >
                {hero.fainted ? <Skull className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5 fill-current" />}
                {hero.fainted ? 'Évanoui !' : 'PV — ne se rechargent pas seuls'}
              </span>
              <span className="text-gray-600">{hero.hp}/{hero.hpMax}</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/70 overflow-hidden shadow-inner">
              <div
                className={cn('h-full rounded-full transition-all duration-500', hero.fainted ? 'bg-gray-400' : hpPercent > 50 ? 'bg-gradient-to-r from-red-400 to-rose-500' : hpPercent > 25 ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-red-600')}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
          {/* XP */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-0.5">
              <span className="flex items-center gap-1 text-indigo-600">
                <Sparkles className="w-3.5 h-3.5" /> XP — Niveau {hero.level}
              </span>
              <span className="text-gray-600">{hero.xp}/{hero.xpForNext}</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/70 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-500"
                style={{ width: `${hero.xpProgress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 text-xs font-bold shrink-0">
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 text-orange-600 shadow-sm">
            <Sword className="w-3.5 h-3.5" /> {hero.attack}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 text-blue-600 shadow-sm">
            <Shield className="w-3.5 h-3.5" /> {hero.defense}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 text-gray-600 shadow-sm" title="Monstres vaincus">
            💀 {hero.dungeonKills}
          </span>
        </div>

        {/* Potion */}
        <button
          onClick={heal}
          disabled={healing || mushrooms < 1 || hero.hp >= hero.hpMax}
          className={cn(
            'shrink-0 px-3 py-2 rounded-xl text-xs font-bold shadow transition-all',
            hero.hp >= hero.hpMax
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : mushrooms < 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:brightness-110 active:scale-95'
          )}
          title={
            hero.hp >= hero.hpMax
              ? 'PV déjà au maximum'
              : mushrooms < 1
                ? 'Aucun champignon — tes PV ne remonteront pas tout seuls'
                : 'PV au maximum + Petit Boost activé (1 champignon)'
          }
        >
          {healing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>🍄 Potion ({mushrooms})</>}
        </button>
      </div>

      {/* Avertissements : la règle des PV doit être lisible AVANT de perdre sa case */}
      {hero.fainted ? (
        <div className={cn(
          'mt-3 rounded-xl border-2 px-3 py-2 text-xs font-semibold',
          mushrooms < 1
            ? 'bg-red-50 border-red-300 text-red-800'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        )}>
          {mushrooms < 1 ? (
            <>
              💀 <strong>Ton héros est à terre et tu n&apos;as aucun champignon.</strong> Tu ne peux
              pas réclamer ta case du jour — elle sera perdue. Ton héros se réveillera demain.
            </>
          ) : (
            <>
              💫 <strong>Ton héros est évanoui.</strong> Pas d&apos;XP et pas de réclamation tant
              qu&apos;il est à terre. Bois une potion 🍄 pour repartir aujourd&apos;hui.
            </>
          )}
        </div>
      ) : hpPercent <= 34 && (
        <div className="mt-3 rounded-xl border-2 border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">
          ⚠️ <strong>PV bas.</strong> Ils ne remonteront pas demain tout seuls : une erreur de plus
          et tu tombes. Garde une potion 🍄 sous la main.
        </div>
      )}

      {/* Équipement */}
      <div className="mt-3 pt-3 border-t border-indigo-200/60 flex flex-wrap gap-2">
        {(['weapon', 'armor', 'amulet'] as const).map((slot) => {
          const item = hero.equipped[slot];
          return (
            <div
              key={slot}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border',
                item
                  ? item.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-400 text-amber-800'
                    : item.rarity === 'epic' ? 'bg-purple-100 border-purple-300 text-purple-800'
                    : item.rarity === 'rare' ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-white/70 border-gray-200 text-gray-700'
                  : 'bg-white/40 border-dashed border-gray-300 text-gray-400'
              )}
              title={item ? `${item.name} — ${item.flavor}` : `Aucun(e) ${slotLabel[slot].toLowerCase()}`}
            >
              <span>{item ? item.emoji : '▫️'}</span>
              <span className="font-semibold">{item ? item.name : slotLabel[slot]}</span>
              {item && <span className="font-bold">+{item.stat}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
