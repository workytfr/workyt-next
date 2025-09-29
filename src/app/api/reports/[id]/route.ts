import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Report from '@/models/Report';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

/**
 * GET /api/reports/[id] - Récupérer un signalement spécifique
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const report = await Report.findById(id)
            .populate('reporter', 'name username email')
            .populate('moderator', 'name username email');

        if (!report) {
            return NextResponse.json(
                { error: 'Signalement non trouvé' },
                { status: 404 }
            );
        }

        return NextResponse.json({ report });

    } catch (error) {
        console.error('Erreur lors de la récupération du signalement:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/reports/[id] - Mettre à jour un signalement (modération)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const body = await request.json();
        const { status, moderatorNotes } = body;

        const { id } = await params;
        const report = await Report.findById(id);
        if (!report) {
            return NextResponse.json(
                { error: 'Signalement non trouvé' },
                { status: 404 }
            );
        }

        // Mettre à jour le signalement
        report.status = status;
        report.moderator = user._id;
        if (moderatorNotes) {
            report.moderatorNotes = moderatorNotes;
        }

        await report.save();

        return NextResponse.json(
            { message: 'Signalement mis à jour avec succès', report }
        );

    } catch (error) {
        console.error('Erreur lors de la mise à jour du signalement:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/reports/[id] - Supprimer un signalement (admin uniquement)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        if (!user || user.role !== 'Admin') {
            return NextResponse.json(
                { error: 'Accès non autorisé' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const report = await Report.findByIdAndDelete(id);
        if (!report) {
            return NextResponse.json(
                { error: 'Signalement non trouvé' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Signalement supprimé avec succès' }
        );

    } catch (error) {
        console.error('Erreur lors de la suppression du signalement:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
