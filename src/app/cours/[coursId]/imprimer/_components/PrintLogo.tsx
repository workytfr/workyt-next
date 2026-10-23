import { WORKYT_WORDMARK } from "@/components/ui/WorkytLogo";
import { WORKYT_BIRD } from "@/lib/workytMark";

/**
 * Logo Workyt fixe pour l'impression : mêmes tracés que WorkytLogo, sans
 * l'animation (qui pourrait être figée en cours de tracé dans le PDF), avec le
 * dégradé des documents PDF de l'association (docs/_pdf/render.js).
 */
export default function PrintLogo({ className = "", id }: { className?: string; id: string }) {
    const fill = `url(#${id})`;
    return (
        <svg viewBox="0 0 1688 359" className={className} role="img" aria-label="Workyt">
            <defs>
                <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f5610c" />
                    <stop offset="45%" stopColor="#f72585" />
                    <stop offset="100%" stopColor="#970ce3" />
                </linearGradient>
            </defs>
            <g transform="matrix(1,0,0,1,-414.042591,-3838.804522)">
                <g transform="matrix(2.175642,0,0,2.175642,-3553.536171,2008.190791)">
                    {WORKYT_WORDMARK.map((p, i) => (
                        <g key={i} transform={p.t}>
                            <path d={p.d} fill={fill} />
                        </g>
                    ))}
                </g>
                <g transform="matrix(1,0,0,1,410.354895,3874.216062)">
                    {WORKYT_BIRD.map((d, i) => (
                        <path key={i} d={d} fill={fill} />
                    ))}
                </g>
            </g>
        </svg>
    );
}
