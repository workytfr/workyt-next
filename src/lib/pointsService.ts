import { Types } from 'mongoose';
import User from '@/models/User';
import PointTransaction from '@/models/PointTransaction';
import { MushroomService } from '@/lib/mushroomService';

type PointAction =
  | 'createRevision'
  | 'likeRevision'
  | 'unlikeRevision'
  | 'createAnswer'
  | 'likeAnswer'
  | 'unlikeAnswer'
  | 'validateAnswer'
  | 'createQuestion'
  | 'completeQuiz'
  | 'completeEvaluation'
  | 'createCourse'
  | 'verifyCourse'
  | 'createQuiz'
  | 'createExercisePack'
  | 'winChallenge'
  | 'completeAssignedResource'
  | 'reachMentorshipGoal'
  | 'mentorshipCheckin'
  | 'mentorshipDuoStreak'
  | 'clanReward';

/**
 * Ajoute des points a un utilisateur en appliquant le boost actif si present.
 * A utiliser partout ou on donne des points (gain uniquement).
 */
export async function addPointsWithBoost(
  userId: string,
  basePoints: number,
  action: PointAction,
  refs?: {
    question?: string;
    answer?: string;
    revision?: string;
    course?: string;
    quiz?: string;
    challenge?: string;
    mentorship?: string;
  }
): Promise<number> {
  if (basePoints <= 0) return 0;

  const multiplier = await MushroomService.getPointsMultiplier(userId);
  const finalPoints = Math.round(basePoints * multiplier);

  await User.findByIdAndUpdate(userId, { $inc: { points: finalPoints } });

  const txData: any = {
    user: userId,
    action,
    type: 'gain',
    points: finalPoints
  };
  if (refs?.question) txData.question = refs.question;
  if (refs?.answer) txData.answer = refs.answer;
  if (refs?.revision) txData.revision = refs.revision;
  if (refs?.course) txData.course = refs.course;
  if (refs?.quiz) txData.quiz = refs.quiz;
  if (refs?.challenge) txData.challenge = refs.challenge;
  if (refs?.mentorship) txData.mentorship = refs.mentorship;

  await PointTransaction.create(txData);

  // Guerre des Clans : chaque point compte deux fois — une fois pour l'assaut
  // du joueur, une fois pour le trésor de son clan.
  // Import dynamique + await volontairement absent : le crédit au clan ne doit
  // ni ralentir ni faire échouer l'attribution des points elle-même.
  void import('@/lib/clanService')
    .then(({ creditClanPoints }) => creditClanPoints(userId, finalPoints))
    .catch((err) => console.error('Erreur crédit clan:', err));

  return finalPoints;
}

/**
 * Attribue des points une seule fois par (utilisateur, action, contenu).
 * Utilise pour les recompenses de contribution (cours, quiz...) afin d'eviter
 * les doubles gains (ex: cours depublie puis republie, auteur retire puis re-ajoute).
 * Retourne 0 si la recompense a deja ete versee.
 */
export async function awardPointsOnce(
  userId: string,
  basePoints: number,
  action: PointAction,
  refs: { course?: string; quiz?: string }
): Promise<number> {
  if (basePoints <= 0) return 0;

  const query: any = { user: userId, action, type: 'gain' };
  if (refs.course) query.course = refs.course;
  if (refs.quiz) query.quiz = refs.quiz;

  const alreadyAwarded = await PointTransaction.exists(query);
  if (alreadyAwarded) return 0;

  return addPointsWithBoost(userId, basePoints, action, refs);
}

/**
 * Retire une recompense de contribution precedemment versee (ex: auteur retire
 * d'un cours publie, verification de cours annulee).
 * Supprime la transaction de gain (donc une re-attribution future redevient
 * possible via awardPointsOnce) et enregistre une perte pour la tracabilite.
 * Retourne le nombre de points retires (0 si rien n'avait ete verse).
 */
export async function revokePointsOnce(
  userId: string,
  action: PointAction,
  refs: { course?: string; quiz?: string }
): Promise<number> {
  const query: any = { user: userId, action, type: 'gain' };
  if (refs.course) query.course = refs.course;
  if (refs.quiz) query.quiz = refs.quiz;

  const tx = await PointTransaction.findOneAndDelete(query);
  if (!tx) return 0;

  await User.findByIdAndUpdate(userId, { $inc: { points: -tx.points } });

  const perteData: any = {
    user: userId,
    action,
    type: 'perte',
    points: tx.points
  };
  if (refs.course) perteData.course = refs.course;
  if (refs.quiz) perteData.quiz = refs.quiz;
  await PointTransaction.create(perteData);

  return tx.points;
}

/**
 * Attribue des points dans la limite d'un quota journalier pour cette action.
 *
 * Le quota se lit dans le grand livre (PointTransaction) et non dans un
 * compteur à part : le solde et le plafond decoulent ainsi de la meme source,
 * et une remise a zero manquee ne peut pas ouvrir la porte au farm.
 *
 * Le reliquat est verse s'il reste de la place : gagner 5 points quand il n'en
 * reste que 2 en credite 2. Retourne les points reellement credites.
 */
export async function awardPointsCapped(
  userId: string,
  basePoints: number,
  action: PointAction,
  maxPerDay: number,
  refs?: { challenge?: string; course?: string; quiz?: string; mentorship?: string },
  now: Date = new Date()
): Promise<{ awarded: number; capped: boolean }> {
  if (basePoints <= 0) return { awarded: 0, capped: false };

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const rows = await PointTransaction.aggregate([
    { $match: { user: new Types.ObjectId(userId), action, type: 'gain', createdAt: { $gte: dayStart } } },
    { $group: { _id: null, total: { $sum: '$points' } } }
  ]);
  const already = rows[0]?.total ?? 0;

  const room = Math.max(0, maxPerDay - already);
  if (room === 0) return { awarded: 0, capped: true };

  // Le quota porte sur les points de base : un boost actif peut donc faire
  // depasser legerement le plafond. C'est voulu — le boost se merite, il ne
  // doit pas etre annule par le garde-fou anti-farm.
  const toAward = Math.min(basePoints, room);
  const awarded = await addPointsWithBoost(userId, toAward, action, refs);
  return { awarded, capped: toAward < basePoints };
}
