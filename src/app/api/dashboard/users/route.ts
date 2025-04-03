import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import authMiddleware from '@/middlewares/authMiddleware';

// Forcer le rendu dynamique pour cette route
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/users
 * Affiche la liste de tous les utilisateurs (sensible, donc on exclut certains champs)
 */
export async function GET(req: NextRequest) {
    await dbConnect();

    try {
        const admin = await authMiddleware(req);
        if (!admin || admin.role !== 'Admin') {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        // Récupération des paramètres de pagination et de recherche
        const searchParam = req.nextUrl.searchParams.get('search') || '';
        const pageParam = req.nextUrl.searchParams.get('page');
        const limitParam = req.nextUrl.searchParams.get('limit');

        const pageNum = pageParam ? parseInt(pageParam) : 1;
        const limitNum = limitParam ? parseInt(limitParam) : 10;

        // Construction de la requête en fonction du filtre de recherche
        const query: any = {};
        if (searchParam) {
            query.$or = [
                { name: { $regex: searchParam, $options: 'i' } },
                { email: { $regex: searchParam, $options: 'i' } },
                { username: { $regex: searchParam, $options: 'i' } },
            ];
        }

        // Récupérer le total des documents correspondants
        const total = await User.countDocuments(query);

        // Récupérer les utilisateurs paginés (en excluant les infos sensibles)
        const users = await User.find(query)
            .select('-password -resetPasswordToken -resetPasswordExpiry')
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        return NextResponse.json(
            { users, total, page: pageNum, limit: limitNum },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des utilisateurs' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/dashboard/users
 * Permet à l'administrateur de mettre à jour les informations d'un utilisateur.
 * Le corps de la requête doit contenir au moins "userId".
 * Vous pouvez envoyer d'autres champs (role, name, email, username, bio, points, badges) à modifier.
 */
export async function PATCH(req: NextRequest) {
    await dbConnect();

    try {
        const admin = await authMiddleware(req);
        if (!admin || admin.role !== 'Admin') {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, role, ...rest } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Identifiant de l\'utilisateur manquant.' }, { status: 400 });
        }

        const updateObj: any = {};

        if (role) {
            if (!['Apprenti', 'Rédacteur', 'Correcteur', 'Admin'].includes(role)) {
                return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
            }
            updateObj.role = role;
        }

        if (rest.name) updateObj.name = rest.name;
        if (rest.email) updateObj.email = rest.email;
        if (rest.username) updateObj.username = rest.username;
        if (rest.bio) updateObj.bio = rest.bio;
        if (rest.points !== undefined) updateObj.points = rest.points;
        if (rest.badges) updateObj.badges = rest.badges;

        const updatedUser = await User.findByIdAndUpdate(userId, updateObj, { new: true })
            .select('-password -resetPasswordToken -resetPasswordExpiry');

        if (!updatedUser) {
            return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 });
        }

        return NextResponse.json({ user: updatedUser }, { status: 200 });
    } catch (error) {
        console.error('Erreur PATCH /api/dashboard/users:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'utilisateur.' }, { status: 500 });
    }
}
