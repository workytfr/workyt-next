/* eslint-disable @next/next/no-img-element -- images rendues côté serveur par next/og */
import { INK, PAPER, PAPER2, ORANGE, SUN, LEAF, POSTIT, W, H } from "./render";

/**
 * Modèles des images de partage (1200 × 630). Règles de next/og : tout bloc
 * à plusieurs enfants est en display flex ; pas d'émoji (police absente).
 */

const font = { fontFamily: "Montserrat" };
const display = { fontFamily: "Funnel Display", fontWeight: 700 } as const;

function Logo({ src }: { src: string }) {
    return <img src={src} width={207} height={44} alt="" style={{ position: "absolute", left: 64, top: 54 }} />;
}

function Chip({ children, bg = "#ffffff", color = INK }: { children: string; bg?: string; color?: string }) {
    return (
        <div style={{ display: "flex", fontSize: 22, fontWeight: 700, padding: "9px 20px", borderRadius: 99, background: bg, color, border: bg === "#ffffff" ? "2px solid rgba(26,21,18,0.1)" : "2px solid transparent" }}>
            {children}
        </div>
    );
}

function Avatar({ src, size }: { src: string; size: number }) {
    return <img src={src} width={size} height={size} alt="" style={{ borderRadius: 999, background: PAPER2, border: "4px solid #ffffff" }} />;
}

/** Taille du titre selon sa longueur, pour tenir en 3 lignes */
const titleSize = (t: string, big = 64) => (t.length > 80 ? big - 18 : t.length > 55 ? big - 8 : big);
const clip = (t: string, n: number) => (t.length > n ? `${t.slice(0, t.lastIndexOf(" ", n - 1) > n * 0.6 ? t.lastIndexOf(" ", n - 1) : n - 1)}…` : t);
const plural = (n: number, one: string, many: string) => `${n.toLocaleString("fr-FR")} ${n > 1 ? many : one}`;

/* ─── Accueil / image par défaut ─── */
export function HomeCard({ logo }: { logo: string }) {
    const mini = (label: string, text: string, bg: string, color: string, extra: object) => (
        <div style={{ position: "absolute", width: 330, display: "flex", flexDirection: "column", background: bg, color, borderRadius: 26, padding: "24px 26px", boxShadow: "0 14px 32px rgba(26,21,18,0.14)", ...extra }}>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.8 }}>{label}</div>
            <div style={{ ...display, fontSize: 29, lineHeight: 1.15, marginTop: 8 }}>{text}</div>
        </div>
    );
    return (
        <div style={{ ...font, width: W, height: H, display: "flex", position: "relative", color: INK }}>
            <Logo src={logo} />
            <div style={{ position: "absolute", left: 64, top: 160, width: 560, display: "flex", flexDirection: "column" }}>
                <div style={{ ...display, fontSize: 80, lineHeight: 1.02 }}>L&apos;entraide scolaire gratuite</div>
                <div style={{ marginTop: 26, fontSize: 28, lineHeight: 1.4, color: "rgba(26,21,18,0.62)" }}>Cours, fiches de révision et forum, du collège au supérieur.</div>
            </div>
            {mini("Cours", "Des cours écrits par des bénévoles", "#ffffff", INK, { right: 300, top: 76, transform: "rotate(-4deg)" })}
            {mini("Fiches", "Les fiches de révision de la communauté", POSTIT, INK, { right: 56, top: 190, transform: "rotate(5deg)" })}
            {mini("Forum", "Une question sur tes devoirs ? On t'aide", "#2f86b3", "#ffffff", { right: 220, top: 390, transform: "rotate(-2deg)" })}
        </div>
    );
}

/* ─── Cours : l'image du cours en grand, découpée en arche ─── */
export function CourseCard({ logo, c, photo, avatar }: { logo: string; c: { title: string; subject: string; level: string; lessons: number; learners: number; verified: boolean; author: string | null }; photo: string | null; avatar: string | null }) {
    const left = photo ? 600 : 720;
    return (
        <div style={{ ...font, width: W, height: H, display: "flex", position: "relative", color: INK }}>
            {photo ? (
                <img src={photo} width={560} height={H} alt="" style={{ position: "absolute", right: 0, top: 0, borderTopLeftRadius: 280 }} />
            ) : (
                <div style={{ position: "absolute", right: 0, top: 0, width: 420, height: H, borderTopLeftRadius: 210, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ ...display, fontSize: 220, color: "rgba(255,255,255,0.9)" }}>{(c.subject || "W").slice(0, 1).toUpperCase()}</div>
                </div>
            )}
            <Logo src={logo} />
            <div style={{ position: "absolute", left: 64, top: 136, width: left - 64, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {c.subject ? <Chip bg={ORANGE} color="#ffffff">{c.subject}</Chip> : null}
                    {c.level ? <Chip>{c.level}</Chip> : null}
                    {c.verified ? <Chip bg="rgba(126,217,87,0.32)" color="#2f6e14">Vérifié</Chip> : null}
                </div>
                <div style={{ ...display, fontSize: titleSize(c.title), lineHeight: 1.05, marginTop: 24 }}>{clip(c.title, 95)}</div>
            </div>
            <div style={{ position: "absolute", left: 64, bottom: 54, display: "flex", alignItems: "center", gap: 16, fontSize: 24, fontWeight: 700 }}>
                {avatar ? <Avatar src={avatar} size={58} /> : null}
                {c.author ? <div style={{ display: "flex" }}>{`Par ${c.author}`}</div> : null}
                {c.learners >= 10 ? <div style={{ display: "flex", fontWeight: 400, color: "rgba(26,21,18,0.55)" }}>{`· ${plural(c.learners, "élève", "élèves")}`}</div> : null}
            </div>
            {c.lessons > 0 ? (
                <div style={{ position: "absolute", right: 56, bottom: 52, display: "flex", alignItems: "baseline", gap: 10, background: "rgba(253,250,244,0.96)", borderRadius: 99, padding: "16px 30px", boxShadow: "0 10px 26px rgba(0,0,0,0.25)" }}>
                    <div style={{ ...display, fontSize: 40, color: ORANGE }}>{String(c.lessons)}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(26,21,18,0.65)" }}>{c.lessons > 1 ? "leçons" : "leçon"}</div>
                </div>
            ) : null}
        </div>
    );
}

/* ─── Fiche : la fiche elle-même, posée en biais ─── */
export function FicheCard({ logo, f, sheet, text, avatar }: { logo: string; f: { title: string; subject: string; level: string; likes: number; status: string; author: string | null }; sheet: string | null; text: string | null; avatar: string | null }) {
    // Statuts de relecture, couleurs du site (« Non Certifiée » n'affiche rien)
    const STATUS: Record<string, { bg: string; color: string }> = {
        "Certifiée": { bg: "#eaf6fb", color: "#2f86b3" },
        "Vérifiée": { bg: "#ecfdf5", color: "#065f46" },
    };
    const status = STATUS[f.status.trim()];
    return (
        <div style={{ ...font, width: W, height: H, display: "flex", position: "relative", color: INK, background: "rgba(255,243,214,0.45)" }}>
            {/* La feuille */}
            <div style={{ position: "absolute", right: 70, top: 56, width: 420, height: 570, background: "#ffffff", transform: "rotate(4deg)", boxShadow: "0 18px 40px rgba(26,21,18,0.18)", display: "flex", overflow: "hidden" }}>
                {sheet ? (
                    <img src={sheet} width={420} height={570} alt="" style={{ objectFit: "cover", objectPosition: "top" }} />
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", width: 420, height: 570, padding: "40px 34px 0 62px", position: "relative" }}>
                        {Array.from({ length: 14 }, (_, i) => (
                            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 78 + i * 38, height: 2, background: "rgba(110,193,228,0.35)", display: "flex" }} />
                        ))}
                        <div style={{ position: "absolute", left: 46, top: 0, bottom: 0, width: 2, background: "rgba(255,106,26,0.45)", display: "flex" }} />
                        <div style={{ ...display, fontSize: 28, color: "#c24a0a", lineHeight: 1.2 }}>{clip(f.title, 60)}</div>
                        {text ? <div style={{ fontSize: 19, lineHeight: "38px", marginTop: 14, color: "rgba(26,21,18,0.78)" }}>{clip(text, 330)}</div> : null}
                    </div>
                )}
            </div>
            <div style={{ position: "absolute", right: 250, top: 34, width: 140, height: 38, background: "rgba(255,181,71,0.6)", transform: "rotate(-3deg)", display: "flex" }} />
            {f.likes > 0 ? (
                <div style={{ position: "absolute", right: 400, bottom: 62, background: POSTIT, padding: "16px 24px", transform: "rotate(-5deg)", boxShadow: "0 8px 18px rgba(26,21,18,0.12)", display: "flex", ...display, fontSize: 28 }}>
                    {plural(f.likes, "j'aime", "j'aime")}
                </div>
            ) : null}
            <Logo src={logo} />
            <div style={{ position: "absolute", left: 64, top: 136, width: 560, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {f.subject ? <Chip bg={SUN}>{f.subject}</Chip> : null}
                    {f.level ? <Chip>{f.level}</Chip> : null}
                    {status ? <Chip bg={status.bg} color={status.color}>{f.status.trim()}</Chip> : null}
                </div>
                <div style={{ ...display, fontSize: titleSize(f.title, 60), lineHeight: 1.06, marginTop: 24 }}>{clip(f.title, 90)}</div>
            </div>
            <div style={{ position: "absolute", left: 64, bottom: 54, display: "flex", alignItems: "center", gap: 16, fontSize: 24, fontWeight: 700 }}>
                {avatar ? <Avatar src={avatar} size={58} /> : null}
                {f.author ? <div style={{ display: "flex" }}>{`Fiche de ${f.author}`}</div> : <div style={{ display: "flex" }}>Fiche de révision</div>}
            </div>
        </div>
    );
}

/* ─── Forum : la question en bulle de discussion ─── */
export function QuestionCard({ logo, q, avatar }: { logo: string; q: { title: string; subject: string; level: string; excerpt: string; points: number; solved: boolean; answers: number }; avatar: string | null }) {
    const status = q.solved ? `Résolue · ${plural(q.answers, "réponse", "réponses")}` : q.answers > 0 ? plural(q.answers, "réponse", "réponses") : "En attente de réponse";
    return (
        <div style={{ ...font, width: W, height: H, display: "flex", position: "relative", color: INK, background: "rgba(110,193,228,0.12)" }}>
            <Logo src={logo} />
            {q.points > 0 ? (
                <div style={{ position: "absolute", right: 64, top: 46, display: "flex", background: INK, color: SUN, ...display, fontSize: 28, borderRadius: 99, padding: "10px 22px" }}>{`+${q.points} pts`}</div>
            ) : null}
            <div style={{ position: "absolute", left: 64, top: 136, right: 64, display: "flex", gap: 22, alignItems: "flex-start" }}>
                {avatar ? <Avatar src={avatar} size={78} /> : null}
                <div style={{ display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: "34px 34px 34px 8px", padding: "30px 36px", boxShadow: "0 8px 22px rgba(26,21,18,0.08)", width: 920 }}>
                    <div style={{ ...display, fontSize: q.title.length > 70 ? 42 : 50, lineHeight: 1.1 }}>{clip(q.title, 110)}</div>
                    {q.excerpt ? <div style={{ fontSize: 23, lineHeight: 1.45, marginTop: 14, color: "rgba(26,21,18,0.6)" }}>{clip(q.excerpt, 150)}</div> : null}
                </div>
            </div>
            <div style={{ position: "absolute", left: 64, bottom: 60, display: "flex", gap: 12 }}>
                {q.subject ? <Chip bg="#2f86b3" color="#ffffff">{q.subject}</Chip> : null}
                {q.level ? <Chip>{q.level}</Chip> : null}
            </div>
            <div style={{ position: "absolute", right: 64, bottom: 56, display: "flex", background: q.solved ? "#2f86b3" : "#ffffff", color: q.solved ? "#ffffff" : INK, border: q.solved ? "none" : "2px solid rgba(26,21,18,0.1)", borderRadius: "30px 30px 8px 30px", padding: "18px 28px", fontSize: 25, fontWeight: 700 }}>
                {status}
            </div>
        </div>
    );
}

/* ─── Profil : carte de joueur ─── */
export function ProfileCard({
    logoWhite,
    p,
    avatar,
    border,
}: {
    logoWhite: string;
    p: { username: string; role: string; rank: string; level: number; points: number; fiches: number; answers: number; badges: number; since: string; name: { color: string } | { gradient: string } | null };
    avatar: string | null;
    border: string | null;
}) {
    // Couleur du pseudo achetée : unie, ou dégradé dans les lettres
    const nameColor = p.name && "gradient" in p.name ? { backgroundImage: p.name.gradient, backgroundClip: "text", color: "transparent" } : p.name ? { color: p.name.color } : {};
    const stat = (n: number, label: string) => (
        <div style={{ display: "flex", flexDirection: "column", background: "rgba(253,250,244,0.08)", border: "2px solid rgba(253,250,244,0.14)", borderRadius: 22, padding: "18px 22px", width: 190 }}>
            <div style={{ ...display, fontSize: 46, color: PAPER }}>{n.toLocaleString("fr-FR")}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "rgba(253,250,244,0.6)", marginTop: 4 }}>{label}</div>
        </div>
    );
    return (
        <div style={{ ...font, width: W, height: H, display: "flex", position: "relative", color: PAPER }}>
            <div style={{ position: "absolute", left: 64, top: 58, width: 360, height: 514, borderRadius: 34, background: `linear-gradient(160deg, ${LEAF}, #2f8f4f)`, padding: 8, transform: "rotate(-3deg)", display: "flex", boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}>
                <div style={{ width: 344, height: 498, borderRadius: 28, background: PAPER, color: INK, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 34 }}>
                    {border ? (
                        // Contour acheté : l'avatar à 85 %, le contour par-dessus (comme sur le site)
                        <div style={{ width: 230, height: 230, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                            {avatar ? <img src={avatar} width={196} height={196} alt="" style={{ borderRadius: 999 }} /> : null}
                            <img src={border} width={230} height={230} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
                        </div>
                    ) : (
                        <div style={{ width: 220, height: 220, borderRadius: 999, border: `12px solid ${LEAF}`, display: "flex", alignItems: "center", justifyContent: "center", background: PAPER2 }}>
                            {avatar ? <img src={avatar} width={180} height={180} alt="" style={{ borderRadius: 999 }} /> : null}
                        </div>
                    )}
                    <div style={{ display: "flex", marginTop: -22, background: INK, color: SUN, ...display, fontSize: 26, padding: "6px 18px", borderRadius: 99 }}>{`Niv. ${p.level}`}</div>
                    <div style={{ ...display, fontSize: p.username.length > 12 ? 40 : 52, marginTop: 16, ...nameColor }}>{p.username}</div>
                    <div style={{ display: "flex", fontSize: 21, fontWeight: 700, color: "#2f6e14", marginTop: 4 }}>{p.role}</div>
                </div>
            </div>
            <img src={logoWhite} width={207} height={44} alt="" style={{ position: "absolute", right: 64, top: 54 }} />
            <div style={{ position: "absolute", left: 500, top: 130, display: "flex", flexDirection: "column" }}>
                <div style={{ ...display, fontSize: 36, color: "rgba(253,250,244,0.75)" }}>{p.rank}</div>
                {p.since ? <div style={{ display: "flex", fontSize: 23, color: "rgba(253,250,244,0.55)", marginTop: 6 }}>{`Membre depuis ${p.since}`}</div> : null}
                <div style={{ display: "flex", gap: 16, marginTop: 26 }}>
                    {stat(p.points, "points")}
                    {stat(p.fiches, p.fiches > 1 ? "fiches" : "fiche")}
                    {stat(p.answers, p.answers > 1 ? "réponses" : "réponse")}
                </div>
                {p.badges > 0 ? (
                    <div style={{ display: "flex", marginTop: 22 }}>
                        <div style={{ display: "flex", fontSize: 21, fontWeight: 700, padding: "9px 18px", borderRadius: 99, background: "rgba(253,250,244,0.1)", border: "2px solid rgba(253,250,244,0.16)" }}>{plural(p.badges, "badge gagné", "badges gagnés")}</div>
                    </div>
                ) : null}
            </div>
            <div style={{ position: "absolute", right: 64, bottom: 48, display: "flex", ...display, fontSize: 24, color: "rgba(253,250,244,0.45)" }}>workyt.fr</div>
        </div>
    );
}

