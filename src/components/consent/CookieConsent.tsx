"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Cookie, Lock, X } from "lucide-react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import {
    CONSENT_CATEGORIES,
    GOOGLE_ADS_ID,
    OPEN_CONSENT_EVENT,
    clearTrackerCookies,
    getConsentSnapshot,
    parseConsent,
    saveConsent,
    subscribeConsent,
    type ConsentChoices,
} from "@/lib/consent";

const MAILCHIMP_SRC = "https://chimpstatic.com/mcjs-connected/js/users/7e5e31a95d8d924397deba535/7bee0dc79cb596b3ac1a6081a.js";
const SERVER_SNAPSHOT = "__server__";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange?: (v: boolean) => void; label: string }) {
    return (
        <SwitchPrimitives.Root
            checked={checked}
            onCheckedChange={onChange}
            disabled={!onChange}
            aria-label={label}
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wk-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed data-[state=checked]:bg-[var(--wk-ink)] data-[state=unchecked]:bg-[rgba(26,21,18,0.15)] disabled:data-[state=checked]:bg-[rgba(26,21,18,0.35)]"
        >
            <SwitchPrimitives.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
        </SwitchPrimitives.Root>
    );
}

/**
 * Bandeau cookies maison (Consent Mode v2) et chargement des traceurs selon le
 * choix. Refuser est aussi simple qu'accepter, rien n'est coché d'avance.
 */
export default function CookieConsent({ umamiUrl, umamiWebsiteId }: { umamiUrl?: string; umamiWebsiteId?: string }) {
    const pathname = usePathname();
    const reduceMotion = useReducedMotion();
    const raw = useSyncExternalStore(subscribeConsent, getConsentSnapshot, () => SERVER_SNAPSHOT);
    const hydrated = raw !== SERVER_SNAPSHOT;
    const consent = hydrated ? parseConsent(raw) : null;

    const [panelOpen, setPanelOpen] = useState(false);
    const [view, setView] = useState<"banner" | "prefs">("banner");
    const [draft, setDraft] = useState<ConsentChoices>({ analytics: false, marketing: false });

    useEffect(() => {
        const open = () => {
            const current = parseConsent(getConsentSnapshot());
            setDraft({ analytics: !!current?.analytics, marketing: !!current?.marketing });
            setView("prefs");
            setPanelOpen(true);
        };
        window.addEventListener(OPEN_CONSENT_EVENT, open);
        return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
    }, []);

    const isPrint = /^\/cours\/[^/]+\/imprimer(\/|$)/.test(pathname ?? "");
    const visible = !isPrint && (panelOpen || (hydrated && !consent));

    const decide = (choices: ConsentChoices) => {
        const previous = consent;
        saveConsent(choices);
        setPanelOpen(false);
        setView("banner");
        // Un traceur déjà chargé ne se décharge pas : on efface ses cookies et on recharge
        const revoked = !!previous && ((previous.marketing && !choices.marketing) || (previous.analytics && !choices.analytics));
        if (revoked) {
            clearTrackerCookies(choices);
            window.location.reload();
        }
    };

    const close = () => {
        // Fermer sans choisir = refuser (CNIL) ; si un choix existe déjà, on le garde
        if (consent) {
            setPanelOpen(false);
            setView("banner");
        } else {
            decide({ analytics: false, marketing: false });
        }
    };

    return (
        <>
            {consent?.marketing && (
                <>
                    <Script id="gtag-src" src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
                    <Script id="mcjs" src={MAILCHIMP_SRC} strategy="lazyOnload" />
                </>
            )}
            {consent?.analytics && umamiUrl && umamiWebsiteId && (
                <Script id="umami-recorder" src={`${umamiUrl}/recorder.js`} data-website-id={umamiWebsiteId} strategy="lazyOnload" />
            )}

            <AnimatePresence>
                {visible && (
                    <motion.div
                        key="cookie-consent"
                        role="dialog"
                        aria-modal="false"
                        aria-labelledby="cookie-consent-title"
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-[540px] rounded-[22px] border border-[rgba(26,21,18,0.1)] bg-[var(--wk-paper)] text-[var(--wk-ink)] shadow-[0_18px_50px_rgba(26,21,18,0.22)] sm:bottom-6 print:hidden"
                    >
                        <button
                            type="button"
                            onClick={close}
                            aria-label={consent ? "Fermer" : "Continuer sans accepter"}
                            title={consent ? "Fermer" : "Continuer sans accepter"}
                            className="absolute right-3 top-3 rounded-full p-1.5 text-[rgba(26,21,18,0.45)] transition-colors hover:bg-[var(--wk-paper-2)] hover:text-[var(--wk-ink)]"
                        >
                            <X size={16} />
                        </button>

                        {view === "banner" ? (
                            <div className="p-5 sm:p-6">
                                <div className="flex items-start gap-3 pr-6">
                                    <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--wk-paper-2)] text-[var(--wk-accent)]">
                                        <Cookie size={20} />
                                    </span>
                                    <div>
                                        <h2 id="cookie-consent-title" className="font-serif-display text-xl leading-tight">
                                            Un petit point cookies
                                        </h2>
                                        <p className="mt-1.5 text-sm leading-relaxed text-[rgba(26,21,18,0.7)]">
                                            Workyt n&apos;affiche aucune pub. Avec ton accord, on mesure l&apos;audience et
                                            l&apos;efficacité de nos campagnes pour faire connaître l&apos;asso. Tu peux changer
                                            d&apos;avis à tout moment depuis le bas de page.{" "}
                                            <Link href="/politique-confidentialite" className="font-semibold text-[var(--wk-ink)] underline underline-offset-2 hover:text-[var(--wk-accent)]">
                                                En savoir plus
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => decide({ analytics: false, marketing: false })}
                                        className="rounded-full border border-[rgba(26,21,18,0.14)] bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[var(--wk-ink)]"
                                    >
                                        Tout refuser
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => decide({ analytics: true, marketing: true })}
                                        className="rounded-full bg-[var(--wk-ink)] px-4 py-2.5 text-sm font-semibold text-[var(--wk-paper)] transition-colors hover:bg-black"
                                    >
                                        Tout accepter
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDraft({ analytics: !!consent?.analytics, marketing: !!consent?.marketing });
                                        setView("prefs");
                                    }}
                                    className="mx-auto mt-3 block text-xs font-semibold text-[rgba(26,21,18,0.6)] underline-offset-2 hover:text-[var(--wk-accent)] hover:underline"
                                >
                                    Choisir au cas par cas
                                </button>
                            </div>
                        ) : (
                            <div className="p-5 sm:p-6">
                                <h2 id="cookie-consent-title" className="pr-8 font-serif-display text-xl leading-tight">
                                    Tes choix de cookies
                                </h2>
                                <ul className="mt-4 max-h-[50vh] space-y-2.5 overflow-y-auto">
                                    {CONSENT_CATEGORIES.map((cat) => {
                                        const essential = cat.key === "essential";
                                        const checked = essential ? true : draft[cat.key as keyof ConsentChoices];
                                        return (
                                            <li key={cat.key} className="rounded-2xl border border-[rgba(26,21,18,0.08)] bg-white p-3.5">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                                                        {cat.title}
                                                        {essential && <Lock size={12} className="text-[rgba(26,21,18,0.45)]" />}
                                                    </span>
                                                    <Toggle
                                                        checked={checked}
                                                        label={cat.title}
                                                        onChange={essential ? undefined : (v) => setDraft((d) => ({ ...d, [cat.key]: v }))}
                                                    />
                                                </div>
                                                <p className="mt-1 text-xs leading-relaxed text-[rgba(26,21,18,0.62)]">{cat.description}</p>
                                                <p className="mt-1 text-[11px] text-[rgba(26,21,18,0.45)]">{cat.services}</p>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div className="mt-4 grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => decide({ analytics: false, marketing: false })}
                                        className="rounded-full border border-[rgba(26,21,18,0.14)] bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[var(--wk-ink)]"
                                    >
                                        Tout refuser
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => decide(draft)}
                                        className="rounded-full bg-[var(--wk-ink)] px-4 py-2.5 text-sm font-semibold text-[var(--wk-paper)] transition-colors hover:bg-black"
                                    >
                                        Enregistrer
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
