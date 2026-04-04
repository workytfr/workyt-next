import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentAcademicProfile from '@/models/StudentAcademicProfile';
import authMiddleware from '@/middlewares/authMiddleware';

/**
 * GET /api/student-profile
 * Récupère le profil académique de l'utilisateur connecté
 */
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        const profile = await StudentAcademicProfile.findOne({ userId: user._id }).lean();

        if (!profile) {
            return NextResponse.json({ exists: false, profile: null });
        }

        return NextResponse.json({ exists: true, profile });
    } catch (error: any) {
        if (error.code === 'JWT_EXPIRED') {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Erreur GET /api/student-profile:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/student-profile
 * Crée ou met à jour le profil académique
 */
export async function PUT(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        const body = await req.json();
        const { currentGrade, cycle, track, specialities, options, school, preferences, upcomingExams } = body;

        if (!currentGrade || !cycle) {
            return NextResponse.json(
                { error: 'Champs requis: currentGrade, cycle' },
                { status: 400 }
            );
        }

        const profileData = {
            userId: user._id,
            currentGrade,
            cycle,
            track,
            specialities: specialities || [],
            options: options || [],
            school,
            preferences: {
                dailyStudyTime: preferences?.dailyStudyTime ?? 45,
                preferredStudyDays: preferences?.preferredStudyDays ?? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                pace: preferences?.pace ?? 'moderate',
                reminderEnabled: preferences?.reminderEnabled ?? true,
            },
            upcomingExams: upcomingExams || [],
        };

        const profile = await StudentAcademicProfile.findOneAndUpdate(
            { userId: user._id },
            { $set: profileData },
            { new: true, upsert: true, runValidators: true }
        );

        return NextResponse.json({ profile });
    } catch (error: any) {
        if (error.code === 'JWT_EXPIRED') {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Erreur PUT /api/student-profile:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
