import Image from "next/image";

interface PointsIconProps {
    size?: number;
    className?: string;
}

/**
 * Icône points officielle du site Workyt (badge/coin.svg, pièce carrée).
 * À utiliser pour toute représentation visuelle des points.
 */
export default function PointsIcon({ size = 16, className = "" }: PointsIconProps) {
    return (
        <Image
            src="/badge/coin.svg"
            alt="points"
            width={size}
            height={size}
            className={`inline-block align-text-bottom ${className}`}
        />
    );
}
