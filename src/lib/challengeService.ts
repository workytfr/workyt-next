import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Challenge, { IChallenge, IChallengeQuestion } from '@/models/Challenge';
import Quiz from '@/models/Quiz';
import Section from '@/models/Section';
import Course from '@/models/Course';
import { areFriends } from '@/lib/friendService';
import { getOrCreateHero } from '@/lib/heroService';

/**
 * Défis au quiz entre amis.
 *
 * Calibrage sur le niveau de héros MOYEN des deux joueurs : le nombre de
 * questions monte avec le niveau, le temps par question descend. Le `Quiz` du
 * site n'a aucun champ de difficulté — le niveau de héros est le seul signal
 * exploitable, et il reflète l'activité réelle.
 */

const oid = (id: string) => new mongoose.Types.ObjectId(id);

/** Plafond de défis en cours par joueur — un défi crée des écritures, pas de spam */
const MAX_ACTIVE = 5;
const EXPIRY_MS = 48 * 60 * 60 * 1000;

export function questionCountFor(level: number): number {
  return Math.min(10, Math.max(3, 3 + Math.floor(level / 5)));
}

export function secondsPerQuestionFor(level: number): number {
  return Math.max(15, 30 - Math.floor(level / 3));
}

/**
 * Tire des questions au hasard, éventuellement restreintes à une matière.
 *
 * On ne garde que les questions à choix parmi une liste avec une bonne réponse
 * numérique (QCM, Vrai/Faux) : les autres types du modèle Quiz — texte à trous,
 * classement, code — ne peuvent pas être corrigés automatiquement ici.
 */
async function sampleQuestions(
  count: number,
  matiere?: string | null
): Promise<IChallengeQuestion[]> {
  await dbConnect();

  const match: any = {};

  if (matiere) {
    // Course.matiere → Section.courseId → Quiz.sectionId
    const courses = await Course.find({ matiere }).select('_id').lean();
    if (courses.length === 0) return [];
    const sections = await Section.find({
      courseId: { $in: (courses as any[]).map((c) => c._id) }
    })
      .select('_id')
      .lean();
    if (sections.length === 0) return [];
    match.sectionId = { $in: (sections as any[]).map((s) => s._id) };
  }

  // On échantillonne les QUIZ puis on déplie leurs questions : $sample sur la
  // collection est bien plus efficace qu'un find() suivi d'un shuffle en JS.
  const quizzes = await Quiz.aggregate([
    { $match: match },
    { $sample: { size: Math.max(count * 3, 15) } },
    { $project: { questions: 1 } }
  ]);

  const pool: IChallengeQuestion[] = [];
  for (const quiz of quizzes as any[]) {
    for (const q of quiz.questions || []) {
      if (
        typeof q.question === 'string' &&
        Array.isArray(q.answers) &&
        q.answers.length >= 2 &&
        typeof q.correctAnswer === 'number' &&
        q.correctAnswer >= 0 &&
        q.correctAnswer < q.answers.length
      ) {
        pool.push({
          question: q.question,
          answers: q.answers,
          correctAnswer: q.correctAnswer,
          point: typeof q.point === 'number' && q.point > 0 ? q.point : 1
        });
      }
    }
  }

  // Mélange (Fisher-Yates) puis découpe
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/**
 * Crée un défi. L'adversaire doit être un ami accepté.
 */
export async function createChallenge(
  fromId: string,
  toId: string,
  matiere?: string | null
): Promise<{ success: boolean; message?: string; challengeId?: string }> {
  await dbConnect();

  if (fromId === toId) {
    return { success: false, message: 'Tu ne peux pas te défier toi-même' };
  }
  if (!(await areFriends(fromId, toId))) {
    return { success: false, message: 'Tu ne peux défier que tes amis' };
  }

  const active = await Challenge.countDocuments({
    challenger: oid(fromId),
    status: { $in: ['pending', 'active'] }
  });
  if (active >= MAX_ACTIVE) {
    return {
      success: false,
      message: `Tu as déjà ${MAX_ACTIVE} défis en cours. Termine-les avant d'en lancer un autre.`
    };
  }

  // Un défi déjà en cours avec cette personne ?
  const existing = await Challenge.findOne({
    status: { $in: ['pending', 'active'] },
    $or: [
      { challenger: oid(fromId), opponent: oid(toId) },
      { challenger: oid(toId), opponent: oid(fromId) }
    ]
  }).select('_id');
  if (existing) {
    return { success: false, message: 'Un défi est déjà en cours avec cette personne' };
  }

  const [heroA, heroB] = await Promise.all([
    getOrCreateHero(fromId),
    getOrCreateHero(toId)
  ]);
  const level = Math.max(1, Math.round((heroA.level + heroB.level) / 2));

  const questions = await sampleQuestions(questionCountFor(level), matiere);
  if (questions.length < 3) {
    return {
      success: false,
      message: matiere
        ? 'Pas assez de questions disponibles dans cette matière'
        : 'Pas assez de questions disponibles pour lancer un défi'
    };
  }

  const challenge = await Challenge.create({
    challenger: oid(fromId),
    opponent: oid(toId),
    status: 'pending',
    matiere: matiere || null,
    level,
    secondsPerQuestion: secondsPerQuestionFor(level),
    questions,
    expiresAt: new Date(Date.now() + EXPIRY_MS)
  });

  return { success: true, challengeId: challenge._id.toString() };
}

/**
 * L'adversaire accepte (le défi devient jouable) ou refuse.
 */
export async function respondToChallenge(
  challengeId: string,
  userId: string,
  accept: boolean
): Promise<{ success: boolean; message?: string; challengerId?: string }> {
  await dbConnect();

  const c = await Challenge.findById(challengeId);
  if (!c) return { success: false, message: 'Défi introuvable' };
  if (c.opponent.toString() !== userId) {
    return { success: false, message: 'Ce défi ne t\'est pas adressé' };
  }
  if (c.status !== 'pending') {
    return { success: false, message: 'Ce défi a déjà été traité' };
  }

  c.status = accept ? 'active' : 'declined';
  if (accept) c.startedAt = new Date();
  await c.save();

  return { success: true, challengerId: c.challenger.toString() };
}

type Side = 'challenger' | 'opponent';

function sideOf(c: IChallenge, userId: string): Side | null {
  if (c.challenger.toString() === userId) return 'challenger';
  if (c.opponent.toString() === userId) return 'opponent';
  return null;
}

/**
 * Le défi tel que le joueur doit le voir : SANS les bonnes réponses.
 */
export async function getPlayableChallenge(challengeId: string, userId: string) {
  await dbConnect();

  const c = await Challenge.findById(challengeId).lean<IChallenge>();
  if (!c) return null;

  const side = sideOf(c as any, userId);
  if (!side) return null; // pas un participant

  const mine = c.results[side];
  const other = c.results[side === 'challenger' ? 'opponent' : 'challenger'];
  const finished = !!mine.finishedAt;

  return {
    id: (c as any)._id.toString(),
    status: c.status,
    matiere: c.matiere,
    level: c.level,
    secondsPerQuestion: c.secondsPerQuestion,
    side,
    total: c.questions.length,
    answeredCount: mine.answers.length,
    myScore: mine.score,
    myFinished: finished,
    opponentFinished: !!other.finishedAt,
    // Le score adverse ne se révèle qu'une fois le défi terminé
    opponentScore: c.status === 'completed' ? other.score : null,
    winner: c.status === 'completed' ? (c.winner ? c.winner.toString() : null) : undefined,
    // ⚠️ Projection explicite : correctAnswer ne sort JAMAIS avant la fin
    questions: c.questions.map((q, i) => ({
      index: i,
      question: q.question,
      answers: q.answers,
      point: q.point,
      ...(finished ? { correctAnswer: q.correctAnswer } : {})
    }))
  };
}

/**
 * Enregistre une réponse. La correction est faite ici, jamais côté client.
 */
export async function answerChallenge(
  challengeId: string,
  userId: string,
  index: number,
  answerIndex: number
): Promise<{
  success: boolean;
  message?: string;
  isCorrect?: boolean;
  correctAnswer?: number;
  finished?: boolean;
  completed?: boolean;
}> {
  await dbConnect();

  const c = await Challenge.findById(challengeId);
  if (!c) return { success: false, message: 'Défi introuvable' };
  if (c.status !== 'active') return { success: false, message: 'Ce défi n\'est pas en cours' };

  const side = sideOf(c, userId);
  if (!side) return { success: false, message: 'Tu ne participes pas à ce défi' };

  const mine = c.results[side];
  if (mine.finishedAt) return { success: false, message: 'Tu as déjà terminé ce défi' };

  if (!Number.isInteger(index) || index < 0 || index >= c.questions.length) {
    return { success: false, message: 'Question invalide' };
  }
  // Les questions se jouent dans l'ordre : impossible de piocher ni de rejouer
  if (index !== mine.answers.length) {
    return { success: false, message: 'Question déjà répondue' };
  }

  const q = c.questions[index];
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= q.answers.length) {
    return { success: false, message: 'Réponse invalide' };
  }

  // Temps mesuré côté serveur. Le client peut mentir, pas la base.
  const previousAt = mine.answers.length
    ? mine.answers[mine.answers.length - 1].timeMs
    : 0;
  const elapsed = c.startedAt ? Date.now() - new Date(c.startedAt).getTime() : 0;
  const timeMs = Math.max(0, elapsed - previousAt);

  const isCorrect = answerIndex === q.correctAnswer;
  mine.answers.push({ index, answerIndex, isCorrect, timeMs: elapsed });
  if (isCorrect) mine.score += q.point;
  mine.totalTimeMs = elapsed;

  const finished = mine.answers.length >= c.questions.length;
  if (finished) mine.finishedAt = new Date();

  c.markModified(`results.${side}`);

  // Les deux ont terminé → on tranche
  const other = c.results[side === 'challenger' ? 'opponent' : 'challenger'];
  let completed = false;
  if (finished && other.finishedAt) {
    resolveWinner(c);
    completed = true;
  }

  await c.save();

  if (completed) await awardXp(c);

  return {
    success: true,
    isCorrect,
    correctAnswer: q.correctAnswer,
    finished,
    completed
  };
}

/** Meilleur score ; à égalité, le plus rapide l'emporte. */
function resolveWinner(c: IChallenge) {
  const a = c.results.challenger;
  const b = c.results.opponent;

  c.status = 'completed';
  if (a.score > b.score) c.winner = c.challenger;
  else if (b.score > a.score) c.winner = c.opponent;
  else if (a.totalTimeMs < b.totalTimeMs) c.winner = c.challenger;
  else if (b.totalTimeMs < a.totalTimeMs) c.winner = c.opponent;
  else c.winner = null; // égalité parfaite
}

/**
 * Points Workyt d'un défi terminé.
 *
 * Volontairement modeste : un défi se joue en deux minutes, il ne doit pas
 * peser autant qu'une fiche de révision (10 points). Le perdant touche quand
 * même quelque chose — refuser un défi ne doit jamais être la stratégie
 * rentable.
 */
const CHALLENGE_POINTS = { win: 5, loss: 1, draw: 3 };

/**
 * Quota journalier de points tirés des défis, par joueur.
 *
 * Deux amis peuvent enchaîner les défis toute la soirée : sans ce plafond, la
 * monnaie du site se fabrique à deux. Au-delà, les défis restent jouables et
 * comptent au classement, ils ne rapportent simplement plus.
 */
const MAX_CHALLENGE_POINTS_PER_DAY = 15;

/**
 * XP et points de fin de défi.
 *
 * Aucun dégât en PvP : un ami ne doit pas pouvoir vider tes PV et te bloquer
 * ta case de calendrier. Le PvE reste la seule source de dégâts.
 */
async function awardXp(c: IChallenge) {
  if (c.xpAwarded) return;

  try {
    const { grantChallengeXp } = await import('@/lib/heroService');
    const { awardPointsCapped } = await import('@/lib/pointsService');
    const winXp = 40 + 5 * c.level;
    const challengeId = (c as any)._id.toString();

    /** XP + points d'un joueur, chacun avec son propre quota du jour. */
    const reward = async (userId: string, xp: number, points: number) => {
      await grantChallengeXp(userId, xp);
      await awardPointsCapped(
        userId,
        points,
        'winChallenge',
        MAX_CHALLENGE_POINTS_PER_DAY,
        { challenge: challengeId }
      );
    };

    if (c.winner) {
      const loserId =
        c.winner.toString() === c.challenger.toString() ? c.opponent : c.challenger;
      await reward(c.winner.toString(), winXp, CHALLENGE_POINTS.win);
      await reward(loserId.toString(), 15, CHALLENGE_POINTS.loss);
    } else {
      await reward(c.challenger.toString(), 25, CHALLENGE_POINTS.draw);
      await reward(c.opponent.toString(), 25, CHALLENGE_POINTS.draw);
    }

    c.xpAwarded = true;
    await c.save();
  } catch (err) {
    console.error('Erreur attribution des gains de défi:', err);
  }

  // Prévenir les deux joueurs du résultat — ne doit jamais bloquer l'XP
  try {
    const { NotificationService } = await import('@/lib/notificationService');
    const { default: User } = await import('@/models/User');

    const [a, b] = await Promise.all([
      User.findById(c.challenger).select('username').lean<{ username: string }>(),
      User.findById(c.opponent).select('username').lean<{ username: string }>()
    ]);

    const challengerId = c.challenger.toString();
    const opponentId = c.opponent.toString();
    const challengeId = (c as any)._id.toString();

    const outcomeFor = (userId: string): 'win' | 'loss' | 'draw' => {
      if (!c.winner) return 'draw';
      return c.winner.toString() === userId ? 'win' : 'loss';
    };

    await Promise.all([
      NotificationService.notifyChallengeResult(
        challengerId, opponentId, challengeId, outcomeFor(challengerId), b?.username || 'ton adversaire'
      ),
      NotificationService.notifyChallengeResult(
        opponentId, challengerId, challengeId, outcomeFor(opponentId), a?.username || 'ton adversaire'
      )
    ]);
  } catch (err) {
    console.error('Erreur notification résultat de défi:', err);
  }
}

/**
 * Mes défis, dans les deux sens.
 */
export async function listChallenges(userId: string) {
  await dbConnect();

  const me = oid(userId);
  const rows = await Challenge.find({
    $or: [{ challenger: me }, { opponent: me }],
    status: { $in: ['pending', 'active', 'completed'] }
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('challenger', 'username')
    .populate('opponent', 'username')
    .select('-questions.correctAnswer -questions.answers') // jamais côté liste
    .lean();

  return (rows as any[]).map((c) => {
    const isChallenger = c.challenger._id.toString() === userId;
    const side = isChallenger ? 'challenger' : 'opponent';
    const mine = c.results[side];
    const other = c.results[isChallenger ? 'opponent' : 'challenger'];

    return {
      id: c._id.toString(),
      status: c.status,
      matiere: c.matiere,
      level: c.level,
      total: c.questions.length,
      opponent: isChallenger ? c.opponent : c.challenger,
      iAmChallenger: isChallenger,
      myScore: mine.score,
      myFinished: !!mine.finishedAt,
      opponentFinished: !!other.finishedAt,
      opponentScore: c.status === 'completed' ? other.score : null,
      outcome:
        c.status !== 'completed'
          ? null
          : !c.winner
            ? 'draw'
            : c.winner.toString() === userId
              ? 'win'
              : 'loss',
      createdAt: c.createdAt,
      expiresAt: c.expiresAt
    };
  });
}
