import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Assembly from '@/models/Assembly';

// GET /api/admin/assemblies — liste des AG (Admin)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }
        await dbConnect();
        const assemblies = await Assembly.find().sort({ date: -1 }).lean();
        return NextResponse.json({ assemblies });
    } catch (error) {
        console.error('Assemblies GET error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST /api/admin/assemblies — crée une AG (Admin)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }
        const { title, date } = await req.json();
        if (!title?.trim() || !date) {
            return NextResponse.json({ error: 'Titre et date requis' }, { status: 400 });
        }
        await dbConnect();
        const assembly = await Assembly.create({
            title: title.trim(),
            date: new Date(date),
            createdBy: session.user.id,
        });
        return NextResponse.json({ assembly }, { status: 201 });
    } catch (error) {
        console.error('Assemblies POST error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
