"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";

interface ChestAnimationProps {
  chestType: "common" | "rare" | "epic" | "legendary";
  reward: {
    rewardType: string;
    amount?: number;
    cosmeticType?: string;
    cosmeticId?: string;
  };
  onClose: () => void;
}

const chestImages = {
  common: {
    closed: "/coffre/common_f.png",
    open: "/coffre/common_o.png",
  },
  rare: {
    closed: "/coffre/rare_f.png",
    open: "/coffre/rare_o.png",
  },
  epic: {
    closed: "/coffre/epic_f.png",
    open: "/coffre/epic_o.png",
  },
  legendary: {
    closed: "/coffre/legendary_f.png",
    open: "/coffre/legendary_o.png",
  },
};

const chestGlow: Record<string, string> = {
  common: "from-gray-400/40 via-white/60 to-gray-400/40",
  rare: "from-blue-500/40 via-cyan-300/60 to-blue-500/40",
  epic: "from-purple-500/40 via-pink-300/60 to-purple-500/40",
  legendary: "from-yellow-500/50 via-amber-300/70 to-yellow-500/50",
};

const particleColors: Record<string, string[]> = {
  common: ["bg-gray-300", "bg-gray-400", "bg-white"],
  rare: ["bg-blue-400", "bg-cyan-300", "bg-blue-500"],
  epic: ["bg-purple-400", "bg-pink-400", "bg-fuchsia-300"],
  legendary: ["bg-yellow-400", "bg-amber-300", "bg-orange-400"],
};

export default function ChestAnimation({
  chestType,
  reward,
  onClose,
}: ChestAnimationProps) {
  const [phase, setPhase] = useState<"idle" | "shake" | "open" | "reward">("idle");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("shake"), 200);
    const t2 = setTimeout(() => setPhase("open"), 1200);
    const t3 = setTimeout(() => setPhase("reward"), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const getRewardLabel = () => {
    if (reward.rewardType === "points") return `${reward.amount} points`;
    if (reward.rewardType === "gems") return `${reward.amount} diamants`;
    if (reward.rewardType === "mushrooms")
      return `${reward.amount} champignon${(reward.amount || 0) > 1 ? "s" : ""}`;
    if (reward.rewardType === "cosmetic") {
      const cosmeticLabels: Record<string, Record<string, string>> = {
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
      return (
        cosmeticLabels[reward.cosmeticType || ""]?.[reward.cosmeticId || ""] ||
        "Cosmetique"
      );
    }
    return "Recompense";
  };

  const colors = particleColors[chestType];
  const isOpen = phase === "open" || phase === "reward";

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[400]">
          {/* Fond avec transition */}
          <div
            className={`absolute inset-0 transition-colors duration-1000 ${
              isOpen ? "bg-black/80" : "bg-black/50"
            }`}
          />

          {/* Rayons de lumiere derriere le coffre (visibles a l'ouverture) */}
          {isOpen && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-[500px] h-[500px] rounded-full bg-gradient-radial ${chestGlow[chestType]} opacity-0 animate-[chest-glow_0.8s_ease-out_forwards]`}
                style={{ filter: "blur(60px)" }}
              />
            </div>
          )}

          <Dialog.Content className="absolute inset-0 flex items-center justify-center bg-transparent border-none outline-none">
            <div className="flex flex-col items-center justify-center relative">
              {/* Coffre */}
              <div
                className={`relative ${
                  phase === "shake"
                    ? "animate-[chest-shake_0.12s_ease-in-out_infinite]"
                    : ""
                } ${
                  isOpen
                    ? "animate-[chest-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
                    : ""
                }`}
              >
                <div className="relative">
                  <Image
                    src={
                      isOpen
                        ? chestImages[chestType].open
                        : chestImages[chestType].closed
                    }
                    alt={`Coffre ${chestType}`}
                    width={220}
                    height={220}
                    className={`transition-all duration-300 drop-shadow-lg ${
                      isOpen ? "drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]" : ""
                    }`}
                    priority
                  />

                  {/* Flash lumineux a l'ouverture */}
                  {isOpen && (
                    <div className="absolute inset-0 bg-white/80 rounded-full animate-[chest-flash_0.4s_ease-out_forwards] pointer-events-none" />
                  )}
                </div>

                {/* Particules qui s'envolent */}
                {isOpen && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => {
                      const angle = (i * Math.PI * 2) / 20;
                      const dist = 60 + Math.random() * 80;
                      const size = 4 + Math.random() * 6;
                      const color = colors[i % colors.length];
                      return (
                        <div
                          key={i}
                          className={`absolute rounded-full ${color} animate-[chest-particle_1.2s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]`}
                          style={{
                            width: size,
                            height: size,
                            left: "50%",
                            top: "50%",
                            opacity: 0,
                            ["--tx" as string]: `${Math.cos(angle) * dist}px`,
                            ["--ty" as string]: `${Math.sin(angle) * dist - 40}px`,
                            animationDelay: `${i * 0.03}s`,
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Etoiles flottantes */}
                {isOpen && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => {
                      const angle = (i * Math.PI * 2) / 8;
                      const dist = 90 + Math.random() * 40;
                      return (
                        <div
                          key={`star-${i}`}
                          className="absolute text-yellow-300 animate-[chest-star_1.5s_ease-out_forwards]"
                          style={{
                            left: `calc(50% + ${Math.cos(angle) * dist}px)`,
                            top: `calc(50% + ${Math.sin(angle) * dist}px)`,
                            fontSize: 12 + Math.random() * 8,
                            animationDelay: `${0.2 + i * 0.08}s`,
                            opacity: 0,
                          }}
                        >
                          &#10022;
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recompense */}
              {phase === "reward" && (
                <div className="mt-6 text-center animate-[chest-reward_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards] opacity-0">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl px-8 py-6 shadow-2xl border border-yellow-200">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Vous avez obtenu
                    </p>
                    <div className="flex items-center justify-center gap-3 text-2xl font-bold text-gray-900">
                      {reward.rewardType === "points" && (
                        <>
                          <Image
                            src="/badge/points.png"
                            alt="Points"
                            width={36}
                            height={36}
                            className="object-contain"
                          />
                          <span>{reward.amount} points</span>
                        </>
                      )}
                      {reward.rewardType === "gems" && (
                        <>
                          <Image
                            src="/badge/diamond.png"
                            alt="Diamants"
                            width={36}
                            height={36}
                            className="object-contain"
                          />
                          <span>{reward.amount} diamants</span>
                        </>
                      )}
                      {reward.rewardType === "mushrooms" && (
                        <>
                          <Image
                            src="/badge/champiworkyt.webp"
                            alt="Champignons"
                            width={36}
                            height={36}
                            className="object-contain"
                          />
                          <span>{getRewardLabel()}</span>
                        </>
                      )}
                      {reward.rewardType === "cosmetic" && (
                        <>
                          <span className="text-3xl">&#10024;</span>
                          <span className="text-purple-700">{getRewardLabel()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="mt-5 px-8 py-2.5 bg-white/90 hover:bg-white text-gray-800 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl border border-gray-200"
                  >
                    Continuer
                  </button>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
