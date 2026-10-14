import { hasRole, roleFilter } from "@/lib/userRoles";
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import authMiddleware from '@/middlewares/authMiddleware';
import { escapeRegex } from '@/utils/escapeRegex';
import { hasPermission, getRolesMap } from '@/lib/roles';

// Forcer le rendu dynamique pour cette route
export const dynamic = "force-dynamic";

/** Rôles secondaires reçus du client : liste de rôles existants, dédoublonnée. null si invalide. */
async function validateRoles(roles: unknown): Promise<string[] | null> {
    if (!Array.isArray(roles) || !roles.every((r) => typeof r === 'string')) return null;
    const rolesMap = await getRolesMap();
    if (!roles.every((r) => rolesMap.has(r))) return null;
    return [...new Set(roles as string[])];
}

/**
 * GET /api/dashboard/users
 * Affiche la liste de tous les utilisateurs avec filtres avancés et pagination
 */
export async function GET(req: NextRequest) {
    await dbConnect();

    try {
        const admin = await authMiddleware(req);
        if (!admin || !hasRole(admin, "Admin")) {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        // Récupération des paramètres de pagination et de recherche
        const searchParam = req.nextUrl.searchParams.get('search') || '';
        const pageParam = req.nextUrl.searchParams.get('page');
        const limitParam = req.nextUrl.searchParams.get('limit');
        const roleParam = req.nextUrl.searchParams.get('role') || '';
        const sortByParam = req.nextUrl.searchParams.get('sortBy') || 'createdAt';
        const sortOrderParam = req.nextUrl.searchParams.get('sortOrder') || 'desc';
        const hasBadgesParam = req.nextUrl.searchParams.get('hasBadges');
        const minPointsParam = req.nextUrl.searchParams.get('minPoints');
        const maxPointsParam = req.nextUrl.searchParams.get('maxPoints');

        const pageNum = pageParam ? parseInt(pageParam) : 1;
        const limitNum = limitParam ? parseInt(limitParam) : 10;

        // Construction de la requête en fonction des filtres
        const query: any = {};

        // Recherche textuelle
        if (searchParam) {
            const escaped = escapeRegex(searchParam);
            query.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { email: { $regex: escaped, $options: 'i' } },
                { username: { $regex: escaped, $options: 'i' } },
                { bio: { $regex: escaped, $options: 'i' } },
            ];
        }

        // Filtre par rôle (principal ou secondaire)
        if (roleParam && roleParam !== 'all') {
            query.$and = [roleFilter(roleParam)];
        }

        // Filtre par badges
        if (hasBadgesParam === 'true') {
            query.badges = { $exists: true, $ne: [], $not: { $size: 0 } };
        }

        // Filtre par points
        if (minPointsParam || maxPointsParam) {
            query.points = {};
            if (minPointsParam) {
                query.points.$gte = parseInt(minPointsParam);
            }
            if (maxPointsParam && maxPointsParam !== '999999') {
                query.points.$lte = parseInt(maxPointsParam);
            }
        }

        // Configuration du tri
        const sortConfig: any = {};
        sortConfig[sortByParam] = sortOrderParam === 'asc' ? 1 : -1;

        // Récupérer le total des documents correspondants
        const total = await User.countDocuments(query);

        // Récupérer les utilisateurs paginés avec tri
        const users = await User.find(query)
            .select('-password -resetPasswordToken -resetPasswordExpiry')
            .sort(sortConfig)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        // Calculer les statistiques pour les filtres
        const stats = await Promise.all([
            User.countDocuments({ role: 'Apprenti' }),
            User.countDocuments(roleFilter('Rédacteur')),
            User.countDocuments(roleFilter('Correcteur')),
            User.countDocuments(roleFilter('Admin')),
            User.countDocuments({ badges: { $exists: true, $ne: [], $not: { $size: 0 } } }),
            User.aggregate([
                { $group: { _id: null, minPoints: { $min: '$points' }, maxPoints: { $max: '$points' }, avgPoints: { $avg: '$points' } } }
            ])
        ]);

        const [apprentiCount, redacteurCount, correcteurCount, adminCount, withBadgesCount, pointsStats] = stats;

        return NextResponse.json({
            users,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            stats: {
                roles: {
                    apprenti: apprentiCount,
                    redacteur: redacteurCount,
                    correcteur: correcteurCount,
                    admin: adminCount
                },
                withBadges: withBadgesCount,
                points: pointsStats[0] || { minPoints: 0, maxPoints: 0, avgPoints: 0 }
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Erreur GET /api/dashboard/users:', error);
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
 * Vous pouvez envoyer d'autres champs (role, roles, name, email, username, bio, points, badges) à modifier.
 * `roles` = rôles secondaires (le rôle principal en est retiré s'il y figure).
 */
export async function PATCH(req: NextRequest) {
    await dbConnect();

    try {
        const admin = await authMiddleware(req);
        if (!admin || !hasRole(admin, "Admin")) {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, role, roles, ...rest } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Identifiant de l\'utilisateur manquant.' }, { status: 400 });
        }

        const updateObj: any = {};

        if (role) {
            const rolesMap = await getRolesMap();
            if (!rolesMap.has(role)) {
                return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
            }
            updateObj.role = role;
        }

        if (roles !== undefined) {
            const checked = await validateRoles(roles);
            if (!checked) {
                return NextResponse.json({ error: 'Rôles secondaires invalides.' }, { status: 400 });
            }
            updateObj.roles = checked;
        }

        // Un rôle secondaire identique au principal ne sert à rien
        if (updateObj.role || updateObj.roles) {
            const current = await User.findById(userId).select('role roles').lean<{ role: string; roles?: string[] }>();
            if (!current) {
                return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 });
            }
            const primary = updateObj.role ?? current.role;
            updateObj.roles = (updateObj.roles ?? current.roles ?? []).filter((r: string) => r !== primary);
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

/**
 * POST /api/dashboard/users
 * Permet à l'administrateur de créer un nouvel utilisateur.
 */
export async function POST(req: NextRequest) {
    await dbConnect();

    try {
        const admin = await authMiddleware(req);
        if (!admin || !hasRole(admin, "Admin")) {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, username, role, roles, bio, points, badges } = body;

        // Validation des champs requis
        if (!name || !email || !username || !role) {
            return NextResponse.json({ error: 'Tous les champs obligatoires doivent être remplis.' }, { status: 400 });
        }

        const extraRoles = roles === undefined ? [] : await validateRoles(roles);
        if (!extraRoles) {
            return NextResponse.json({ error: 'Rôles secondaires invalides.' }, { status: 400 });
        }

        // Vérifier si l'email ou username existe déjà
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return NextResponse.json({ 
                error: existingUser.email === email ? 'Cet email est déjà utilisé.' : 'Ce nom d\'utilisateur est déjà utilisé.' 
            }, { status: 400 });
        }

        // Créer le nouvel utilisateur
        const newUser = new User({
            name,
            email,
            username,
            role,
            roles: extraRoles.filter((r) => r !== role),
            bio: bio || '',
            points: points || 20,
            badges: badges || [],
            password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12),
        });

        await newUser.save();

        const userResponse = newUser.toObject();
        const { password, ...userWithoutPassword } = userResponse;

        return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
    } catch (error) {
        console.error('Erreur POST /api/dashboard/users:', error);
        return NextResponse.json({ error: 'Erreur lors de la création de l\'utilisateur.' }, { status: 500 });
    }
}
