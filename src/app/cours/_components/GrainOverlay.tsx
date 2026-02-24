"use client";

import { cn } from "@/lib/utils";

interface GrainOverlayProps {
    opacity?: number;
    className?: string;
}

export function GrainOverlay({ opacity = 0.05, className }: GrainOverlayProps) {
    return (
        <div
            className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}
            style={{
                backgroundImage: "url(/noise.webp)",
                backgroundSize: "30%",
                opacity,
                mixBlendMode: "overlay" as const,
            }}
        />
    );
}

export function OrangeGradient({ className = "", children }: { className?: string; children?: React.ReactNode }) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-100 to-orange-50 opacity-80 z-0" />
            <div className="absolute inset-0 z-0">
                <GrainOverlay opacity={0.07} />
            </div>
            <div className="relative z-10 h-full">{children}</div>
        </div>
    );
}
