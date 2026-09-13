"use client";

import React, { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { LineChart } from "lucide-react";
import { parseGraphPoints, parseGraphSettings, type GraphPoint } from "@/lib/imageQuestion";
import type { QuestionInputProps } from "../types";

const PADDING = 28; // place pour les graduations, en unités du viewBox
const SIZE = 320; // côté de la zone traçable, en unités du viewBox

/**
 * Graphique : l'élève place des points sur un repère cartésien.
 *
 * Un clic ajoute un point, un clic sur un point existant le retire. Les points
 * sont aimantés au pas de la grille — sans cela, viser une coordonnée exacte à
 * la souris serait une épreuve d'adresse plutôt que de mathématiques.
 */
export default function GraphInput({ question, value, onChange }: QuestionInputProps) {
    const settings = useMemo(() => parseGraphSettings(question.answers), [question.answers]);
    const points = useMemo(() => parseGraphPoints(value), [value]);
    const svgRef = useRef<SVGSVGElement>(null);

    const { xMin, xMax, yMin, yMax, step } = settings;

    /** Unités du repère → coordonnées du viewBox. */
    const toSvgX = (x: number) => PADDING + ((x - xMin) / (xMax - xMin)) * SIZE;
    const toSvgY = (y: number) => PADDING + SIZE - ((y - yMin) / (yMax - yMin)) * SIZE;

    const snap = (value: number, min: number) => {
        const snapped = min + Math.round((value - min) / step) * step;
        // Le pas peut être décimal : on limite la dérive en virgule flottante.
        return parseFloat(snapped.toFixed(6));
    };

    const handleClick = (event: React.PointerEvent<SVGSVGElement>) => {
        const svg = svgRef.current;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const viewX = ((event.clientX - rect.left) / rect.width) * (SIZE + PADDING * 2);
        const viewY = ((event.clientY - rect.top) / rect.height) * (SIZE + PADDING * 2);

        const rawX = xMin + ((viewX - PADDING) / SIZE) * (xMax - xMin);
        const rawY = yMin + ((PADDING + SIZE - viewY) / SIZE) * (yMax - yMin);

        if (rawX < xMin || rawX > xMax || rawY < yMin || rawY > yMax) return;

        const next: GraphPoint = { x: snap(rawX, xMin), y: snap(rawY, yMin) };

        // Reclic sur un point déjà placé : on le retire.
        const existing = points.findIndex(
            (p) => Math.abs(p.x - next.x) < step / 2 && Math.abs(p.y - next.y) < step / 2
        );

        onChange(
            existing >= 0
                ? points.filter((_, index) => index !== existing)
                : [...points, next]
        );
    };

    // Graduations : on en limite le nombre, sinon un repère large devient
    // illisible sur mobile.
    const ticks = (min: number, max: number) => {
        const count = Math.round((max - min) / step);
        const every = Math.max(1, Math.ceil(count / 10));
        return Array.from({ length: count + 1 }, (_, i) => min + i * step).filter(
            (_, i) => i % every === 0
        );
    };

    const xTicks = ticks(xMin, xMax);
    const yTicks = ticks(yMin, yMax);

    const showAxisX = yMin <= 0 && yMax >= 0;
    const showAxisY = xMin <= 0 && xMax >= 0;

    return (
        <div className="space-y-3">
            <p className="text-xs text-[#9ca3af] flex items-center gap-1.5">
                <LineChart className="w-3.5 h-3.5" />
                Cliquez sur le repère pour placer vos points — recliquez sur un point pour
                l&apos;enlever.
            </p>

            <div className="bg-white border-2 border-[#e3e2e0] rounded-xl p-2">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${SIZE + PADDING * 2} ${SIZE + PADDING * 2}`}
                    onPointerDown={handleClick}
                    style={{ touchAction: "none" }}
                    role="application"
                    aria-label="Repère : cliquez pour placer un point"
                    className="w-full h-auto cursor-crosshair select-none"
                >
                    {/* Grille */}
                    {xTicks.map((x) => (
                        <line
                            key={`gx-${x}`}
                            x1={toSvgX(x)}
                            y1={PADDING}
                            x2={toSvgX(x)}
                            y2={PADDING + SIZE}
                            stroke="#f1f1ef"
                            strokeWidth={1}
                        />
                    ))}
                    {yTicks.map((y) => (
                        <line
                            key={`gy-${y}`}
                            x1={PADDING}
                            y1={toSvgY(y)}
                            x2={PADDING + SIZE}
                            y2={toSvgY(y)}
                            stroke="#f1f1ef"
                            strokeWidth={1}
                        />
                    ))}

                    {/* Cadre */}
                    <rect
                        x={PADDING}
                        y={PADDING}
                        width={SIZE}
                        height={SIZE}
                        fill="none"
                        stroke="#e3e2e0"
                        strokeWidth={1.5}
                    />

                    {/* Axes */}
                    {showAxisX && (
                        <line
                            x1={PADDING}
                            y1={toSvgY(0)}
                            x2={PADDING + SIZE}
                            y2={toSvgY(0)}
                            stroke="#9ca3af"
                            strokeWidth={1.5}
                        />
                    )}
                    {showAxisY && (
                        <line
                            x1={toSvgX(0)}
                            y1={PADDING}
                            x2={toSvgX(0)}
                            y2={PADDING + SIZE}
                            stroke="#9ca3af"
                            strokeWidth={1.5}
                        />
                    )}

                    {/* Graduations */}
                    {xTicks.map((x) => (
                        <text
                            key={`tx-${x}`}
                            x={toSvgX(x)}
                            y={PADDING + SIZE + 16}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#9ca3af"
                        >
                            {parseFloat(x.toFixed(4))}
                        </text>
                    ))}
                    {yTicks.map((y) => (
                        <text
                            key={`ty-${y}`}
                            x={PADDING - 6}
                            y={toSvgY(y) + 3}
                            textAnchor="end"
                            fontSize={10}
                            fill="#9ca3af"
                        >
                            {parseFloat(y.toFixed(4))}
                        </text>
                    ))}

                    {/* Points placés */}
                    {points.map((point, index) => (
                        <motion.circle
                            key={`${point.x}-${point.y}-${index}`}
                            initial={{ r: 0 }}
                            animate={{ r: 6 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            cx={toSvgX(point.x)}
                            cy={toSvgY(point.y)}
                            fill="#f97316"
                            stroke="#ffffff"
                            strokeWidth={2}
                        />
                    ))}
                </svg>
            </div>

            <p className="text-xs text-[#9ca3af]">
                {points.length === 0
                    ? "Aucun point placé."
                    : `${points.length} point${points.length > 1 ? "s" : ""} placé${
                          points.length > 1 ? "s" : ""
                      } : ${points.map((p) => `(${p.x} ; ${p.y})`).join("  ")}`}
            </p>
        </div>
    );
}
