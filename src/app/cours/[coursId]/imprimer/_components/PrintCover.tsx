import type { Curriculum } from "@/app/cours/_components/courseLinks";
import PrintLogo from "./PrintLogo";

/** Description markdown → texte court pour la couverture */
function plainLead(markdown: string, max = 230) {
    const text = markdown
        .replace(/\$\$?[^$]*\$\$?/g, "")
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[#*_>`~]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")}…` : text;
}

const escapeCss = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ");

/**
 * Couverture façon documents PDF Workyt : grille de points, logo en dégradé,
 * grand titre ponctué d'orange, pastilles, nuancier et bandeau encre.
 * Pose aussi le pied de page courant (titre du document) de toutes les pages.
 */
export default function PrintCover({
    curriculum,
    kind,
    stickers,
}: {
    curriculum: Curriculum;
    kind: "cours" | "exercices";
    /** Pastilles décoratives (nombre de leçons, d'exercices…) */
    stickers: string[];
}) {
    const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const docName = kind === "cours" ? "Cours" : "Cahier d'exercices";
    const authors = curriculum.authors.map((a) => a.username).join(", ") || "L'équipe Workyt";
    const lead = curriculum.description ? plainLead(curriculum.description) : "";

    const STICKER_STYLES = [
        { right: "22mm", top: "188mm", background: "var(--accent)", color: "#fff", transform: "rotate(4deg)" },
        { right: "50mm", top: "204mm", background: "#fff", border: "1px solid var(--line-2)", transform: "rotate(-3deg)" },
        { right: "18mm", top: "220mm", background: "var(--accent-3)", transform: "rotate(2deg)" },
        { right: "56mm", top: "236mm", background: "var(--accent-4)", transform: "rotate(-2deg)" },
    ];
    const allStickers = [curriculum.matiere, curriculum.niveau, ...stickers].filter(Boolean).slice(0, STICKER_STYLES.length);

    return (
        <section className="wk-cover">
            {/* Pied de page courant : « Workyt · Cours · <titre> » */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `@page { @bottom-left { content: "WORKYT · ${escapeCss(docName.toUpperCase())} · ${escapeCss(curriculum.title.toUpperCase().slice(0, 70))}"; font-family: Consolas, "Courier New", monospace; font-size: 6.8pt; letter-spacing: 0.14em; color: rgba(26, 21, 18, 0.46); } @top-right { content: "${escapeCss(`${curriculum.matiere} · ${curriculum.niveau}`.toUpperCase())}"; font-family: Consolas, "Courier New", monospace; font-size: 7pt; letter-spacing: 0.18em; color: rgba(26, 21, 18, 0.46); } } @page :first { @top-right { content: none; } @bottom-left { content: none; } }`,
                }}
            />
            <div className="wk-cover-top wk-dotgrid">
                <PrintLogo id="wk-cover-logo" className="wk-cover-logo" />
                <div className="wk-eyebrow" style={{ marginTop: "34mm" }}>
                    {docName} · {curriculum.matiere} · {curriculum.niveau}
                </div>
                {/* Le titre rétrécit s'il est long, pour laisser la place aux pastilles */}
                <h1 style={{ fontSize: curriculum.title.length > 70 ? "30pt" : curriculum.title.length > 38 ? "40pt" : undefined }}>
                    {curriculum.title}
                </h1>
                {lead && <p className="wk-lead">{lead}</p>}
                {allStickers.map((label, i) => (
                    <span key={label + i} className="wk-sticker" style={STICKER_STYLES[i]}>
                        {label}
                    </span>
                ))}
            </div>
            <div className="wk-swatch-row">
                <span style={{ background: "var(--accent)" }} />
                <span style={{ background: "var(--accent-2)" }} />
                <span style={{ background: "var(--accent-3)" }} />
                <span style={{ background: "var(--accent-4)" }} />
                <span style={{ background: "var(--paper-2)" }} />
            </div>
            <div className="wk-cover-band">
                <div>
                    <div className="k">Niveau</div>
                    <div className="v">{curriculum.niveau}</div>
                </div>
                <div style={{ minWidth: 0 }}>
                    <div className="k">Écrit par</div>
                    <div className="v">
                        {authors}
                        {curriculum.verifiedBy ? ` · vérifié par ${curriculum.verifiedBy.username}` : ""}
                    </div>
                </div>
                <div>
                    <div className="k">Édition</div>
                    <div className="v">{today}</div>
                </div>
            </div>
        </section>
    );
}
