import nodemailer from 'nodemailer';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import NewsletterBatch from '@/models/NewsletterBatch';
import PointTransaction from '@/models/PointTransaction';
import Streak from '@/models/Streak';
import { fetchGlobalContent, hasGlobalContent } from './fetchContent';
import { fetchAllUserActivity, hasUserActivity } from './fetchUserActivity';
import { renderNewsletterEmail } from './emailTemplate';

/**
 * Calcule le mercredi precedent (00:00:00) = debut de la periode
 * Si on est mercredi, c'est le mercredi d'il y a 7 jours
 */
function getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay(); // 0=dimanche, 3=mercredi
    // Jours depuis le dernier mercredi (si mercredi = 7 jours en arriere)
    const diff = day >= 3 ? day - 3 : day + 4;
    const lastWednesday = new Date(now);
    lastWednesday.setDate(now.getDate() - (diff === 0 ? 7 : diff));
    lastWednesday.setHours(0, 0, 0, 0);
    return lastWednesday;
}

function getWeekEnd(weekStart: Date): Date {
    const nextWednesday = new Date(weekStart);
    nextWednesday.setDate(weekStart.getDate() + 6);
    nextWednesday.setHours(23, 59, 59, 999);
    return nextWednesday;
}

function formatWeekLabel(weekStart: Date, weekEnd: Date): string {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const start = weekStart.toLocaleDateString('fr-FR', options);
    const end = weekEnd.toLocaleDateString('fr-FR', { ...options, year: 'numeric' });
    return `${start} - ${end}`;
}

/**
 * Envoie un batch de newsletters (max batchSize emails par execution)
 * Idempotent : peut etre relance sans envoyer de doublons
 */
export async function sendNewsletterBatch(batchSize: number = 450): Promise<{
    sent: number;
    skipped: number;
    errors: number;
    completed: boolean;
}> {
    await connectDB();

    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd(weekStart);
    const baseUrl = process.env.NEWSLETTER_BASE_URL || 'https://workyt.fr';

    // 1. Chercher ou creer le batch de cette semaine
    let batch = await NewsletterBatch.findOne({
        weekStart,
        status: { $in: ['pending', 'sending'] },
    });

    if (!batch) {
        // Verifier s'il n'y a pas deja un batch complete cette semaine
        const completedBatch = await NewsletterBatch.findOne({ weekStart, status: 'completed' });
        if (completedBatch) {
            console.log('Newsletter de cette semaine deja envoyee');
            return { sent: 0, skipped: 0, errors: 0, completed: true };
        }

        // Creer un nouveau batch avec le contenu global
        const globalContent = await fetchGlobalContent(weekStart);
        batch = await NewsletterBatch.create({
            weekStart,
            weekEnd,
            status: 'pending',
            globalContent,
            sentUserIds: [],
            sentCount: 0,
            skippedCount: 0,
            errorCount: 0,
            sendErrors: [],
        });
        console.log('Nouveau batch cree pour la semaine du', formatWeekLabel(weekStart, weekEnd));
    }

    // 2. Recuperer les users opt-in, actifs les 14 derniers jours, pas encore traites
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Trouver les users actifs : ont gagne des points OU ont un streak OU se sont connectes recemment
    const [activeByPoints, activeByStreak] = await Promise.all([
        PointTransaction.distinct('user', { createdAt: { $gte: fourteenDaysAgo } }),
        Streak.distinct('user', { lastActivityDate: { $gte: fourteenDaysAgo } }),
    ]);

    const activeUserIds = [...new Set([
        ...activeByPoints.map((id: any) => id.toString()),
        ...activeByStreak.map((id: any) => id.toString()),
    ])];

    const users = await User.find({
        newsletterOptIn: true,
        $or: [
            { 'newsletterPreferences.hebdo': true },
            { newsletterPreferences: { $exists: false } }, // Backward compat: users sans preferences = opt-in
        ],
        _id: { $in: activeUserIds, $nin: batch.sentUserIds },
    })
        .limit(batchSize)
        .select('_id name email unsubscribeToken')
        .lean();

    if (users.length === 0) {
        batch.status = 'completed';
        batch.completedAt = new Date();
        await batch.save();
        console.log('Tous les utilisateurs ont ete traites');
        return { sent: batch.sentCount, skipped: batch.skippedCount, errors: batch.errorCount, completed: true };
    }

    // Mettre a jour le status et le total
    batch.status = 'sending';
    batch.totalRecipients = await User.countDocuments({ newsletterOptIn: true });
    await batch.save();

    // 3. Recuperer l'activite utilisateur en bulk
    const userActivityMap = await fetchAllUserActivity(weekStart);
    const contentExists = hasGlobalContent(batch.globalContent);

    // 4. Creer le transporteur email
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const weekLabel = formatWeekLabel(weekStart, weekEnd);
    let sent = 0;
    let skipped = 0;
    let errors = 0;

    // 5. Envoyer les emails
    for (const user of users) {
        const userId = (user._id as any).toString();
        const activity = userActivityMap.get(userId) || null;
        const userHasActivity = hasUserActivity(activity ?? undefined);

        // Skip si aucun contenu ET aucune activite
        if (!contentExists && !userHasActivity) {
            batch.sentUserIds.push(user._id as any);
            batch.skippedCount++;
            skipped++;
            continue;
        }

        const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?token=${user.unsubscribeToken}`;

        const html = renderNewsletterEmail({
            userName: user.name,
            unsubscribeUrl,
            globalContent: batch.globalContent,
            userActivity: activity,
            weekLabel,
            baseUrl,
        });

        try {
            await transporter.sendMail({
                from: '"Workyt" <noreply@workyt.fr>',
                to: user.email,
                subject: `Workyt - Ton recap de la semaine du ${weekLabel}`,
                html,
            });

            batch.sentUserIds.push(user._id as any);
            batch.sentCount++;
            sent++;
        } catch (error: any) {
            batch.sentUserIds.push(user._id as any); // Marquer comme traite pour ne pas re-essayer
            batch.sendErrors.push({
                userId: user._id as any,
                error: error.message || 'Unknown error',
                timestamp: new Date(),
            });
            batch.errorCount++;
            errors++;
            console.error(`Erreur envoi a ${user.email}:`, error.message);
        }

        // Delai entre les emails pour eviter le throttling SMTP
        await new Promise(r => setTimeout(r, 100));
    }

    await batch.save();

    // Verifier s'il reste des users
    const remaining = await User.countDocuments({
        newsletterOptIn: true,
        _id: { $nin: batch.sentUserIds },
    });

    if (remaining === 0) {
        batch.status = 'completed';
        batch.completedAt = new Date();
        await batch.save();
        console.log('Newsletter completee !');
    } else {
        console.log(`${remaining} utilisateurs restants, a traiter au prochain batch`);
    }

    console.log(`Batch termine : ${sent} envoyes, ${skipped} ignores, ${errors} erreurs`);
    return { sent, skipped, errors, completed: remaining === 0 };
}
