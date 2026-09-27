"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Shirt, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    ACCESSORY_SLOTS,
    AVATAR_ACCESSORIES,
    renderAvatarUri,
    type AccessorySlot,
    type AvatarAccessory,
    type AvatarLook,
    type Rarity,
} from "@/lib/avatarLook";

interface ButtonProps {
    label: string;
    className: string;
    disabled: boolean;
    showGemIcon: boolean;
}

interface Props {
    userId: string;
    /** Accessoires actuellement équipés */
    look: AvatarLook;
    /** Une photo ou une image de profil masque le Blobatar */
    hasProfileImage: boolean;
    getButtonProps: (itemType: string, itemValue: string, price: number) => ButtonProps;
    onAction: (itemType: string, itemValue: string) => void;
}

const RARITY: Record<Rarity, { stars: string; className: string }> = {
    common: { stars: "★", className: "bg-orange-100 text-orange-600" },
    rare: { stars: "★★", className: "bg-blue-100 text-[#2f86b3]" },
    epic: { stars: "★★★", className: "bg-purple-100 text-purple-600" },
    legendary: { stars: "★★★★", className: "bg-amber-100 text-amber-700" },
};

/**
 * Boutique d'accessoires Blobatar : un essayage en direct sur l'avatar du
 * membre, puis achat / équipement par emplacement.
 */
export default function AvatarAccessoryShop({ userId, look, hasProfileImage, getButtonProps, onAction }: Props) {
    const [slot, setSlot] = useState<AccessorySlot>("hat");
    // Essayage : accessoire montré sur l'aperçu sans être acheté
    const [trying, setTrying] = useState<AvatarAccessory | null>(null);

    const previewLook = useMemo<AvatarLook>(
        () => (trying ? { ...look, [trying.slot]: trying.id } : look),
        [look, trying],
    );
    const items = AVATAR_ACCESSORIES.filter((a) => a.slot === slot);

    return (
        <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 sm:p-6 md:p-7">
            <div className="flex items-center gap-2 mb-1">
                <Shirt className="h-5 w-5" style={{ color: "var(--wk-accent)" }} />
                <h2 className="font-serif-display text-2xl leading-none" style={{ marginBottom: 0 }}>
                    Accessoires d&apos;avatar
                </h2>
            </div>
            <p className="text-[rgba(26,21,18,0.62)] mb-6">
                Habille ton avatar : clique sur un accessoire pour l&apos;essayer, puis achète-le avec tes gemmes.
            </p>

            {hasProfileImage && (
                <p className="mb-5 rounded-2xl bg-[var(--wk-paper-2)] px-4 py-3 text-sm text-[rgba(26,21,18,0.72)]">
                    Une image de profil est équipée : elle s&apos;affiche à la place de ton avatar. Déséquipe-la pour
                    montrer tes accessoires.
                </p>
            )}

            <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                {/* Essayage */}
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--wk-paper-2)] p-5 md:self-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={renderAvatarUri(userId, previewLook)}
                        alt="Aperçu de ton avatar"
                        className="h-40 w-40"
                    />
                    <div className="min-h-[2.5rem] text-center text-sm">
                        {trying ? (
                            <>
                                <span className="text-[rgba(26,21,18,0.62)]">Essayage : </span>
                                <span className="font-semibold">{trying.label}</span>
                            </>
                        ) : (
                            <span className="text-[rgba(26,21,18,0.62)]">Ton avatar actuel</span>
                        )}
                    </div>
                    {trying && (
                        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => setTrying(null)}>
                            <RotateCcw className="h-3.5 w-3.5" />
                            Annuler l&apos;essai
                        </Button>
                    )}
                </div>

                <div>
                    {/* Emplacements */}
                    <div className="mb-4 flex flex-wrap gap-2" role="tablist">
                        {ACCESSORY_SLOTS.map((s) => (
                            <button
                                key={s.slot}
                                role="tab"
                                aria-selected={slot === s.slot}
                                onClick={() => setSlot(s.slot)}
                                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                    slot === s.slot
                                        ? "border-[var(--wk-ink)] bg-[var(--wk-ink)] text-white"
                                        : "border-[rgba(26,21,18,0.14)] bg-white hover:border-[var(--wk-accent)]"
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Accessoires de l'emplacement */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {items.map((item) => {
                            const bp = getButtonProps("avatarAccessory", item.id, item.price);
                            const rarity = RARITY[item.rarity];
                            const isTrying = trying?.id === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className={`relative rounded-2xl border p-3 text-center transition-shadow ${
                                        isTrying ? "border-[var(--wk-accent)] ring-2 ring-orange-200" : "border-[rgba(26,21,18,0.1)]"
                                    }`}
                                >
                                    <div className={`absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-xs font-bold ${rarity.className}`}>
                                        {rarity.stars}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setTrying(isTrying ? null : item)}
                                        className="mx-auto mb-2 block rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--wk-accent)]"
                                        aria-label={`Essayer : ${item.label}`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={renderAvatarUri(userId, { ...look, [item.slot]: item.id })}
                                            alt=""
                                            className="h-16 w-16"
                                            loading="lazy"
                                        />
                                    </button>
                                    <div className="mb-2 text-sm font-medium leading-tight">{item.label}</div>
                                    <Button
                                        size="sm"
                                        onClick={() => onAction("avatarAccessory", item.id)}
                                        disabled={bp.disabled}
                                        className={`w-full ${bp.className}`}
                                    >
                                        {bp.label}
                                        {bp.showGemIcon && (
                                            <>
                                                <Image src="/badge/diamond.png" alt="" width={14} height={14} className="mx-0.5 inline object-contain" />)
                                            </>
                                        )}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
