import Image from "next/image";

/* Trois piliers, pas quatre cartes à emoji.
   Le repère visuel est un trait tracé à la main (.wk-underline) plutôt que
   des grands numéros 01/02/03 : même fonction de scansion, mais c'est notre
   écriture et pas celle d'un site SaaS. */
const PILIERS = [
    {
        titre: "Gratuit",
        suite: "pour toujours",
        body: "Pas de version premium, pas de contenu réservé, pas de carte bancaire. L'asso vit de dons et de bénévolat — l'accès aux cours n'est pas la variable d'ajustement.",
    },
    {
        titre: "Apprendre",
        suite: "en jouant",
        body: "Points, badges, séries et défis entre clans. La mécanique de jeu sert à revenir demain, jamais à masquer un contenu derrière une récompense.",
    },
    {
        titre: "Zéro",
        suite: "pression",
        body: "Aucun classement imposé, aucune notification culpabilisante. Tu avances à ton rythme, tu poses une question sans qu'on te juge, tu t'arrêtes quand tu veux.",
    },
];

export function WobbleCardDemo() {
    return (
        <section
            id="mission"
            className="relative overflow-hidden bg-[var(--wk-ink)] px-4 py-20 text-[var(--wk-paper)] md:py-28"
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                aria-hidden="true"
                style={{
                    background:
                        "radial-gradient(ellipse at 50% 0%, #ff6a1a 0%, transparent 60%)",
                }}
            />

            <div className="relative mx-auto max-w-[1400px]">
                {/* En-tête */}
                <div className="max-w-3xl">
                    <div className="font-mono-ui inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(253,250,244,0.6)]">
                        <span className="inline-block w-8 border-t border-[rgba(253,250,244,0.3)]" />
                        <span>03</span>
                        <span>Notre mission</span>
                    </div>
                    <h2 className="font-serif-display mt-4 text-4xl leading-[0.95] sm:text-5xl md:text-6xl">
                        Une éducation{" "}
                        <span className="italic text-[var(--wk-accent-2)]">joyeuse</span>,
                        accessible à tous.
                    </h2>
                    <p className="mt-6 max-w-xl leading-relaxed text-[rgba(253,250,244,0.75)]">
                        Workyt est une association portée par des bénévoles qui croient
                        qu&apos;apprendre devrait être gratuit, simple et un peu amusant.
                        Pas de paywall, pas de jargon — des outils qui marchent, pour les
                        11-25 ans.
                    </p>
                </div>

                {/* Les trois piliers */}
                <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
                    {PILIERS.map((p) => (
                        <div
                            key={p.titre}
                            className="border-t border-[rgba(253,250,244,0.18)] pt-6"
                        >
                            <h3 className="font-serif-display text-3xl leading-tight md:text-4xl">
                                <span className="wk-underline">{p.titre}</span>{" "}
                                <span className="italic text-[rgba(253,250,244,0.75)]">
                                    {p.suite}
                                </span>
                            </h3>
                            <p className="mt-4 text-sm leading-relaxed text-[rgba(253,250,244,0.7)]">
                                {p.body}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Faits vérifiables — pas de métriques d'usage */}
                <div className="mt-14 flex flex-col items-start gap-6 border-t border-[rgba(253,250,244,0.15)] pt-8 md:flex-row md:items-center md:justify-between">
                    <div className="grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <div className="font-serif-display text-4xl text-[var(--wk-accent-2)]">
                                100 %
                            </div>
                            <div className="mt-1 text-sm text-[rgba(253,250,244,0.7)]">
                                Gratuit, sans publicité, sans revente de données
                            </div>
                        </div>
                        <div>
                            <div className="font-serif-display text-4xl text-[var(--wk-accent-2)]">
                                Depuis 2020
                            </div>
                            <div className="mt-1 text-sm text-[rgba(253,250,244,0.7)]">
                                Né pendant le confinement, association loi 1901 depuis
                                mars 2022
                            </div>
                        </div>
                    </div>

                    <Image
                        src="/workytanim-poster.webp"
                        width={140}
                        height={140}
                        alt=""
                        aria-hidden="true"
                        className="hidden w-[140px] rounded-2xl opacity-90 lg:block"
                    />
                </div>
            </div>
        </section>
    );
}
