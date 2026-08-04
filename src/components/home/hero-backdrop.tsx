/**
 * Calques d'ambiance du haut de page.
 *
 * Ils vivaient dans la section hero, donc démarraient sous la navbar : la
 * trame de cahier et le halo s'arrêtaient net à la limite du header, ce qui
 * dessinait une couture visible tout en haut de la page.
 *
 * Ils sont donc remontés au niveau du conteneur de page. Celui-ci commence
 * malgré tout sous le header — qui vit dans `layout.tsx`, hors de la page —
 * d'où le débordement vers le haut (`-top-32`) et la base papier portée par
 * le calque lui-même. La marge de 128px couvre largement les ~78px du header
 * à tous les points de rupture, sans coder sa hauteur exacte en dur.
 */
export default function HeroBackdrop() {
    return (
        <div
            className="pointer-events-none absolute inset-x-0 -top-32 h-[1040px] overflow-hidden bg-[var(--wk-paper)]"
            aria-hidden="true"
        >
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 60% 55% at 85% 82%, rgba(255,181,71,0.28) 0%, transparent 62%), radial-gradient(ellipse 50% 45% at 10% 14%, rgba(255,106,26,0.10) 0%, transparent 60%)",
                }}
            />
            <div
                className="wk-cahier absolute inset-x-0 top-0 h-[640px] opacity-[0.45]"
                style={{
                    maskImage: "linear-gradient(to bottom, #000 0%, transparent 100%)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, #000 0%, transparent 100%)",
                }}
            />
            <div className="wk-grain absolute inset-0" />
        </div>
    );
}
