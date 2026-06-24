import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Membership from '@/models/Membership';
import User from '@/models/User';
import { generateMembershipCardPDF } from '@/lib/membershipCard';
import type { MembershipType } from '@/lib/membership';

export const runtime = 'nodejs';

// GET /api/adhesion/carte — (re)télécharge la carte d'adhérent de l'utilisateur connecté.
// La carte est régénérée à partir du nom du compte (déjà stocké) + n° d'adhérent.
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await dbConnect();
        const membership = await Membership.findOne({ userId: session.user.id });
        if (!membership) {
            return NextResponse.json({ error: "Aucune adhésion trouvée." }, { status: 404 });
        }

        const user = await User.findById(session.user.id).select('name');
        const fullName = user?.name || 'Adhérent';
        const [firstName, ...rest] = fullName.split(' ');
        const lastName = rest.join(' ');

        const pdf = await generateMembershipCardPDF({
            fullName,
            firstName,
            lastName,
            memberNumber: membership.memberNumber,
            type: membership.type as MembershipType,
            joinedAt: membership.joinedAt,
        });

        return new Response(new Uint8Array(pdf), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="carte-adherent-${membership.memberNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Carte adhérent GET error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
