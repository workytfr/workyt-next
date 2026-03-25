import { GlobalContent } from './fetchContent';
import { UserActivity } from './fetchUserActivity';

interface NewsletterData {
    userName: string;
    unsubscribeUrl: string;
    globalContent: GlobalContent;
    userActivity: UserActivity | null;
    weekLabel: string;
    baseUrl: string;
}

// Emoji icons pour les emails (les SVG inline ne sont pas supportes par la plupart des clients email)
const COIN_ICON = `<div style="font-size: 28px; line-height: 1; margin: 0 auto 4px; text-align: center;">💰</div>`;
const STREAK_ICON = `<div style="font-size: 28px; line-height: 1; margin: 0 auto 4px; text-align: center;">🔥</div>`;
const QUESTS_ICON = `<div style="font-size: 28px; line-height: 1; margin: 0 auto 4px; text-align: center;">✅</div>`;

export function renderNewsletterEmail(data: NewsletterData): string {
    const { userName, unsubscribeUrl, globalContent, userActivity, weekLabel, baseUrl } = data;

    const coursesSection = globalContent.newCourses.length > 0 ? `
        <tr>
            <td style="padding: 0 32px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                        <td style="padding-bottom: 16px;">
                            <h2 style="margin: 0; font-size: 18px; color: #1e293b; font-weight: 700;">
                                📚 Nouveaux cours
                            </h2>
                        </td>
                    </tr>
                    ${globalContent.newCourses.map(course => `
                    <tr>
                        <td style="padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f8fafc; border-radius: 12px; border-left: 4px solid #6366f1;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                            <tr>
                                                <td>
                                                    <a href="${baseUrl}/cours/${course.slug}" style="text-decoration: none; color: #1e293b; font-weight: 600; font-size: 15px; display: block; margin-bottom: 4px;">
                                                        ${escapeHtml(course.title)}
                                                    </a>
                                                    <span style="font-size: 13px; color: #64748b;">${escapeHtml(course.matiere)} · ${escapeHtml(course.niveau)}</span>
                                                </td>
                                                <td width="90" style="text-align: right; vertical-align: middle;">
                                                    <a href="${baseUrl}/cours/${course.slug}" style="display: inline-block; padding: 8px 16px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">
                                                        Voir
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr><td style="height: 10px;"></td></tr>
                    `).join('')}
                </table>
            </td>
        </tr>` : '';

    const fichesSection = globalContent.newFiches.length > 0 ? `
        <tr>
            <td style="padding: 0 32px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                        <td style="padding-bottom: 16px;">
                            <h2 style="margin: 0; font-size: 18px; color: #1e293b; font-weight: 700;">
                                📝 Nouvelles fiches
                            </h2>
                        </td>
                    </tr>
                    ${globalContent.newFiches.slice(0, 6).map(fiche => `
                    <tr>
                        <td style="padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #fef2f2; border-radius: 12px; border-left: 4px solid #ef4444;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                            <tr>
                                                <td>
                                                    <a href="${baseUrl}/fiches/${fiche.slug}" style="text-decoration: none; color: #1e293b; font-weight: 600; font-size: 15px; display: block; margin-bottom: 4px;">
                                                        ${escapeHtml(fiche.title)}
                                                    </a>
                                                    <span style="font-size: 13px; color: #64748b;">${escapeHtml(fiche.subject)} · ${escapeHtml(fiche.level)}</span>
                                                </td>
                                                <td width="90" style="text-align: right; vertical-align: middle;">
                                                    <a href="${baseUrl}/fiches/${fiche.slug}" style="display: inline-block; padding: 8px 16px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">
                                                        Lire
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr><td style="height: 10px;"></td></tr>
                    `).join('')}
                    ${globalContent.newFiches.length > 6 ? `
                    <tr>
                        <td style="text-align: center; padding-top: 8px;">
                            <a href="${baseUrl}/fiches" style="color: #6366f1; font-size: 14px; text-decoration: none; font-weight: 500;">
                                Voir les ${globalContent.newFiches.length - 6} autres fiches →
                            </a>
                        </td>
                    </tr>` : ''}
                </table>
            </td>
        </tr>` : '';

    const blogSection = globalContent.blogPosts.length > 0 ? `
        <tr>
            <td style="padding: 0 32px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                        <td style="padding-bottom: 16px;">
                            <h2 style="margin: 0; font-size: 18px; color: #1e293b; font-weight: 700;">
                                📰 Récemment publié
                            </h2>
                        </td>
                    </tr>
                    ${globalContent.blogPosts.map(post => `
                    <tr>
                        <td style="padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f0fdf4; border-radius: 12px; border-left: 4px solid #22c55e;">
                                <tr>
                                    ${post.thumbnail ? `<td width="80" style="padding: 12px 0 12px 12px; vertical-align: middle;">
                                        <a href="${escapeHtml(post.link)}" style="text-decoration: none;">
                                            <img src="${escapeHtml(post.thumbnail)}" alt="" width="72" height="72" style="display: block; border-radius: 8px; object-fit: cover; width: 72px; height: 72px;" />
                                        </a>
                                    </td>` : ''}
                                    <td style="padding: 16px;">
                                        <a href="${escapeHtml(post.link)}" style="text-decoration: none; color: #1e293b; font-weight: 600; font-size: 15px; display: block; margin-bottom: 4px;">
                                            ${escapeHtml(post.title)}
                                        </a>
                                        <span style="font-size: 13px; color: #64748b;">${formatDate(post.pubDate)}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr><td style="height: 10px;"></td></tr>
                    `).join('')}
                </table>
            </td>
        </tr>` : '';

    // Build activity cards HTML
    const activityCards: string[] = [];
    if (userActivity) {
        if (userActivity.pointsEarned > 0) {
            activityCards.push(`
                <td style="width: ${100 / Math.min(activityCards.length + 1 + (userActivity.questsCompleted > 0 ? 1 : 0) + (userActivity.currentStreak > 0 ? 1 : 0), 3)}%; padding: 0 6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px;">
                        <tr>
                            <td style="padding: 16px 8px; text-align: center;">
                                ${COIN_ICON}
                                <div style="font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1;">${userActivity.pointsEarned}</div>
                                <div style="font-size: 11px; color: rgba(255,255,255,0.9); margin-top: 4px; font-weight: 500;">Points</div>
                            </td>
                        </tr>
                    </table>
                </td>
            `);
        }
        if (userActivity.questsCompleted > 0) {
            activityCards.push(`
                <td style="width: ${100 / Math.min(activityCards.length + 1 + (userActivity.currentStreak > 0 ? 1 : 0), 3)}%; padding: 0 6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); border-radius: 16px;">
                        <tr>
                            <td style="padding: 16px 8px; text-align: center;">
                                ${QUESTS_ICON}
                                <div style="font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1;">${userActivity.questsCompleted}</div>
                                <div style="font-size: 11px; color: rgba(255,255,255,0.9); margin-top: 4px; font-weight: 500;">Quêtes</div>
                            </td>
                        </tr>
                    </table>
                </td>
            `);
        }
        if (userActivity.currentStreak > 0) {
            activityCards.push(`
                <td style="width: ${100 / Math.min(activityCards.length + 1, 3)}%; padding: 0 6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); border-radius: 16px;">
                        <tr>
                            <td style="padding: 16px 8px; text-align: center;">
                                ${STREAK_ICON}
                                <div style="font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1;">${userActivity.currentStreak}</div>
                                <div style="font-size: 11px; color: rgba(255,255,255,0.9); margin-top: 4px; font-weight: 500;">${userActivity.currentStreak > 1 ? 'Jours' : 'Jour'}</div>
                            </td>
                        </tr>
                    </table>
                </td>
            `);
        }
    }

    const activitySection = activityCards.length > 0 ? `
        <tr>
            <td style="padding: 0 26px 28px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                        <td style="padding-bottom: 16px;">
                            <h2 style="margin: 0; font-size: 18px; color: #1e293b; font-weight: 700;">
                                🏆 Ton activité cette semaine
                            </h2>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                <tr>
                                    ${activityCards.join('')}
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>` : '';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workyt - Récap de la semaine</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f1f5f9;">
        <tr>
            <td align="center" style="padding: 40px 16px;">
                <table width="600" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 32px; border-radius: 20px 20px 0 0; text-align: center;">
                            <img src="${baseUrl}/workyt_fr.svg" alt="Workyt" width="140" height="35" style="display: block; margin: 0 auto;" />
                            <p style="margin: 16px 0 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500;">
                                Ton récap de la semaine du ${escapeHtml(weekLabel)}
                            </p>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 32px 32px 8px;">
                            <p style="margin: 0; font-size: 18px; color: #1e293b; font-weight: 600;">
                                Salut <strong style="color: #4f46e5;">${escapeHtml(userName)}</strong> ! 👋
                            </p>
                            <p style="margin: 8px 0 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                                Voici ce qu'il s'est passé cette semaine sur Workyt :
                            </p>
                        </td>
                    </tr>

                    <!-- Activity Section -->
                    ${activitySection}

                    <!-- Content Sections -->
                    ${coursesSection}
                    ${fichesSection}
                    ${blogSection}

                    <!-- CTA -->
                    <tr>
                        <td style="padding: 16px 32px 40px; text-align: center;">
                            <a href="${baseUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);">
                                Continuer sur Workyt →
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 32px; border-radius: 0 0 20px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                                Tu reçois cet email car tu es inscrit(e) sur Workyt.<br>
                                <a href="${escapeHtml(unsubscribeUrl)}" style="color: #6366f1; text-decoration: none; font-weight: 500;">
                                    Se désabonner de la newsletter
                                </a>
                            </p>
                            <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">
                                Workyt - Apprendre ensemble, réussir ensemble
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}
