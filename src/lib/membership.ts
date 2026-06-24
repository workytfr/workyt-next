/**
 * Constantes partagées pour l'adhésion à l'association Workyt.
 * Importable côté client comme serveur (aucune dépendance DB).
 */

export type MembershipType = 'benevole' | 'salarie' | 'utilisateur';
export type MembershipStatus = 'actif' | 'suspendu';

/** Couleur associée au statut de la personne dans l'association. */
export const MEMBERSHIP_TYPES: Record<
    MembershipType,
    { label: string; color: string; soft: string }
> = {
    benevole: { label: 'Bénévole', color: '#10b981', soft: '#d1fae5' },
    salarie: { label: 'Salarié', color: '#2563eb', soft: '#dbeafe' },
    utilisateur: { label: 'Utilisateur', color: '#ff6a1a', soft: '#ffe8d6' },
};

export const MEMBERSHIP_TYPE_IDS = Object.keys(MEMBERSHIP_TYPES) as MembershipType[];

export function isValidMembershipType(t: string): t is MembershipType {
    return MEMBERSHIP_TYPE_IDS.includes(t as MembershipType);
}

export function membershipTypeLabel(t: string): string {
    return MEMBERSHIP_TYPES[t as MembershipType]?.label || t;
}

export function membershipTypeColor(t: string): string {
    return MEMBERSHIP_TYPES[t as MembershipType]?.color || '#ff6a1a';
}

/** Nombre d'absences consécutives aux AG entraînant la suspension de l'adhésion. */
export const MAX_CONSECUTIVE_ABSENCES = 3;

/** Couleurs de marque (alignées sur les PDF fiches/évaluations). */
export const BRAND = {
    orange: '#ff6a1a',
    dark: '#1a1512',
    gray: '#6b6b6b',
};

/** Génère un numéro d'adhérent : WK-<année>-<séquence sur 4 chiffres>. */
export function formatMemberNumber(year: number, seq: number): string {
    return `WK-${year}-${String(seq).padStart(4, '0')}`;
}
