import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Question from '@/models/Question';
import Evaluation from '@/models/Evaluation';
import { buildIdSlug } from '@/utils/slugify';

// Échappe une saisie utilisateur pour un usage sûr dans une RegExp
function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/kanban/link-search?type=course|forum|evaluation&q=...
// Recherche des entités liables. Réservé au staff (accès dashboard).
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || '';
        const q = (searchParams.get('q') || '').trim();
        const rx = q ? new RegExp(escapeRegex(q), 'i') : null;

        await dbConnect();

        if (type === 'course') {
            const items = await Course.find(rx ? { title: rx } : {})
                .select('title slug')
                .sort({ updatedAt: -1 })
                .limit(15)
                .lean<{ _id: any; title: string; slug?: string }[]>();
            return NextResponse.json({
                results: items.map((c) => ({
                    id: c._id.toString(),
                    label: c.title,
                    url: `/cours/${buildIdSlug(c._id.toString(), c.title)}`,
                })),
            });
        }

        if (type === 'forum') {
            const items = await Question.find(rx ? { title: rx } : {})
                .select('title slug')
                .sort({ createdAt: -1 })
                .limit(15)
                .lean<{ _id: any; title: string; slug?: string }[]>();
            return NextResponse.json({
                results: items.map((qn) => ({
                    id: qn._id.toString(),
                    label: qn.title,
                    url: `/forum/${buildIdSlug(qn._id.toString(), qn.title)}`,
                })),
            });
        }

        if (type === 'evaluation') {
            const items = await Evaluation.find(rx ? { title: rx } : {})
                .select('title')
                .sort({ updatedAt: -1 })
                .limit(15)
                .lean<{ _id: any; title: string }[]>();
            return NextResponse.json({
                results: items.map((e) => ({
                    id: e._id.toString(),
                    label: e.title,
                    url: `/dashboard/evaluations/manage`,
                })),
            });
        }

        return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    } catch (error) {
        console.error('Erreur kanban link-search GET:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
