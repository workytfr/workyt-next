"use client";

import React, { useState, useEffect } from 'react';
import { Gem } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import useSWR from 'swr';

interface GemIndicatorProps {
  userId: string;
  className?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const GemIndicator: React.FC<GemIndicatorProps> = ({ userId, className = '' }) => {
  const { data, error, isLoading } = useSWR(
    userId ? ['/api/gems/balance', userId] : null,
    ([url]) => fetcher(url),
    {
      refreshInterval: 60000, // rafraîchit toutes les 60s
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (isLoading || !data) {
    return null;
  }

  if (error) {
    console.error('Erreur lors du chargement des gemmes:', error);
    return null;
  }

  // Vérifie que l'utilisateur correspond bien
  if (!data.success || data.data.user.id !== userId) {
    return null;
  }

  const gemBalance = data.data.gems.balance;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Gem className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-600">{gemBalance}</span>
    </div>
  );
};

export default GemIndicator;
