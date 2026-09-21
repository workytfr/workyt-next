import connectDB from '@/lib/mongodb';
import Mentorship from '@/models/Mentorship';
import MentorshipMessage from '@/models/MentorshipMessage';
import { notify, notifyModerators } from '@/lib/mentorship/notify';
import { releaseToQueue, advanceDuoStreaks } from '@/lib/mentorship/service';
import { emitMentorshipChanged } from '@/lib/realtime/emit';
import {
  CHECKIN_INTERVAL_DAYS,
  ESCALATE_PENDING_HOURS,
  EXPIRE_PENDING_DAYS,
  MENTOR_REMINDER_DAYS,
  MENTOR_TIMEOUT_DAYS,
  STUDENT_REMINDER_DAYS
} from '@/lib/mentorship/config';

/**
 * Relances automatiques du suivi personnalisé — appelées chaque jour par le
 * cron d'instrumentation.ts. Chaque étape est idempotente (marqueurs de date
 * sur le suivi) : un double passage ne relance jamais deux fois.
 *
 * Le principe : les bénévoles disparaissent parfois, c'est normal. Le système
 * doit l'absorber sans que l'élève le subisse.
 */

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

export async function runMentorshipDaily(): Promise<Record<string, number>> {
  await connectDB();
  const counts = { escalated: 0, expired: 0, mentorReminded: 0, released: 0, studentReminded: 0, checkins: 0 };

  // 1. Demande en file depuis 48 h → la modération est alertée (une fois)
  const late = await Mentorship.find({
    status: 'pending',
    createdAt: { $lte: new Date(Date.now() - ESCALATE_PENDING_HOURS * 3600 * 1000) },
    escalatedAt: { $exists: false }
  }).limit(100);
  for (const m of late) {
    m.escalatedAt = new Date();
    await m.save();
    await notifyModerators(String(m.student), String(m._id), 'Demande de suivi en attente', `Une demande en ${m.subject} (${m.level}) attend un bénévole depuis plus de ${ESCALATE_PENDING_HOURS} h.`);
    counts.escalated++;
  }

  // 2. Demande restée trop longtemps sans bénévole → fermée honnêtement.
  //    Les reprises après relais ne sont jamais fermées : l'élève a déjà été suivi.
  const stale = await Mentorship.find({
    status: 'pending',
    createdAt: { $lte: ago(EXPIRE_PENDING_DAYS) },
    'mentorHistory.0': { $exists: false }
  }).limit(100);
  for (const m of stale) {
    m.status = 'cancelled';
    m.closedAt = new Date();
    await m.save();
    await MentorshipMessage.create({
      mentorship: m._id,
      authorRole: 'system',
      kind: 'event',
      text: 'Aucun bénévole n’a pu prendre cette demande à temps, et nous en sommes désolés. Tu peux refaire une demande quand tu veux, et le forum reste ouvert à tes questions.',
      meta: { event: 'expired' }
    });
    await notify('mentorship_update', String(m.student), String(m.student), String(m._id), 'Ta demande de suivi a expiré', 'Aucun bénévole n’a pu la prendre à temps. Tu peux en refaire une quand tu veux.');
    counts.expired++;
  }

  // 3. L'élève attend une réponse du bénévole
  //    (dernier geste de l'élève postérieur au dernier geste du bénévole)
  const waiting = await Mentorship.find({
    status: 'active',
    mentor: { $ne: null },
    lastStudentActivityAt: { $lte: ago(MENTOR_REMINDER_DAYS) },
    $expr: { $gt: ['$lastStudentActivityAt', { $ifNull: ['$lastMentorActivityAt', new Date(0)] }] }
  }).limit(200);
  for (const m of waiting) {
    const waitingSince = m.lastStudentActivityAt!;
    if (waitingSince <= ago(MENTOR_TIMEOUT_DAYS)) {
      // 3b. … depuis 7 jours → relais automatique, sans rien perdre
      const r = await releaseToQueue(m, 'timeout', `Relais automatique : pas de réponse du bénévole précédent depuis ${MENTOR_TIMEOUT_DAYS} jours.`);
      if (r.ok) counts.released++;
    } else if (!m.mentorReminderAt) {
      // 3a. … depuis 3 jours → un rappel, un seul
      m.mentorReminderAt = new Date();
      await m.save();
      await notify('mentorship_update', String(m.mentor), String(m.student), String(m._id), 'Ton élève attend ta réponse', `Le suivi en ${m.subject} attend un message de ta part. Si tu manques de temps, tu peux le mettre en pause ou passer la main.`);
      counts.mentorReminded++;
    }
  }

  // 4. L'élève ne donne plus de nouvelles → un petit rappel (pas de relance en boucle)
  const quiet = await Mentorship.find({
    status: 'active',
    lastStudentActivityAt: { $lte: ago(STUDENT_REMINDER_DAYS) },
    $or: [{ studentReminderAt: { $exists: false } }, { studentReminderAt: { $lte: ago(STUDENT_REMINDER_DAYS) } }]
  }).limit(200);
  for (const m of quiet) {
    m.studentReminderAt = new Date();
    await m.save();
    await notify('mentorship_update', String(m.student), String(m.mentor || m.student), String(m._id), 'Ton bénévole t’attend', `Un petit message pour dire où tu en es en ${m.subject} ?`);
    counts.studentReminded++;
  }

  // 5. Points d'étape toutes les 2 semaines
  const due = await Mentorship.find({ status: 'active', nextCheckinAt: { $lte: new Date() } }).limit(300);
  for (const m of due) {
    m.checkin = { askedAt: new Date(), rewarded: false };
    m.nextCheckinAt = new Date(Date.now() + CHECKIN_INTERVAL_DAYS * DAY);
    await m.save();
    await MentorshipMessage.create({
      mentorship: m._id,
      authorRole: 'system',
      kind: 'checkin',
      text: 'Point d’étape : comment ça se passe depuis deux semaines ?'
    });
    await notify('mentorship_checkin', String(m.student), String(m.mentor || m.student), String(m._id), 'Point d’étape', 'Dis à ton bénévole où tu en es — ça prend 10 secondes.');
    if (m.mentor) {
      await notify('mentorship_checkin', String(m.mentor), String(m.student), String(m._id), 'Point d’étape', `C’est le moment de faire le point avec ton élève en ${m.subject}.`);
    }
    emitMentorshipChanged(m.roomKey);
    counts.checkins++;
  }

  return counts;
}

export async function runMentorshipWeekly() {
  await connectDB();
  return advanceDuoStreaks();
}
