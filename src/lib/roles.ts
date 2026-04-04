import connectDB from '@/lib/mongodb';
import Role, { IRole } from '@/models/Role';

/* ═══════════════════════════════════════════════
   Liste de toutes les permissions du système
   ═══════════════════════════════════════════════ */

export const ALL_PERMISSIONS = {
    // Dashboard
    'dashboard.access': 'Accéder au dashboard',

    // Cours
    'course.create': 'Créer un cours',
    'course.edit': 'Modifier un cours',
    'course.delete': 'Supprimer un cours',

    // Leçons
    'lesson.create': 'Créer une leçon',
    'lesson.edit': 'Modifier une leçon',
    'lesson.approve': 'Approuver/publier une leçon',

    // Sections
    'section.create': 'Créer une section',
    'section.edit': 'Modifier une section',

    // Évaluations
    'evaluation.create': 'Créer une évaluation',
    'evaluation.edit': 'Modifier une évaluation',
    'evaluation.delete': 'Supprimer une évaluation',
    'evaluation.grade': 'Corriger une évaluation',

    // Fiches
    'fiche.create': 'Créer une fiche',
    'fiche.edit': 'Modifier une fiche',
    'fiche.delete': 'Supprimer une fiche',

    // Quiz
    'quiz.create': 'Créer un quiz',
    'quiz.edit': 'Modifier un quiz',
    'quiz.delete': 'Supprimer un quiz',

    // Forum
    'forum.moderate': 'Modérer le forum',
    'forum.validate_answer': 'Valider une réponse du forum',

    // Utilisateurs
    'user.manage': 'Gérer les utilisateurs',
    'user.ban': 'Bannir un utilisateur',
    'user.change_role': 'Changer le rôle d\'un utilisateur',

    // Rôles
    'role.manage': 'Gérer les rôles et permissions',

    // Administration
    'admin.panel': 'Accéder au panel admin',
    'admin.stats': 'Voir les statistiques admin',
    'admin.newsletter': 'Gérer la newsletter',
    'admin.partners': 'Gérer les partenaires',

    // Curriculum
    'curriculum.manage': 'Gérer le curriculum scolaire',

    // TTS
    'tts.generate': 'Générer de l\'audio TTS',
} as const;

export type Permission = keyof typeof ALL_PERMISSIONS;

/* Regroupement pour l'affichage dans l'UI admin */
export const PERMISSION_GROUPS: Record<string, Permission[]> = {
    'Dashboard': ['dashboard.access'],
    'Cours': ['course.create', 'course.edit', 'course.delete'],
    'Leçons': ['lesson.create', 'lesson.edit', 'lesson.approve'],
    'Sections': ['section.create', 'section.edit'],
    'Évaluations': ['evaluation.create', 'evaluation.edit', 'evaluation.delete', 'evaluation.grade'],
    'Fiches': ['fiche.create', 'fiche.edit', 'fiche.delete'],
    'Quiz': ['quiz.create', 'quiz.edit', 'quiz.delete'],
    'Forum': ['forum.moderate', 'forum.validate_answer'],
    'Utilisateurs': ['user.manage', 'user.ban', 'user.change_role'],
    'Rôles': ['role.manage'],
    'Administration': ['admin.panel', 'admin.stats', 'admin.newsletter', 'admin.partners'],
    'Autre': ['curriculum.manage', 'tts.generate'],
};

/* ═══════════════════════════════════════════════
   Rôles par défaut (seed)
   ═══════════════════════════════════════════════ */

export const DEFAULT_ROLES: Array<{
    name: string;
    displayName: string;
    description: string;
    color: string;
    icon: string;
    permissions: string[];
    isSystem: boolean;
    isDefault: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}> = [
    {
        name: 'Apprenti',
        displayName: 'Apprenti',
        description: 'Élève inscrit sur la plateforme',
        color: '#6b7280',
        icon: '',
        permissions: [],
        isSystem: true,
        isDefault: true,
        priority: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'Helpeur',
        displayName: 'Helpeur',
        description: 'Bénévole qui aide les élèves sur le forum et corrige les évaluations',
        color: '#f59e0b',
        icon: '',
        permissions: [
            'dashboard.access',
            'evaluation.grade',
            'forum.validate_answer',
            'fiche.edit',
        ],
        isSystem: false,
        isDefault: false,
        priority: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'Rédacteur',
        displayName: 'Rédacteur',
        description: 'Crée et édite le contenu pédagogique',
        color: '#3b82f6',
        icon: '',
        permissions: [
            'dashboard.access',
            'course.create', 'course.edit',
            'lesson.create', 'lesson.edit',
            'section.create', 'section.edit',
            'evaluation.create', 'evaluation.edit',
            'fiche.create', 'fiche.edit',
            'quiz.create', 'quiz.edit',
            'tts.generate',
        ],
        isSystem: false,
        isDefault: false,
        priority: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'Correcteur',
        displayName: 'Correcteur',
        description: 'Corrige les évaluations et révise le contenu',
        color: '#8b5cf6',
        icon: '',
        permissions: [
            'dashboard.access',
            'course.create', 'course.edit',
            'lesson.create', 'lesson.edit', 'lesson.approve',
            'section.create', 'section.edit',
            'evaluation.grade',
            'fiche.edit',
            'quiz.edit',
        ],
        isSystem: false,
        isDefault: false,
        priority: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'Modérateur',
        displayName: 'Modérateur',
        description: 'Modère le forum et les commentaires',
        color: '#10b981',
        icon: '',
        permissions: [
            'dashboard.access',
            'forum.moderate',
            'forum.validate_answer',
            'user.ban',
            'fiche.edit', 'fiche.delete',
        ],
        isSystem: false,
        isDefault: false,
        priority: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'Admin',
        displayName: 'Administrateur',
        description: 'Accès complet à toute la plateforme',
        color: '#ef4444',
        icon: '',
        permissions: Object.keys(ALL_PERMISSIONS) as Permission[],
        isSystem: true,
        isDefault: false,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

/* ═══════════════════════════════════════════════
   Cache mémoire (évite un appel DB à chaque requête)
   ═══════════════════════════════════════════════ */

let rolesCache: Map<string, IRole> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minute

export async function getRolesMap(): Promise<Map<string, IRole>> {
    if (rolesCache && Date.now() - cacheTimestamp < CACHE_TTL) {
        return rolesCache;
    }
    await connectDB();
    const roles = await Role.find().lean();
    rolesCache = new Map(roles.map((r) => [r.name, r as IRole]));
    cacheTimestamp = Date.now();
    return rolesCache;
}

/** Force le rechargement du cache (après CRUD sur les rôles) */
export function invalidateRolesCache() {
    rolesCache = null;
    cacheTimestamp = 0;
}

/* ═══════════════════════════════════════════════
   Vérification de permission
   ═══════════════════════════════════════════════ */

/**
 * Vérifie si un rôle possède une permission donnée.
 * Admin a toujours toutes les permissions.
 */
export async function hasPermission(
    roleName: string,
    permission: Permission
): Promise<boolean> {
    if (roleName === 'Admin') return true;
    const roles = await getRolesMap();
    const role = roles.get(roleName);
    if (!role) return false;
    return role.permissions.includes(permission);
}

/**
 * Vérifie si un rôle possède au moins une des permissions données.
 */
export async function hasAnyPermission(
    roleName: string,
    permissions: Permission[]
): Promise<boolean> {
    if (roleName === 'Admin') return true;
    const roles = await getRolesMap();
    const role = roles.get(roleName);
    if (!role) return false;
    return permissions.some((p) => role.permissions.includes(p));
}

/**
 * Récupère les infos d'un rôle par son nom.
 */
export async function getRoleByName(name: string): Promise<IRole | null> {
    const roles = await getRolesMap();
    return roles.get(name) || null;
}

/* ═══════════════════════════════════════════════
   Seed — insère les rôles par défaut si absents
   ═══════════════════════════════════════════════ */

export async function seedRoles() {
    await connectDB();
    const existing = await Role.find().lean();
    const existingNames = new Set(existing.map((r) => r.name));

    const toInsert = DEFAULT_ROLES.filter((r) => !existingNames.has(r.name));
    if (toInsert.length > 0) {
        await Role.insertMany(toInsert);
        invalidateRolesCache();
    }
}
