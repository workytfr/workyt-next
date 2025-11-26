"use client";

import { useState, useEffect } from "react";
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

export default function ChestAnimation({
  chestType,
  reward,
  onClose,
}: ChestAnimationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Démarrer l'animation après un court délai
    const timer1 = setTimeout(() => {
      setIsOpen(true);
    }, 300);

    // Afficher la récompense après l'ouverture
    const timer2 = setTimeout(() => {
      setShowReward(true);
    }, 800);

    // Terminer l'animation
    const timer3 = setTimeout(() => {
      setIsAnimating(false);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const getRewardLabel = () => {
    if (reward.rewardType === "points") {
      return `${reward.amount} points`;
    } else if (reward.rewardType === "gems") {
      return `${reward.amount} diamants`;
    } else if (reward.rewardType === "cosmetic") {
      const cosmeticLabels: Record<string, Record<string, string>> = {
        profile_border: {
          silver: "Bordure Argent",
          gold: "Bordure Or",
          eclair_green: "Bordure Éclair Vert",
          fumee: "Bordure Fumée",
          poison_orange: "Bordure Poison Orange",
          halloween_pumpkins_apng: "Bordure Citrouilles",
        },
        profile_image: {
          "FoxyPink.webp": "Image Foxy Rose",
          "FoxyFrenchies.webp": "Image Foxy Frenchies",
          "FoxyHallo.webp": "Image Foxy Halloween",
          "FoxyTerreur.webp": "Image Foxy Terreur",
          "FoxyMecha.webp": "Image Foxy Mécha",
          "FoxyWaMe.webp": "Image Foxy WaMe",
          "FoxyWaterMelon.webp": "Image Foxy Pastèque",
          "FoxySably.webp": "Image Foxy Sably",
        },
        username_color: {
          rainbow: "Couleur Arc-en-ciel",
          legendary: "Couleur Légendaire",
          neon: "Couleur Néon",
          galaxy: "Couleur Galaxie",
        },
      };
      return (
        cosmeticLabels[reward.cosmeticType || ""]?.[reward.cosmeticId || ""] ||
        "Cosmétique"
      );
    }
    return "Récompense";
  };

  return (
    <Dialog.Root open={isAnimating} onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center">
          <Dialog.Content className="bg-transparent border-none outline-none">
            <div className="flex flex-col items-center justify-center">
              {/* Animation du coffre */}
              <div
                className={`relative transition-all duration-700 ease-out ${
                  isOpen ? "scale-125 rotate-6" : "scale-100 rotate-0"
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
                    width={250}
                    height={250}
                    className={`transition-all duration-500 ${
                      isOpen
                        ? "animate-pulse drop-shadow-2xl"
                        : "drop-shadow-lg"
                    }`}
                    priority
                  />
                  
                  {/* Effet de brillance lors de l'ouverture */}
                  {isOpen && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent animate-shine pointer-events-none" />
                  )}
                </div>
                
                {/* Particules d'ouverture */}
                {isOpen && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(16)].map((_, i) => {
                      const angle = (i * Math.PI * 2) / 16;
                      const distance = 80;
                      return (
                        <div
                          key={i}
                          className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-ping"
                          style={{
                            left: `calc(50% + ${Math.cos(angle) * distance}px)`,
                            top: `calc(50% + ${Math.sin(angle) * distance}px)`,
                            animationDelay: `${i * 0.05}s`,
                            animationDuration: "1.5s",
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Récompense */}
              {showReward && (
                <div
                  className={`mt-8 text-center animate-fade-in-up ${
                    showReward ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  } transition-all duration-500`}
                >
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-2xl border-2 border-yellow-400">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      🎉 Félicitations !
                    </h3>
                    <p className="text-lg text-gray-700 mb-4">
                      Vous avez obtenu :
                    </p>
                    <div className="flex items-center justify-center gap-3 text-xl font-semibold text-gray-900">
                      {reward.rewardType === "points" && (
                        <>
                          <Image
                            src="/badge/points.png"
                            alt="Points"
                            width={32}
                            height={32}
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
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                          <span>{reward.amount} diamants</span>
                        </>
                      )}
                      {reward.rewardType === "cosmetic" && (
                        <>
                          <span className="text-purple-600">✨</span>
                          <span>{getRewardLabel()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsAnimating(false);
                      onClose();
                    }}
                    className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Fermer
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

