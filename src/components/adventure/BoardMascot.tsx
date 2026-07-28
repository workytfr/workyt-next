"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

/**
 * Pion mascotte du Plateau de l'Aventure.
 * Affiche la photo de profil du joueur (cosmétique actif) si disponible,
 * sinon le pion par défaut. Positionné sur une case via `layoutId` partagé :
 * framer-motion anime automatiquement son déplacement.
 */
export default function BoardMascot({ layoutId, imageUrl }: { layoutId: string; imageUrl?: string | null }) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="absolute -top-3 -right-1 z-20 pointer-events-none"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white shadow-lg flex items-center justify-center overflow-hidden text-base sm:text-lg"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Ton héros"
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        ) : (
          '🧑‍🚀'
        )}
      </motion.div>
      {/* Ombre du pion */}
      <div className="mx-auto mt-0.5 w-4 h-1 rounded-full bg-black/20 blur-[2px]" />
    </motion.div>
  );
}
