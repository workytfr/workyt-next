"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Quote, Star } from "lucide-react";
import { AvatarDisplay } from "./AvatarDisplay";

export const InfiniteMovingCards = ({
    items,
    direction = "left",
    speed = "fast",
    pauseOnHover = true,
    className,
}: {
    items: {
        quote: string;
        name: string;
        title: string;
        userId?: string;
        avatar?: string;
    }[];
    direction?: "left" | "right";
    speed?: "fast" | "normal" | "slow";
    pauseOnHover?: boolean;
    className?: string;
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollerRef = React.useRef<HTMLUListElement>(null);

    useEffect(() => {
        addAnimation();
    }, []);
    const [start, setStart] = useState(false);

    function addAnimation() {
        if (containerRef.current && scrollerRef.current) {
            const scrollerContent = Array.from(scrollerRef.current.children);

            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true);
                if (scrollerRef.current) {
                    scrollerRef.current.appendChild(duplicatedItem);
                }
            });

            getDirection();
            getSpeed();
            setStart(true);
        }
    }

    const getDirection = () => {
        if (containerRef.current) {
            if (direction === "left") {
                containerRef.current.style.setProperty(
                    "--animation-direction",
                    "forwards"
                );
            } else {
                containerRef.current.style.setProperty(
                    "--animation-direction",
                    "reverse"
                );
            }
        }
    };

    const getSpeed = () => {
        if (containerRef.current) {
            if (speed === "fast") {
                containerRef.current.style.setProperty("--animation-duration", "20s");
            } else if (speed === "normal") {
                containerRef.current.style.setProperty("--animation-duration", "40s");
            } else {
                containerRef.current.style.setProperty("--animation-duration", "80s");
            }
        }
    };

    // Couleurs de dégradé modernes pour les cartes
    const getGradientColors = (index: number) => {
        const gradients = [
            "from-rose-500 via-pink-500 to-rose-600", // Rose dégradé
            "from-violet-500 via-purple-500 to-violet-600", // Violet dégradé
            "from-blue-500 via-indigo-500 to-blue-600", // Bleu dégradé
            "from-emerald-500 via-teal-500 to-emerald-600", // Vert dégradé
            "from-orange-500 via-amber-500 to-orange-600", // Orange dégradé
        ];
        return gradients[index % gradients.length];
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]",
                className
            )}
        >
            <ul
                ref={scrollerRef}
                className={cn(
                    "flex min-w-full shrink-0 gap-5 py-4 w-max flex-nowrap",
                    start && "animate-scroll",
                    pauseOnHover && "hover:[animation-play-state:paused]"
                )}
            >
                {items.map((item, idx) => (
                    <li
                        className={cn(
                            "w-[350px] h-[280px] max-w-full relative rounded-2xl flex-shrink-0 overflow-hidden",
                            "bg-gradient-to-br",
                            getGradientColors(idx),
                            "shadow-lg shadow-black/10",
                            "transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                        )}
                        key={`${item.name}-${idx}`}
                    >
                        {/* Pattern de fond subtil */}
                        <div className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                                backgroundSize: '20px 20px'
                            }}
                        />

                        {/* Effet de brillance */}
                        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-white/20 to-transparent rounded-full blur-3xl" />

                        <div className="relative h-full flex flex-col p-6">
                            {/* Header avec icône et étoiles */}
                            <div className="flex items-start justify-between mb-3">
                                <Quote className="w-8 h-8 text-white/40 fill-white/20 flex-shrink-0" />
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Contenu - texte tronqué à 4 lignes */}
                            <blockquote className="flex-1 flex flex-col">
                                <p className="text-white/95 text-sm leading-relaxed font-normal line-clamp-4">
                                    "{item.quote}"
                                </p>

                                {/* Séparateur */}
                                <div className="h-px w-full bg-gradient-to-r from-white/30 via-white/20 to-transparent my-4" />

                                {/* Auteur avec avatar */}
                                <div className="flex items-center gap-3 mt-auto">
                                    {/* Avatar avec composant réutilisable */}
                                    <AvatarDisplay
                                        name={item.name}
                                        userId={item.userId}
                                        fallbackImage={item.avatar}
                                        size="lg"
                                    />
                                    
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white font-semibold text-sm truncate">
                                            {item.name}
                                        </span>
                                        <span className="text-white/70 text-xs truncate">
                                            {item.title}
                                        </span>
                                    </div>
                                </div>
                            </blockquote>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};
