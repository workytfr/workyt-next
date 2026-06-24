import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Membership from '@/models/Membership';

// PATCH /api/admin/adherents/[id] — change le statut d'un adhérent (Admin)
// body: { status: 'actif' | 'suspendu' }
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { id } = await params;
        const { status } = await req.json();
        if (status !== 'actif' && status !== 'suspendu') {
            return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
        }

        await dbConnect();
        const membership = await Membership.findById(id);
        if (!membership) {
            return NextResponse.json({ error: 'Adhérent introuvable' }, { status: 404 });
        }

        membership.status = status;
        if (status === 'actif') membership.consecutiveAbsences = 0; // réactivation = compteur remis à zéro
        await membership.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Adhérent PATCH error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
