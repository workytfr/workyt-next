import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET /api/newsletter/preferences - Recuperer les preferences newsletter
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
        }

        await connectDB();
        const user = await User.findById(session.user.id).select('newsletterOptIn newsletterPreferences newsletterConsentAt').lean();
        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        return NextResponse.json({
            // Dit au client s'il faut demander la declaration des 15 ans avant
            // d'activer quoi que ce soit. La decision reste prise au PATCH.
            consentDonne: !!user.newsletterConsentAt,
            newsletterOptIn: user.newsletterOptIn ?? false,
            newsletterPreferences: {
                hebdo: user.newsletterPreferences?.hebdo ?? false,
                classique: user.newsletterPreferences?.classique ?? false,
            },
        });
    } catch (error) {
        console.error('Erreur GET newsletter preferences:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

/**
 * PATCH /api/newsletter/preferences - Modifier les preferences newsletter
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
        }

        const body = await req.json();

        await connectDB();

        const update: Record<string, any> = {};

        const existant = await User.findById(session.user.id)
            .select('newsletterPreferences newsletterConsentAt')
            .lean();

        /**
         * S'ABONNER exige un consentement, et un consentement exige la
         * declaration des 15 ans.
         *
         * La verification est ici et nulle part ailleurs : l'interface peut
         * etre contournee, pas cette route. Se DESABONNER n'exige evidemment
         * rien - on ne met jamais d'obstacle sur le retrait du consentement
         * (art. 7.3 : aussi simple de retirer que de donner).
         */
        const veutSAbonner =
            body.newsletterOptIn === true ||
            body.newsletterPreferences?.hebdo === true ||
            body.newsletterPreferences?.classique === true;

        if (veutSAbonner && !existant?.newsletterConsentAt) {
            if (body.ageDeclare !== true) {
                return NextResponse.json(
                    {
                        error: "Pour recevoir la newsletter, tu dois declarer avoir 15 ans ou plus. En dessous de cet age, l'inscription doit etre faite par un parent : ecris a admin@workyt.fr.",
                        code: 'AGE_DECLARATION_REQUISE',
                    },
                    { status: 400 }
                );
            }
            // Le consentement et sa declaration d'age sont figes ensemble :
            // ils se rapportent l'un a l'autre et ne valent que par paire.
            update.newsletterConsentAt = new Date();
            update.newsletterAgeDeclaree = true;
        }

        // Support ancien format (newsletterOptIn boolean)
        if (typeof body.newsletterOptIn === 'boolean') {
            update.newsletterOptIn = body.newsletterOptIn;
            // Si desabonnement global, desactiver tout
            if (!body.newsletterOptIn) {
                update['newsletterPreferences.hebdo'] = false;
                update['newsletterPreferences.classique'] = false;
            }
        }

        // Support nouveau format (preferences granulaires)
        if (body.newsletterPreferences) {
            if (typeof body.newsletterPreferences.hebdo === 'boolean') {
                update['newsletterPreferences.hebdo'] = body.newsletterPreferences.hebdo;
            }
            if (typeof body.newsletterPreferences.classique === 'boolean') {
                update['newsletterPreferences.classique'] = body.newsletterPreferences.classique;
            }

            // Mettre a jour newsletterOptIn en fonction des preferences.
            // Les valeurs par defaut sont `false` : un champ absent ne vaut
            // plus consentement (voir User.newsletterOptIn).
            const hebdo = body.newsletterPreferences.hebdo ?? existant?.newsletterPreferences?.hebdo ?? false;
            const classique = body.newsletterPreferences.classique ?? existant?.newsletterPreferences?.classique ?? false;
            update.newsletterOptIn = hebdo || classique;
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json({ error: 'Aucune preference valide fournie' }, { status: 400 });
        }

        await User.findByIdAndUpdate(session.user.id, { $set: update });

        const updatedUser = await User.findById(session.user.id).select('newsletterOptIn newsletterPreferences').lean();

        return NextResponse.json({
            success: true,
            newsletterOptIn: updatedUser?.newsletterOptIn ?? false,
            newsletterPreferences: {
                hebdo: updatedUser?.newsletterPreferences?.hebdo ?? false,
                classique: updatedUser?.newsletterPreferences?.classique ?? false,
            },
        });
    } catch (error) {
        console.error('Erreur PATCH newsletter preferences:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
