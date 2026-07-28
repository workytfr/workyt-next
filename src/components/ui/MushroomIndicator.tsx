"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Clock, Zap } from 'lucide-react';
import useSWR from 'swr';

interface MushroomIndicatorProps {
  userId: string;
  className?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Anneau de progression du boost, tracé dans un viewBox 28×28
const RING_RADIUS = 12.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const MushroomIndicator: React.FC<MushroomIndicatorProps> = ({ userId, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [usingBoost, setUsingBoost] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });

  const { data: mushroomData, mutate: mutateBalance } = useSWR(
    userId ? '/api/mushrooms' : null,
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: false }
  );

  const { data: boostData, mutate: mutateBoosts } = useSWR(
    userId && isOpen ? '/api/mushrooms/boosts' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Horloge de l'anneau de boost. Ne tourne QUE s'il y a un boost chronométré
  // en cours, et se coupe si l'onglet passe en arrière-plan : un indicateur de
  // navbar est monté sur toutes les pages, il ne doit rien coûter au repos.
  const hasTimedBoost = (mushroomData?.data?.activeBoosts || []).some(
    (b: any) => b.durationMs > 0 && new Date(b.expiresAt).getTime() > Date.now()
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!hasTimedBoost) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (interval) return;
      setNow(Date.now());
      interval = setInterval(() => setNow(Date.now()), 1000);
    };
    const stop = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hasTimedBoost]);

  if (!mushroomData?.success) return null;

  const balance = mushroomData.data.balance;
  const activeBoosts: any[] = mushroomData.data.activeBoosts || [];

  // Boost chronométré le plus proche de l'expiration : c'est lui que l'anneau suit.
  // (lucky_chest a durationMs = 0 — usage unique, rien à décompter)
  const timedBoost = activeBoosts
    .filter(b => b.durationMs > 0 && new Date(b.expiresAt).getTime() > now)
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())[0];

  const remainingMs = timedBoost ? new Date(timedBoost.expiresAt).getTime() - now : 0;
  const ratio = timedBoost ? Math.max(0, Math.min(1, remainingMs / timedBoost.durationMs)) : 0;

  const handleToggle = () => {
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleUseBoost = async (boostType: string) => {
    setUsingBoost(boostType);
    try {
      const res = await fetch('/api/mushrooms/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boostType })
      });
      if (res.ok) {
        mutateBalance();
        mutateBoosts();
        // Le boost soigne aussi le héros : le panneau RPG doit se rafraîchir
        const { invalidateHero } = await import('@/lib/heroClient');
        invalidateHero();
      }
    } catch (err) {
      console.error('Erreur utilisation boost:', err);
    } finally {
      setUsingBoost(null);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - now;
    if (remaining <= 0) return 'Expiré';
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h${String(minutes % 60).padStart(2, '0')}`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`; // dernière minute : on descend à la seconde
  };

  return (
    <div className={className}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
        title={
          timedBoost
            ? `${timedBoost.name} actif — ${formatTimeRemaining(timedBoost.expiresAt)} restant`
            : `${balance} champignon${balance > 1 ? 's' : ''}`
        }
      >
        {/* Le contour du champignon sert de compteur au boost actif */}
        <span className="relative inline-flex items-center justify-center w-7 h-7 shrink-0">
          {timedBoost && (
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 28 28"
              aria-hidden="true"
            >
              <circle
                cx="14" cy="14" r={RING_RADIUS}
                fill="none" strokeWidth="2"
                className="stroke-orange-200"
              />
              <circle
                cx="14" cy="14" r={RING_RADIUS}
                fill="none" strokeWidth="2" strokeLinecap="round"
                className={ratio > 0.2 ? 'stroke-emerald-500' : 'stroke-red-500 animate-pulse'}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - ratio)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
          )}
          <Image
            src="/badge/champiworkyt.webp"
            alt="Champignon"
            width={20}
            height={20}
            className="w-5 h-5"
          />
        </span>
        <span className="text-sm font-medium text-orange-600">{balance}</span>
        {timedBoost && (
          <span className="sr-only">
            Boost {timedBoost.name} actif, {formatTimeRemaining(timedBoost.expiresAt)} restant
          </span>
        )}
      </button>

      {/* Dropdown - fixed to viewport */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-[200] p-4 max-h-[70vh] overflow-y-auto"
          style={{ top: panelPos.top, right: panelPos.right }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/badge/champiworkyt.webp"
              alt="ChampiWorkyt"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <div>
              <p className="text-lg font-bold text-gray-900">{balance} Champignon{balance > 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-500">Chaque boost soigne aussi ton héros 💚</p>
            </div>
          </div>

          {/* Active boosts */}
          {activeBoosts.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Boosts actifs</p>
              {activeBoosts.map((boost: any) => (
                <div key={boost.boostType} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg mb-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{boost.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Clock className="w-3 h-3" />
                    {formatTimeRemaining(boost.expiresAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Available boosts */}
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Boosts disponibles</p>
          <div className="space-y-2">
            {boostData?.success && boostData.data.boosts.map((boost: any) => (
              <div
                key={boost.type}
                className={`p-3 rounded-lg border ${
                  boost.isActive
                    ? 'bg-emerald-50 border-emerald-200'
                    : boost.canAfford
                      ? 'bg-white border-gray-200 hover:border-orange-200'
                      : 'bg-gray-50 border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{boost.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{boost.description}</p>
                  </div>
                  <button
                    onClick={() => handleUseBoost(boost.type)}
                    disabled={!boost.canAfford || usingBoost === boost.type}
                    title={boost.isActive ? 'Prolonger ce boost (et soigner ton héros)' : undefined}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ml-2"
                  >
                    <Image
                      src="/badge/champiworkyt.webp"
                      alt=""
                      width={12}
                      height={12}
                      className="w-3 h-3"
                    />
                    {usingBoost === boost.type ? '...' : boost.cost}
                  </button>
                </div>
              </div>
            ))}

            {!boostData && (
              <div className="text-center text-sm text-gray-400 py-4">Chargement...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MushroomIndicator;
