import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Section from '@/models/Section';
import Course from '@/models/Course';
import connectDB from '@/lib/mongodb';

// GET - Récupérer une section spécifique
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        
        const resolvedParams = await params;
        const section = await Section.findById(resolvedParams.id)
            .populate('courseId', 'title niveau matiere')
            .populate('lessons', 'title')
            .populate('exercises', 'title')
            .populate('quizzes', 'title');
        
        if (!section) {
            return NextResponse.json({ error: 'Section non trouvée' }, { status: 404 });
        }

        return NextResponse.json(section);
    } catch (error) {
        console.error('Erreur lors de la récupération de la section:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

// PUT - Mettre à jour une section
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Vérifier que l'utilisateur a les droits appropriés
        if (session.user.role !== 'Admin' && session.user.role !== 'Rédacteur' && session.user.role !== 'Correcteur') {
            return NextResponse.json({ error: 'Accès refusé. Seuls les Admins, rédacteurs et correcteurs peuvent modifier des sections.' }, { status: 403 });
        }

        await connectDB();

        const resolvedParams = await params;
        const body = await request.json();
        
        // Validation des données
        if (!body.title || !body.courseId) {
            return NextResponse.json(
                { error: 'Titre et cours requis' },
                { status: 400 }
            );
        }

        // Vérifier que le cours existe
        const course = await Course.findById(body.courseId);
        if (!course) {
            return NextResponse.json(
                { error: 'Cours non trouvé' },
                { status: 404 }
            );
        }

        // Mettre à jour la section
        const updatedSection = await Section.findByIdAndUpdate(
            resolvedParams.id,
            {
                title: body.title,
                courseId: body.courseId,
                order: body.order || 1
            },
            { new: true }
        ).populate('courseId', 'title niveau matiere');

        if (!updatedSection) {
            return NextResponse.json({ error: 'Section non trouvée' }, { status: 404 });
        }

        return NextResponse.json(updatedSection);

    } catch (error) {
        console.error('Erreur lors de la mise à jour de la section:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

// DELETE - Supprimer une section
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Vérifier que l'utilisateur est Admin (seuls les Admins peuvent supprimer)
        if (session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Accès refusé. Seuls les Admins peuvent supprimer des sections.' }, { status: 403 });
        }

        await connectDB();

        const resolvedParams = await params;
        const deletedSection = await Section.findByIdAndDelete(resolvedParams.id);
        
        if (!deletedSection) {
            return NextResponse.json({ error: 'Section non trouvée' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Section supprimée avec succès' });

    } catch (error) {
        console.error('Erreur lors de la suppression de la section:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}