"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProfileAvatar from "@/components/ui/profile";
import TimeAgo from "@/components/ui/TimeAgo";
import type { FicheLikeState } from "./useFicheLike";

const MAX_VISIBLE = 5;
const BURST_COLORS = ["#ff6a1a", "#ffb547", "#ffd27a", "#ff8a3d"];
const BURST_COUNT = 8;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Cœur Workyt : plein avec une étincelle évidée quand on aime, en contour sinon */
export function WorkytHeart({ size, filled }: { size: number; filled: boolean }) {
    const heart = "M12 21C6.6 17.2 3 13.9 3 9.6 3 6.6 5.2 4.5 7.9 4.5c1.8 0 3.2.9 4.1 2.4.9-1.5 2.3-2.4 4.1-2.4C18.8 4.5 21 6.6 21 9.6c0 4.3-3.6 7.6-9 11.4Z";
    const spark = "M15.6 7.6q.25 1.3 1.6 1.6-1.35.3-1.6 1.6-.25-1.3-1.6-1.6 1.35-.3 1.6-1.6Z";
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
            {filled ? (
                <path d={`${heart}${spark}`} fill="currentColor" fillRule="evenodd" />
            ) : (
                <path d={heart} fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinejoin="round" />
            )}
        </svg>
    );
}

/** Petite étoile à quatre branches des éclats */
function Spark({ size, color }: { size: number; color: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden>
            <path d="M5 0Q5.8 4.2 10 5 5.8 5.8 5 10 4.2 5.8 0 5 4.2 4.2 5 0Z" fill={color} />
        </svg>
    );
}

/** Éclats au moment du like : quelques étincelles orange et un « +1 » */
function LikeBurst({ big }: { big: boolean }) {
    const radius = big ? 40 : 32;
    return (
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-0 w-0">
            {Array.from({ length: BURST_COUNT }).map((_, i) => {
                const angle = (i / BURST_COUNT) * Math.PI * 2 - Math.PI / 2;
                const dist = radius * (i % 2 ? 0.7 : 1);
                const s = (i % 2 ? 7 : 10) * (big ? 1.2 : 1);
                return (
                    <motion.span
                        key={i}
                        className="absolute"
                        style={{ left: -s / 2, top: -s / 2 }}
                        initial={{ x: 0, y: 0, scale: 0.6, opacity: 0 }}
                        animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: [0.6, 1, 0.4], opacity: [0, 1, 0] }}
                        transition={{ duration: 0.6, ease: EASE_OUT }}
                    >
                        <Spark size={s} color={BURST_COLORS[i % BURST_COLORS.length]} />
                    </motion.span>
                );
            })}
            {/* +1 qui monte */}
            <motion.span
                className="absolute -left-2.5 -top-3 text-xs font-bold text-[var(--wk-accent)]"
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: big ? -34 : -28, opacity: [0, 1, 0] }}
                transition={{ duration: 0.7, ease: EASE_OUT }}
            >
                +1
            </motion.span>
        </span>
    );
}

/** Les éclats jouent une fois puis se retirent du DOM */
function LikeBurstOnce({ big }: { big: boolean }) {
    const [done, setDone] = useState(false);
    useEffect(() => {
        const t = window.setTimeout(() => setDone(true), 950);
        return () => clearTimeout(t);
    }, []);
    return done ? null : <LikeBurst big={big} />;
}

/** Bouton « J'aime » : le cœur se remplit, rebondit et lance des éclats */
export function LikeButton({ like, size = "md" }: { like: FicheLikeState; size?: "md" | "lg" }) {
    const reduceMotion = useReducedMotion();
    const big = size === "lg";
    const label = !like.isLoggedIn
        ? "Connecte-toi pour aimer cette fiche"
        : like.isAuthor
        ? "C'est ta fiche"
        : like.hasLiked
        ? "Retirer mon j'aime"
        : "J'aime cette fiche";
    const celebrate = like.pop > 0 && like.hasLiked && !reduceMotion;

    return (
        <motion.button
            type="button"
            onClick={like.toggle}
            aria-pressed={like.hasLiked}
            aria-label={label}
            title={label}
            whileTap={{ scale: 0.96 }}
            className={`relative inline-flex items-center gap-2 rounded-full border font-semibold transition-colors duration-300 ${
                big ? "px-5 py-2.5 text-[15px]" : "px-3.5 py-2 text-sm"
            } ${
                like.hasLiked
                    ? "border-transparent bg-[var(--wk-accent)] text-white shadow-[0_6px_18px_rgba(255,106,26,0.3)]"
                    : like.isAuthor
                    ? "cursor-default border-[rgba(26,21,18,0.1)] bg-[var(--wk-paper)] text-[rgba(26,21,18,0.5)]"
                    : "border-[rgba(26,21,18,0.14)] bg-white text-[var(--wk-ink)] hover:border-[var(--wk-accent)] hover:text-[var(--wk-accent)]"
            }`}
        >
            <span className="relative inline-flex">
                <motion.span
                    key={celebrate ? `heart-${like.pop}` : "heart"}
                    className="inline-flex"
                    animate={celebrate ? { scale: [0.8, 1.18, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35, ease: EASE_OUT }}
                >
                    <WorkytHeart size={big ? 22 : 19} filled={like.hasLiked} />
                </motion.span>
                {celebrate && <LikeBurstOnce key={`burst-${like.pop}`} big={big} />}
            </span>

            {/* Le compteur défile vers le haut (like) ou vers le bas (retrait) */}
            <span className="relative inline-flex h-[1.3em] items-center overflow-hidden tabular-nums">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={like.likes}
                        initial={{ y: like.hasLiked ? "100%" : "-100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: like.hasLiked ? "-100%" : "100%", opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        {like.likes}
                    </motion.span>
                </AnimatePresence>
            </span>
            {big && <span className="font-medium">{like.hasLiked ? "Merci !" : "J'aime"}</span>}
        </motion.button>
    );
}

/** Avatars des dernières personnes, et la liste complète dans une fenêtre */
export function LikersPreview({ like }: { like: FicheLikeState }) {
    const [open, setOpen] = useState(false);
    const visible = like.likers.slice(0, MAX_VISIBLE);
    const rest = like.likers.length - visible.length;
    if (visible.length === 0) return null;

    return (
        <>
            <div className="flex items-center gap-2">
                <div className="flex items-center -space-x-2">
                    {visible.map((l, index) => (
                        <Tooltip key={l.userId._id}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={`/compte/${l.userId._id}`}
                                    className="relative inline-block rounded-full ring-2 ring-white transition-transform hover:z-10 hover:scale-110"
                                    style={{ zIndex: visible.length - index }}
                                >
                                    <ProfileAvatar username={l.userId.username} showPoints={false} userId={l.userId._id} size="small" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent className="rounded bg-[var(--wk-ink)] px-2.5 py-1.5 text-xs text-white">
                                {l.userId.username}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="whitespace-nowrap text-xs font-semibold text-[rgba(26,21,18,0.6)] underline-offset-2 hover:text-[var(--wk-accent)] hover:underline"
                    aria-label="Voir tous ceux qui ont aimé la fiche"
                >
                    {rest > 0 ? `+${rest} · Voir tout` : "Voir"}
                </button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="font-serif-display text-2xl font-normal">
                            {like.likers.length} personne{like.likers.length > 1 ? "s ont" : " a"} aimé cette fiche
                        </DialogTitle>
                    </DialogHeader>
                    <ul className="-mx-2 max-h-[60vh] overflow-y-auto">
                        {like.likers.map((l) => (
                            <li key={l.userId._id}>
                                <Link
                                    href={`/compte/${l.userId._id}`}
                                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--wk-paper)]"
                                >
                                    <ProfileAvatar username={l.userId.username} showPoints={false} userId={l.userId._id} size="small" />
                                    <span className="flex-1 truncate text-sm font-medium">{l.userId.username}</span>
                                    {new Date(l.likedAt).getTime() > 0 && (
                                        <span className="text-xs text-[rgba(26,21,18,0.45)]">
                                            <TimeAgo date={l.likedAt} />
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </DialogContent>
            </Dialog>
        </>
    );
}

/** Panneau latéral : bouton + avatars */
export default function LikedByList({ like }: { like: FicheLikeState }) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <LikeButton like={like} />
            <LikersPreview like={like} />
        </div>
    );
}
