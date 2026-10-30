import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { getDeletedUserId, DELETED_USER_NAME } from '@/lib/deletedUser';
import { deleteFromR2 } from '@/lib/r2Object';
import { deleteAttachment } from '@/lib/mentorship/storage';
import { notify } from '@/lib/mentorship/notify';
import { releaseToQueue } from '@/lib/mentorship/service';
import { emitMentorshipChanged } from '@/lib/realtime/emit';

import User from '@/models/User';
import ActiveBoost from '@/models/ActiveBoost';
import Answer from '@/models/Answer';
import Assembly from '@/models/Assembly';
import Bookmark from '@/models/Bookmark';
import CalendarClaim from '@/models/CalendarClaim';
import Challenge from '@/models/Challenge';
import ChestReward from '@/models/ChestReward';
import Clan from '@/models/Clan';
import ClanDailyResult from '@/models/ClanDailyResult';
import ClanMember from '@/models/ClanMember';
import ClanMessage from '@/models/ClanMessage';
import ClanSoldier from '@/models/ClanSoldier';
import ClanWeeklyReward from '@/models/ClanWeeklyReward';
import Comment from '@/models/Comment';
import CompetencyProgress from '@/models/CompetencyProgress';
import Course from '@/models/Course';
import CourseProgress from '@/models/CourseProgress';
import DailyQuiz from '@/models/DailyQuiz';
import DailyQuizAttempt from '@/models/DailyQuizAttempt';
import Evaluation from '@/models/Evaluation';
import EvaluationDraw from '@/models/EvaluationDraw';
import EvaluationGrade from '@/models/EvaluationGrade';
import EvaluationSubmission from '@/models/EvaluationSubmission';
import Exercise from '@/models/Exercise';
import Friendship from '@/models/Friendship';
import Gem from '@/models/Gem';
import GemTransaction from '@/models/GemTransaction';
import HeroEquipment from '@/models/HeroEquipment';
import HeroProfile from '@/models/HeroProfile';
import KanbanCard from '@/models/KanbanCard';
import Lesson from '@/models/Lesson';
import LiveEvent from '@/models/LiveEvent';
import Membership from '@/models/Membership';
import MentorProfile from '@/models/MentorProfile';
import Mentorship from '@/models/Mentorship';
import MentorshipMessage from '@/models/MentorshipMessage';
import MushroomInventory from '@/models/MushroomInventory';
import MushroomTransaction from '@/models/MushroomTransaction';
import NewsletterBatch from '@/models/NewsletterBatch';
import Notification from '@/models/Notification';
import OAuthCode from '@/models/OAuthCode';
import OAuthConsent from '@/models/OAuthConsent';
import OwnedCosmetic from '@/models/OwnedCosmetic';
import Partner from '@/models/Partner';
import PointTransaction from '@/models/PointTransaction';
import PomodoroPreference from '@/models/PomodoroPreference';
import PomodoroSession from '@/models/PomodoroSession';
import ProfileCustomization from '@/models/ProfileCustomization';
import PromoCode from '@/models/PromoCode';
import PushNudge from '@/models/PushNudge';
import PushToken from '@/models/PushToken';
import QuestProgress from '@/models/QuestProgress';
import Question from '@/models/Question';
import Quiz from '@/models/Quiz';
import QuizCompletion from '@/models/QuizCompletion';
import R2CleanupLog from '@/models/R2CleanupLog';
import Report from '@/models/Report';
import Revision from '@/models/Revision';
import Streak from '@/models/Streak';
import StudentAcademicProfile from '@/models/StudentAcademicProfile';
import UserCard from '@/models/UserCard';
import UserLeague from '@/models/UserLeague';

/**
 * Suppression d'un compte (demandée par le membre, depuis le site ou l'app).
 *
 * Choix retenu : ANONYMISER plutôt qu'effacer tout.
 * - Les données personnelles et l'activité privée sont supprimées : compte,
 *   e-mail, mot de passe, photo, jetons push, progression, gemmes, amis…
 * - Les contributions publiques restent (sinon le forum et les fiches des
 *   autres perdraient leur sens), mais sont rattachées au compte partagé
 *   « Utilisateur supprimé » (voir lib/deletedUser).
 *
 * Idempotent : chaque étape est un filtre sur l'identifiant, on peut donc la
 * relancer sans risque après un échec partiel (le compte lui-même est effacé
 * en dernier). Le journal ne contient que des compteurs, aucune donnée
 * personnelle.
 */

type Counts = Record<string, number>;
type WriteResult = { deletedCount?: number; modifiedCount?: number };

const OPEN_STATUSES = ['active', 'paused'];

/** Suppressions en cours, pour ne pas traiter deux fois le même compte en parallèle */
const inProgress = new Set<string>();

export class AccountDeletionError extends Error {}

export async function deleteAccount(userId: string): Promise<Counts> {
    if (!mongoose.isValidObjectId(userId)) throw new AccountDeletionError('Identifiant invalide');
    if (inProgress.has(userId)) throw new AccountDeletionError('Suppression déjà en cours');
    inProgress.add(userId);
    try {
        await dbConnect();
        const placeholder = await getDeletedUserId();
        if (placeholder.toString() === userId) {
            throw new AccountDeletionError('Ce compte ne peut pas être supprimé');
        }
        const counts = await run(new mongoose.Types.ObjectId(userId), placeholder);
        // Compteurs uniquement : ni identifiant, ni pseudo, ni e-mail
        const touched = Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 0));
        console.info('[suppression de compte] terminée', touched);
        return counts;
    } finally {
        inProgress.delete(userId);
    }
}

async function run(uid: mongoose.Types.ObjectId, P: mongoose.Types.ObjectId): Promise<Counts> {
    const counts: Counts = {};
    const step = async (label: string, op: Promise<WriteResult>) => {
        const r = await op;
        counts[label] = (counts[label] || 0) + (r.deletedCount ?? r.modifiedCount ?? 0);
    };
    const uidStr = uid.toString();
    const pStr = P.toString();

    // ── 1. Suivis personnalisés (avant les notifications : on en crée) ──────

    // Élève : le suivi est clos, son contenu privé (demande, messages, pièces
    // jointes, notes) effacé. La coquille reste, anonymisée, pour l'historique
    // du bénévole (engagement, badges).
    const asStudent = await Mentorship.find({ student: uid })
        .select('_id status mentor subject roomKey')
        .lean<{ _id: mongoose.Types.ObjectId; status: string; mentor?: mongoose.Types.ObjectId | null; subject: string; roomKey: string }[]>();
    const now = new Date();
    for (const m of asStudent) {
        const wasOpen = OPEN_STATUSES.includes(m.status);
        const set: Record<string, unknown> = {
            student: P,
            need: 'Demande supprimée',
            availability: '',
            mentorNotes: '',
            pinnedMessages: [],
        };
        const unset: Record<string, 1> = { handoffNote: 1, checkin: 1, 'closure.summary': 1, nextCheckinAt: 1 };
        if (wasOpen) {
            Object.assign(set, {
                status: 'closed',
                closedAt: now,
                'closure.by': P,
                'closure.outcome': 'stopped',
                'mentorHistory.$[h].to': now,
                'mentorHistory.$[h].reason': 'closed',
            });
        } else if (m.status === 'pending') {
            Object.assign(set, { status: 'cancelled', closedAt: now });
        }
        await Mentorship.updateOne(
            { _id: m._id },
            { $set: set, $unset: unset },
            wasOpen ? { arrayFilters: [{ 'h.to': { $exists: false } }] } : {}
        );

        const withFiles = await MentorshipMessage.find({ mentorship: m._id, 'attachment.key': { $exists: true, $ne: '' } })
            .select('attachment.key')
            .lean<{ attachment?: { key?: string } }[]>();
        for (const msg of withFiles) {
            if (await deleteAttachment(msg.attachment?.key)) counts.mentorshipAttachments = (counts.mentorshipAttachments || 0) + 1;
        }
        await step('mentorshipMessages', MentorshipMessage.deleteMany({ mentorship: m._id }));

        if (wasOpen && m.mentor) {
            await notify('mentorship_update', m.mentor.toString(), pStr, m._id.toString(), 'Suivi terminé',
                `L’élève a supprimé son compte : le suivi en ${m.subject} est terminé.`).catch(() => {});
        }
        if (m.roomKey) emitMentorshipChanged(m.roomKey);
        counts.mentorshipsAsStudent = (counts.mentorshipsAsStudent || 0) + 1;
    }

    // Bénévole : ses suivis en cours repartent en file, avec tout l'historique,
    // pour qu'un autre bénévole les reprenne.
    const asMentor = await Mentorship.find({ mentor: uid, status: { $in: OPEN_STATUSES } });
    for (const m of asMentor) {
        const r = await releaseToQueue(m, 'released', 'Le bénévole précédent a supprimé son compte.', pStr);
        if (r.ok) counts.mentorshipsReleased = (counts.mentorshipsReleased || 0) + 1;
    }
    await step('mentorshipsAnonymized', Mentorship.updateMany({ mentor: uid }, { $set: { mentor: P } }));
    await step('mentorshipsAnonymized', Mentorship.updateMany(
        { 'mentorHistory.mentor': uid },
        { $set: { 'mentorHistory.$[h].mentor': P } },
        { arrayFilters: [{ 'h.mentor': uid }] }
    ));
    await step('mentorshipsAnonymized', Mentorship.updateMany({ 'closure.by': uid }, { $set: { 'closure.by': P } }));
    await step('mentorshipMessagesAnonymized', MentorshipMessage.updateMany({ author: uid }, { $set: { author: P } }));
    await step('mentorProfile', MentorProfile.deleteMany({ user: uid }));

    // ── 2. Contributions publiques : conservées, rattachées au compte partagé ─

    await step('questions', Question.updateMany({ user: uid }, { $set: { user: P } }));
    await step('answers', Answer.updateMany({ user: uid }, { $set: { user: P } }));
    await step('revisions', Revision.updateMany({ author: uid }, { $set: { author: P } }));
    await step('comments', Comment.updateMany({ author: uid }, { $set: { author: P } }));
    await step('courses', Course.updateMany(
        { authors: uid },
        { $set: { 'authors.$[a]': P } },
        { arrayFilters: [{ a: uid }] }
    ));
    await step('courses', Course.updateMany({ verifiedBy: uid }, { $set: { verifiedBy: P } }));
    await step('lessons', Lesson.updateMany({ author: uid }, { $set: { author: P } }));
    await step('lessons', Lesson.updateMany({ validatedBy: uid }, { $set: { validatedBy: P } }));
    await step('exercises', Exercise.updateMany({ author: uid }, { $set: { author: P } }));
    await step('quizzes', Quiz.updateMany({ author: uid }, { $set: { author: P } }));
    await step('dailyQuizzes', DailyQuiz.updateMany({ author: uid }, { $set: { author: P } }));
    await step('evaluations', Evaluation.updateMany({ createdBy: uid }, { $set: { createdBy: P } }));
    await step('evaluationGradesGiven', EvaluationGrade.updateMany({ evaluatorId: uid }, { $set: { evaluatorId: P } }));
    await step('liveEvents', LiveEvent.updateMany({ createdBy: uid }, { $set: { createdBy: P } }));
    await step('partners', Partner.updateMany({ createdBy: uid }, { $set: { createdBy: P } }));
    await step('assemblies', Assembly.updateMany({ createdBy: uid }, { $set: { createdBy: P } }));
    // Feuille de présence des AG : le nombre de présents doit rester juste
    await step('assemblies', Assembly.updateMany(
        { attendees: uid },
        { $set: { 'attendees.$[a]': P } },
        { arrayFilters: [{ a: uid }] }
    ));
    await step('kanban', KanbanCard.updateMany({ createdBy: uid }, { $set: { createdBy: P } }));
    await step('kanban', KanbanCard.updateMany({ assignees: uid }, { $pull: { assignees: uid } }));
    await step('kanban', KanbanCard.updateMany(
        { 'comments.author': uid },
        { $set: { 'comments.$[c].author': P } },
        { arrayFilters: [{ 'c.author': uid }] }
    ));
    await step('reports', Report.updateMany({ reporter: uid }, { $set: { reporter: P } }));
    await step('reports', Report.updateMany({ moderator: uid }, { $set: { moderator: P } }));
    // Le code reste « attribué » : il ne doit pas être redistribué
    await step('promoCodes', PromoCode.updateMany({ assignedTo: uid }, { $set: { assignedTo: P } }));
    await step('r2CleanupLogs', R2CleanupLog.updateMany({ triggeredByUserId: uid }, { $set: { triggeredByUserId: P } }));

    // Likes donnés : retirés, et les compteurs suivent
    await step('likesRemoved', Revision.updateMany({ 'likedBy.userId': uid }, { $pull: { likedBy: { userId: uid } }, $inc: { likes: -1 } }));
    await step('likesRemoved', Revision.updateMany({ likeHistory: uid }, { $pull: { likeHistory: uid } }));
    await step('likesRemoved', Answer.updateMany({ likedBy: uidStr }, { $pull: { likedBy: uidStr }, $inc: { likes: -1 } }));
    await step('likesRemoved', Comment.updateMany({ likedBy: uid }, { $pull: { likedBy: uid }, $inc: { likes: -1 } }));

    // ── 3. Clan ─────────────────────────────────────────────────────────────

    const clanIds = (await ClanMember.find({ user: uid }).select('clan').lean<{ clan: mongoose.Types.ObjectId }[]>())
        .map((c) => c.clan);
    if (clanIds.length) {
        // Effectif de la guerre en cours (jamais sous 1 : contrainte du schéma)
        await step('clans', Clan.updateMany(
            { _id: { $in: clanIds }, resolved: false, memberCount: { $gt: 1 } },
            { $inc: { memberCount: -1 } }
        ));
    }
    await step('clans', Clan.updateMany({ captain: uid }, { $unset: { captain: 1 } }));
    await step('clanMembers', ClanMember.deleteMany({ user: uid }));
    await step('clanMembers', ClanMember.updateMany({ focusTarget: uid }, { $unset: { focusTarget: 1 } }));
    // Tchat (effacé chaque nuit de toute façon) : on garde la phrase, pas l'auteur
    await step('clanMessages', ClanMessage.updateMany({ user: uid }, { $set: { user: P, username: DELETED_USER_NAME } }));
    await step('clanMessages', ClanMessage.updateMany({ targetUser: uid }, { $set: { targetUser: P, targetUsername: DELETED_USER_NAME } }));
    await step('clanSoldiers', ClanSoldier.updateMany({ purchasedBy: uid }, { $set: { purchasedBy: P } }));
    await step('clanResults', ClanDailyResult.updateMany(
        { 'events.user': uid },
        { $set: { 'events.$[e].user': P } },
        { arrayFilters: [{ 'e.user': uid }] }
    ));
    await step('clanWeeklyRewards', ClanWeeklyReward.deleteMany({ user: uid }));

    // ── 4. Défis entre amis ─────────────────────────────────────────────────

    // Défis en attente ou en cours : sans adversaire, ils n'ont plus de sens
    await step('challengesDeleted', Challenge.deleteMany({
        $or: [{ challenger: uid }, { opponent: uid }],
        status: { $in: ['pending', 'active'] },
    }));
    // Défis terminés : l'historique de l'autre joueur reste, sans nom
    await step('challengesAnonymized', Challenge.updateMany({ challenger: uid }, { $set: { challenger: P } }));
    await step('challengesAnonymized', Challenge.updateMany({ opponent: uid }, { $set: { opponent: P } }));
    await step('challengesAnonymized', Challenge.updateMany({ winner: uid }, { $set: { winner: P } }));

    // ── 5. Données personnelles : supprimées ────────────────────────────────

    // Photo envoyée par le membre (R2)
    const custom = await ProfileCustomization.findOne({ user: uid })
        .select('customPhoto.key')
        .lean<{ customPhoto?: { key?: string } }>();
    if (custom?.customPhoto?.key) {
        await deleteFromR2(custom.customPhoto.key);
        counts.profilePhoto = 1;
    }
    await step('profileCustomization', ProfileCustomization.deleteMany({ user: uid }));

    // Évaluations : copies et notes du membre (les fichiers déposés sous uploads/
    // deviennent orphelins et sont ramassés par le nettoyage R2)
    const subIds = (await EvaluationSubmission.find({ userId: uid }).select('_id').lean<{ _id: mongoose.Types.ObjectId }[]>())
        .map((s) => s._id);
    if (subIds.length) await step('evaluationGrades', EvaluationGrade.deleteMany({ submissionId: { $in: subIds } }));
    await step('evaluationSubmissions', EvaluationSubmission.deleteMany({ userId: uid }));
    await step('evaluationDraws', EvaluationDraw.deleteMany({ userId: uid }));

    // Notifications reçues, et celles envoyées (leur texte contient le pseudo)
    await step('notifications', Notification.deleteMany({
        $or: [
            { recipient: uid },
            { sender: uid },
            { 'relatedEntity.type': 'user', 'relatedEntity.id': uid },
        ],
    }));

    await step('newsletterBatches', NewsletterBatch.updateMany(
        { $or: [{ sentUserIds: uid }, { 'sendErrors.userId': uid }] },
        { $pull: { sentUserIds: uid, sendErrors: { userId: uid } } }
    ));

    await Promise.all([
        step('friendships', Friendship.deleteMany({ $or: [{ requester: uid }, { recipient: uid }] })),
        step('pushTokens', PushToken.deleteMany({ user: uid })),
        step('pushNudges', PushNudge.deleteMany({ user: uid })),
        step('oauthCodes', OAuthCode.deleteMany({ user: uid })),
        step('oauthConsents', OAuthConsent.deleteMany({ user: uid })),
        step('bookmarks', Bookmark.deleteMany({ user: uid })),
        step('streak', Streak.deleteMany({ user: uid })),
        step('questProgress', QuestProgress.deleteMany({ user: uid })),
        step('heroProfile', HeroProfile.deleteMany({ user: uid })),
        step('heroEquipment', HeroEquipment.deleteMany({ user: uid })),
        step('ownedCosmetics', OwnedCosmetic.deleteMany({ user: uid })),
        step('activeBoosts', ActiveBoost.deleteMany({ user: uid })),
        step('chestRewards', ChestReward.deleteMany({ user: uid })),
        step('gems', Gem.deleteMany({ user: uid })),
        step('gemTransactions', GemTransaction.deleteMany({ user: uid })),
        step('mushroomInventory', MushroomInventory.deleteMany({ user: uid })),
        step('mushroomTransactions', MushroomTransaction.deleteMany({ user: uid })),
        step('pointTransactions', PointTransaction.deleteMany({ user: uid })),
        step('calendarClaims', CalendarClaim.deleteMany({ user: uid })),
        step('userCards', UserCard.deleteMany({ user: uid })),
        step('userLeague', UserLeague.deleteMany({ user: uid })),
        step('dailyQuizAttempts', DailyQuizAttempt.deleteMany({ user: uid })),
        step('pomodoroPreference', PomodoroPreference.deleteMany({ user: uid })),
        step('pomodoroSessions', PomodoroSession.deleteMany({ user: uid })),
        step('courseProgress', CourseProgress.deleteMany({ userId: uid })),
        step('quizCompletions', QuizCompletion.deleteMany({ userId: uid })),
        step('competencyProgress', CompetencyProgress.deleteMany({ userId: uid })),
        step('academicProfile', StudentAcademicProfile.deleteMany({ userId: uid })),
        step('membership', Membership.deleteMany({ userId: uid })),
    ]);

    // ── 6. Le compte lui-même, en dernier ───────────────────────────────────
    // E-mail, mot de passe, Discord, rôles, bio, newsletter… tout part avec lui.
    // (Sessions NextAuth en JWT : rien en base. Le jeton restant ne retrouve
    // plus le compte et les rôles sont relus en base toutes les 5 minutes.)
    await step('user', User.deleteOne({ _id: uid }));

    return counts;
}
