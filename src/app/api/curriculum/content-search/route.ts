import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import Quiz from '@/models/Quiz';
import Revision from '@/models/Revision';

/**
 * GET /api/curriculum/content-search?type=course&q=algo
 * Recherche de contenu Workyt (cours, quiz, fiches) par titre.
 * Utilisé dans l'admin pour lier du contenu aux noeuds du programme.
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'course' | 'quiz' | 'fiche'
        const q = searchParams.get('q') || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

        const textFilter = q
            ? { title: { $regex: q, $options: 'i' } }
            : {};

        const results: { _id: string; title: string; type: string; extra?: string }[] = [];

        if (!type || type === 'course') {
            const courses = await Course.find(textFilter)
                .select('_id title')
                .limit(limit)
                .sort({ updatedAt: -1 })
                .lean();
            results.push(...courses.map((c: any) => ({
                _id: c._id.toString(),
                title: c.title,
                type: 'course' as const,
            })));
        }

        if (!type || type === 'quiz') {
            const quizzes = await Quiz.find(textFilter)
                .select('_id title sectionId')
                .limit(limit)
                .sort({ updatedAt: -1 })
                .lean();
            results.push(...quizzes.map((q: any) => ({
                _id: q._id.toString(),
                title: q.title,
                type: 'quiz' as const,
            })));
        }

        if (!type || type === 'fiche') {
            const fiches = await Revision.find(textFilter)
                .select('_id title')
                .limit(limit)
                .sort({ updatedAt: -1 })
                .lean();
            results.push(...fiches.map((f: any) => ({
                _id: f._id.toString(),
                title: f.title,
                type: 'fiche' as const,
            })));
        }

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('Erreur GET /api/curriculum/content-search:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
