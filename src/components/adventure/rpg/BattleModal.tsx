"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Lock, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MonsterSprite from './MonsterSprite';
import HeroLevelUpModal from './HeroLevelUpModal';
import { BATTLE_NARRATION } from '@/lib/monsters';
import { fetchHero, invalidateHero } from '@/lib/heroClient';

interface QuizState {
  available: boolean;
  /** Le chrono anti-triche tourne-t-il déjà ? */
  started?: boolean;
  question?: string;
  answers?: string[];
  solved?: boolean;
  correctAnswer?: number;
  explanation?: string | null;
}

interface MonsterInfo {
  name: string;
  emoji: string;
  hp: number;
  attack: number;
  isBoss: boolean;
  power?: 'poison' | 'brutal' | null;
  powerLabel?: string | null;
  taunts: string[];
  mockQuotes: string[];
  defeatQuotes: string[];
  critQuotes: string[];
}

const TURN_SECONDS = 30;
// Un héros niveau 1 tombe en ~10 coups : au-delà, la riposte auto ne sert
// plus qu'à consommer du serveur pour un onglet laissé ouvert.
const MAX_STRIKES = 12;

interface BattleModalProps {
  onSolved?: () => void;
}

/**
 * Arène de combat RPG : le quiz du jour présenté comme un duel contre
 * le monstre du jour, avec dialogues, dégâts et coups critiques.
 */
export default function BattleModal({ onSolved }: BattleModalProps) {
  const { data: session } = useSession();
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [monster, setMonster] = useState<MonsterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);
  const [dialogue, setDialogue] = useState<{ text: string; from: 'monster' | 'narrator' } | null>(null);
  const [monsterHit, setMonsterHit] = useState(false);
  const [heroHit, setHeroHit] = useState<{ damage: number; critical?: boolean } | null>(null);
  const [heroDefense, setHeroDefense] = useState(1);
  const [victory, setVictory] = useState<{ xp: number; critical: boolean } | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; rewards?: { points: number; gems: number; mushrooms: number; equipment: boolean } } | null>(null);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [striking, setStriking] = useState(false);
  const [starting, setStarting] = useState(false);
  // Engagement de CETTE visite. Volontairement local : `quiz.started` dit que le
  // chrono serveur tourne depuis un précédent passage, et s'y fier faisait
  // repartir le décompte tout seul à l'ouverture de la page, sans que l'élève
  // ait cliqué. Il doit toujours entrer dans le combat de son plein gré.
  const [engaged, setEngaged] = useState(false);
  const [heroFainted, setHeroFainted] = useState(false);
  // Nombre de ripostes automatiques déjà déclenchées sur ce combat
  const strikeCountRef = useRef(0);

  // Le combat n'est « actif » (donc le minuteur ne tourne) que si une riposte
  // a encore un sens : quiz jouable, héros debout, monstre éveillé.
  const battleActive = !!quiz?.available
    && !quiz?.solved
    && engaged
    && !!session
    && !heroFainted
    && !!monster
    && !(monster as any).sleeping;

  const fetchAll = useCallback(async () => {
    try {
      // fetchHero mutualise /api/hero avec AdventureBoard (même page)
      const [quizRes, heroData] = await Promise.all([
        fetch('/api/daily-quiz/play'),
        fetchHero()
      ]);
      if (quizRes.ok) setQuiz(await quizRes.json());
      else setQuiz({ available: false });
      if (heroData) {
        if (heroData.hero?.defense) setHeroDefense(heroData.hero.defense);
        if (heroData.hero?.fainted) setHeroFainted(true);
        if (heroData.monster) {
          setMonster(heroData.monster);
          if (!heroData.monster.sleeping && heroData.monster.taunts?.length) {
            const taunts = heroData.monster.taunts;
            setDialogue({ text: taunts[Math.floor(Math.random() * taunts.length)], from: 'monster' });
          }
        }
      }
    } catch {
      setQuiz({ available: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchAll();
    else setLoading(false);
  }, [session, fetchAll]);

  // ⏱️ Minuteur anti-triche : à 0, le monstre attaque et le tour recommence.
  // Le minuteur s'arrête si l'onglet est en arrière-plan (sinon un onglet
  // oublié envoyait un POST monster-strike toutes les 30 s, indéfiniment).
  useEffect(() => {
    if (!battleActive) return;
    if (strikeCountRef.current >= MAX_STRIKES) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval) return;
      interval = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            monsterStrike();
            return TURN_SECONDS;
          }
          return t - 1;
        });
      }, 1000);
    };
    const stop = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleActive]);

  const monsterStrike = async () => {
    if (striking || heroFainted) return;
    // Garde-fou : au-delà, le combat s'arrête au lieu de taper le serveur
    if (strikeCountRef.current >= MAX_STRIKES) return;
    strikeCountRef.current += 1;
    setStriking(true);
    try {
      const res = await fetch('/api/hero/monster-strike', { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.fainted) setHeroFainted(true);
      // Le minuteur ne fait plus de dégâts : il fait monter la pression.
      // Chaque tour écoulé grignote le multiplicateur d'XP côté serveur.
      setDialogue({
        text: `⏰ ${monster?.name || 'Le monstre'} ricane… Plus tu hésites, moins la victoire rapportera !`,
        from: 'narrator'
      });
    } catch {
      // silencieux
    } finally {
      setStriking(false);
    }
  };

  /**
   * Démarre le chrono anti-triche. Tant que l'élève n'a pas cliqué, la
   * question reste masquée et rien n'est décompté — parcourir la page ne
   * doit jamais coûter de récompense.
   *
   * Si le chrono avait déjà été lancé aujourd'hui, le serveur ignore l'appel
   * et garde l'heure d'origine : rouvrir la page ne remet rien à zéro.
   */
  const startBattle = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const res = await fetch('/api/daily-quiz/start', { method: 'POST' });
      if (!res.ok) return;
      setEngaged(true);
      setQuiz((prev) => (prev ? { ...prev, started: true } : prev));
      setTimeLeft(TURN_SECONDS);
      strikeCountRef.current = 0;
    } catch {
      /* silencieux : réessayer suffit */
    } finally {
      setStarting(false);
    }
  };

  const submit = async (index: number) => {
    setSubmitting(true);
    setSelected(index);
    setHeroHit(null);
    try {
      const res = await fetch('/api/daily-quiz/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerIndex: index })
      });
      const data = await res.json();
      if (!res.ok) return;
      invalidateHero(); // XP/HP modifiés par le combat

      if (data.isCorrect) {
        // Victoire : le monstre prend le coup
        setMonsterHit(true);
        const critical = data.battle?.critical === true;
        if (critical && monster?.critQuotes?.length) {
          setDialogue({
            text: monster.critQuotes[Math.floor(Math.random() * monster.critQuotes.length)],
            from: 'monster'
          });
        }
        setTimeout(() => {
          setVictory({ xp: data.battle?.xpGained || 0, critical });
          if (monster?.defeatQuotes?.length) {
            setDialogue({
              text: monster.defeatQuotes[Math.floor(Math.random() * monster.defeatQuotes.length)],
              from: 'monster'
            });
          }
          setQuiz(prev => prev ? {
            ...prev,
            solved: true,
            correctAnswer: data.correctAnswer,
            explanation: data.explanation
          } : prev);
          // Le narrateur commente la victoire après la phrase du monstre
          setTimeout(() => {
            setDialogue({
              text: BATTLE_NARRATION.heroVictory[Math.floor(Math.random() * BATTLE_NARRATION.heroVictory.length)],
              from: 'narrator'
            });
          }, 2500);
          if (data.battle?.leveledUp) setLevelUp({ level: data.battle.newLevel, rewards: data.battle.levelRewards });
          onSolved?.();
        }, critical ? 1200 : 800);
      } else {
        // Défaite partielle : le monstre riposte ET se moque
        const newWrong = [...wrongAnswers, index];
        setWrongAnswers(newWrong);
        setSelected(null);
        setTimeLeft(TURN_SECONDS); // nouveau tour, nouveau minuteur
        const damage = data.battle?.damage || 1;
        setHeroHit({ damage, critical: data.battle?.critical === true });
        if (data.battle?.fainted) {
          setHeroFainted(true);
          setDialogue({ text: BATTLE_NARRATION.fainted[0], from: 'narrator' });
        } else if (monster?.mockQuotes?.length) {
          // Alternance : moquerie du monstre, puis encouragement du narrateur
          const mocks = monster.mockQuotes;
          const useMock = newWrong.length % 2 === 1;
          setDialogue(useMock
            ? { text: mocks[(newWrong.length - 1) % mocks.length], from: 'monster' }
            : { text: BATTLE_NARRATION.heroDefeat[Math.floor(Math.random() * BATTLE_NARRATION.heroDefeat.length)], from: 'narrator' }
          );
        }
        setTimeout(() => setHeroHit(null), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="rounded-xl border border-white/20 bg-white/50 p-4 flex items-center gap-3">
        <Lock className="h-5 w-5 text-gray-400 shrink-0" />
        <p className="text-sm text-gray-600">
          Connectez-vous pour combattre le monstre du jour et débloquer votre récompense.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/20 bg-white/50 p-6 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  // Pas de quiz aujourd'hui : monstre endormi, récompense libre — rien à afficher
  if (!quiz?.available) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-red-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 space-y-4 text-white">
      {/* En-tête arène */}
      <div className="flex items-center gap-2">
        <Swords className="h-5 w-5 text-red-400" />
        <h3 className="font-bold text-red-100">
          Combat du jour {monster?.isBoss && <span className="ml-1 text-xs font-extrabold text-red-400 tracking-widest">— BOSS DU DONJON</span>}
        </h3>
        {quiz.solved && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-green-200 bg-green-500/20 px-2 py-1 rounded-full">
            <Check className="h-3 w-3" /> Victoire
          </span>
        )}
      </div>

      {/* Zone du monstre + dialogue */}
      {monster && (
        <div className="flex items-center gap-4">
          <motion.div
            animate={monsterHit ? { x: [0, -12, 8, -4, 0], opacity: quiz.solved ? [1, 0.4] : 1, rotate: quiz.solved ? [0, -20] : 0 } : {}}
            transition={{ duration: 0.5 }}
            className="relative shrink-0"
          >
            <MonsterSprite emoji={monster.emoji} isBoss={monster.isBoss} defeated={quiz.solved} size="lg" />
            {monsterHit && !quiz.solved && (
              <motion.span
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -30 }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 text-yellow-400 font-extrabold text-lg"
              >
                💥
              </motion.span>
            )}
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-red-200">{monster.name}</p>
              {/* Stats visibles du monstre (comme dans un vrai RPG) */}
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-orange-300 bg-orange-500/15 border border-orange-400/30 px-1.5 py-0.5 rounded">
                ⚔️ ATK {monster.attack}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-300 bg-rose-500/15 border border-rose-400/30 px-1.5 py-0.5 rounded">
                💥 -{Math.max(1, monster.attack - heroDefense)} PV/erreur
              </span>
              {monster.powerLabel && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-lime-300 bg-lime-500/15 border border-lime-400/30 px-1.5 py-0.5 rounded">
                  {monster.powerLabel}
                </span>
              )}
            </div>
            {/* Bulle de dialogue */}
            <AnimatePresence mode="wait">
              {dialogue && (
                <motion.div
                  key={dialogue.text}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'relative mt-1 rounded-xl px-3 py-2 text-sm italic',
                    dialogue.from === 'monster'
                      ? 'bg-red-500/15 text-red-100 border border-red-400/30'
                      : 'bg-indigo-500/15 text-indigo-100 border border-indigo-400/30'
                  )}
                >
                  {dialogue.from === 'narrator' && '📢 '}{dialogue.text}
                </motion.div>
              )}
            </AnimatePresence>
            {/* Dégâts sur le héros */}
            <AnimatePresence>
              {heroHit && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  className="mt-1"
                >
                  <p className="text-red-400 font-extrabold text-lg">
                    -{heroHit.damage} ❤️
                  </p>
                  {heroHit.critical && (
                    <p className="text-orange-400 font-extrabold text-xs">💥 COUP CRITIQUE DU MONSTRE !</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {/* XP de victoire */}
            {victory && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 font-extrabold text-yellow-300"
              >
                {victory.critical && '⚡ COUP CRITIQUE ! '}+{victory.xp} XP
              </motion.p>
            )}
          </div>
        </div>
      )}

      {/* La question = l'attaque */}
      {!quiz.solved ? (
        <>
          {/* Minuteur — n'apparaît qu'une fois le combat lancé : afficher un
              compte à rebours figé avant le départ serait trompeur. */}
          {engaged && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">⏱️ Temps pour répondre</span>
              <span className={timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-slate-300'}>
                {timeLeft}s
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-1000',
                  timeLeft <= 10 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-sky-400 to-indigo-400'
                )}
                style={{ width: `${(timeLeft / TURN_SECONDS) * 100}%` }}
              />
            </div>
            {timeLeft <= 10 && (
              <p className="text-[11px] text-red-300 font-semibold">Le monstre s&apos;apprête à attaquer…</p>
            )}
          </div>
          )}

          {!engaged ? (
            <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-center">
              <p className="text-sm font-semibold text-amber-100">
                {quiz.started
                  ? `${monster?.name || 'Le monstre'} t'attend toujours…`
                  : `Prêt à affronter ${monster?.name || 'le monstre'} ?`}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-amber-200/80">
                {quiz.started ? (
                  <>
                    Tu as déjà découvert la question aujourd&apos;hui : le chrono a
                    démarré à ce moment-là et ne repart pas de zéro. Réponds dès que
                    tu es prêt.
                  </>
                ) : (
                  <>
                    Le chrono ne démarre qu&apos;au clic — tu peux lire le reste de la
                    page sans rien perdre. Plus tu réponds vite, plus tu gagnes
                    d&apos;XP ; prendre le temps de réfléchir ne coûte jamais de points
                    de vie.
                  </>
                )}
              </p>
              <Button
                onClick={startBattle}
                disabled={starting}
                className="mt-3 bg-amber-500 font-bold text-slate-900 hover:bg-amber-400"
              >
                {starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : quiz.started ? (
                  <>⚔️ Reprendre le combat</>
                ) : (
                  <>⚔️ Commencer le combat</>
                )}
              </Button>
            </div>
          ) : (
          <>
          <p className="text-sm font-semibold text-slate-100">{quiz.question}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quiz.answers?.map((answer, i) => {
              const isWrong = wrongAnswers.includes(i);
              return (
                <Button
                  key={i}
                  variant="outline"
                  disabled={submitting || isWrong}
                  onClick={() => submit(i)}
                  className={cn(
                    'justify-start h-auto py-2.5 text-left whitespace-normal bg-white/5 border-white/20 text-white hover:bg-red-500/20 hover:border-red-400/50 hover:text-white',
                    isWrong && 'border-red-500/50 bg-red-500/10 text-red-300 opacity-60'
                  )}
                >
                  {submitting && selected === i ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                  ) : isWrong ? (
                    <X className="h-4 w-4 mr-2 shrink-0" />
                  ) : (
                    <span className="mr-2">⚔️</span>
                  )}
                  {answer}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">
            {wrongAnswers.length > 0
              ? 'Le monstre a riposté ! Attaque à nouveau avec une autre réponse.'
              : 'Bonne réponse = attaque réussie · Bonne réponse du 1er coup = CRITIQUE (XP ×1.5)'}
          </p>
          </>
          )}
        </>
      ) : (
        <div className="text-sm space-y-1">
          <p className="text-green-300 font-bold">
            🏆 Victoire ! Ta récompense du jour est débloquée sur le plateau.
          </p>
          {quiz.explanation && <p className="text-slate-300 text-xs">{quiz.explanation}</p>}
        </div>
      )}

      {/* Level-up */}
      <HeroLevelUpModal level={levelUp?.level ?? null} rewards={levelUp?.rewards} onClose={() => setLevelUp(null)} />
    </div>
  );
}
