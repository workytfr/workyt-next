import mongoose from 'mongoose';
import Mentorship, { IMentorship } from '@/models/Mentorship';
import MentorshipMessage from '@/models/MentorshipMessage';
import MentorProfile from '@/models/MentorProfile';
import User from '@/models/User';
import { activeLoadByMentor } from './notify';
import type { SuiviViewerRole } from './access';

/**
 * Ce que chacun a le droit de voir d'un suivi.
 *
 *  - l'élève : tout, sauf les notes privées du bénévole et le mot de relais ;
 *  - le bénévole en charge et la modération : tout ;
 *  - un bénévole « candidat » (demande en file) : la demande seule.
 */

export interface PublicUser {
  id: string;
  username: string;
  role?: string;
}

async function usersById(ids: unknown[]): Promise<Map<string, PublicUser>> {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (!unique.length) return new Map();
  const users = await User.find({ _id: { $in: unique } })
    .select('username role')
    .lean<{ _id: mongoose.Types.ObjectId; username: string; role: string }[]>();
  return new Map(users.map((u) => [u._id.toString(), { id: u._id.toString(), username: u.username, role: u.role }]));
}

function iso(d?: Date | null) {
  return d ? new Date(d).toISOString() : null;
}

export async function serializeMentorship(m: IMentorship, viewer: SuiviViewerRole) {
  const users = await usersById([m.student, m.mentor, ...m.mentorHistory.map((h) => h.mentor)]);
  const mentorProfile = m.mentor
    ? await MentorProfile.findOne({ user: m.mentor }).select('bio subjects').lean<{ bio: string; subjects: string[] }>()
    : null;

  const base = {
    id: m._id.toString(),
    status: m.status,
    format: m.format,
    subject: m.subject,
    level: m.level,
    need: m.need,
    goalType: m.goalType,
    availability: m.availability,
    createdAt: iso(m.createdAt),
    student: users.get(String(m.student)) || null,
    viewer
  };

  if (viewer === 'candidate') {
    // Un bénévole qui hésite à prendre la demande voit la demande et le mot de
    // relais éventuel (pour savoir s'il s'agit d'une reprise), rien d'autre.
    return { ...base, handoffNote: m.handoffNote || null, resumed: m.mentorHistory.length > 0 };
  }

  const staff = viewer === 'mentor' || viewer === 'moderator';

  return {
    ...base,
    roomKey: m.roomKey,
    mentor: m.mentor
      ? { ...(users.get(String(m.mentor)) || { id: String(m.mentor), username: 'Bénévole' }), bio: mentorProfile?.bio || '' }
      : null,
    matchedAt: iso(m.matchedAt),
    pausedAt: iso(m.pausedAt),
    closedAt: iso(m.closedAt),
    goals: m.goals.map((g) => ({
      id: String(g._id),
      title: g.title,
      done: g.done,
      doneAt: iso(g.doneAt)
    })),
    assignments: m.assignments.map((a) => ({
      id: String(a._id),
      kind: a.kind,
      title: a.title,
      url: a.url,
      note: a.note || '',
      dueAt: iso(a.dueAt),
      assignedAt: iso(a.assignedAt),
      doneAt: iso(a.doneAt),
      doneSource: a.doneSource || null,
      alreadyDone: !!a.alreadyDone,
      score: a.score ?? null,
      maxScore: a.maxScore ?? null
    })),
    checkin: m.checkin?.askedAt
      ? { askedAt: iso(m.checkin.askedAt), answeredAt: iso(m.checkin.answeredAt), mood: m.checkin.mood || null }
      : null,
    nextCheckinAt: iso(m.nextCheckinAt),
    duoStreak: { current: m.duoStreak?.current || 0, best: m.duoStreak?.best || 0 },
    lastReadAt: { student: iso(m.lastReadAt?.student), mentor: iso(m.lastReadAt?.mentor) },
    closure: m.closure?.outcome
      ? {
          outcome: m.closure.outcome,
          summary: m.closure.summary || '',
          studentFeedback: m.closure.studentFeedback || null,
          byStudent: String(m.closure.by) === String(m.student)
        }
      : null,
    // Réservé au bénévole et à la modération
    mentorNotes: staff ? m.mentorNotes : undefined,
    handoffNote: staff ? m.handoffNote || null : undefined,
    mentorHistory: staff
      ? m.mentorHistory.map((h) => ({
          mentor: users.get(String(h.mentor)) || { id: String(h.mentor), username: 'Bénévole' },
          from: iso(h.from),
          to: iso(h.to),
          reason: h.reason || null,
          note: h.note || ''
        }))
      : undefined
  };
}

/** Le fil d'un suivi. Les messages bloqués ne sont visibles que de leur auteur et de la modération. */
export async function listMessages(m: IMentorship, viewer: SuiviViewerRole, userId: string, since?: Date | null) {
  const filter: Record<string, unknown> = { mentorship: m._id };
  if (since) filter.createdAt = { $gt: since };
  if (viewer !== 'moderator') {
    filter.$or = [{ status: 'visible' }, { status: 'blocked', author: new mongoose.Types.ObjectId(userId) }];
  }

  const messages = await MentorshipMessage.find(filter).sort({ createdAt: 1 }).limit(since ? 200 : 500).lean<any[]>();
  const users = await usersById(messages.map((x) => x.author));

  return messages.map((x) => ({
    id: x._id.toString(),
    authorRole: x.authorRole,
    author: x.author ? users.get(String(x.author)) || null : null,
    kind: x.kind,
    text: x.text,
    attachment: x.attachment?.key
      ? {
          name: x.attachment.name,
          mime: x.attachment.mime,
          url: `/api/suivi/${m._id.toString()}/messages/${x._id.toString()}/attachment`
        }
      : null,
    meta: x.meta
      ? {
          assignmentId: x.meta.assignmentId ? String(x.meta.assignmentId) : null,
          goalId: x.meta.goalId ? String(x.meta.goalId) : null,
          mood: x.meta.mood || null,
          event: x.meta.event || null
        }
      : null,
    status: x.status,
    blockedReasons: x.status === 'blocked' ? x.blockedReasons || [] : undefined,
    createdAt: iso(x.createdAt)
  }));
}

/** Résumé d'un suivi pour les listes (pas de contenu de conversation) */
async function summarize(list: IMentorship[], perspective: 'student' | 'mentor' | 'moderator', userId?: string) {
  const users = await usersById(list.flatMap((m) => [m.student, m.mentor]));
  const unread = new Map<string, number>();

  if (userId && list.length) {
    // Messages non lus : postérieurs au dernier passage, écrits par quelqu'un d'autre
    await Promise.all(
      list.map(async (m) => {
        const readAt = perspective === 'student' ? m.lastReadAt?.student : m.lastReadAt?.mentor;
        const n = await MentorshipMessage.countDocuments({
          mentorship: m._id,
          status: 'visible',
          author: { $ne: new mongoose.Types.ObjectId(userId) },
          ...(readAt ? { createdAt: { $gt: readAt } } : {})
        });
        unread.set(m._id.toString(), n);
      })
    );
  }

  return list.map((m) => ({
    id: m._id.toString(),
    status: m.status,
    format: m.format,
    subject: m.subject,
    level: m.level,
    goalType: m.goalType,
    need: perspective === 'student' ? undefined : m.need,
    student: users.get(String(m.student)) || null,
    mentor: m.mentor ? users.get(String(m.mentor)) || null : null,
    createdAt: iso(m.createdAt),
    matchedAt: iso(m.matchedAt),
    closedAt: iso(m.closedAt),
    lastMessageAt: iso(m.lastMessageAt),
    lastStudentActivityAt: iso(m.lastStudentActivityAt),
    lastMentorActivityAt: iso(m.lastMentorActivityAt),
    goals: { total: m.goals.length, done: m.goals.filter((g) => g.done).length },
    assignments: { total: m.assignments.length, done: m.assignments.filter((a) => a.doneAt).length },
    checkinMood: m.checkin?.answeredAt ? m.checkin.mood || null : null,
    checkinPending: !!m.checkin?.askedAt && !m.checkin?.answeredAt,
    duoStreak: m.duoStreak?.current || 0,
    resumed: m.mentorHistory.length > (m.mentor ? 1 : 0),
    outcome: m.closure?.outcome || null,
    unread: unread.get(m._id.toString()) || 0
  }));
}

export async function listForStudent(userId: string) {
  const list = await Mentorship.find({ student: userId }).sort({ updatedAt: -1 }).limit(30);
  return summarize(list, 'student', userId);
}

export async function listForMentor(userId: string) {
  const [current, past] = await Promise.all([
    Mentorship.find({ mentor: userId, status: { $in: ['active', 'paused'] } }).sort({ lastMessageAt: -1 }),
    Mentorship.find({ 'mentorHistory.mentor': userId, status: { $in: ['closed', 'cancelled'] } })
      .sort({ closedAt: -1 })
      .limit(20)
  ]);
  return {
    current: await summarize(current, 'mentor', userId),
    past: await summarize(past, 'mentor')
  };
}

/** La file d'attente, les reprises (relais) en premier puis de la plus ancienne à la plus récente */
export async function listQueue(filters: { subject?: string; level?: string } = {}) {
  const q: Record<string, unknown> = { status: 'pending' };
  if (filters.subject) q.subject = filters.subject;
  if (filters.level) q.level = filters.level;
  const list = await Mentorship.find(q).sort({ createdAt: 1 }).limit(100);
  list.sort((a, b) => Number(b.mentorHistory.length > 0) - Number(a.mentorHistory.length > 0));
  return summarize(list, 'moderator');
}

export async function getMentorProfile(userId: string) {
  const [profile, load] = await Promise.all([
    MentorProfile.findOne({ user: userId }).lean<any>(),
    activeLoadByMentor([new mongoose.Types.ObjectId(userId)])
  ]);
  return {
    status: profile?.status || 'available',
    maxActive: profile?.maxActive || 3,
    subjects: profile?.subjects || [],
    levels: profile?.levels || [],
    bio: profile?.bio || '',
    charterAccepted: !!profile?.charterAcceptedAt && !!profile?.adultDeclared,
    charterAcceptedAt: iso(profile?.charterAcceptedAt),
    activeCount: load.get(userId) || 0
  };
}

/**
 * L'engagement d'un bénévole, chiffré et vérifiable — la matière de son
 * attestation de bénévolat (voir VolunteerCertificate). Pour un bénévole
 * étudiant, c'est la reconnaissance qui compte le plus : elle va sur un CV,
 * un dossier Parcoursup ou de master.
 */
export async function mentorEngagement(userId: string) {
  const oid = new mongoose.Types.ObjectId(userId);
  const list = await Mentorship.find({ 'mentorHistory.mentor': oid })
    .select('student subject status closure mentor mentorHistory')
    .lean<any[]>();

  const now = Date.now();
  let weeks = 0;
  let firstFrom: Date | null = null;
  const students = new Set<string>();
  const subjects = new Set<string>();
  for (const m of list) {
    for (const h of m.mentorHistory as { mentor: mongoose.Types.ObjectId; from: Date; to?: Date }[]) {
      if (String(h.mentor) !== userId) continue;
      students.add(String(m.student));
      subjects.add(m.subject);
      const from = new Date(h.from).getTime();
      const to = h.to ? new Date(h.to).getTime() : now;
      weeks += Math.max(0, to - from) / (7 * 24 * 3600 * 1000);
      if (!firstFrom || new Date(h.from) < firstFrom) firstFrom = new Date(h.from);
    }
  }

  const completed = list.filter(
    (m) => String(m.mentor) === userId && m.status === 'closed' && ['goal_reached', 'partial'].includes(m.closure?.outcome)
  ).length;
  const goalReached = list.filter((m) => String(m.mentor) === userId && m.closure?.outcome === 'goal_reached').length;
  const active = list.filter((m) => String(m.mentor) === userId && ['active', 'paused'].includes(m.status)).length;
  const helpful = list.filter((m) => String(m.mentor) === userId && m.closure?.studentFeedback === 'helpful').length;
  const messages = await MentorshipMessage.countDocuments({ author: oid, authorRole: 'mentor', status: 'visible' });

  const subjectList = [...subjects].sort();
  const totalWeeks = Math.round(weeks);
  const lines: string[] = [];
  if (students.size) {
    lines.push(
      `Accompagnement personnalisé de ${students.size} élève${students.size > 1 ? 's' : ''} en ${subjectList.join(', ')}` +
        (totalWeeks ? `, sur ${totalWeeks} semaine${totalWeeks > 1 ? 's' : ''} de suivi cumulées` : '') + '.'
    );
  }
  if (completed) {
    lines.push(
      `${completed} suivi${completed > 1 ? 's' : ''} mené${completed > 1 ? 's' : ''} à terme` +
        (goalReached ? `, dont ${goalReached} avec l’objectif de l’élève atteint` : '') + '.'
    );
  }

  return {
    students: students.size,
    subjects: subjectList,
    active,
    completed,
    goalReached,
    helpful,
    messages,
    weeks: totalWeeks,
    since: iso(firstFrom),
    certificateLines: lines
  };
}

// ─────────────────────────────────────────────────────────────
// Pilotage (modération)
// ─────────────────────────────────────────────────────────────

/** Suivis en cours, les plus préoccupants en premier (élève qui attend une réponse) */
export async function listOpenForAdmin() {
  const list = await Mentorship.find({ status: { $in: ['active', 'paused'] } }).sort({ lastMessageAt: -1 }).limit(200);
  const rows = await summarize(list, 'moderator');
  const waitingDays = (r: (typeof rows)[number]) => {
    if (!r.lastStudentActivityAt) return 0;
    const s = new Date(r.lastStudentActivityAt).getTime();
    const mt = r.lastMentorActivityAt ? new Date(r.lastMentorActivityAt).getTime() : 0;
    return s > mt ? Math.floor((Date.now() - s) / 86400000) : 0;
  };
  return rows
    .map((r) => ({ ...r, waitingForMentorDays: waitingDays(r) }))
    .sort((a, b) => b.waitingForMentorDays - a.waitingForMentorDays);
}

export async function listMentorsForAdmin() {
  const profiles = await MentorProfile.find({}).sort({ updatedAt: -1 }).limit(200).lean<any[]>();
  const [users, load] = await Promise.all([
    usersById(profiles.map((p) => p.user)),
    activeLoadByMentor(profiles.map((p) => p.user))
  ]);
  return profiles.map((p) => ({
    user: users.get(String(p.user)) || { id: String(p.user), username: '?' },
    status: p.status,
    maxActive: p.maxActive,
    activeCount: load.get(String(p.user)) || 0,
    subjects: p.subjects || [],
    levels: p.levels || [],
    charterAccepted: !!p.charterAcceptedAt && !!p.adultDeclared,
    charterAcceptedAt: iso(p.charterAcceptedAt)
  }));
}

export async function listBlockedMessages(limit = 40) {
  const msgs = await MentorshipMessage.find({ status: 'blocked' }).sort({ createdAt: -1 }).limit(limit).lean<any[]>();
  const users = await usersById(msgs.map((m) => m.author));
  return msgs.map((m) => ({
    id: m._id.toString(),
    mentorshipId: String(m.mentorship),
    author: users.get(String(m.author)) || null,
    authorRole: m.authorRole,
    text: m.text,
    reasons: m.blockedReasons || [],
    createdAt: iso(m.createdAt)
  }));
}

export async function adminStats() {
  const since = new Date(Date.now() - 30 * 86400000);
  const [byStatus, matched, mentors] = await Promise.all([
    Mentorship.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Mentorship.find({ matchedAt: { $gte: since } }).select('createdAt matchedAt').lean<any[]>(),
    listMentorsForAdmin()
  ]);
  const count = (s: string) => byStatus.find((r) => r._id === s)?.n || 0;
  const waits = matched.map((m) => new Date(m.matchedAt).getTime() - new Date(m.createdAt).getTime()).filter((w) => w >= 0);
  const avgWaitHours = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length / 3600000) : null;
  const ready = mentors.filter((m) => m.charterAccepted);
  const freeSeats = ready
    .filter((m) => m.status === 'available')
    .reduce((sum, m) => sum + Math.max(0, m.maxActive - m.activeCount), 0);
  const closedRecently = await Mentorship.countDocuments({ status: 'closed', closedAt: { $gte: since } });
  const successRecently = await Mentorship.countDocuments({ status: 'closed', closedAt: { $gte: since }, 'closure.outcome': 'goal_reached' });

  return {
    pending: count('pending'),
    active: count('active'),
    paused: count('paused'),
    closedLast30: closedRecently,
    goalReachedLast30: successRecently,
    matchedLast30: matched.length,
    avgWaitHours,
    mentorsReady: ready.length,
    mentorsAvailable: ready.filter((m) => m.status === 'available').length,
    freeSeats
  };
}
