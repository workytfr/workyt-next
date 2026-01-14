"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CheckIcon,
  Cross2Icon,
  ClockIcon,
} from "@radix-ui/react-icons";
import { Gift } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import ChestAnimation from "./ChestAnimation";

interface Quest {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: "daily" | "weekly" | "monthly";
  progress: number;
  target: number;
  status: "in_progress" | "completed" | "claimed";
  rewards: {
    type: "chest" | "points" | "gems";
    amount?: number;
    chestType?: "common" | "rare" | "epic" | "legendary";
  }[];
  periodStart: string;
  periodEnd: string;
}

const typeLabels = {
  daily: "Quotidienne",
  weekly: "Hebdomadaire",
  monthly: "Mensuelle",
};

const typeColors = {
  daily: "bg-blue-100 text-blue-700",
  weekly: "bg-purple-100 text-purple-700",
  monthly: "bg-orange-100 text-orange-700",
};

const chestTypeColors = {
  common: "bg-gray-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-yellow-500",
};

export default function QuestsPanel() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [showChests, setShowChests] = useState(false);
  const [chests, setChests] = useState<any[]>([]);
  const [openingChest, setOpeningChest] = useState<{
    chestType: "common" | "rare" | "epic" | "legendary";
    reward: any;
  } | null>(null);

  useEffect(() => {
    if (isOpen && session) {
      fetchQuests();
      fetchChests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, session]);

  const fetchChests = async () => {
    if (!session) return;
    try {
      const response = await fetch("/api/chests");
      if (response.ok) {
        const data = await response.json();
        setChests(data.chests || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des coffres:", error);
    }
  };

  const fetchQuests = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const response = await fetch("/api/quests");
      if (response.ok) {
        const data = await response.json();
        setQuests(data.quests || []);
        
        // Si aucune quête et besoin de seed, essayer d'initialiser
        if ((data.quests || []).length === 0 && data.needsSeed) {
          // Essayer d'initialiser les quêtes
          const initResponse = await fetch("/api/quests/init", {
            method: "POST",
          });
          if (initResponse.ok) {
            const initData = await initResponse.json();
            setQuests(initData.quests || []);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des quêtes:", error);
    } finally {
      setLoading(false);
    }
  };

  const claimQuest = async (questId: string) => {
    if (!session || claiming) return;
    setClaiming(questId);
    try {
      const response = await fetch(`/api/quests/${questId}/claim`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        
        // Vérifier s'il y a un coffre dans les récompenses
        const chestReward = data.rewards?.find((r: any) => r.type === "chest");
        
        if (chestReward && chestReward.reward) {
          // Afficher l'animation du coffre
          setOpeningChest({
            chestType: chestReward.chestType || "common",
            reward: chestReward.reward,
          });
        } else {
          // Rafraîchir les quêtes sans animation
          await fetchQuests();
          alert(`Récompenses réclamées !`);
        }
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Erreur lors de la réclamation:", error);
      alert("Erreur lors de la réclamation des récompenses");
    } finally {
      setClaiming(null);
    }
  };

  const handleChestAnimationClose = async () => {
    setOpeningChest(null);
    // Rafraîchir les quêtes après l'animation
    await fetchQuests();
  };

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };


  const groupedQuests = {
    daily: quests.filter((q) => q.type === "daily"),
    weekly: quests.filter((q) => q.type === "weekly"),
    monthly: quests.filter((q) => q.type === "monthly"),
  };

  return (
    <>
      {openingChest && (
        <ChestAnimation
          chestType={openingChest.chestType}
          reward={openingChest.reward}
          onClose={handleChestAnimationClose}
        />
      )}
      
      <button
        onClick={() => {
          setIsOpen(true);
        }}
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
      >
        <Gift className="w-4 h-4 mr-2" />
        Quêtes
      </button>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen} modal={true}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <Dialog.Title className="text-2xl font-bold text-gray-900">
                  Mes Quêtes
                </Dialog.Title>
                <button
                  onClick={() => setShowChests(!showChests)}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  {showChests ? 'Voir les quêtes' : 'Voir les coffres'}
                </button>
              </div>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-600">
                  <Cross2Icon className="w-6 h-6" />
                </button>
              </Dialog.Close>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {showChests ? (
                <ChestsInfo chests={chests} />
              ) : loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Chargement des quêtes...</p>
                </div>
              ) : quests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Aucune quête disponible</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Les quêtes doivent être initialisées dans la base de données.
                  </p>
                  <Button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const response = await fetch("/api/quests/init", {
                          method: "POST",
                        });
                        if (response.ok) {
                          const data = await response.json();
                          setQuests(data.quests || []);
                        } else {
                          const error = await response.json();
                          alert(error.error || "Erreur lors de l'initialisation");
                        }
                      } catch (error) {
                        console.error("Erreur:", error);
                        alert("Erreur lors de l'initialisation des quêtes");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Initialiser les quêtes
                  </Button>
                  <p className="text-xs text-gray-400 mt-4">
                    Ou exécutez: npx ts-node scripts/seedQuests.ts
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Quêtes Journalières */}
                  {groupedQuests.daily.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ClockIcon className="w-5 h-5 mr-2 text-blue-600" />
                        Quêtes Journalières
                      </h3>
                      <div className="space-y-4">
                        {groupedQuests.daily.map((quest) => (
                          <QuestCard
                            key={quest.id}
                            quest={quest}
                            onClaim={claimQuest}
                            claiming={claiming === quest.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quêtes Hebdomadaires */}
                  {groupedQuests.weekly.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ClockIcon className="w-5 h-5 mr-2 text-purple-600" />
                        Quêtes Hebdomadaires
                      </h3>
                      <div className="space-y-4">
                        {groupedQuests.weekly.map((quest) => (
                          <QuestCard
                            key={quest.id}
                            quest={quest}
                            onClaim={claimQuest}
                            claiming={claiming === quest.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quêtes Mensuelles */}
                  {groupedQuests.monthly.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ClockIcon className="w-5 h-5 mr-2 text-orange-600" />
                        Quêtes Mensuelles
                      </h3>
                      <div className="space-y-4">
                        {groupedQuests.monthly.map((quest) => (
                          <QuestCard
                            key={quest.id}
                            quest={quest}
                            onClaim={claimQuest}
                            claiming={claiming === quest.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function QuestCard({
  quest,
  onClaim,
  claiming,
}: {
  quest: Quest;
  onClaim: (id: string) => void;
  claiming: boolean;
}) {
  const progress = getProgressPercentage(quest.progress, quest.target);
  const isCompleted = quest.status === "completed";
  const isClaimed = quest.status === "claimed";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{quest.name}</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${typeColors[quest.type]}`}
            >
              {typeLabels[quest.type]}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{quest.description}</p>
        </div>
        {isClaimed && (
          <div className="flex items-center text-green-600">
            <CheckIcon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">
            Progression: {quest.progress} / {quest.target}
          </span>
          <span className="text-gray-500">
            {formatDate(quest.periodStart)} - {formatDate(quest.periodEnd)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isCompleted
                ? "bg-green-500"
                : isClaimed
                ? "bg-gray-400"
                : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Récompenses */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-700">Récompenses:</span>
        {quest.rewards.map((reward, index) => (
          <div
            key={index}
            className="flex items-center gap-1 text-sm text-gray-600"
          >
            {reward.type === "points" && (
              <>
                <Image 
                  src="/badge/points.png" 
                  alt="Points" 
                  width={16} 
                  height={16} 
                  className="object-contain"
                />
                <span>{reward.amount} pts</span>
              </>
            )}
            {reward.type === "gems" && (
              <>
                <Image 
                  src="/badge/diamond.png" 
                  alt="Diamants" 
                  width={16} 
                  height={16} 
                  className="object-contain"
                />
                <span>{reward.amount}</span>
              </>
            )}
            {reward.type === "chest" && (
              <>
                <Image
                  src={`/coffre/${reward.chestType || "common"}_f.png`}
                  alt={`Coffre ${reward.chestType}`}
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <span className="capitalize">{reward.chestType}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Bouton de réclamation */}
      {isCompleted && !isClaimed && (
        <Button
          onClick={() => onClaim(quest.id)}
          disabled={claiming}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {claiming ? "Réclamation..." : "Réclamer les récompenses"}
        </Button>
      )}
    </div>
  );
}

function getProgressPercentage(progress: number, target: number) {
  return Math.min((progress / target) * 100, 100);
}

function ChestsInfo({ chests }: { chests: any[] }) {
  const getChestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      common: 'Commun',
      rare: 'Rare',
      epic: 'Épique',
      legendary: 'Légendaire'
    };
    return labels[type] || type;
  };

  const getCosmeticLabel = (cosmeticType?: string, cosmeticId?: string) => {
    if (!cosmeticType || !cosmeticId) return '';
    
    const labels: Record<string, Record<string, string>> = {
      profile_border: {
        silver: 'Bordure Argent',
        gold: 'Bordure Or',
        eclair_green: 'Bordure Éclair Vert',
        fumee: 'Bordure Fumée',
        poison_orange: 'Bordure Poison Orange',
        halloween_pumpkins_apng: 'Bordure Citrouilles'
      },
      profile_image: {
        'FoxyPink.webp': 'Image Foxy Rose',
        'FoxyFrenchies.webp': 'Image Foxy Frenchies',
        'FoxyHallo.webp': 'Image Foxy Halloween',
        'FoxyTerreur.webp': 'Image Foxy Terreur',
        'FoxyMecha.webp': 'Image Foxy Mécha',
        'FoxyWaMe.webp': 'Image Foxy WaMe',
        'FoxyWaterMelon.webp': 'Image Foxy Pastèque',
        'FoxySably.webp': 'Image Foxy Sably',
        'FoxyLmdpc.webp': 'Image Foxy Lmdpc (Partenaire)',
        'FoxyStagey.webp': 'Image Foxy Stagey (Partenaire)'
      },
      username_color: {
        rainbow: 'Couleur Arc-en-ciel',
        legendary: 'Couleur Légendaire',
        neon: 'Couleur Néon',
        galaxy: 'Couleur Galaxie'
      }
    };
    
    return labels[cosmeticType]?.[cosmeticId] || `${cosmeticType} ${cosmeticId}`;
  };

  if (chests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chargement des coffres...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Récompenses des Coffres
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Les coffres sont obtenus en complétant des quêtes. Voici les récompenses possibles pour chaque type de coffre :
      </p>
      
      {chests.map((chest) => (
        <div
          key={chest._id}
          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image
                  src={`/coffre/${chest.type}_f.png`}
                  alt={chest.name}
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <h4 className="text-lg font-semibold text-gray-900">
                  {chest.name}
                </h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    chestTypeColors[chest.type as keyof typeof chestTypeColors]
                  } text-white`}
                >
                  {getChestTypeLabel(chest.type)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{chest.description}</p>
            </div>
          </div>

          <div className="mt-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">
              Récompenses possibles :
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chest.possibleRewards.map((reward: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    {reward.type === 'points' && (
                      <>
                        <Image
                          src="/badge/points.png"
                          alt="Points"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {reward.amount} points
                        </span>
                      </>
                    )}
                    {reward.type === 'gems' && (
                      <>
                        <Image
                          src="/badge/diamond.png"
                          alt="Diamants"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {reward.amount} diamants
                        </span>
                      </>
                    )}
                    {reward.type === 'cosmetic' && (
                      <>
                        <Gift className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {getCosmeticLabel(reward.cosmeticType, reward.cosmeticId)}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {reward.probability}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

