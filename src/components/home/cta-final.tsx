import Link from "next/link";
import { ArrowRight, MessagesSquare } from "lucide-react";

/* Objectif de la page : faire consulter, pas faire s'inscrire.
   Le compte n'a d'ailleurs pas d'URL dédiée (la connexion est une modale de
   navbar) — envoyer vers une page d'inscription serait un lien mort. On dit
   donc explicitement que le compte n'est pas nécessaire pour commencer. */
export default function CtaFinal() {
    return (
        <section className="bg-[var(--wk-paper)] px-4 pb-20 md:pb-28">
            <div className="mx-auto max-w-[1200px]">
                <div className="relative overflow-hidden rounded-[32px] bg-[var(--wk-accent)] px-6 py-14 text-center text-white md:px-16 md:py-20">
                    <div
                        className="wk-grain pointer-events-none absolute inset-0"
                        aria-hidden="true"
                    />
                    <div
                        className="pointer-events-none absolute inset-0 opacity-40"
                        aria-hidden="true"
                        style={{
                            background:
                                "radial-gradient(ellipse 70% 60% at 50% 0%, #ffb547 0%, transparent 65%)",
                        }}
                    />

                    <div className="relative mx-auto max-w-3xl">
                        <h2 className="font-serif-display text-4xl leading-[0.95] sm:text-5xl md:text-6xl">
                            Prêt·e à apprendre{" "}
                            <span className="italic">sans stress</span> ?
                        </h2>
                        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                            Les cours, les fiches et le forum sont accessibles tout de
                            suite. Le compte, tu le créeras quand tu voudras poser une
                            question ou garder ta progression.
                        </p>

                        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href="/cours"
                                className="wk-btn-ink w-full justify-center sm:w-auto"
                            >
                                Parcourir les cours
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/forum"
                                className="wk-btn-ghost w-full justify-center !border-white/35 !bg-white/15 !text-white backdrop-blur hover:!bg-white/25 sm:w-auto"
                            >
                                <MessagesSquare className="h-4 w-4" />
                                Poser une question
                            </Link>
                        </div>

                        <p className="font-mono-ui mt-7 text-[11px] uppercase tracking-widest text-white/70">
                            Gratuit · sans publicité · association loi 1901
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
