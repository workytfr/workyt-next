import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Membership from '@/models/Membership';
import '@/models/User';

// GET /api/admin/adherents — liste des adhérents (Admin)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await dbConnect();
        const members = await Membership.find()
            .populate('userId', 'name username email')
            .sort({ createdAt: -1 })
            .lean();

        const stats = {
            total: members.length,
            actifs: members.filter((m: any) => m.status === 'actif').length,
            suspendus: members.filter((m: any) => m.status === 'suspendu').length,
        };

        return NextResponse.json({ members, stats });
    } catch (error) {
        console.error('Adhérents GET error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
