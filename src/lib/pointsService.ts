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
  | 'completeQuiz';

/**
 * Ajoute des points a un utilisateur en appliquant le boost actif si present.
 * A utiliser partout ou on donne des points (gain uniquement).
 */
export async function addPointsWithBoost(
  userId: string,
  basePoints: number,
  action: PointAction,
  refs?: { question?: string; answer?: string; revision?: string }
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

  await PointTransaction.create(txData);

  return finalPoints;
}
