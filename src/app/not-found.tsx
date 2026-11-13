import Link from "next/link";
import { Metadata } from "next";
import Foxy from "@/components/foxy/Foxy";

export const metadata: Metadata = {
    title: { absolute: "Page non trouvée | Workyt" },
    description: "La page que vous recherchez n'existe pas ou a été déplacée.",
    robots: { index: false, follow: true },
};

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
            <Foxy pose="oups" size={170} eager />
            <p className="font-mono-ui mt-4 text-xs uppercase tracking-[0.2em] text-[rgba(26,21,18,0.45)]">Erreur 404</p>
            <h1 className="font-serif-display mt-2 text-3xl text-[var(--wk-ink)] sm:text-4xl">Foxy ne trouve pas cette page</h1>
            <p className="mt-3 max-w-md text-[rgba(26,21,18,0.6)]">
                Elle n&apos;existe pas, ou elle a changé d&apos;adresse. Reprends depuis l&apos;un de ces endroits :
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/" className="wk-btn-orange !py-2.5 text-sm">
                    Accueil
                </Link>
                {[
                    { href: "/cours", label: "Cours" },
                    { href: "/forum", label: "Forum" },
                    { href: "/fiches", label: "Fiches" },
                ].map((l) => (
                    <Link
                        key={l.href}
                        href={l.href}
                        className="rounded-full border border-[rgba(26,21,18,0.14)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--wk-ink)] transition-colors hover:border-[var(--wk-accent)] hover:text-[var(--wk-accent)]"
                    >
                        {l.label}
                    </Link>
                ))}
            </div>
            <p className="mt-8 text-xs text-[rgba(26,21,18,0.45)]">
                <Link href="/sitemap.xml" className="hover:text-[var(--wk-accent)]">
                    Sitemap
                </Link>{" "}
                ·{" "}
                <Link href="/a-propos" className="hover:text-[var(--wk-accent)]">
                    À propos
                </Link>
            </p>
        </div>
    );
}
