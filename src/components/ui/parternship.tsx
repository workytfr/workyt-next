"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const Noise = () => {
    return (
        <div
            className="absolute inset-0 w-full h-full scale-[1.2] transform opacity-10 [mask-image:radial-gradient(#fff,transparent,75%)]"
            style={{
                backgroundImage: "url(/noise.webp)",
                backgroundSize: "30%",
            }}
        ></div>
    );
};

export const Partenaires = ({
                                partenaires,
                                direction = "left",
                                speed = "fast",
                                pauseOnHover = true,
                                className,
                            }: {
    partenaires: {
        name: string;
        logo: string;
        website: string;
    }[];
    direction?: "left" | "right";
    speed?: "fast" | "normal" | "slow";
    pauseOnHover?: boolean;
    className?: string;
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollerRef = React.useRef<HTMLUListElement>(null);

    const [start, setStart] = useState(false);

    useEffect(() => {
        addAnimation();
    });

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
            containerRef.current.style.setProperty(
                "--animation-direction",
                direction === "left" ? "forwards" : "reverse"
            );
        }
    };

    const getSpeed = () => {
        if (containerRef.current) {
            const speedMap = {
                fast: "20s",
                normal: "40s",
                slow: "80s",
            };
            containerRef.current.style.setProperty(
                "--animation-duration",
                speedMap[speed] || "40s"
            );
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
                className
            )}
        >
            <ul
                ref={scrollerRef}
                className={cn(
                    "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
                    start && "animate-scroll",
                    pauseOnHover && "hover:[animation-play-state:paused]"
                )}
            >
                {partenaires.map((partenaire) => (
                    <li
                        className={cn(
                            "w-[350px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-700 px-8 py-6 md:w-[450px]",
                            "bg-gray-800 cursor-pointer hover:bg-gray-700 transition-all duration-200"
                        )}
                        key={partenaire.name}
                        onClick={() => window.open(partenaire.website, "_blank")} // Redirection lors du clic
                    >
                        <Noise />
                        <div className="flex flex-col items-center text-center">
                            <img
                                src={partenaire.logo}
                                alt={`${partenaire.name} logo`}
                                className="w-full h-24 object-contain mb-4" // Taille uniforme des images
                                style={{ maxHeight: "96px", maxWidth: "200px" }} // Limites de taille pour les images
                            />
                            <span className="text-white text-lg font-bold">
                {partenaire.name}
              </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};
