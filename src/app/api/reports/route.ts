import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Report from '@/models/Report';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

/**
 * POST /api/reports - Créer un nouveau signalement
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        await connectDB();
        
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { reportedContent, reason, description, questionId } = body;

        // Validation des données
        if (!reportedContent || !reportedContent.type || !reportedContent.id) {
            return NextResponse.json(
                { error: 'Contenu signalé manquant' },
                { status: 400 }
            );
        }

        if (!reason || !description) {
            return NextResponse.json(
                { error: 'Motif et description requis' },
                { status: 400 }
            );
        }

        // Vérifier si l'utilisateur a déjà signalé ce contenu
        const existingReport = await Report.findOne({
            reporter: user._id,
            'reportedContent.type': reportedContent.type,
            'reportedContent.id': reportedContent.id
        });

        if (existingReport) {
            return NextResponse.json(
                { error: 'Vous avez déjà signalé ce contenu' },
                { status: 409 }
            );
        }

        // Créer le signalement
        const reportData: any = {
            reporter: user._id,
            reportedContent,
            reason,
            description
        };
        
        // Ajouter questionId pour les réponses forum
        if (reportedContent.type === 'forum_answer' && questionId) {
            reportData.questionId = questionId;
        }
        
        const report = new Report(reportData);

        await report.save();

        return NextResponse.json(
            { message: 'Signalement créé avec succès', reportId: report._id },
            { status: 201 }
        );

    } catch (error) {
        console.error('Erreur lors de la création du signalement:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/reports - Récupérer les signalements (admin/moderateur uniquement)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        await connectDB();
        
        const user = await User.findOne({ email: session.user.email });
        if (!user || (user.role !== 'Admin' && user.role !== 'Modérateur')) {
            return NextResponse.json(
                { error: 'Accès non autorisé' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Construire le filtre
        const filter: any = {};
        if (status) {
            filter.status = status;
        }

        // Récupérer les signalements avec les informations des utilisateurs
        const reports = await Report.find(filter)
            .populate('reporter', 'name username email')
            .populate('moderator', 'name username email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Report.countDocuments(filter);

        return NextResponse.json({
            reports,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des signalements:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
