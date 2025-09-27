"use client";

import React, { useState, useEffect } from 'react';
import { Gem } from 'lucide-react';
import Link from 'next/link';

interface GemMenuSectionProps {
  userId: string;
  className?: string;
}

const GemMenuSection: React.FC<GemMenuSectionProps> = ({ userId, className = '' }) => {
  const [gemBalance, setGemBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadGemBalance();
    }
  }, [userId]);

  const loadGemBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gems/balance');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user.id === userId) {
          setGemBalance(data.data.gems.balance);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des gemmes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || gemBalance === null) {
    return (
      <div className={`px-4 py-2 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Gem className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gem className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-600">Gemmes</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-600">{gemBalance}</span>
          <Link 
            href="/gems" 
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/gems';
            }}
          >
            Gérer →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GemMenuSection;
