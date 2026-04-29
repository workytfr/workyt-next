"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import {
  MessageCircle,
  BookOpen,
  Calculator,
  FlaskConical,
  Landmark,
  CheckCircle2,
  Clock,
  Sparkles as SparklesIcon,
} from "lucide-react";

interface ForumCard {
  id: string;
  subject: string;
  subjectColor: string;
  icon: React.ReactNode;
  userName: string;
  question: string;
  answer: string;
  answererName: string;
  timeAgo: string;
  upvotes: number;
}

const FORUM_CARDS: ForumCard[] = [
  {
    id: "math-card",
    subject: "Maths",
    subjectColor: "#ff6a1a",
    icon: <Calculator className="h-3 w-3" />,
    userName: "Léa M.",
    question: "Comment factoriser x² − 5x + 6 ?",
    answer: "Deux nombres de produit 6 et somme −5 → (x−2)(x−3).",
    answererName: "Thomas B.",
    timeAgo: "il y a 2 min",
    upvotes: 14,
  },
  {
    id: "fr-card",
    subject: "Français",
    subjectColor: "#e0315a",
    icon: <BookOpen className="h-3 w-3" />,
    userName: "Emma R.",
    question: "Analyse de la Princesse de Clèves ?",
    answer: "Personnage tragique tiraillé entre devoir et passion.",
    answererName: "Sophie L.",
    timeAgo: "il y a 5 min",
    upvotes: 23,
  },
  {
    id: "phy-card",
    subject: "Physique",
    subjectColor: "#0aa393",
    icon: <FlaskConical className="h-3 w-3" />,
    userName: "Lucas P.",
    question: "Vitesse d'un objet en chute libre ?",
    answer: "v = g × t, avec g ≈ 9,81 m/s². Facile !",
    answererName: "Inès K.",
    timeAgo: "il y a 8 min",
    upvotes: 9,
  },
  {
    id: "hist-card",
    subject: "Histoire",
    subjectColor: "#8d3bff",
    icon: <Landmark className="h-3 w-3" />,
    userName: "Noah D.",
    question: "Causes principales de la Révolution ?",
    answer: "Crise financière, inégalités, Lumières.",
    answererName: "Clara V.",
    timeAgo: "il y a 12 min",
    upvotes: 31,
  },
];

function ForumCardItem({ card, index }: { card: ForumCard; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300 + index * 180);
    return () => clearTimeout(t);
  }, [index]);

  const tilt = index % 2 === 0 ? 1.2 : -1.4;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ rotate: `${tilt}deg` }}
          className="group relative rounded-2xl border border-[rgba(26,21,18,0.08)] bg-white/95 p-3.5 shadow-[0_8px_30px_-10px_rgba(26,21,18,0.18)] backdrop-blur-sm transition-transform hover:rotate-0 hover:scale-[1.02]"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: card.subjectColor }}
            >
              {card.icon}
              {card.subject}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[rgba(26,21,18,0.5)]">
              <Clock className="h-2.5 w-2.5" />
              {card.timeAgo}
            </span>
          </div>

          {/* Question */}
          <div className="mt-2.5 flex items-start gap-2">
            <AvatarDisplay name={card.userName} size="xs" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-medium text-[rgba(26,21,18,0.55)]">
                {card.userName} demande
              </div>
              <div className="mt-0.5 flex items-start gap-1">
                <MessageCircle className="mt-0.5 h-3 w-3 shrink-0 text-[rgba(26,21,18,0.35)]" />
                <p className="text-[12px] font-medium leading-snug text-[var(--wk-ink)]">
                  {card.question}
                </p>
              </div>
            </div>
          </div>

          {/* Answer */}
          <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-[rgba(126,217,87,0.1)] p-2.5">
            <AvatarDisplay name={card.answererName} size="xs" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-[var(--wk-ink)]">
                  {card.answererName}
                </span>
                <CheckCircle2 className="h-3 w-3 text-[#5ba83f]" />
                <span className="ml-auto font-mono-ui text-[10px] font-semibold text-[#5ba83f]">
                  +{card.upvotes}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-[rgba(26,21,18,0.75)]">
                {card.answer}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function HeroForumCards() {
  return (
    <div className="relative w-full">
      {/* Header "Live activity" */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-3 flex items-center justify-between rounded-2xl border border-[rgba(26,21,18,0.08)] bg-white/80 px-4 py-2.5 backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7ed957] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#5ba83f]" />
          </span>
          <span className="font-mono-ui text-[11px] font-semibold uppercase tracking-widest text-[var(--wk-ink)]">
            Forum · en direct
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-medium text-[rgba(26,21,18,0.6)]">
          <SparklesIcon className="h-3 w-3 text-[var(--wk-accent)]" />
          142 en ligne
        </span>
      </motion.div>

      {/* Stacked cards */}
      <div className="flex flex-col gap-3">
        {FORUM_CARDS.map((card, i) => (
          <ForumCardItem key={card.id} card={card} index={i} />
        ))}
      </div>

    </div>
  );
}
