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

  if (!mushroomData?.success) return null;

  const balance = mushroomData.data.balance;
  const activeBoosts = mushroomData.data.activeBoosts || [];

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
      }
    } catch (err) {
      console.error('Erreur utilisation boost:', err);
    } finally {
      setUsingBoost(null);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return 'Expire';
    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className={className}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
        title={`${balance} champignon${balance > 1 ? 's' : ''}`}
      >
        <Image
          src="/badge/champiworkyt.webp"
          alt="Champignon"
          width={20}
          height={20}
          className="w-5 h-5"
        />
        <span className="text-sm font-medium text-orange-600">{balance}</span>
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
              <p className="text-xs text-gray-500">Utilise-les pour activer des boosts</p>
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
                    ? 'bg-gray-50 border-gray-200 opacity-60'
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
                    disabled={!boost.canAfford || boost.isActive || usingBoost === boost.type}
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
