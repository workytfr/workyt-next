"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesCore } from '@/components/ui/sparkles';
import { cn } from '@/lib/utils';
import type { BoardTheme } from './boardThemes';
import type { ClaimResult } from './types';
import { themeEmojis } from './types';

interface RewardCeremonyProps {
  result: ClaimResult | null;
  theme: BoardTheme;
  onClose: () => void;
}

/**
 * Cérémonie de récompense : au claim réussi, une carte mystère se retourne
 * en 3D pour révéler la récompense, avec pluie de particules.
 */
export default function RewardCeremony({ result, theme, onClose }: RewardCeremonyProps) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (result) {
      setFlipped(false);
      const t = setTimeout(() => setFlipped(true), 700);
      return () => clearTimeout(t);
    }
  }, [result]);

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          {/* Particules de fond */}
          <div className="absolute inset-0 pointer-events-none">
            <SparklesCore
              id="reward-ceremony-sparkles"
              background="transparent"
              minSize={0.6}
              maxSize={1.8}
              particleDensity={70}
              speed={3}
              particleColor="#FCD34D"
              className="w-full h-full"
            />
          </div>

          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Carte 3D */}
            <div style={{ perspective: 1200 }} className="w-64 sm:w-72">
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative w-full aspect-[3/4]"
              >
                {/* Dos de la carte (mystère) */}
                <div
                  style={{ backfaceVisibility: 'hidden' }}
                  className={cn(
                    'absolute inset-0 rounded-2xl border-4 border-yellow-300 shadow-2xl flex flex-col items-center justify-center gap-3',
                    'bg-gradient-to-br', theme.cardBack
                  )}
                >
                  <span className="text-6xl">🎁</span>
                  <span className="text-white/80 font-bold text-sm tracking-widest uppercase">Récompense</span>
                </div>

                {/* Face de la carte (récompense) */}
                <div
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  className="absolute inset-0 rounded-2xl border-4 border-yellow-300 shadow-2xl bg-gradient-to-br from-white to-amber-50 flex flex-col items-center justify-center gap-2 p-4"
                >
                  <RewardFace result={result} />
                </div>
              </motion.div>
            </div>

            {/* Bonus : carte de collection / set complet */}
            {flipped && (result.cardEarned || result.setCompleted) && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 w-64 sm:w-72 rounded-xl bg-white/95 border border-yellow-200 shadow-xl p-3 text-center space-y-1"
              >
                {result.cardEarned && (
                  <p className="text-sm font-bold text-gray-900">
                    {themeEmojis[result.cardEarned.theme] || '🃏'} Nouvelle carte débloquée — Semaine {result.cardEarned.week + 1} !
                  </p>
                )}
                {result.setCompleted && (
                  <p className="text-sm font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                    🏆 SET COMPLET ! Coffre épique : {describeSetChest(result)}
                  </p>
                )}
              </motion.div>
            )}

            {/* Bouton continuer */}
            {flipped && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onClose}
                className={cn(
                  'mt-4 w-64 sm:w-72 py-3 rounded-xl text-white font-bold shadow-lg transition-all hover:brightness-110 active:scale-95',
                  'bg-gradient-to-r', theme.claimButton
                )}
              >
                Continuer l&apos;aventure ➜
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RewardFace({ result }: { result: ClaimResult }) {
  if (result.rewardType === 'chest') {
    const chestName = result.chestType === 'rare' ? 'Coffre Rare' : 'Coffre';
    return (
      <>
        <Image
          src={`/coffre/${result.chestType || 'common'}_f.png`}
          alt={chestName}
          width={90}
          height={90}
          className="object-contain drop-shadow-lg"
        />
        <p className="text-lg font-extrabold text-gray-900">{chestName}</p>
        {result.chestReward && (
          <p className="text-sm font-semibold text-amber-700 text-center">
            {describeChestReward(result.chestReward)}
          </p>
        )}
      </>
    );
  }
  if (result.rewardType === 'gems') {
    return (
      <>
        <Image src="/badge/diamond.png" alt="Diamants" width={80} height={80} className="object-contain drop-shadow-lg" />
        <p className="text-3xl font-extrabold text-blue-600">+{result.amount}</p>
        <p className="text-sm font-semibold text-gray-600">diamant{(result.amount || 0) > 1 ? 's' : ''} 💎</p>
      </>
    );
  }
  return (
    <>
      <Image src="/badge/points.png" alt="Points" width={80} height={80} className="object-contain drop-shadow-lg" />
      <p className="text-3xl font-extrabold text-amber-600">+{result.amount}</p>
      <p className="text-sm font-semibold text-gray-600">point{(result.amount || 0) > 1 ? 's' : ''} ⭐</p>
    </>
  );
}

function describeChestReward(cr: NonNullable<ClaimResult['chestReward']>): string {
  if (cr.rewardType === 'gems') return `${cr.amount} diamant${(cr.amount || 0) > 1 ? 's' : ''} à l'intérieur !`;
  if (cr.rewardType === 'points') return `${cr.amount} points à l'intérieur !`;
  if (cr.rewardType === 'mushrooms') return `${cr.amount} champignon${(cr.amount || 0) > 1 ? 's' : ''} à l'intérieur !`;
  return 'Un cosmétique à l\'intérieur !';
}

function describeSetChest(result: ClaimResult): string {
  const sc = result.setChestReward;
  if (!sc) return 'récompense surprise';
  if (sc.rewardType === 'gems') return `${sc.amount} diamants`;
  if (sc.rewardType === 'points') return `${sc.amount} points`;
  if (sc.rewardType === 'mushrooms') return `${sc.amount} champignons`;
  return 'un cosmétique';
}
