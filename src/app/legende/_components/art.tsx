/* Dessins de la Légende : renard, flamme du logo, bannière. */

/** Les deux tracés de la flamme du logo Workyt (public/workyt_square.svg). */
const FLAME_TOP = "m34.13,76.62c2.65-9.87,8.34-17.99,14.83-25.62,3.8-4.47,8.12-8.43,12.63-12.18,5.8-4.82,10.3-10.66,13.64-17.41.35-.7.7-1.39,1.03-2.04,1.14-.12,1.43.76,1.81,1.37,6.92,11.08,10.68,23.12,10.68,36.21,0,3.48-.45,6.97-1.23,10.4-.88,3.9-.83,3.87,2.7,5.42,5.37,2.35,10.6,4.95,15.37,8.42,5.17,3.77,8.89,8.63,11.2,14.54,3.91,10.01,8.9,19.36,15.98,27.51,8.96,10.31,20.02,17.28,33.14,21.02-1.31.02-2.63.18-3.92.03-10.07-1.23-20.11-2.65-30.07-4.63-19.99-3.98-39.31-9.85-57.31-19.64-8.15-4.44-15.8-9.62-22.35-16.17-7.46-7.45-13.39-16.02-16.49-26.27-.33-1.09-.55-1.6-1.66-.96Z";
const FLAME_BOTTOM = "m34.13,76.62c1.12-.64,1.34-.13,1.66.96,3.1,10.25,9.03,18.82,16.49,26.27,6.55,6.54,14.2,11.73,22.35,16.17,18,9.8,37.31,15.67,57.31,19.64,9.96,1.98,20,3.41,30.07,4.63,1.29.16,2.61,0,3.92-.03.76.1,1.53.2,2.39.31-.13.33-.16.64-.33.76-12.79,9.03-26.21,16.72-42.02,19.07-19.57,2.91-37.88-1.05-54.98-10.69-14.81-8.36-26.51-19.87-33.89-35.38-6.17-12.96-7.38-26.42-3.58-40.29.14-.49.4-.95.6-1.43Z";

/** Flamme du logo d'une seule couleur ; le trait de même teinte soude les deux morceaux. */
export function FlameLogo({ className, color = "currentColor" }: { className?: string; color?: string }) {
    return (
        <svg viewBox="30 18 145 150" className={className} aria-hidden="true">
            <g fill={color} stroke={color} strokeWidth={2.4} strokeLinejoin="round">
                <path d={FLAME_TOP} />
                <path d={FLAME_BOTTOM} />
            </g>
        </svg>
    );
}

/** Tête de Foxy : vieux renard, regard plissé, cicatrice sur le museau. */
export function FoxyMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
            <path d="M8 12 22 25Q32 21 42 25L56 12 54 34Q50 50 32 57 14 50 10 34Z" fill="#e8651a" stroke="#1a1512" strokeWidth={3} strokeLinejoin="round" />
            <path d="M12.5 18 20 26 14.5 29Z M51.5 18 44 26 49.5 29Z" fill="#7a2c0a" />
            <path d="M13 37Q22 39 32 53 18 50 13 37Z M51 37Q42 39 32 53 46 50 51 37Z" fill="#fff1dc" />
            <path d="M19.5 34.5 27 36.5 M44.5 34.5 37 36.5" stroke="#1a1512" strokeWidth={3} strokeLinecap="round" />
            <path d="M36.5 39.5 40 45" stroke="#7a2c0a" strokeWidth={1.8} strokeLinecap="round" />
            <ellipse cx="32" cy="50" rx="3.4" ry="2.6" fill="#1a1512" />
        </svg>
    );
}

/** Bannière de clan, couleur au choix. */
export function Banner({ color, label }: { color: string; label: string }) {
    return (
        <svg viewBox="0 0 80 150" className="h-full w-full" role="img" aria-label={label}>
            <path d="M6 6h68" stroke="#1a1512" strokeWidth={4} strokeLinecap="round" />
            <path d="M12 8h56v126l-28-18-28 18Z" fill={color} stroke="#1a1512" strokeWidth={3} strokeLinejoin="round" />
            <path d="M18 14h44" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
            <g transform="translate(20 34) scale(0.27)">
                <path d={FLAME_TOP} fill="#fff4e0" transform="translate(-30 -18)" />
                <path d={FLAME_BOTTOM} fill="#fff4e0" transform="translate(-30 -18)" />
            </g>
        </svg>
    );
}

/* ---------- Pictogrammes des planches : trait d'encre, aplats de la marque ---------- */

const INK = "#1a1512";

/** Bête de garde d'une dalle ; `crowned` pour le Gardien du 15. */
export function Beast({ className, crowned = false }: { className?: string; crowned?: boolean }) {
    return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
            {crowned && <path d="M20 14l5 7 7-9 7 9 5-7v10H20Z" fill="#ffb547" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />}
            <path d="M14 30l-4-12 11 7M50 30l4-12-11 7" fill="#7a2c0a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M12 40c0-12 9-18 20-18s20 6 20 18-9 18-20 18-20-6-20-18Z" fill={crowned ? "#c24a0a" : "#e8651a"} stroke={INK} strokeWidth={3} />
            <path d="M22 37l7 3M42 37l-7 3" stroke={INK} strokeWidth={3} strokeLinecap="round" />
            <path d="M25 49q7 4 14 0" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
            <path d="M28 49.5l1.5 3 1.5-2.6M33 50.4l1.5 2.6 1.5-3" fill="#fff4e0" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
    );
}

/** Lanterne ; `flame` de 0 à 1 règle la taille de la flamme. */
export function Lantern({ className, flame = 0.5 }: { className?: string; flame?: number }) {
    const s = 0.35 + flame * 0.65;
    return (
        <svg viewBox="0 0 48 72" className={className} aria-hidden="true">
            <path d="M18 8a6 6 0 0 1 12 0" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
            <path d="M12 11h24l-3 6H15Z" fill="#7a2c0a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M15 17h18l3 41H12Z" fill="#fff4e0" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <g transform={`translate(24 52) scale(${s}) translate(-24 -52)`}>
                <path d="M24 26c6 8 9 13 9 18a9 9 0 0 1-18 0c0-5 3-9 6-12 0 4 1 6 3 7-1-5-1-9 0-13Z" fill="#ff6a1a" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
                <path d="M24 40c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7Z" fill="#ffd27a" />
            </g>
            <path d="M9 58h30l-3 8H12Z" fill="#7a2c0a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        </svg>
    );
}

export function Sword({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
            <path d="M36 6l6 0 0 6-20 20-6-6Z" fill="#e9dccb" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M12 24l12 12" stroke={INK} strokeWidth={3} strokeLinecap="round" />
            <path d="M15 33l-7 7" stroke="#7a2c0a" strokeWidth={5} strokeLinecap="round" />
            <path d="M15 33l-7 7" stroke={INK} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
        </svg>
    );
}

export function Armor({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
            <path d="M16 6h16l8 6-4 8v20H12V20l-4-8Z" fill="#9fb3c8" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M18 6q6 8 12 0M12 28h24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        </svg>
    );
}

export function Amulet({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
            <path d="M12 6q12 18 24 0" fill="none" stroke="#b38a2e" strokeWidth={2.5} strokeLinecap="round" />
            <path d="M24 20l9 9-9 13-9-13Z" fill="#ff6a1a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M24 24l4 5-4 6" fill="none" stroke="#ffd27a" strokeWidth={2} strokeLinecap="round" />
        </svg>
    );
}

export function CrossedSwords({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
            {[1, -1].map((d) => (
                <g key={d} transform={d === -1 ? "translate(64 0) scale(-1 1)" : undefined}>
                    <path d="M10 8h6l28 28-6 6L10 14Z" fill="#e9dccb" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
                    <path d="M34 46l12-12" stroke={INK} strokeWidth={3} strokeLinecap="round" />
                    <path d="M44 44l10 10" stroke="#7a2c0a" strokeWidth={6} strokeLinecap="round" />
                </g>
            ))}
        </svg>
    );
}

export function Scroll({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
            <path d="M12 8h26v30a4 4 0 0 1-4 4H10" fill="#fff4e0" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M10 42a4 4 0 0 1-4-4V12a4 4 0 0 1 8 0v26a4 4 0 0 1-4 4Z" fill="#f0d9b5" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M19 16h13M19 22h13M19 28h9" stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        </svg>
    );
}

export function Book({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
            <path d="M8 10h14a4 4 0 0 1 4 4v26a3 3 0 0 0-3-3H8Z" fill="#ff6a1a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M40 10H26a4 4 0 0 0-4 4v26a3 3 0 0 1 3-3h15Z" fill="#fff4e0" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M29 18h7M29 24h7M29 30h5" stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        </svg>
    );
}
