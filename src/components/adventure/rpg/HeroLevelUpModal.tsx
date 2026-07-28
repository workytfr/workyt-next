"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesCore } from '@/components/ui/sparkles';

interface HeroLevelUpModalProps {
  level: number | null;
  rewards?: { points: number; gems: number; mushrooms: number; equipment: boolean };
  onClose: () => void;
}

/**
 * Modale de level-up du héros : affichée quand le héros gagne un niveau,
 * avec les récompenses de palier (points, champignons, diamants, équipement).
 */
export default function HeroLevelUpModal({ level, rewards, onClose }: HeroLevelUpModalProps) {
  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 pointer-events-none">
            <SparklesCore
              id="levelup-sparkles"
              background="transparent"
              minSize={0.8}
              maxSize={2}
              particleDensity={90}
              speed={4}
              particleColor="#A5B4FC"
              className="w-full h-full"
            />
          </div>

          <motion.div
            initial={{ scale: 0.5, y: 60 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="relative text-center rounded-3xl bg-gradient-to-b from-indigo-900 to-purple-900 border-4 border-yellow-400 px-10 py-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-7xl mb-3"
            >
              🦸
            </motion.div>
            <p className="text-yellow-300 font-extrabold tracking-widest text-sm uppercase">Niveau supérieur !</p>
            <p className="text-6xl font-extrabold text-white my-2">Niv. {level}</p>
            <div className="text-indigo-200 text-sm space-y-1 mb-4">
              <p>❤️ PV max +4 · ⚔️ Attaque +1 · PV restaurés !</p>
            </div>
            {/* Récompenses de palier */}
            {rewards && (
              <div className="mb-5 rounded-xl bg-white/10 border border-yellow-400/40 px-4 py-2.5 space-y-1">
                <p className="text-yellow-300 font-extrabold text-xs tracking-widest uppercase">Butin de niveau</p>
                <div className="text-white text-sm font-bold space-y-0.5">
                  {rewards.points > 0 && <p>⭐ +{rewards.points} points</p>}
                  {rewards.mushrooms > 0 && <p>🍄 +{rewards.mushrooms} champignon{rewards.mushrooms > 1 ? 's' : ''}</p>}
                  {rewards.gems > 0 && <p>💎 +{rewards.gems} diamants</p>}
                  {rewards.equipment && <p>🎁 Équipement bonus !</p>}
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 font-extrabold shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              En avant ! ⚔️
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
