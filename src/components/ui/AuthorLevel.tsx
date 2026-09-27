import { calculateUserRank } from "@/lib/rankSystem";
import RankIcon from "@/components/ui/RankIcon";

/**
 * Niveau d'un auteur, affiché juste après son pseudo : l'icône du rang,
 * à sa couleur. Le détail (rang, niveau, points) est au survol et lu par les
 * lecteurs d'écran. Remplace l'ancienne pastille de points en coin d'avatar,
 * qui se lisait comme un compteur de notifications.
 */
export default function AuthorLevel({ points = 0, className = "" }: { points?: number; className?: string }) {
    const rank = calculateUserRank(points);
    const label = `${rank.name} · Niv. ${rank.level} · ${points.toLocaleString("fr-FR")} points`;
    return (
        <span className={`inline-flex shrink-0 items-center ${className}`} title={label}>
            <RankIcon level={rank.level} color={rank.color} size={14} />
            <span className="sr-only">{label}</span>
        </span>
    );
}
