import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Section from '@/models/Section';
import Course from '@/models/Course';
import connectDB from '@/lib/mongodb';
import { escapeRegex } from '@/utils/escapeRegex';

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
            query.title = { $regex: escapeRegex(search), $options: 'i' };
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

// POST - Créer une nouvelle section ou plusieurs sections
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        
        // Si on reçoit un tableau de sections, les traiter toutes
        if (Array.isArray(body.sections)) {
            const sections = body.sections;
            const courseId = body.courseId;
            
            if (!courseId) {
                return NextResponse.json(
                    { error: 'ID du cours requis' },
                    { status: 400 }
                );
            }

            // Vérifier que le cours existe
            const course = await Course.findById(courseId);
            if (!course) {
                return NextResponse.json(
                    { error: 'Cours non trouvé' },
                    { status: 404 }
                );
            }

            const savedSections = [];
            
            for (const sectionData of sections) {
                if (!sectionData.title) continue;
                
                // Déterminer l'ordre si non fourni
                if (!sectionData.order) {
                    const lastSection = await Section.findOne({ courseId })
                        .sort({ order: -1 })
                        .limit(1);
                    sectionData.order = lastSection ? lastSection.order + 1 : 1;
                }
                
                sectionData.courseId = courseId;
                
                if (sectionData._id) {
                    // Mettre à jour une section existante
                    const updatedSection = await Section.findByIdAndUpdate(
                        sectionData._id,
                        sectionData,
                        { new: true }
                    );
                    savedSections.push(updatedSection);
                } else {
                    // Créer une nouvelle section
                    const section = new Section(sectionData);
                    await section.save();
                    savedSections.push(section);
                }
            }

            // Retourner toutes les sections mises à jour
            const allSections = await Section.find({ courseId })
                .sort({ order: 1 })
                .populate('courseId', 'title niveau matiere');

            return NextResponse.json({ 
                sections: allSections,
                message: `${savedSections.length} sections traitées avec succès`
            }, { status: 200 });
        }
        
        // Traitement d'une seule section (comportement original)
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

// PUT - Mettre à jour l'ordre des sections
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        
        if (!body.sections || !Array.isArray(body.sections)) {
            return NextResponse.json(
                { error: 'Sections requises' },
                { status: 400 }
            );
        }

        const updatedSections = [];
        
        for (const sectionData of body.sections) {
            if (sectionData._id && sectionData.order !== undefined) {
                const updatedSection = await Section.findByIdAndUpdate(
                    sectionData._id,
                    { order: sectionData.order },
                    { new: true }
                );
                if (updatedSection) {
                    updatedSections.push(updatedSection);
                }
            }
        }

        // Retourner toutes les sections mises à jour
        if (updatedSections.length > 0) {
            const courseId = updatedSections[0].courseId;
            const allSections = await Section.find({ courseId })
                .sort({ order: 1 })
                .populate('courseId', 'title niveau matiere');

            return NextResponse.json({ 
                sections: allSections,
                message: `${updatedSections.length} sections mises à jour avec succès`
            });
        }

        return NextResponse.json({ 
            sections: [],
            message: 'Aucune section mise à jour'
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour des sections:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
