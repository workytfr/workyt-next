import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Assembly from '@/models/Assembly';
import Membership from '@/models/Membership';
import { MAX_CONSECUTIVE_ABSENCES } from '@/lib/membership';

// PATCH /api/admin/assemblies/[id] — enregistre le pointage, et clôture l'AG (Admin)
// body: { attendees?: string[], close?: boolean }
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
        const { attendees, close } = await req.json();

        await dbConnect();
        const assembly = await Assembly.findById(id);
        if (!assembly) {
            return NextResponse.json({ error: 'AG introuvable' }, { status: 404 });
        }
        if (assembly.closed) {
            return NextResponse.json({ error: 'Cette AG est déjà clôturée.' }, { status: 400 });
        }

        if (Array.isArray(attendees)) {
            assembly.attendees = attendees;
        }

        let suspended = 0;
        if (close) {
            const presentSet = new Set((assembly.attendees || []).map((a: any) => String(a)));
            const actifs = await Membership.find({ status: 'actif' })
                .select('userId consecutiveAbsences')
                .lean<{ _id: any; userId: any; consecutiveAbsences: number }[]>();

            const ops = actifs.map((m) => {
                const present = presentSet.has(String(m.userId));
                const next = present ? 0 : (m.consecutiveAbsences || 0) + 1;
                const set: any = { consecutiveAbsences: next };
                if (next >= MAX_CONSECUTIVE_ABSENCES) {
                    set.status = 'suspendu';
                    suspended++;
                }
                return { updateOne: { filter: { _id: m._id }, update: { $set: set } } };
            });
            if (ops.length) await Membership.bulkWrite(ops);

            assembly.closed = true;
        }

        await assembly.save();

        return NextResponse.json({ success: true, suspended, closed: assembly.closed });
    } catch (error) {
        console.error('Assembly PATCH error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// DELETE /api/admin/assemblies/[id] (Admin)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }
        const { id } = await params;
        await dbConnect();
        await Assembly.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Assembly DELETE error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
