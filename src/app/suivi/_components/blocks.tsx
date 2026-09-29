"use client";

import React, { useState } from "react";
import { Eye, KeyRound, ListOrdered, type LucideIcon } from "lucide-react";
import { BLOCK_TYPE_BY_KEY } from "@/components/ui/editor/blockTypes";
import { SUIVI_BLOCK_LABELS, SUIVI_BLOCK_TYPES, type SuiviBlockType } from "@/lib/mentorship/config";
import "@/app/cours/_components/styles/lesson-blocks.css";
import MessageText from "./MessageText";

/**
 * Les blocs pédagogiques du suivi. Même carte que les leçons (lesson-blocks.css) ;
 * `methode` et `indice` n'existent que dans le suivi, leurs couleurs sont
 * données ici par les variables de la carte.
 */
export interface SuiviBlockDef {
    type: SuiviBlockType;
    label: string;
    hint: string;
    icon: LucideIcon;
    titlePlaceholder: string;
    bodyPlaceholder: string;
    /** Couleurs des blocs propres au suivi (les autres viennent du CSS des leçons) */
    vars?: React.CSSProperties;
}

const EXTRA: Record<SuiviBlockType, Omit<SuiviBlockDef, "type" | "label" | "icon" | "hint"> & { icon?: LucideIcon; hint?: string }> = {
    definition: { titlePlaceholder: "Le mot défini (ex. : Nombre premier)", bodyPlaceholder: "Un nombre premier est un entier qui…" },
    propriete: { titlePlaceholder: "Ex. : Produit de puissances", bodyPlaceholder: "Pour tous réels $a$, $n$ et $m$ : $a^n \\times a^m = a^{n+m}$" },
    theoreme: { titlePlaceholder: "Ex. : Théorème de Pythagore", bodyPlaceholder: "Si le triangle $ABC$ est rectangle en $A$, alors $BC^2 = AB^2 + AC^2$." },
    exemple: { titlePlaceholder: "Ex. : Calculer $\\frac{2}{3} + \\frac{1}{6}$", bodyPlaceholder: "On met au même dénominateur…" },
    methode: {
        icon: ListOrdered,
        hint: "Les étapes à suivre, dans l'ordre",
        titlePlaceholder: "Ex. : Résoudre une équation du 1er degré",
        bodyPlaceholder: "1. Regrouper les $x$ d'un côté\n2. …",
        vars: { "--wk-block-tile": "#ffe3cf", "--wk-block-icon": "#c24a0a", "--wk-block-label": "#c24a0a" } as React.CSSProperties,
    },
    indice: {
        icon: KeyRound,
        hint: "Un coup de pouce, masqué jusqu'au clic de l'élève",
        titlePlaceholder: "Ex. : Pense à factoriser",
        bodyPlaceholder: "Regarde ce que les deux termes ont en commun…",
        vars: { "--wk-block-tile": "#ffb547", "--wk-block-icon": "#1a1512", "--wk-block-label": "#a0650a" } as React.CSSProperties,
    },
    remarque: { titlePlaceholder: "Titre (facultatif)", bodyPlaceholder: "Une précision utile…" },
    attention: { titlePlaceholder: "Ex. : Ne pas confondre $-x^2$ et $(-x)^2$", bodyPlaceholder: "Le carré ne porte que sur…" },
};

export const SUIVI_BLOCKS: SuiviBlockDef[] = SUIVI_BLOCK_TYPES.map((type) => {
    const lesson = BLOCK_TYPE_BY_KEY[type];
    const extra = EXTRA[type];
    return {
        type,
        label: SUIVI_BLOCK_LABELS[type],
        hint: extra.hint ?? lesson?.hint ?? "",
        icon: extra.icon ?? lesson?.icon ?? KeyRound,
        titlePlaceholder: extra.titlePlaceholder,
        bodyPlaceholder: extra.bodyPlaceholder,
        vars: extra.vars,
    };
});

export const SUIVI_BLOCK_BY_TYPE = Object.fromEntries(SUIVI_BLOCKS.map((b) => [b.type, b])) as Record<SuiviBlockType, SuiviBlockDef>;

export function blockDef(type?: string | null): SuiviBlockDef {
    return SUIVI_BLOCK_BY_TYPE[type as SuiviBlockType] ?? SUIVI_BLOCK_BY_TYPE.remarque;
}

const REVEALED_KEY = (id: string) => `wk-suivi-indice:${id}`;

/**
 * Carte d'un bloc. Un indice est replié pour l'élève tant qu'il ne l'a pas
 * ouvert (retenu sur l'appareil) ; le bénévole le voit toujours.
 */
export function BlockCard({
    id,
    type,
    title,
    text,
    hideHint = false,
    showHintNote = false,
    footer,
    className = "",
}: {
    /** Absent pour un aperçu */
    id?: string;
    type?: string | null;
    title?: string | null;
    text: string;
    /** Élève : l'indice reste masqué jusqu'au clic */
    hideHint?: boolean;
    /** Bénévole : rappeler qu'un indice est masqué pour l'élève */
    showHintNote?: boolean;
    footer?: React.ReactNode;
    className?: string;
}) {
    const def = blockDef(type);
    const Icon = def.icon;
    const isHint = def.type === "indice";
    // L'indice déjà ouvert reste ouvert d'une visite à l'autre. Les blocs ne
    // s'affichent qu'une fois le fil chargé côté navigateur : localStorage est là.
    const [revealed, setRevealed] = useState(() => {
        if (!hideHint || !isHint) return true;
        try {
            return !!id && typeof window !== "undefined" && !!localStorage.getItem(REVEALED_KEY(id));
        } catch {
            return false;
        }
    });

    const reveal = () => {
        setRevealed(true);
        try {
            if (id) localStorage.setItem(REVEALED_KEY(id), "1");
        } catch {
            /* navigation privée : l'indice se repliera à la prochaine visite */
        }
    };

    return (
        <div className={`wk-block wk-block--${def.type} !my-0 !rounded-[20px] !px-4 !py-3.5 text-left ${className}`} style={def.vars}>
            <div className="wk-block__head !mb-2">
                <span className="wk-block__icon !h-8 !w-8">
                    <Icon />
                </span>
                <span className="wk-block__heading">
                    <span className="wk-block__label">{def.label}</span>
                    {title && (
                        <span className="wk-block__title !text-base">
                            <MessageText text={title} inline />
                        </span>
                    )}
                </span>
            </div>
            {revealed ? (
                <div className="wk-block__body text-sm">
                    <MessageText text={text} />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={reveal}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(26,21,18,0.14)] bg-[var(--wk-paper)] px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--wk-ink)]"
                >
                    <Eye className="h-3.5 w-3.5" /> Voir l&apos;indice
                </button>
            )}
            {isHint && showHintNote && (
                <p className="mt-2 text-[11px] text-[rgba(26,21,18,0.5)]">Masqué pour l&apos;élève jusqu&apos;à ce qu&apos;il l&apos;ouvre.</p>
            )}
            {footer}
        </div>
    );
}
