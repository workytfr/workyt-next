/**
 * Fonction utilitaire pour obtenir le chemin de l'icône de rôle
 */
export function getRoleIconPath(role: string | undefined | null): string | null {
    if (!role) return null;
    
    const roleMap: Record<string, string> = {
        'Admin': '/role/Admin.webp',
        'Correcteur': '/role/Correcteur.webp',
        'Helpeur': '/role/Helpeur.webp',
        'Modérateur': '/role/Modérateur.webp',
        'Rédacteur': '/role/Rédacteur.webp',
    };
    
    return roleMap[role] || null;
}

