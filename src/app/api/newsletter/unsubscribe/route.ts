import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
        return new Response(renderPage('Erreur', 'Token manquant.', false), {
            status: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }

    try {
        await connectDB();

        const user = await User.findOneAndUpdate(
            { unsubscribeToken: token },
            {
                newsletterOptIn: false,
                'newsletterPreferences.hebdo': false,
                'newsletterPreferences.classique': false,
            },
            { new: true }
        );

        if (!user) {
            return new Response(renderPage('Erreur', 'Lien invalide ou expire.', false), {
                status: 404,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        }

        return new Response(
            renderPage(
                'Desabonnement confirme',
                `${user.name}, tu as ete desabonne(e) de la newsletter Workyt. Tu peux te reabonner a tout moment depuis les parametres de ton compte.`,
                true
            ),
            {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
        );
    } catch (error) {
        console.error('Erreur desabonnement:', error);
        return new Response(renderPage('Erreur', 'Une erreur est survenue. Reessaie plus tard.', false), {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }
}

function renderPage(title: string, message: string, success: boolean): string {
    const baseUrl = process.env.NEWSLETTER_BASE_URL || 'https://workyt.fr';
    const color = success ? '#059669' : '#dc2626';
    const icon = success ? '✅' : '❌';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Workyt</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
    <div style="max-width: 480px; margin: 40px auto; padding: 40px; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">${icon}</div>
        <h1 style="font-size: 24px; color: ${color}; margin: 0 0 12px;">${title}</h1>
        <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px;">${message}</p>
        <a href="${baseUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
            Retour sur Workyt
        </a>
    </div>
</body>
</html>`;
}
