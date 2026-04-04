import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CurriculumNode from '@/models/CurriculumNode';
import { adminAuthMiddleware } from '@/middlewares/authMiddleware';

/**
 * GET /api/curriculum/[nodeId]
 * Détail d'un noeud du programme avec contenu lié
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    try {
        await connectDB();
        const { nodeId } = await params;

        const node = await CurriculumNode.findOne({ nodeId })
            .populate('linkedContent.fiches', 'title slug subject level')
            .populate('linkedContent.courses', 'title slug niveau matiere')
            .populate('linkedContent.quizzes', 'title description');

        if (!node) {
            return NextResponse.json({ error: 'Noeud non trouvé' }, { status: 404 });
        }

        return NextResponse.json(node);
    } catch (error: any) {
        console.error('Erreur GET /api/curriculum/[nodeId]:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/curriculum/[nodeId]
 * Mise à jour d'un noeud (admin seulement) - pour le tagging de contenu
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    try {
        const user = await adminAuthMiddleware(req);
        if (!user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();
        const { nodeId } = await params;
        const body = await req.json();

        const node = await CurriculumNode.findOneAndUpdate(
            { nodeId },
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!node) {
            return NextResponse.json({ error: 'Noeud non trouvé' }, { status: 404 });
        }

        return NextResponse.json(node);
    } catch (error: any) {
        console.error('Erreur PUT /api/curriculum/[nodeId]:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/curriculum/[nodeId]
 * Suppression d'un noeud (admin seulement)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    try {
        const user = await adminAuthMiddleware(req);
        if (!user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();
        const { nodeId } = await params;

        const node = await CurriculumNode.findOneAndDelete({ nodeId });

        if (!node) {
            return NextResponse.json({ error: 'Noeud non trouvé' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Noeud supprimé' });
    } catch (error: any) {
        console.error('Erreur DELETE /api/curriculum/[nodeId]:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
