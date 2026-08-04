"use client";

import React from "react";
import Image from "next/image";
import { Gift } from "lucide-react";
import type { ChestWithOdds } from "@/lib/chestOdds";

/**
 * Carte d'un coffre : visuel, nom, et TABLE DE BUTIN avec les probabilités.
 *
 * Extrait de QuestsPanel pour être réutilisé par la Guerre des Clans. Le butin
 * d'un coffre doit se lire à l'identique partout : deux rendus séparés
 * finiraient par afficher des chances différentes pour le même coffre.
 */

const CHEST_TYPE_COLORS: Record<string, string> = {
  common: "bg-gray-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-yellow-500",
};

const CHEST_TYPE_LABELS: Record<string, string> = {
  common: "Commun",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
};

const COSMETIC_LABELS: Record<string, Record<string, string>> = {
  profile_border: {
    silver: "Bordure Argent",
    gold: "Bordure Or",
    eclair_green: "Bordure Eclair Vert",
    fumee: "Bordure Fumee",
    poison_orange: "Bordure Poison Orange",
    halloween_pumpkins_apng: "Bordure Citrouilles",
  },
  profile_image: {
    "FoxyPink.webp": "Image Foxy Rose",
    "FoxyFrenchies.webp": "Image Foxy Frenchies",
    "FoxyHallo.webp": "Image Foxy Halloween",
    "FoxyTerreur.webp": "Image Foxy Terreur",
    "FoxyMecha.webp": "Image Foxy Mecha",
    "FoxyWaMe.webp": "Image Foxy WaMe",
    "FoxyWaterMelon.webp": "Image Foxy Pasteque",
    "FoxySably.webp": "Image Foxy Sably",
    "FoxyLmdpc.webp": "Image Foxy Lmdpc (Partenaire)",
    "FoxyStagey.webp": "Image Foxy Stagey (Partenaire)",
  },
  username_color: {
    rainbow: "Couleur Arc-en-ciel",
    legendary: "Couleur Legendaire",
    neon: "Couleur Neon",
    galaxy: "Couleur Galaxie",
  },
};

export function getChestTypeLabel(type: string): string {
  return CHEST_TYPE_LABELS[type] ?? type;
}

export function getCosmeticLabel(cosmeticType?: string, cosmeticId?: string): string {
  if (!cosmeticType || !cosmeticId) return "";
  return COSMETIC_LABELS[cosmeticType]?.[cosmeticId] || `${cosmeticType} ${cosmeticId}`;
}

/** Une ligne de butin : icône, libellé, probabilité. */
export function ChestRewardRow({ reward }: { reward: ChestWithOdds["possibleRewards"][number] }) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-sm">
      <div className="flex items-center gap-2">
        {reward.type === "points" && (
          <>
            <Image src="/badge/points.png" alt="" width={18} height={18} className="object-contain" />
            <span className="text-gray-700 text-xs font-medium">{reward.amount} points</span>
          </>
        )}
        {reward.type === "gems" && (
          <>
            <Image src="/badge/diamond.png" alt="" width={18} height={18} className="object-contain" />
            <span className="text-gray-700 text-xs font-medium">{reward.amount} diamants</span>
          </>
        )}
        {reward.type === "mushrooms" && (
          <>
            <Image src="/badge/champiworkyt.webp" alt="" width={18} height={18} className="object-contain" />
            <span className="text-gray-700 text-xs font-medium">
              {reward.amount} champignon{(reward.amount ?? 0) > 1 ? "s" : ""}
            </span>
          </>
        )}
        {reward.type === "cosmetic" && (
          <>
            <Gift className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700 text-xs font-medium">
              {getCosmeticLabel(reward.cosmeticType, reward.cosmeticId)}
            </span>
          </>
        )}
      </div>
      {reward.probability != null && (
        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
          {reward.probability}%
        </span>
      )}
    </div>
  );
}

export default function ChestCard({
  chest,
  badge,
}: {
  chest: ChestWithOdds;
  /** Libellé contextuel optionnel, ex. « 👑 MVP » sur la page des clans */
  badge?: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* En-tete du coffre */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
        <Image
          src={`/coffre/${chest.type}_f.png`}
          alt={chest.name}
          width={36}
          height={36}
          className="object-contain"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-sm">{chest.name}</h4>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                CHEST_TYPE_COLORS[chest.type] ?? "bg-gray-500"
              } text-white font-medium`}
            >
              {getChestTypeLabel(chest.type)}
            </span>
            {badge}
          </div>
          <p className="text-xs text-gray-500">{chest.description}</p>
        </div>
      </div>

      {/* Recompenses possibles */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {chest.possibleRewards.map((reward, index) => (
            <ChestRewardRow key={index} reward={reward} />
          ))}
        </div>
      </div>
    </div>
  );
}
