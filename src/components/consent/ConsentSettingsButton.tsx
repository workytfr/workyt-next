"use client";

import { openConsentPanel } from "@/lib/consent";

/** Bouton « Gérer les cookies » : seule partie interactive du pied de page. */
export default function ConsentSettingsButton({ className }: { className?: string }) {
    return (
        <button type="button" onClick={openConsentPanel} className={className}>
            Gérer les cookies
        </button>
    );
}
