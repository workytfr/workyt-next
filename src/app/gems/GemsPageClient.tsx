"use client";

import Image from "next/image";
import Link from "next/link";
import GemManager from "@/components/ui/GemManager";
import NoSSR from "@/components/NoSSR";
import { Store, ArrowUpRight, Sparkles } from "lucide-react";
import { PAGE_CONTAINER, Eyebrow } from "@/components/wk/primitives";

export default function GemsPageClient() {
    return (
        <NoSSR>
            <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
                {/* En-tête */}
                <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                    <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                    <div className={`${PAGE_CONTAINER} relative grid grid-cols-1 gap-8 pb-10 pt-10 md:pb-14 md:pt-14 lg:grid-cols-12 lg:items-end`}>
                        <div className="lg:col-span-8">
                            <Eyebrow>Boutique</Eyebrow>
                            <h1 className="font-serif-display mt-3 text-[clamp(2.2rem,5vw,3.75rem)] leading-[0.95]">
                                Gemmes &amp; personnalisation<span className="text-[var(--wk-accent)]">.</span>
                            </h1>
                            <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                                Transforme tes points en gemmes, puis donne à ton profil le style qui te ressemble :
                                couleur de pseudo, image, contour, badge mis en avant.
                            </p>
                        </div>
                        <div className="lg:col-span-4">
                            <div className="flex flex-wrap gap-2 lg:justify-end">
                                <span className="wk-chip !px-3.5 !py-2 text-sm">
                                    <Image src="/badge/points.png" alt="" width={16} height={16} className="object-contain" />
                                    100 points = 1 gemme
                                </span>
                                <span className="wk-chip !px-3.5 !py-2 text-sm">
                                    <Image src="/badge/diamond.png" alt="" width={16} height={16} className="object-contain" />
                                    Achat définitif
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className={`${PAGE_CONTAINER} py-8 md:py-10`}>
                    <GemManager />

                    {/* Workyt Award */}
                    <Link
                        href="/award"
                        className="wk-grain group relative mt-8 flex flex-col gap-5 overflow-hidden rounded-3xl bg-[var(--wk-accent)] p-6 text-white transition hover:shadow-[0_20px_50px_rgba(255,106,26,0.35)] sm:flex-row sm:items-center sm:p-7"
                    >
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                            <Store className="h-7 w-7" />
                        </span>
                        <span className="flex-1">
                            <span className="font-mono-ui block text-[11px] uppercase tracking-[0.18em] text-white/75">
                                Workyt Award
                            </span>
                            <span className="font-serif-display mt-1 block text-3xl leading-[0.95]">
                                Tes gemmes valent aussi des réductions
                            </span>
                            <span className="mt-2 block max-w-[70ch] text-sm leading-relaxed text-white/85">
                                Échange-les contre des codes promo chez nos partenaires.
                            </span>
                        </span>
                        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--wk-ink)]">
                            <Sparkles className="h-4 w-4 text-[var(--wk-accent)]" />
                            Voir les réductions
                            <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </span>
                    </Link>
                </div>
            </div>
        </NoSSR>
    );
}
