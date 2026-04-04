import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import Role from '@/models/Role';
import User from '@/models/User';
import { hasPermission, invalidateRolesCache, ALL_PERMISSIONS } from '@/lib/roles';

type Params = { params: Promise<{ roleId: string }> };

/**
 * GET /api/admin/roles/[roleId]
 */
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'role.manage'))) {
            return NextResponse.json({ error: 'Permission refusée.' }, { status: 403 });
        }

        const { roleId } = await params;
        const role = await Role.findById(roleId).lean();
        if (!role) {
            return NextResponse.json({ error: 'Rôle non trouvé.' }, { status: 404 });
        }

        const userCount = await User.countDocuments({ role: role.name });

        return NextResponse.json({ role: { ...role, userCount } });
    } catch (error: any) {
        return handleApiError(error, 'Erreur récupération rôle');
    }
}

/**
 * PUT /api/admin/roles/[roleId]
 * Modifier un rôle (permissions, couleur, description, priorité).
 * Le nom des rôles système ne peut pas être changé.
 */
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'role.manage'))) {
            return NextResponse.json({ error: 'Permission refusée.' }, { status: 403 });
        }

        const { roleId } = await params;
        const role = await Role.findById(roleId);
        if (!role) {
            return NextResponse.json({ error: 'Rôle non trouvé.' }, { status: 404 });
        }

        const body = await req.json();

        // Les rôles système : on peut modifier permissions/couleur/description mais pas le nom
        if (role.isSystem && body.name && body.name !== role.name) {
            return NextResponse.json({ error: 'Impossible de renommer un rôle système.' }, { status: 400 });
        }

        // Renommer : vérifier unicité + mettre à jour les utilisateurs
        if (body.name && body.name !== role.name) {
            if (!/^[a-zA-ZÀ-ÿ0-9_-]+$/.test(body.name)) {
                return NextResponse.json({ error: 'Nom invalide.' }, { status: 400 });
            }
            const duplicate = await Role.findOne({ name: body.name, _id: { $ne: roleId } });
            if (duplicate) {
                return NextResponse.json({ error: 'Ce nom de rôle existe déjà.' }, { status: 409 });
            }
            // Mettre à jour tous les users qui avaient l'ancien nom
            await User.updateMany({ role: role.name }, { role: body.name });
            role.name = body.name;
        }

        if (body.displayName !== undefined) role.displayName = body.displayName;
        if (body.description !== undefined) role.description = body.description;
        if (body.color !== undefined) role.color = body.color;
        if (typeof body.priority === 'number') role.priority = body.priority;

        if (Array.isArray(body.permissions)) {
            // Admin système garde toujours toutes les permissions
            if (role.isSystem && role.name === 'Admin') {
                role.permissions = Object.keys(ALL_PERMISSIONS);
            } else {
                const validPerms = Object.keys(ALL_PERMISSIONS);
                role.permissions = body.permissions.filter((p: string) => validPerms.includes(p));
            }
        }

        await role.save();
        invalidateRolesCache();

        return NextResponse.json({ role });
    } catch (error: any) {
        return handleApiError(error, 'Erreur modification rôle');
    }
}

/**
 * DELETE /api/admin/roles/[roleId]
 * Supprimer un rôle (impossible si système ou si des utilisateurs l'ont).
 */
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'role.manage'))) {
            return NextResponse.json({ error: 'Permission refusée.' }, { status: 403 });
        }

        const { roleId } = await params;
        const role = await Role.findById(roleId);
        if (!role) {
            return NextResponse.json({ error: 'Rôle non trouvé.' }, { status: 404 });
        }

        if (role.isSystem) {
            return NextResponse.json({ error: 'Impossible de supprimer un rôle système.' }, { status: 400 });
        }

        const userCount = await User.countDocuments({ role: role.name });
        if (userCount > 0) {
            return NextResponse.json({
                error: `${userCount} utilisateur(s) ont ce rôle. Réassignez-les d'abord.`,
            }, { status: 400 });
        }

        await Role.findByIdAndDelete(roleId);
        invalidateRolesCache();

        return NextResponse.json({ message: 'Rôle supprimé.' });
    } catch (error: any) {
        return handleApiError(error, 'Erreur suppression rôle');
    }
}

/**
 * POST /api/admin/roles/[roleId] — Cloner un rôle
 */
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'role.manage'))) {
            return NextResponse.json({ error: 'Permission refusée.' }, { status: 403 });
        }

        const { roleId } = await params;
        const source = await Role.findById(roleId).lean();
        if (!source) {
            return NextResponse.json({ error: 'Rôle source non trouvé.' }, { status: 404 });
        }

        // Trouver un nom unique
        let cloneName = `${source.name}-copie`;
        let i = 2;
        while (await Role.findOne({ name: cloneName })) {
            cloneName = `${source.name}-copie-${i++}`;
        }

        const clone = await Role.create({
            name: cloneName,
            displayName: `${source.displayName} (copie)`,
            description: source.description,
            color: source.color,
            permissions: [...source.permissions],
            isSystem: false,
            isDefault: false,
            priority: source.priority,
        });

        invalidateRolesCache();

        return NextResponse.json({ role: clone }, { status: 201 });
    } catch (error: any) {
        return handleApiError(error, 'Erreur clonage rôle');
    }
}
