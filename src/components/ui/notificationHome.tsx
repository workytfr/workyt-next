"use client";
import { useState } from "react";
import { Link } from "@/components/ui/link";
import { X, ArrowUpRight } from "lucide-react";

type BannerWithButtonProps = {
    linkHref: string;
    tButton: string;
    tDetails: string;
    tDismiss: string;
    tTitle: string;
    tVersion?: string;
};

export function BannerWithButton({
    tTitle,
    tDetails,
    tButton,
    linkHref,
    tDismiss,
    tVersion = "v4.6",
}: BannerWithButtonProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="relative bg-[var(--wk-ink)] text-[var(--wk-paper)]">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[rgba(255,106,26,0.18)] px-2 py-0.5 font-mono-ui text-[10px] uppercase tracking-widest text-[var(--wk-accent)]">
                        {tVersion}
                    </span>
                    <span className="truncate">
                        <strong className="font-semibold">{tTitle}</strong>
                        <span className="mx-2 opacity-40">·</span>
                        <span className="opacity-90">{tDetails}</span>
                    </span>
                    <Link
                        href={linkHref}
                        className="hidden shrink-0 items-center gap-1 font-semibold underline decoration-[var(--wk-accent)] underline-offset-4 sm:inline-flex"
                    >
                        {tButton}
                        <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>
                <button
                    type="button"
                    onClick={() => setIsVisible(false)}
                    className="shrink-0 rounded-full p-1 transition hover:bg-white/10"
                    aria-label={tDismiss}
                >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
