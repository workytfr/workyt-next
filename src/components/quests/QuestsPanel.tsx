"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CheckIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import {
  Gift,
  MessageSquare,
  CheckCircle2,
  Brain,
  Trophy,
  BookOpen,
  FileText,
  Heart,
  Bookmark,
  Flame,
  Calendar,
  Star,
  Loader2,
  Package,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

type TabType = "quests" | "chests";

const typeLabels: Record<string, string> = {
  daily: "Quotidienne",
  weekly: "Hebdomadaire",
  monthly: "Mensuelle",
};

const typeConfig: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  daily: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: "text-blue-600",
    label: "Quotidiennes",
  },
  weekly: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: "text-purple-600",
    label: "Hebdomadaires",
  },
  monthly: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "text-amber-600",
    label: "Mensuelles",
  },
};

const chestTypeColors: Record<string, string> = {
  common: "bg-gray-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-yellow-500",
};

function getQuestIcon(slug: string) {
  if (slug.includes("forum_answer") || slug.includes("forum_validated"))
    return <MessageSquare className="w-5 h-5" />;
  if (slug.includes("quiz_score"))
    return <Trophy className="w-5 h-5" />;
  if (slug.includes("quiz"))
    return <Brain className="w-5 h-5" />;
  if (slug.includes("course"))
    return <BookOpen className="w-5 h-5" />;
  if (slug.includes("fiche_create"))
    return <FileText className="w-5 h-5" />;
  if (slug.includes("fiche_like"))
    return <Heart className="w-5 h-5" />;
  if (slug.includes("fiche_bookmark") || slug.includes("bookmark"))
    return <Bookmark className="w-5 h-5" />;
  if (slug.includes("streak") || slug.includes("login"))
    return <Flame className="w-5 h-5" />;
  return <Star className="w-5 h-5" />;
}

function getProgressPercentage(progress: number, target: number) {
  return Math.min((progress / target) * 100, 100);
}

export default function QuestsPanel({ externalOpen, onOpenChange }: { externalOpen?: boolean; onOpenChange?: (open: boolean) => void } = {}) {
  const { data: session } = useSession();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const isOpen = isControlled ? externalOpen : internalOpen;
  const setIsOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("quests");
  const [chests, setChests] = useState<any[]>([]);
  const [openingChest, setOpeningChest] = useState<{
    chestType: "common" | "rare" | "epic" | "legendary";
    reward: any;
  } | null>(null);

  const fetchChests = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch("/api/chests");
      if (response.ok) {
        const data = await response.json();
        setChests(data.chests || []);
      }
    } catch (error) {
      console.error("Erreur lors de la recuperation des coffres:", error);
    }
  }, [session]);

  const fetchQuests = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const response = await fetch("/api/quests");
      if (response.ok) {
        const data = await response.json();
        setQuests(data.quests || []);

        if ((data.quests || []).length === 0 && data.needsSeed) {
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
      console.error("Erreur lors de la recuperation des quetes:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (isOpen && session) {
      fetchQuests();
      fetchChests();
    }
  }, [isOpen, session, fetchQuests, fetchChests]);

  const claimQuest = async (questId: string) => {
    if (!session || claiming) return;
    setClaiming(questId);
    try {
      const response = await fetch(`/api/quests/${questId}/claim`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        const chestReward = data.rewards?.find((r: any) => r.type === "chest");

        if (chestReward && chestReward.reward) {
          setOpeningChest({
            chestType: chestReward.chestType || "common",
            reward: chestReward.reward,
          });
        } else {
          await fetchQuests();
          toast.success("Recompenses reclamees !");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la reclamation");
      }
    } catch (error) {
      console.error("Erreur lors de la reclamation:", error);
      toast.error("Erreur lors de la reclamation des recompenses");
    } finally {
      setClaiming(null);
    }
  };

  const handleChestAnimationClose = async () => {
    setOpeningChest(null);
    await fetchQuests();
  };

  const groupedQuests = useMemo(
    () => ({
      daily: quests.filter((q) => q.type === "daily"),
      weekly: quests.filter((q) => q.type === "weekly"),
      monthly: quests.filter((q) => q.type === "monthly"),
    }),
    [quests]
  );

  const stats = useMemo(() => {
    const completed = quests.filter((q) => q.status === "completed").length;
    const claimed = quests.filter((q) => q.status === "claimed").length;
    const total = quests.length;
    return { completed, claimed, total, done: completed + claimed };
  }, [quests]);

  return (
    <>
      {openingChest && (
        <ChestAnimation
          chestType={openingChest.chestType}
          reward={openingChest.reward}
          onClose={handleChestAnimationClose}
        />
      )}

      {!isControlled && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
          aria-label="Ouvrir le panneau des quetes"
        >
          <Gift className="w-4 h-4 mr-2" />
          Quetes
          {stats.completed > 0 && (
            <span className="ml-auto bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {stats.completed}
            </span>
          )}
        </button>
      )}

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen} modal={true}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[300] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[301] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
            aria-describedby={undefined}
          >
            <Dialog.Description className="sr-only">
              Panneau affichant vos quetes et recompenses
            </Dialog.Description>

            {/* Header */}
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-amber-50">
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <Dialog.Title className="text-xl font-bold text-gray-900">
                  Mes Quetes
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
                    aria-label="Fermer"
                  >
                    <Cross2Icon className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Onglets */}
              <div className="flex px-6 gap-1" role="tablist" aria-label="Sections des quetes">
                <button
                  role="tab"
                  aria-selected={activeTab === "quests"}
                  onClick={() => setActiveTab("quests")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === "quests"
                      ? "bg-white text-gray-900 border border-b-0 border-gray-200"
                      : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                  }`}
                >
                  <Gift className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                  Quetes
                  {stats.done > 0 && (
                    <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {stats.done}/{stats.total}
                    </span>
                  )}
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "chests"}
                  onClick={() => setActiveTab("chests")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === "chests"
                      ? "bg-white text-gray-900 border border-b-0 border-gray-200"
                      : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                  }`}
                >
                  <Package className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                  Coffres
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="overflow-y-auto flex-1 p-6" role="tabpanel">
              {activeTab === "chests" ? (
                <ChestsInfo chests={chests} />
              ) : loading ? (
                <QuestsLoading />
              ) : quests.length === 0 ? (
                <QuestsEmpty
                  onInit={async () => {
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
                        toast.error(error.error || "Erreur lors de l'initialisation");
                      }
                    } catch {
                      toast.error("Erreur lors de l'initialisation des quetes");
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
              ) : (
                <div className="space-y-6">
                  {(["daily", "weekly", "monthly"] as const).map((type) => {
                    const typeQuests = groupedQuests[type];
                    if (typeQuests.length === 0) return null;
                    const config = typeConfig[type];
                    return (
                      <section key={type} aria-label={`Quetes ${config.label}`}>
                        <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${config.bg}`}>
                          {type === "daily" && <Calendar className={`w-4 h-4 ${config.icon}`} />}
                          {type === "weekly" && <Flame className={`w-4 h-4 ${config.icon}`} />}
                          {type === "monthly" && <Trophy className={`w-4 h-4 ${config.icon}`} />}
                          <h3 className={`text-sm font-semibold ${config.text}`}>
                            {config.label}
                          </h3>
                          <span className={`text-xs ${config.text} opacity-70`}>
                            {typeQuests.filter((q) => q.status === "claimed").length}/{typeQuests.length}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {typeQuests.map((quest) => (
                            <QuestCard
                              key={quest.id}
                              quest={quest}
                              onClaim={claimQuest}
                              claiming={claiming === quest.id}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function QuestsLoading() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function QuestsEmpty({ onInit }: { onInit: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Gift className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium mb-1">Aucune quete disponible</p>
      <p className="text-sm text-gray-400 mb-6">
        Les quetes doivent etre initialisees.
      </p>
      <Button onClick={onInit} className="bg-blue-600 hover:bg-blue-700 text-white">
        Initialiser les quetes
      </Button>
    </div>
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

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isClaimed
          ? "border-gray-100 bg-gray-50/50 opacity-60"
          : isCompleted
          ? "border-green-200 bg-green-50/30 shadow-sm ring-1 ring-green-100"
          : "border-gray-200 bg-white hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icone */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isClaimed
              ? "bg-gray-100 text-gray-400"
              : isCompleted
              ? "bg-green-100 text-green-600"
              : `${typeConfig[quest.type].bg} ${typeConfig[quest.type].text}`
          }`}
        >
          {isClaimed ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            getQuestIcon(quest.slug)
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className={`font-semibold text-sm ${isClaimed ? "text-gray-400" : "text-gray-900"}`}>
              {quest.name}
            </h4>
            {isClaimed && (
              <CheckIcon className="w-4 h-4 text-green-500 shrink-0" />
            )}
          </div>
          <p className={`text-xs mb-2.5 ${isClaimed ? "text-gray-400" : "text-gray-500"}`}>
            {quest.description}
          </p>

          {/* Barre de progression */}
          <div className="mb-2.5">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={isClaimed ? "text-gray-400" : "text-gray-600"}>
                {quest.progress}/{quest.target}
              </span>
              <span className={isClaimed ? "text-gray-300" : "text-gray-400"}>
                {Math.round(progress)}%
              </span>
            </div>
            <div
              className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden"
              role="progressbar"
              aria-valuenow={quest.progress}
              aria-valuemin={0}
              aria-valuemax={quest.target}
              aria-label={`Progression: ${quest.progress} sur ${quest.target}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isClaimed
                    ? "bg-gray-300"
                    : isCompleted
                    ? "bg-green-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Recompenses */}
          <div className="flex items-center flex-wrap gap-2">
            {quest.rewards.map((reward, index) => (
              <div
                key={index}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  isClaimed ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-600"
                }`}
              >
                {reward.type === "points" && (
                  <>
                    <Image
                      src="/badge/points.png"
                      alt=""
                      width={14}
                      height={14}
                      className="object-contain"
                    />
                    <span>{reward.amount} pts</span>
                  </>
                )}
                {reward.type === "gems" && (
                  <>
                    <Image
                      src="/badge/diamond.png"
                      alt=""
                      width={14}
                      height={14}
                      className="object-contain"
                    />
                    <span>{reward.amount}</span>
                  </>
                )}
                {reward.type === "chest" && (
                  <>
                    <Image
                      src={`/coffre/${reward.chestType || "common"}_f.png`}
                      alt=""
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                    <span className="capitalize">{reward.chestType}</span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Bouton reclamer */}
          {isCompleted && !isClaimed && (
            <Button
              onClick={() => onClaim(quest.id)}
              disabled={claiming}
              size="sm"
              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Reclamation...
                </>
              ) : (
                "Reclamer les recompenses"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChestsInfo({ chests }: { chests: any[] }) {
  const getChestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      common: "Commun",
      rare: "Rare",
      epic: "Epique",
      legendary: "Legendaire",
    };
    return labels[type] || type;
  };

  const getCosmeticLabel = (cosmeticType?: string, cosmeticId?: string) => {
    if (!cosmeticType || !cosmeticId) return "";

    const labels: Record<string, Record<string, string>> = {
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

    return labels[cosmeticType]?.[cosmeticId] || `${cosmeticType} ${cosmeticId}`;
  };

  if (chests.length === 0) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Chargement des coffres...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Les coffres sont obtenus en completant des quetes. Voici les recompenses possibles :
      </p>

      {chests.map((chest: any) => (
        <div
          key={chest._id}
          className="border border-gray-200 rounded-xl overflow-hidden"
        >
          {/* En-tete du coffre */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
            <Image
              src={`/coffre/${chest.type}_f.png`}
              alt={chest.name}
              width={36}
              height={36}
              className="object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 text-sm">
                  {chest.name}
                </h4>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    chestTypeColors[chest.type as keyof typeof chestTypeColors]
                  } text-white font-medium`}
                >
                  {getChestTypeLabel(chest.type)}
                </span>
              </div>
              <p className="text-xs text-gray-500">{chest.description}</p>
            </div>
          </div>

          {/* Recompenses possibles */}
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {chest.possibleRewards.map((reward: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    {reward.type === "points" && (
                      <>
                        <Image
                          src="/badge/points.png"
                          alt=""
                          width={18}
                          height={18}
                          className="object-contain"
                        />
                        <span className="text-gray-700 text-xs font-medium">
                          {reward.amount} points
                        </span>
                      </>
                    )}
                    {reward.type === "gems" && (
                      <>
                        <Image
                          src="/badge/diamond.png"
                          alt=""
                          width={18}
                          height={18}
                          className="object-contain"
                        />
                        <span className="text-gray-700 text-xs font-medium">
                          {reward.amount} diamants
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
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
