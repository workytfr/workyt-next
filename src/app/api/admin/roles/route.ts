import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import Role from '@/models/Role';
import User from '@/models/User';
import { hasPermission, invalidateRolesCache, ALL_PERMISSIONS, PERMISSION_GROUPS } from '@/lib/roles';

/**
 * GET /api/admin/roles
 * Liste tous les rôles + nombre d'utilisateurs par rôle.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'role.manage'))) {
            return NextResponse.json({ error: 'Permission refusée.' }, { status: 403 });
        }

        const roles = await Role.find().sort({ priority: -1 }).lean();

        // Compter les utilisateurs par rôle
        const roleCounts = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
        ]);
        const countMap = new Map(roleCounts.map((r: any) => [r._id, r.count]));

        const rolesWithCount = roles.map((r) => ({
            ...r,
            userCount: countMap.get(r.name) || 0,
        }));

        return NextResponse.json({
            roles: rolesWithCount,
            permissions: ALL_PERMISSIONS,
            permissionGroups: PERMISSION_GROUPS,
        });
    } catch (error: any) {
        return handleApiError(error, 'Erreur liste rôles');
    }
}

/**
 * POST /api/admin/roles
 * Créer un nouveau rôle.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'role.manage'))) {
            return NextResponse.json({ error: 'Permission refusée.' }, { status: 403 });
        }

        const body = await req.json();
        const { name, displayName, description, color, permissions, priority } = body;

        if (!name || !displayName) {
            return NextResponse.json({ error: 'Nom et nom d\'affichage requis.' }, { status: 400 });
        }

        if (!/^[a-zA-ZÀ-ÿ0-9_-]+$/.test(name)) {
            return NextResponse.json({ error: 'Le nom ne doit contenir que des lettres, chiffres, tirets et underscores.' }, { status: 400 });
        }

        // Vérifier que les permissions existent
        const validPerms = Object.keys(ALL_PERMISSIONS);
        const filteredPerms = (permissions || []).filter((p: string) => validPerms.includes(p));

        const existing = await Role.findOne({ name });
        if (existing) {
            return NextResponse.json({ error: 'Ce nom de rôle existe déjà.' }, { status: 409 });
        }

        const role = await Role.create({
            name,
            displayName,
            description: description || '',
            color: color || '#6b7280',
            permissions: filteredPerms,
            isSystem: false,
            isDefault: false,
            priority: typeof priority === 'number' ? priority : 0,
        });

        invalidateRolesCache();

        return NextResponse.json({ role }, { status: 201 });
    } catch (error: any) {
        return handleApiError(error, 'Erreur création rôle');
    }
}
