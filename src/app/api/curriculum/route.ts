import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CurriculumNode from '@/models/CurriculumNode';

/**
 * GET /api/curriculum
 * Liste les noeuds du programme avec filtres
 * Query params: cycle, level, subject, track, version
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const cycle = searchParams.get('cycle');
        const level = searchParams.get('level');
        const subject = searchParams.get('subject');
        const track = searchParams.get('track');
        const version = searchParams.get('version');

        const filter: Record<string, string> = {};
        if (cycle) filter.cycle = cycle;
        if (level) filter.level = level;
        if (subject) filter.subject = subject;
        if (track) filter.track = track;
        if (version) filter.version = version;

        const nodes = await CurriculumNode.find(filter)
            .sort({ order: 1 })
            .lean();

        // Grouper par theme > chapter pour une vue arborescente
        const grouped: Record<string, Record<string, typeof nodes>> = {};
        for (const node of nodes) {
            if (!grouped[node.theme]) grouped[node.theme] = {};
            if (!grouped[node.theme][node.chapter]) grouped[node.theme][node.chapter] = [];
            grouped[node.theme][node.chapter].push(node);
        }

        return NextResponse.json({
            count: nodes.length,
            filters: filter,
            grouped,
            nodes,
        });
    } catch (error: any) {
        console.error('Erreur GET /api/curriculum:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
