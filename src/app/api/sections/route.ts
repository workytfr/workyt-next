import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Section from '@/models/Section';
import Course from '@/models/Course';
import connectDB from '@/lib/mongodb';

// GET - Récupérer les sections avec pagination et filtres
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const courseId = searchParams.get('courseId') || '';
        const sortBy = searchParams.get('sortBy') || 'order';
        const sortOrder = searchParams.get('sortOrder') || 'asc';

        // Construire la requête
        let query: any = {};
        
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        
        if (courseId) {
            query.courseId = courseId;
        }

        // Calculer le skip pour la pagination
        const skip = (page - 1) * limit;

        // Construire l'objet de tri
        const sort: any = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Récupérer les sections avec population
        const sections = await Section.find(query)
            .populate('courseId', 'title niveau matiere')
            .populate('lessons', 'title')
            .populate('exercises', 'title')
            .populate('quizzes', 'title')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // Compter le total
        const total = await Section.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            sections,
            total,
            totalPages,
            currentPage: page,
            itemsPerPage: limit
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des sections:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

// POST - Créer une nouvelle section
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();

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

        // Déterminer l'ordre si non fourni
        if (!body.order) {
            const lastSection = await Section.findOne({ courseId: body.courseId })
                .sort({ order: -1 })
                .limit(1);
            body.order = lastSection ? lastSection.order + 1 : 1;
        }

        const section = new Section(body);
        await section.save();

        // Retourner la section avec les données populées
        const populatedSection = await Section.findById(section._id)
            .populate('courseId', 'title niveau matiere');

        return NextResponse.json(populatedSection, { status: 201 });

    } catch (error) {
        console.error('Erreur lors de la création de la section:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
