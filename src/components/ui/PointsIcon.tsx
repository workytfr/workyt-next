import Image from "next/image";

interface PointsIconProps {
    size?: number;
    className?: string;
}

/**
 * Icône points officielle du site Workyt (badge/points.png).
 * À utiliser pour toute représentation visuelle des points.
 */
export default function PointsIcon({ size = 16, className = "" }: PointsIconProps) {
    return (
        <Image
            src="/badge/points.png"
            alt="points"
            width={size}
            height={size}
            className={`inline-block align-text-bottom ${className}`}
        />
    );
}
