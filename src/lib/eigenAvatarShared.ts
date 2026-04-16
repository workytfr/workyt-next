/**
 * Constantes et hash partagés entre le site (React canvas) et l’API PNG (/api/avatar).
 * Ne pas diverger : même rendu que AvatarDisplay / ProfileAvatar.
 */

export const COLOR_SETS: string[][] = [
    ["#6366F1", "#8B5CF6", "#A855F7"],
    ["#EC4899", "#F472B6", "#F9A8D4"],
    ["#0EA5E9", "#38BDF8", "#7DD3FC"],
    ["#10B981", "#34D399", "#6EE7B7"],
    ["#F59E0B", "#FBBF24", "#FCD34D"],
];

export const PIXELS_GRADIENT = ["#6366F1", "#EC4899", "#10B981", "#F59E0B"];

export function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

/** 0–3 : Interference, Plasma, Smile, Pixels */
export function getEigenThemeIndex(id: string): number {
    return hashString(id) % 4;
}
