import type { CSSProperties } from "react";
import { WORKYT_BIRD } from "@/lib/workytMark";

/**
 * Logo Workyt animé (SVG inline).
 * - Au montage : chaque glyphe + l'oiseau se "dessinent" au tracé
 *   (stroke-dashoffset en CSS, classe `.wk-logo-path` dans globals.css), puis se
 *   remplissent. Pas de framer-motion : le logo est sur toutes les pages, la
 *   lib (~39 Ko gz) partait dans le bundle commun rien que pour lui.
 * - Remplissage : dégradé SMIL qui cycle sur toutes les couleurs de la marque.
 * - Survol : lift + glow (classe `.wk-logo` dans globals.css).
 */

// Mot-symbole « workyt » — chaque glyphe avec son transform local d'origine.
const GLYPH_TRANSFORM = "matrix(1,0,0,1,-111.802015,-73.055014)";
const wordmark: { d: string; t: string }[] = [
    { t: GLYPH_TRANSFORM, d: "M2141.082,1045.821L2101.695,924.925L2127.886,924.925L2155.71,1013.5L2156.406,1013.5L2174.796,962.233L2198.479,962.233L2216.729,1013.5L2217.426,1013.5L2233.308,962.233L2259.22,962.233L2232.054,1045.821L2205.027,1045.821L2186.777,996.783L2186.219,996.783L2168.109,1045.821L2141.082,1045.821Z" },
    { t: GLYPH_TRANSFORM, d: "M2308.537,1047.493C2299.343,1047.493 2291.309,1045.705 2284.436,1042.129C2277.563,1038.554 2272.246,1033.492 2268.485,1026.944C2264.723,1020.396 2262.901,1011.574 2262.842,1003.888C2262.784,996.201 2266.039,988.429 2268.134,980.825C2270.84,971.007 2279.078,944.981 2279.078,944.981L2308.702,960.612L2338.841,944.935C2338.841,944.935 2344.666,974.399 2348.381,980.901C2352.096,987.402 2353.954,995.111 2353.954,1004.027C2353.954,1012.85 2352.096,1020.536 2348.381,1027.083C2344.666,1033.631 2339.419,1038.67 2332.639,1042.199C2325.859,1045.728 2317.825,1047.493 2308.537,1047.493ZM2308.537,1025.203C2314.946,1025.203 2319.845,1023.275 2323.235,1019.421C2326.625,1015.567 2328.32,1010.389 2328.32,1003.888C2328.32,997.386 2326.625,992.255 2323.235,988.493C2319.845,984.732 2314.946,982.851 2308.537,982.851C2302.036,982.851 2297.067,984.732 2293.631,988.493C2290.194,992.255 2288.476,997.386 2288.476,1003.888C2288.476,1010.389 2290.194,1015.567 2293.631,1019.421C2297.067,1023.275 2302.036,1025.203 2308.537,1025.203Z" },
    { t: GLYPH_TRANSFORM, d: "M2374.294,1045.821L2374.294,987.309L2361.756,987.309L2361.756,962.233L2387.389,962.233L2387.389,978.95L2393.241,978.95C2395.377,972.913 2398.86,968.432 2403.689,965.506C2408.519,962.581 2413.906,961.118 2419.85,961.118L2426.955,961.118L2426.955,983.408L2418.735,983.408C2411.862,983.408 2406.917,985.312 2403.898,989.12C2400.88,992.928 2399.37,997.897 2399.37,1004.027L2399.37,1045.821L2374.294,1045.821Z" },
    { t: "matrix(1,0,0,1,-46.602877,-119.06221)", d: "M2387.61,987.376L2374.294,987.309L2361.756,987.309L2361.756,962.233L2387.389,962.233L2387.61,987.376Z" },
    { t: GLYPH_TRANSFORM, d: "M2438.657,1045.821L2438.657,928.797L2464.291,928.797L2464.291,989.677L2464.848,989.677L2495.219,962.233L2525.589,962.233L2491.039,993.439L2528.097,1045.821L2498.284,1045.821L2472.928,1009.042L2464.291,1016.008L2464.291,1045.821L2438.657,1045.821Z" },
    { t: GLYPH_TRANSFORM, d: "M2509.253,1079.341L2509.253,1058.722L2557.074,1058.638L2562.786,1044.846L2527.261,962.233L2554.427,962.233L2576.16,1015.59L2576.718,1015.59L2592.754,988.137L2619.224,988.137L2588.559,1045.821L2582.29,1060.728C2579.783,1066.672 2576.787,1071.246 2573.304,1074.45C2569.822,1077.655 2564.69,1079.257 2557.91,1079.257L2509.253,1079.341Z" },
    { t: "matrix(1,0,0,1,-111.802015,-66.821784)", d: "M2663.158,1041.26C2656.657,1041.26 2651.619,1039.611 2648.043,1036.314C2644.467,1033.017 2642.679,1027.978 2642.679,1021.198L2642.116,974.389L2600.801,974.554L2600.801,954.493L2642.394,954.328L2642.218,908.235L2665.15,926.813L2665.173,954.383L2711.075,954.361L2711.154,974.141L2665.143,974.376L2665.167,1021.358L2688.374,1021.198L2688.374,1041.26L2663.158,1041.26Z" },
];

// Icône oiseau / origami (partagée avec les contours de profil).
const bird = WORKYT_BIRD;

export default function WorkytLogo({ className = "" }: { className?: string }) {
    // Décalage du tracé par glyphe, lu par l'animation CSS.
    const delay = (i: number) => ({ "--wk-delay": `${0.15 + i * 0.09}s` }) as CSSProperties;

    const stroke = "url(#wkLogoGrad)";
    const fill = "url(#wkLogoGrad)";

    return (
        <svg
            viewBox="0 0 1688 359"
            className={`wk-logo ${className}`}
            role="img"
            aria-label="Workyt"
            fill="none"
        >
            <defs>
                <linearGradient id="wkLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f5610c">
                        <animate attributeName="stop-color" values="#f5610c;#e32c0c;#f72585;#970ce3;#7091f5;#f5610c" dur="8s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor="#970ce3">
                        <animate attributeName="stop-color" values="#970ce3;#7091f5;#f5610c;#e32c0c;#f72585;#970ce3" dur="8s" repeatCount="indefinite" />
                    </stop>
                </linearGradient>
            </defs>

            <g transform="matrix(1,0,0,1,-414.042591,-3838.804522)">
                {/* Mot-symbole « workyt » */}
                <g transform="matrix(2.175642,0,0,2.175642,-3553.536171,2008.190791)">
                    {wordmark.map((p, i) => (
                        <g key={`w${i}`} transform={p.t}>
                            <path
                                d={p.d}
                                pathLength={1}
                                className="wk-logo-path"
                                style={delay(i)}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth={5}
                                strokeLinejoin="round"
                            />
                        </g>
                    ))}
                </g>

                {/* Oiseau / origami */}
                <g transform="matrix(1,0,0,1,410.354895,3874.216062)">
                    {bird.map((d, i) => (
                        <path
                            key={`b${i}`}
                            d={d}
                            pathLength={1}
                            className="wk-logo-path"
                            style={delay(wordmark.length + i)}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={9}
                            strokeLinejoin="round"
                        />
                    ))}
                </g>
            </g>
        </svg>
    );
}
