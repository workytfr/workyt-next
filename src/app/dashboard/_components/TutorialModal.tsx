"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
    X as XIcon, BookOpen, FileText, Trophy, ChevronRight, ChevronLeft,
    CheckCircle, ArrowRight, Lightbulb, GripVertical,
    ChevronDown, Plus, Bold, Italic, List, Link2, Code2,
    AlignLeft, Trash2, Save, Search, Target, Calendar,
    ArrowUp, ArrowDown,
} from "lucide-react";

// ─── Curseur clignotant ───────────────────────────────────────────────────────

function Cursor() {
    const [on, setOn] = useState(true);
    useEffect(() => {
        const t = setInterval(() => setOn(v => !v), 530);
        return () => clearInterval(t);
    }, []);
    return <span className={`inline-block w-0.5 h-[14px] bg-gray-700 ml-px align-middle ${on ? "opacity-100" : "opacity-0"} transition-opacity duration-100`} />;
}

// ─── Répliques statiques des vrais composants shadcn ─────────────────────────

function SimLabel({ children }: { children: React.ReactNode }) {
    return <label className="text-sm font-medium leading-none text-gray-700 block mb-1.5">{children}</label>;
}

function SimInput({ value, placeholder, active = false, typing = false }: {
    value?: string; placeholder?: string; active?: boolean; typing?: boolean;
}) {
    return (
        <div className={`flex h-10 w-full items-center rounded-md border bg-white px-3 text-sm transition-all duration-200 ${active ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-200"}`}>
            <span className="text-gray-800">{value}</span>
            {typing && <Cursor />}
            {!value && <span className="text-gray-400">{placeholder}</span>}
        </div>
    );
}

function SimSelect({ value, placeholder, open = false, options = [], highlighted = -1 }: {
    value?: string; placeholder?: string; open?: boolean; options?: string[]; highlighted?: number;
}) {
    return (
        <div className="relative">
            <div className={`flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm transition-all duration-200 cursor-pointer ${open ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-200"}`}>
                <span className={value ? "text-gray-800" : "text-gray-400"}>{value || placeholder || "Sélectionner..."}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </div>
            {open && options.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden"
                >
                    {options.map((opt, i) => (
                        <div key={i} className={`px-3 py-2 text-sm ${i === highlighted ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"}`}>
                            {opt}
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}

function SimButton({ children, variant = "primary", small = false }: {
    children: React.ReactNode; variant?: "primary" | "outline"; small?: boolean;
}) {
    const base = `inline-flex items-center gap-1.5 font-medium rounded-md transition-colors ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`;
    const styles = variant === "primary"
        ? `${base} bg-[#f97316] text-white hover:bg-[#ea580c]`
        : `${base} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`;
    return <div className={styles}>{children}</div>;
}

// ─── DEMO 1 : Formulaire de cours (Input + Select animés) ─────────────────────

const COURSE_FIELDS = [
    { label: "Titre du cours *", placeholder: "ex: Les fonctions affines", value: "Les fonctions affines — Chapitre 4", type: "input" },
    { label: "Matière *", placeholder: "Sélectionner une matière", value: "Mathématiques", type: "select", options: ["Mathématiques", "Physique-Chimie", "Histoire-Géographie", "Français", "SVT"] },
    { label: "Niveau *", placeholder: "Sélectionner un niveau", value: "Troisième (3ème)", type: "select", options: ["Sixième (6ème)", "Cinquième (5ème)", "Quatrième (4ème)", "Troisième (3ème)", "Seconde"] },
];

function CourseFormDemo() {
    const [phase, setPhase] = useState(0);
    const [charIdx, setCharIdx] = useState(0);
    const [selectOpen, setSelectOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const [filled, setFilled] = useState<(string | undefined)[]>([undefined, undefined, undefined]);

    const advance = useCallback(() => {
        const next = phase + 1;
        if (next >= COURSE_FIELDS.length) {
            setTimeout(() => { setPhase(0); setCharIdx(0); setFilled([undefined, undefined, undefined]); setSelectOpen(false); setHighlighted(-1); }, 1200);
        } else {
            setPhase(next); setCharIdx(0); setSelectOpen(false); setHighlighted(-1);
        }
    }, [phase]);

    useEffect(() => {
        const f = COURSE_FIELDS[phase];
        if (!f) return;
        if (f.type === "input") {
            if (charIdx >= f.value.length) {
                const t = setTimeout(() => { setFilled(p => p.map((v, i) => i === phase ? f.value : v)); advance(); }, 600);
                return () => clearTimeout(t);
            }
            const t = setTimeout(() => setCharIdx(i => i + 1), 38);
            return () => clearTimeout(t);
        } else {
            // select: open → highlight → select
            if (!selectOpen) { const t = setTimeout(() => setSelectOpen(true), 400); return () => clearTimeout(t); }
            const opts = f.options || [];
            const tgtIdx = opts.indexOf(f.value);
            if (highlighted < tgtIdx) {
                const t = setTimeout(() => setHighlighted(h => h + 1), 220);
                return () => clearTimeout(t);
            }
            const t = setTimeout(() => {
                setFilled(p => p.map((v, i) => i === phase ? f.value : v));
                setSelectOpen(false);
                setTimeout(advance, 400);
            }, 400);
            return () => clearTimeout(t);
        }
    }, [phase, charIdx, selectOpen, highlighted, advance]);

    return (
        <div className="space-y-4">
            {COURSE_FIELDS.map((f, i) => (
                <div key={i}>
                    <SimLabel>{f.label}</SimLabel>
                    {f.type === "input"
                        ? <SimInput value={i < phase ? filled[i] : i === phase ? f.value.slice(0, charIdx) : undefined} placeholder={f.placeholder} active={i === phase} typing={i === phase} />
                        : <SimSelect value={filled[i]} placeholder={f.placeholder} open={i === phase && selectOpen} options={f.options} highlighted={i === phase ? highlighted : -1} />
                    }
                </div>
            ))}
            <div className="flex gap-2 pt-1">
                <SimButton>Créer le cours</SimButton>
                <SimButton variant="outline">Annuler</SimButton>
            </div>
        </div>
    );
}

// ─── DEMO 2 : Sections avec drag & drop ───────────────────────────────────────

const INITIAL_SECTIONS = [
    "Introduction et rappels",
    "Définition et propriétés",
    "Applications pratiques",
    "Exercices d'entraînement",
];

function SectionsDndDemo() {
    const [items, setItems] = useState(INITIAL_SECTIONS);
    const [dragging, setDragging] = useState<number | null>(null);
    const [phase, setPhase] = useState<"idle" | "lift" | "move" | "drop">("idle");
    const [from, setFrom] = useState(2);
    const [to, setTo] = useState(0);

    useEffect(() => {
        let t: NodeJS.Timeout;
        const run = () => {
            const a = 2, b = 0;
            setFrom(a); setTo(b);
            setPhase("lift"); setDragging(a);
            t = setTimeout(() => setPhase("move"), 600);
            t = setTimeout(() => {
                setPhase("drop");
                setItems(prev => {
                    const next = [...prev];
                    const [el] = next.splice(a, 1);
                    next.splice(b, 0, el);
                    return next;
                });
                setTimeout(() => { setPhase("idle"); setDragging(null); setTimeout(run, 2000); }, 500);
            }, 1600);
        };
        t = setTimeout(run, 800);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="space-y-2">
            <AnimatePresence>
                {items.map((item, i) => {
                    const isDragging = dragging !== null && items.indexOf(item) === (phase === "drop" ? to : from);
                    return (
                        <motion.div
                            key={item}
                            layout
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            animate={isDragging && phase === "lift" ? { scale: 1.02, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" } : isDragging && phase === "move" ? { scale: 1.02, y: -8, boxShadow: "0 12px 32px rgba(0,0,0,0.15)" } : { scale: 1, boxShadow: "none" }}
                            className={`flex items-center gap-3 rounded-md border px-3 py-2.5 bg-white transition-colors ${isDragging ? "border-indigo-300 bg-indigo-50/50" : "border-gray-200"}`}
                        >
                            <div className={`cursor-grab ${isDragging ? "text-indigo-400" : "text-gray-300"}`}>
                                <GripVertical className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-gray-400 w-5 flex-shrink-0">{i + 1}.</span>
                            <div className={`flex-1 text-sm ${isDragging ? "text-indigo-700 font-medium" : "text-gray-700"}`}>{item}</div>
                            <button className="text-gray-300 hover:text-red-400 p-0.5 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
            <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400"
            >
                <Plus className="w-4 h-4" /> Ajouter une section
            </motion.div>
        </div>
    );
}

// ─── DEMO 3 : Sélection cascade Cours → Section (leçon) ──────────────────────

const LESSON_SELECTS = [
    { label: "Cours *", options: ["Les fonctions affines — Ch.4", "Le théorème de Pythagore", "Les proportionnalités"], value: "Les fonctions affines — Ch.4" },
    { label: "Section *", options: ["Introduction et rappels", "Définition et propriétés", "Applications pratiques"], value: "Définition et propriétés" },
];

function LessonSelectDemo() {
    const [step, setStep] = useState(0);
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const [values, setValues] = useState<(string | undefined)[]>([undefined, undefined]);

    useEffect(() => {
        const f = LESSON_SELECTS[step];
        if (!f) return;
        if (!open) { const t = setTimeout(() => setOpen(true), 600); return () => clearTimeout(t); }
        const tgt = f.options.indexOf(f.value);
        if (highlighted < tgt) {
            const t = setTimeout(() => setHighlighted(h => h + 1), 250);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => {
            setValues(p => p.map((v, i) => i === step ? f.value : v));
            setOpen(false); setHighlighted(-1);
            setTimeout(() => {
                if (step + 1 < LESSON_SELECTS.length) setStep(step + 1);
                else setTimeout(() => { setStep(0); setValues([undefined, undefined]); }, 1200);
            }, 500);
        }, 400);
        return () => clearTimeout(t);
    }, [step, open, highlighted]);

    return (
        <div className="space-y-4">
            {LESSON_SELECTS.map((f, i) => (
                <div key={i} className={i > step ? "opacity-40" : ""}>
                    <SimLabel>{f.label}</SimLabel>
                    <SimSelect value={values[i]} placeholder={`Sélectionner...`} open={i === step && open} options={i === step ? f.options : []} highlighted={i === step ? highlighted : -1} />
                </div>
            ))}
            <div>
                <SimLabel>Titre de la leçon *</SimLabel>
                <SimInput placeholder="Titre de la leçon..." active={step >= LESSON_SELECTS.length} />
            </div>
        </div>
    );
}

// ─── DEMO 4 : Éditeur riche TipTap (toolbar + frappe + blocs) ────────────────

const EDITOR_TOOLBAR = [
    { icon: <Bold className="w-3.5 h-3.5" />, label: "Gras" },
    { icon: <Italic className="w-3.5 h-3.5" />, label: "Italique" },
    { icon: <List className="w-3.5 h-3.5" />, label: "Liste" },
    { icon: <Link2 className="w-3.5 h-3.5" />, label: "Lien" },
    { icon: <Code2 className="w-3.5 h-3.5" />, label: "Code" },
    { icon: <AlignLeft className="w-3.5 h-3.5" />, label: "Alignement" },
];

const BLOCKS = [
    { key: "definition", emoji: "📘", label: "Définition", bg: "bg-orange-50", border: "border-orange-300", title: "text-orange-700" },
    { key: "propriete",  emoji: "⚡", label: "Propriété",  bg: "bg-cyan-50",   border: "border-cyan-300",   title: "text-cyan-700" },
    { key: "theoreme",   emoji: "📐", label: "Théorème",   bg: "bg-green-50",  border: "border-green-300",  title: "text-green-700" },
    { key: "exemple",    emoji: "✏️", label: "Exemple",    bg: "bg-blue-50",   border: "border-blue-300",   title: "text-blue-700" },
    { key: "remarque",   emoji: "💡", label: "Remarque",   bg: "bg-amber-50",  border: "border-amber-300",  title: "text-amber-700" },
    { key: "attention",  emoji: "⚠️", label: "Attention",  bg: "bg-red-50",    border: "border-red-300",    title: "text-red-700" },
];

const EDITOR_SCRIPT = [
    { action: "type", text: "Une fonction affine est définie par " },
    { action: "type", text: "f(x) = ax + b" },
    { action: "newline" },
    { action: "block", block: 0, content: "On dit que f est affine si a ≠ 0. Si a = 0, f est une fonction constante." },
    { action: "block", block: 3, content: "Pour f(x) = 2x + 3 : le coefficient directeur est 2, l'ordonnée à l'origine est 3." },
    { action: "block", block: 5, content: "Ne pas confondre fonction affine et fonction linéaire !" },
];

function EditorDemo() {
    const [lines, setLines] = useState<Array<{ type: string; text?: string; blockIdx?: number; content?: string }>>([]);
    const [typing, setTyping] = useState("");
    const [activeBlock, setActiveBlock] = useState<number | null>(null);
    const [scriptIdx, setScriptIdx] = useState(0);
    const [charIdx, setCharIdx] = useState(0);

    useEffect(() => {
        const step = EDITOR_SCRIPT[scriptIdx];
        if (!step) {
            const t = setTimeout(() => { setLines([]); setScriptIdx(0); setCharIdx(0); setTyping(""); setActiveBlock(null); }, 1500);
            return () => clearTimeout(t);
        }
        if (step.action === "type") {
            if (charIdx < step.text!.length) {
                setTyping(step.text!.slice(0, charIdx + 1));
                const t = setTimeout(() => setCharIdx(i => i + 1), 28);
                return () => clearTimeout(t);
            }
            const t = setTimeout(() => {
                setLines(l => [...l, { type: "text", text: step.text }]);
                setTyping(""); setCharIdx(0);
                setScriptIdx(i => i + 1);
            }, 400);
            return () => clearTimeout(t);
        }
        if (step.action === "newline") {
            const t = setTimeout(() => setScriptIdx(i => i + 1), 200);
            return () => clearTimeout(t);
        }
        if (step.action === "block") {
            setActiveBlock(step.block!);
            if (charIdx === 0) { const t = setTimeout(() => setCharIdx(1), 500); return () => clearTimeout(t); }
            if (charIdx < step.content!.length + 1) {
                setTyping(step.content!.slice(0, charIdx));
                const t = setTimeout(() => setCharIdx(i => i + 1), 22);
                return () => clearTimeout(t);
            }
            const t = setTimeout(() => {
                setLines(l => [...l, { type: "block", blockIdx: step.block, content: step.content }]);
                setTyping(""); setCharIdx(0); setActiveBlock(null);
                setScriptIdx(i => i + 1);
            }, 500);
            return () => clearTimeout(t);
        }
    }, [scriptIdx, charIdx]);

    const currentStep = EDITOR_SCRIPT[scriptIdx];

    return (
        <div className="w-full rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
            {/* Toolbar formatage */}
            <div className="flex items-center gap-0.5 border-b border-gray-100 bg-gray-50 px-2 py-1.5 flex-wrap">
                {EDITOR_TOOLBAR.map((b, i) => (
                    <button key={i} title={b.label} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors">{b.icon}</button>
                ))}
                <div className="h-4 w-px bg-gray-200 mx-1" />
                {/* Blocs pédagogiques */}
                {BLOCKS.map((bl, i) => (
                    <motion.button
                        key={bl.key}
                        animate={activeBlock === i ? { scale: [1, 1.15, 1], backgroundColor: ["#f3f4f6", "#e0e7ff", "#f3f4f6"] } : {}}
                        transition={{ duration: 0.35 }}
                        title={bl.label}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${bl.title} ${bl.bg} ml-0.5`}
                    >
                        {bl.emoji}
                    </motion.button>
                ))}
            </div>

            {/* Zone de contenu */}
            <div className="p-3 min-h-[160px] space-y-2">
                <AnimatePresence>
                    {lines.map((line, i) => {
                        if (line.type === "text") return (
                            <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-800">{line.text}</motion.p>
                        );
                        if (line.type === "block") {
                            const bl = BLOCKS[line.blockIdx!];
                            return (
                                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={`rounded-md border-l-4 ${bl.border} ${bl.bg} px-3 py-2`}>
                                    <div className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${bl.title}`}>{bl.emoji} {bl.label}</div>
                                    <p className="text-xs text-gray-700">{line.content}</p>
                                </motion.div>
                            );
                        }
                        return null;
                    })}
                </AnimatePresence>

                {/* Ligne en cours de frappe */}
                {currentStep?.action === "type" && (
                    <p className="text-sm text-gray-800">{typing}<Cursor /></p>
                )}
                {currentStep?.action === "block" && activeBlock !== null && (
                    <motion.div
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        className={`rounded-md border-l-4 ${BLOCKS[activeBlock].border} ${BLOCKS[activeBlock].bg} px-3 py-2`}
                    >
                        <div className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${BLOCKS[activeBlock].title}`}>
                            {BLOCKS[activeBlock].emoji} {BLOCKS[activeBlock].label}
                        </div>
                        <p className="text-xs text-gray-700">{typing}<Cursor /></p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// ─── DEMO 5 : LaTeX ───────────────────────────────────────────────────────────

const LATEX_EX = [
    { src: "$f(x) = ax + b$", rendered: "f(x) = ax + b", desc: "formule dans le texte" },
    { src: "$$\\frac{a}{b} + \\sqrt{c}$$", rendered: "a/b + √c", desc: "bloc centré" },
    { src: "$\\lim_{x\\to 0} \\frac{\\sin x}{x} = 1$", rendered: "lim(x→0) sin(x)/x = 1", desc: "limite" },
    { src: "$$\\int_0^{+\\infty} e^{-t}\\,dt = 1$$", rendered: "∫₀^∞ e⁻ᵗ dt = 1", desc: "intégrale" },
];

function LatexDemo() {
    const [idx, setIdx] = useState(0);
    const [charIdx, setCharIdx] = useState(0);
    const [rendered, setRendered] = useState(false);
    const ex = LATEX_EX[idx];

    useEffect(() => { setCharIdx(0); setRendered(false); }, [idx]);
    useEffect(() => {
        if (charIdx < ex.src.length) {
            const t = setTimeout(() => setCharIdx(i => i + 1), 40);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => { setRendered(true); setTimeout(() => setIdx(i => (i + 1) % LATEX_EX.length), 2000); }, 350);
        return () => clearTimeout(t);
    }, [charIdx, ex.src.length, idx]);

    return (
        <div className="space-y-3">
            <div>
                <SimLabel>Contenu de la leçon</SimLabel>
                <div className="min-h-[44px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-mono text-gray-700">
                    Du texte… puis : {ex.src.slice(0, charIdx)}<Cursor />
                </div>
            </div>
            <AnimatePresence mode="wait">
                {rendered && (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-md border-2 border-indigo-200 bg-indigo-50 p-3 text-center"
                    >
                        <div className="text-[10px] text-indigo-400 uppercase tracking-wide mb-1">Rendu ({ex.desc})</div>
                        <div className="text-base font-medium text-indigo-700">{ex.rendered}</div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex gap-1.5 justify-center">
                {LATEX_EX.map((_, i) => (
                    <button key={i} onClick={() => setIdx(i)} className={`rounded-full transition-all ${i === idx ? "w-5 h-2 bg-indigo-500" : "w-2 h-2 bg-gray-200"}`} />
                ))}
            </div>
        </div>
    );
}

// ─── DEMO 6 : Exercice — difficulté + correction ──────────────────────────────

const DIFFICULTIES = ["Facile 1", "Facile 2", "Moyen 1", "Moyen 2", "Difficile 1", "Difficile 2", "Élite"];
const DIFF_COLORS = ["bg-emerald-100 text-emerald-700 border-emerald-200", "bg-emerald-200 text-emerald-800 border-emerald-300", "bg-amber-100 text-amber-700 border-amber-200", "bg-amber-200 text-amber-800 border-amber-300", "bg-red-100 text-red-700 border-red-200", "bg-red-200 text-red-800 border-red-300", "bg-purple-100 text-purple-700 border-purple-200"];

function ExerciceDifficultyDemo() {
    const [selected, setSelected] = useState<number | null>(null);
    useEffect(() => {
        let i = 0;
        const t = setInterval(() => {
            setSelected(i % DIFFICULTIES.length);
            i++;
        }, 600);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="space-y-4">
            <div>
                <SimLabel>Niveau de difficulté *</SimLabel>
                <div className="flex flex-wrap gap-2 mt-1">
                    {DIFFICULTIES.map((d, i) => (
                        <motion.div
                            key={d}
                            animate={i === selected ? { scale: 1.08 } : { scale: 1 }}
                            className={`px-3 py-1.5 rounded-md border text-xs font-semibold cursor-pointer transition-all ${i === selected ? DIFF_COLORS[i] + " ring-2 ring-offset-1 ring-current shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200"}`}
                        >
                            {d}
                        </motion.div>
                    ))}
                </div>
            </div>
            <div>
                <SimLabel>Correction (optionnel)</SimLabel>
                <div className="rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-400 min-h-[64px]">
                    La correction sera visible après que l&apos;élève aura soumis sa réponse…
                </div>
            </div>
        </div>
    );
}

// ─── DEMO 7 : Quiz — choix du type de question (exact réplique QuizForm) ──────

const QUIZ_TYPES = [
    { value: "QCM",            label: "QCM",              color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "Vrai/Faux",      label: "Vrai / Faux",      color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { value: "Réponse courte", label: "Réponse courte",   color: "bg-purple-50 text-purple-700 border-purple-200" },
    { value: "Classement",     label: "Classement",        color: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "Glisser-déposer",label: "Glisser-déposer",  color: "bg-pink-50 text-pink-700 border-pink-200" },
    { value: "Slider",         label: "Slider",            color: "bg-orange-50 text-orange-700 border-orange-200" },
    { value: "Code",           label: "Code",              color: "bg-gray-100 text-gray-700 border-gray-300" },
    { value: "Texte à trous",  label: "Texte à trous",    color: "bg-teal-50 text-teal-700 border-teal-200" },
];

function QuizTypeDemo() {
    const [active, setActive] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setActive(i => (i + 1) % QUIZ_TYPES.length), 900);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="space-y-3">
            <SimLabel>Type de question</SimLabel>
            {/* Réplique exacte de la grille dans QuizForm */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                {QUIZ_TYPES.map((t, i) => (
                    <motion.button
                        key={t.value}
                        animate={i === active ? { scale: 1.04 } : { scale: 1 }}
                        onClick={() => setActive(i)}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs text-left transition-all ${i === active ? `${t.color} border-current font-medium shadow-sm` : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"}`}
                    >
                        <span className="truncate">{t.label}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

// ─── DEMO 8 : Quiz QCM (réplique du form d'ajout de réponses) ─────────────────

function QuizQCMDemo() {
    const [answers] = useState(["f'(x) = x", "f'(x) = 2x", "f'(x) = 2x²", "f'(x) = x³"]);
    const [correct, setCorrect] = useState<number | null>(null);
    const [charIdx, setCharIdx] = useState(0);
    const QUESTION = "Quelle est la dérivée de f(x) = x² ?";

    useEffect(() => {
        if (charIdx < QUESTION.length) {
            const t = setTimeout(() => setCharIdx(i => i + 1), 30);
            return () => clearTimeout(t);
        }
        // Sélectionne la bonne réponse après la frappe
        const t = setTimeout(() => setCorrect(1), 600);
        return () => clearTimeout(t);
    }, [charIdx]);

    return (
        <div className="space-y-3">
            <div>
                <SimLabel>Énoncé de la question</SimLabel>
                <div className="min-h-[44px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
                    {QUESTION.slice(0, charIdx)}{charIdx < QUESTION.length && <Cursor />}
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <SimLabel>Réponses</SimLabel>
                    <span className="text-[10px] text-gray-400">Cliquez le ✓ pour marquer la bonne réponse</span>
                </div>
                <div className="space-y-1.5">
                    {answers.map((a, i) => (
                        <motion.div
                            key={i}
                            animate={correct === i ? { borderColor: "#10b981", backgroundColor: "#f0fdf4" } : {}}
                            className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-colors ${correct === i ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white"}`}
                        >
                            <motion.div
                                animate={correct === i ? { backgroundColor: "#10b981", borderColor: "#10b981" } : {}}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${correct === i ? "border-emerald-500 bg-emerald-500" : "border-gray-300"}`}
                            >
                                {correct === i && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </motion.div>
                            <span className="flex-1 text-sm text-gray-700">{a}</span>
                            <button className="text-gray-300 hover:text-red-400"><XIcon className="w-3.5 h-3.5" /></button>
                        </motion.div>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <SimButton small variant="outline"><Plus className="w-3 h-3" /> Option</SimButton>
                <span className="text-xs text-gray-400">Mode : une seule bonne réponse</span>
            </div>
        </div>
    );
}

// ─── DEMO 9 : Quiz — bonus/malus (toggle exact réplique) ─────────────────────

function QuizTimerDemo() {
    const [bonusOn, setBonusOn] = useState(false);
    const [penaltyOn, setPenaltyOn] = useState(false);

    useEffect(() => {
        const t1 = setTimeout(() => setBonusOn(true), 800);
        const t2 = setTimeout(() => setPenaltyOn(true), 1800);
        const t3 = setTimeout(() => { setBonusOn(false); setPenaltyOn(false); }, 4000);
        const t4 = setTimeout(() => setBonusOn(true), 4800);
        const t5 = setTimeout(() => setPenaltyOn(true), 5800);
        return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
    }, []);

    return (
        <div className="space-y-3">
            {/* Bonus */}
            <div className={`rounded-xl border-2 p-4 transition-colors duration-300 ${bonusOn ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 bg-white"}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${bonusOn ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                            <span className="text-base">⚡</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Bonus de rapidité</p>
                            <p className="text-xs text-gray-400">Récompense les élèves rapides</p>
                        </div>
                    </div>
                    <motion.div
                        animate={{ backgroundColor: bonusOn ? "#10b981" : "#d1d5db" }}
                        className="relative w-10 h-5 rounded-full cursor-pointer"
                        onClick={() => setBonusOn(v => !v)}
                    >
                        <motion.span animate={{ x: bonusOn ? 20 : 2 }} className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow pointer-events-none" style={{ left: 0 }} />
                    </motion.div>
                </div>
                <AnimatePresence>
                    {bonusOn && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-200 overflow-hidden">
                            <div>
                                <SimLabel>Temps cible (min)</SimLabel>
                                <SimInput value="2" />
                            </div>
                            <div>
                                <SimLabel>Bonus (%)</SimLabel>
                                <SimInput value="15" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Malus */}
            <div className={`rounded-xl border-2 p-4 transition-colors duration-300 ${penaltyOn ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${penaltyOn ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-400"}`}>
                            <span className="text-base">⏱</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Malus de lenteur</p>
                            <p className="text-xs text-gray-400">Pénalise les dépassements</p>
                        </div>
                    </div>
                    <motion.div
                        animate={{ backgroundColor: penaltyOn ? "#ef4444" : "#d1d5db" }}
                        className="relative w-10 h-5 rounded-full cursor-pointer"
                        onClick={() => setPenaltyOn(v => !v)}
                    >
                        <motion.span animate={{ x: penaltyOn ? 20 : 2 }} className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow" style={{ left: 0 }} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

// ─── DEMO 10 : Statut leçon / publication ─────────────────────────────────────

function LessonStatusDemo() {
    const [status, setStatus] = useState(0);
    const statuses = [
        { label: "En attente de correction", color: "bg-amber-100 text-amber-700 border-amber-200" },
        { label: "Validée ✓", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    ];
    useEffect(() => {
        const t = setInterval(() => setStatus(s => (s + 1) % statuses.length), 2000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="space-y-3">
            <div>
                <SimLabel>Statut de la leçon</SimLabel>
                <AnimatePresence mode="wait">
                    <motion.div key={status} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${statuses[status].color}`}
                    >
                        {status === 1 && <CheckCircle className="w-3.5 h-3.5" />}
                        {statuses[status].label}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="flex gap-2 pt-2">
                <SimButton><Save className="w-3.5 h-3.5" /> Sauvegarder</SimButton>
                <SimButton variant="outline">Annuler</SimButton>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs text-gray-500">
                La leçon sera relue par un correcteur avant publication. Vous pouvez soumettre autant de fois que nécessaire.
            </div>
        </div>
    );
}

// ─── DEMO 11 : Exercice — éditeur MDEditor (markdown + LaTeX) ────────────────

const MD_SCRIPT = [
    "## Exercice — Fonctions affines\n\n",
    "Soit $f$ une fonction affine telle que $f(0) = 3$ et $f(2) = 7$.\n\n",
    "**1.** Déterminer l'expression de $f(x)$.\n\n",
    "**2.** Calculer $f(-1)$.\n\n",
    "$$f(x) = ax + b$$",
];

function ExerciceEnoncéDemo() {
    const [phase, setPhase] = useState(0);
    const [charIdx, setCharIdx] = useState(0);
    const [committed, setCommitted] = useState("");
    const [showPreview, setShowPreview] = useState(false);

    const target = MD_SCRIPT[phase] || "";

    useEffect(() => {
        if (charIdx < target.length) {
            const t = setTimeout(() => setCharIdx(i => i + 1), 20);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => {
            const next = phase + 1;
            if (next < MD_SCRIPT.length) {
                setCommitted(c => c + target);
                setPhase(next); setCharIdx(0);
            } else {
                setShowPreview(true);
                setTimeout(() => {
                    setCommitted(""); setPhase(0); setCharIdx(0); setShowPreview(false);
                }, 2500);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [charIdx, phase, target]);

    const full = committed + target.slice(0, charIdx);

    return (
        <div className="w-full rounded-lg border border-gray-200 overflow-hidden">
            {/* Toolbar MDEditor */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-1.5">
                <div className="flex gap-0.5">
                    {["H1", "H2", "B", "I", "≡", "{ }", "🔗", "🖼"].map((b, i) => (
                        <button key={i} className="px-2 py-1 rounded text-[10px] font-mono text-gray-500 hover:bg-gray-200 transition-colors">{b}</button>
                    ))}
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setShowPreview(false)} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${!showPreview ? "bg-white shadow-sm text-gray-700 border border-gray-200" : "text-gray-400 hover:text-gray-600"}`}>Éditer</button>
                    <button onClick={() => setShowPreview(true)} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${showPreview ? "bg-white shadow-sm text-gray-700 border border-gray-200" : "text-gray-400 hover:text-gray-600"}`}>Aperçu</button>
                </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-gray-100">
                {/* Éditeur */}
                <div className="p-3 min-h-[140px] font-mono text-xs text-gray-700 whitespace-pre-wrap bg-white leading-relaxed">
                    {full}<Cursor />
                </div>

                {/* Preview */}
                <AnimatePresence>
                    {showPreview ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 min-h-[140px] text-xs text-gray-800 bg-white space-y-1.5 leading-relaxed">
                            <div className="font-bold text-sm text-gray-900">Exercice — Fonctions affines</div>
                            <p>Soit <em>f</em> une fonction affine telle que <span className="font-mono bg-gray-100 px-1 rounded">f(0) = 3</span> et <span className="font-mono bg-gray-100 px-1 rounded">f(2) = 7</span>.</p>
                            <p><strong>1.</strong> Déterminer l&apos;expression de <span className="font-mono bg-gray-100 px-1 rounded">f(x)</span>.</p>
                            <p><strong>2.</strong> Calculer <span className="font-mono bg-gray-100 px-1 rounded">f(-1)</span>.</p>
                            <div className="text-center bg-indigo-50 rounded px-2 py-1 font-medium text-indigo-700">f(x) = ax + b</div>
                        </motion.div>
                    ) : (
                        <div className="p-3 min-h-[140px] bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                            Cliquez Aperçu pour voir le rendu
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── DEMO 12 : Exercice — image + correction ──────────────────────────────────

function ExerciceCorrectionDemo() {
    const [phase, setPhase] = useState<"upload" | "correction" | "done">("upload");
    const [corrText, setCorrText] = useState("");
    const CORRECTION = "On cherche a et b tels que f(0)=3 → b=3, et f(2)=7 → 2a+3=7 → a=2. Donc f(x) = 2x + 3. Pour f(-1) = 2×(-1)+3 = 1.";

    useEffect(() => {
        const t1 = setTimeout(() => setPhase("correction"), 1200);
        return () => clearTimeout(t1);
    }, []);

    useEffect(() => {
        if (phase !== "correction") return;
        let i = 0;
        const t = setInterval(() => {
            i++;
            setCorrText(CORRECTION.slice(0, i));
            if (i >= CORRECTION.length) { clearInterval(t); setPhase("done"); setTimeout(() => { setPhase("upload"); setCorrText(""); }, 2000); }
        }, 22);
        return () => clearInterval(t);
    }, [phase]);

    return (
        <div className="space-y-3">
            {/* Zone image (upload Uploadthing style) */}
            <div>
                <SimLabel>Image de l&apos;exercice (optionnel)</SimLabel>
                <AnimatePresence mode="wait">
                    {phase === "upload" ? (
                        <motion.div key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50"
                        >
                            <div className="text-2xl mb-1">🖼</div>
                            <p className="text-xs text-gray-500">Glissez une image ou cliquez pour uploader</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP — max 8 Mo</p>
                        </motion.div>
                    ) : (
                        <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                            className="border-2 border-emerald-200 bg-emerald-50 rounded-lg p-3 flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-xs text-emerald-700 font-medium">schema_exercice.png uploadé</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Correction */}
            <div>
                <SimLabel>Correction *</SimLabel>
                <div className="rounded-md border border-gray-200 bg-white px-3 py-2 min-h-[80px] text-xs text-gray-700 leading-relaxed">
                    {corrText}{phase === "correction" && <Cursor />}
                    {phase === "upload" && <span className="text-gray-400">Rédigez la correction complète ici…</span>}
                </div>
            </div>
        </div>
    );
}

// ─── DEMO 13 : Quiz — autres types (Texte à trous, Classement, Glisser-déposer)

function QuizOtherTypesDemo() {
    const [typeIdx, setTypeIdx] = useState(0);
    const types = ["Texte à trous", "Classement", "Glisser-déposer"];

    useEffect(() => {
        const t = setInterval(() => setTypeIdx(i => (i + 1) % types.length), 3000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="space-y-3">
            {/* Sélecteur de type */}
            <div className="flex gap-1.5">
                {types.map((t, i) => (
                    <button key={t} onClick={() => setTypeIdx(i)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${i === typeIdx
                            ? i === 0 ? "bg-teal-50 text-teal-700 border-teal-200 shadow-sm"
                            : i === 1 ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
                            : "bg-pink-50 text-pink-700 border-pink-200 shadow-sm"
                            : "bg-gray-50 text-gray-400 border-gray-200"}`}
                    >{t}</button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ── Texte à trous ── */}
                {typeIdx === 0 && (
                    <motion.div key="trous" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-3">
                        <div>
                            <SimLabel>Texte avec trous (utilisez {"{{"+"blank}}"} pour chaque trou)</SimLabel>
                            <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 font-mono min-h-[48px] leading-relaxed">
                                La dérivée de x² est <span className="bg-teal-100 text-teal-700 px-1 rounded font-bold">{"{{"+"blank}}"}</span> et la dérivée de sin(x) est <span className="bg-teal-100 text-teal-700 px-1 rounded font-bold">{"{{"+"blank}}"}</span>.
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">2 trous détectés</p>
                        </div>
                        <div className="space-y-2">
                            {["Trou 1 :", "Trou 2 :"].map((label, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 w-14 flex-shrink-0">{label}</span>
                                    <div className="flex-1 flex h-9 items-center rounded-md border-2 border-emerald-200 bg-emerald-50/40 px-3 text-sm text-emerald-700 font-medium">
                                        {i === 0 ? "2x" : "cos(x)"}<span className="ml-0.5 opacity-50">|</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Classement ── */}
                {typeIdx === 1 && (
                    <motion.div key="classement" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-2">
                        <SimLabel>Éléments dans le bon ordre (l&apos;élève les verra mélangés)</SimLabel>
                        {["Identifier la fonction f(x)", "Calculer la dérivée f'(x)", "Simplifier le résultat", "Vérifier le résultat"].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 border border-gray-200 bg-white rounded-md px-3 py-2">
                                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                <span className="flex-1 text-sm text-gray-700">{item}</span>
                                <div className="flex flex-col gap-0.5">
                                    <button className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30" disabled={i === 0}><ArrowUp className="w-3 h-3 text-gray-400" /></button>
                                    <button className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30" disabled={i === 3}><ArrowDown className="w-3 h-3 text-gray-400" /></button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── Glisser-déposer ── */}
                {typeIdx === 2 && (
                    <motion.div key="glisser" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-2">
                        <SimLabel>Paires à associer (terme ↔ définition)</SimLabel>
                        {[
                            { left: "Dérivée", right: "Limite du taux de variation" },
                            { left: "Primitive", right: "Fonction dont f est la dérivée" },
                            { left: "Intégrale", right: "Aire sous la courbe" },
                        ].map((pair, i) => (
                            <div key={i} className="flex items-center gap-2 border border-gray-200 bg-white rounded-md px-3 py-2">
                                <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                <div className="flex-1 text-sm font-medium text-gray-800">{pair.left}</div>
                                <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                <div className="flex-1 text-sm text-gray-600 bg-pink-50 rounded px-2 py-0.5">{pair.right}</div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── DEMO 14 : Quiz — points et explication ───────────────────────────────────

function QuizPointsExplanationDemo() {
    const [expanded, setExpanded] = useState(false);
    const [points, setPoints] = useState("");
    const [expl, setExpl] = useState("");
    const EXPL = "La dérivée de xⁿ est n·x^(n-1). Ici, n=2 donc f'(x) = 2x.";

    useEffect(() => {
        const t1 = setTimeout(() => setExpanded(true), 600);
        const t2 = setTimeout(() => setPoints("2"), 1200);
        let i = 0;
        const t3 = setTimeout(() => {
            const iv = setInterval(() => {
                i++;
                setExpl(EXPL.slice(0, i));
                if (i >= EXPL.length) clearInterval(iv);
            }, 22);
        }, 1800);
        return () => [t1, t2, t3].forEach(clearTimeout);
    }, []);

    return (
        <div className="space-y-2">
            {/* Question card (réplique QuizForm) */}
            <div className={`rounded-xl border-2 ${expanded ? "border-gray-300 shadow-sm" : "border-gray-200"}`}>
                {/* Header question */}
                <button className="w-full flex items-center gap-3 p-3 text-left bg-white rounded-t-xl" onClick={() => setExpanded(v => !v)}>
                    <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">1</span>
                    <div className="flex-1 flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200 font-medium">QCM</span>
                        <span className="text-sm text-gray-700 truncate">Quelle est la dérivée de f(x) = x² ?</span>
                    </div>
                    <span className="text-[10px] border border-gray-200 px-1.5 py-0.5 rounded text-gray-500">{points || "—"} pt</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>

                {expanded && (
                    <div className="border-t border-gray-100 p-3 space-y-3">
                        {/* Points */}
                        <div className="flex items-center gap-3">
                            <SimLabel>Points</SimLabel>
                            <div className="w-20">
                                <div className={`flex h-9 items-center rounded-md border-2 px-3 text-sm text-center font-medium transition-all ${points ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-400"}`}>
                                    {points || "0"}{!points && <Cursor />}
                                </div>
                            </div>
                            <span className="text-xs text-gray-400">pts attribués à cette question</span>
                        </div>

                        {/* Explication */}
                        <div>
                            <SimLabel>Explication (affichée après soumission)</SimLabel>
                            <div className="rounded-md border border-gray-200 bg-white px-3 py-2 min-h-[52px] text-xs text-gray-700 leading-relaxed">
                                {expl}{expl.length < EXPL.length && <Cursor />}
                                {!expl && <span className="text-gray-400">Expliquez pourquoi cette réponse est correcte…</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── DEMO 15 : SkillPicker — réplique exacte ─────────────────────────────────

const FAKE_SKILLS = [
    { id: "C4-MATH-ALG-FA-01", desc: "Reconnaître une fonction affine et ses paramètres", diff: 2, level: "3ème" },
    { id: "C4-MATH-ALG-FA-02", desc: "Calculer l'image d'un nombre par une fonction affine", diff: 2, level: "3ème" },
    { id: "C4-MATH-ALG-FA-03", desc: "Trouver un antécédent par résolution d'équation", diff: 3, level: "3ème" },
    { id: "C4-MATH-GEO-DR-01", desc: "Tracer la représentation graphique d'une fonction affine", diff: 2, level: "3ème" },
    { id: "C4-MATH-GEO-DR-02", desc: "Lire graphiquement coefficient directeur et ordonnée à l'origine", diff: 3, level: "3ème" },
];
const SKILL_DIFF_COLORS = ["", "bg-green-100 text-green-700", "bg-blue-100 text-blue-700", "bg-yellow-100 text-yellow-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"];

function SkillPickerDemo() {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [highlighted, setHighlighted] = useState(-1);

    const filtered = FAKE_SKILLS.filter(s => !query || s.desc.toLowerCase().includes(query.toLowerCase()) || s.id.toLowerCase().includes(query.toLowerCase()));

    // Animation : ouvre → highlights → sélectionne 2 compétences → ferme → loop
    useEffect(() => {
        const t1 = setTimeout(() => setOpen(true), 700);
        const t2 = setTimeout(() => setHighlighted(0), 1300);
        const t3 = setTimeout(() => { setSelected(["C4-MATH-ALG-FA-01"]); setHighlighted(1); }, 2000);
        const t4 = setTimeout(() => { setSelected(["C4-MATH-ALG-FA-01", "C4-MATH-GEO-DR-01"]); setHighlighted(-1); }, 2700);
        const t5 = setTimeout(() => setOpen(false), 3400);
        const t6 = setTimeout(() => { setSelected([]); setOpen(false); }, 5000);
        return () => [t1, t2, t3, t4, t5, t6].forEach(clearTimeout);
    }, []);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-orange-500" />
                <SimLabel>Compétences du programme (optionnel)</SimLabel>
            </div>

            {/* Tags sélectionnés */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selected.map(id => {
                        const sk = FAKE_SKILLS.find(s => s.id === id);
                        return (
                            <motion.span key={id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-xs"
                            >
                                <Target className="w-3 h-3" />
                                <span className="max-w-[180px] truncate">{sk?.desc || id}</span>
                                <button onClick={() => setSelected(s => s.filter(i => i !== id))} className="ml-0.5 hover:text-orange-900">
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </motion.span>
                        );
                    })}
                </div>
            )}

            {/* Search input — réplique exacte SkillPicker */}
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder="Rechercher une compétence (ex: équation, fraction…)"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none transition-all ${open ? "border-orange-400 ring-2 ring-orange-500/20" : "border-gray-200"}`}
                />
            </div>

            {/* Dropdown — réplique exacte */}
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="border border-gray-200 rounded-lg shadow-lg bg-white overflow-hidden max-h-52 overflow-y-auto"
                    >
                        {/* Groupe thème */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0">
                            <ChevronDown className="w-3 h-3" /> Algèbre et fonctions
                        </div>
                        <div className="px-5 py-1 text-xs text-gray-400 font-medium">Fonctions affines</div>
                        {filtered.slice(0, 4).map((sk, i) => {
                            const isSel = selected.includes(sk.id);
                            return (
                                <motion.div key={sk.id} animate={i === highlighted ? { backgroundColor: "#fff7ed" } : {}}
                                    onClick={() => setSelected(s => isSel ? s.filter(x => x !== sk.id) : [...s, sk.id])}
                                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer text-sm hover:bg-orange-50 transition-colors ${isSel ? "bg-orange-50 text-orange-700" : "text-gray-700"}`}
                                >
                                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold shrink-0 ${SKILL_DIFF_COLORS[sk.diff]}`}>{sk.diff}</span>
                                    <span className="flex-1 text-xs truncate">{sk.desc}</span>
                                    <span className="text-[10px] text-gray-400 shrink-0">C4 · {sk.level}</span>
                                    {isSel && <span className="w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs shrink-0">✓</span>}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── DEMO 16 : Progression des compétences + SRS ──────────────────────────────

const SRS_INTERVALS = [1, 3, 7, 14, 30, 60];
const STATUS_CONFIG = [
    { status: "not_started", label: "Non commencée", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", desc: "Aucune tentative enregistrée" },
    { status: "in_progress", label: "En cours",       color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400", desc: "Score entre 40% et 79%, ou moins de 2 révisions" },
    { status: "failed",      label: "Échouée",        color: "bg-red-100 text-red-700 border-red-200",       dot: "bg-red-500",   desc: "Dernier score < 40%" },
    { status: "mastered",    label: "Maîtrisée ✓",    color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", desc: "Score ≥ 80% + au moins 2 révisions" },
];

function CompetencyProgressDemo() {
    const [activeStatus, setActiveStatus] = useState(0);
    const [srsLevel, setSrsLevel] = useState(0);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const sequence = [
            { s: 0, sc: 0, sr: 0, delay: 0 },
            { s: 1, sc: 65, sr: 1, delay: 1000 },
            { s: 2, sc: 30, sr: 1, delay: 2500 },
            { s: 1, sc: 72, sr: 2, delay: 4000 },
            { s: 3, sc: 88, sr: 3, delay: 5500 },
        ];
        const timers = sequence.map(({ s, sc, sr, delay }) =>
            setTimeout(() => { setActiveStatus(s); setScore(sc); setSrsLevel(sr); }, delay)
        );
        const reset = setTimeout(() => { setActiveStatus(0); setScore(0); setSrsLevel(0); }, 7500);
        return () => { timers.forEach(clearTimeout); clearTimeout(reset); };
    }, [activeStatus === 0 && score === 0 ? "reset" : "running"]);

    const cfg = STATUS_CONFIG[activeStatus];

    return (
        <div className="space-y-4">
            {/* Score + statut actuel */}
            <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl border-2 p-3 transition-all duration-500 ${cfg.color}`}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-70">Statut</div>
                    <motion.div key={activeStatus} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-bold">{cfg.label}</motion.div>
                    <p className="text-[10px] mt-1 opacity-70 leading-tight">{cfg.desc}</p>
                </div>
                <div className="rounded-xl border-2 border-gray-200 bg-white p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Dernier score</div>
                    <div className={`text-2xl font-bold ${score >= 80 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : score > 0 ? "text-red-500" : "text-gray-400"}`}>
                        {score}%
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <motion.div animate={{ width: `${score}%` }} transition={{ duration: 0.5 }} className={`h-full rounded-full ${score >= 80 ? "bg-emerald-400" : score >= 40 ? "bg-amber-400" : "bg-red-400"}`} />
                    </div>
                </div>
            </div>

            {/* 4 statuts */}
            <div className="grid grid-cols-2 gap-1.5">
                {STATUS_CONFIG.map((s, i) => (
                    <div key={s.status} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all ${i === activeStatus ? s.color + " border-current shadow-sm scale-105" : "border-gray-200 bg-gray-50"}`}>
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${i === activeStatus ? s.dot : "bg-gray-300"}`} />
                        <span className={`text-xs font-medium ${i === activeStatus ? "" : "text-gray-400"}`}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* SRS - répétition espacée */}
            <div className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-1.5 mb-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-semibold text-gray-700">Répétition espacée (niveau {srsLevel}/5)</span>
                </div>
                <div className="flex gap-1">
                    {SRS_INTERVALS.map((days, i) => (
                        <div key={i} className={`flex-1 text-center rounded-md py-1.5 text-[10px] font-medium transition-all ${i === srsLevel ? "bg-indigo-500 text-white shadow-sm" : i < srsLevel ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-400"}`}>
                            <div>{days}j</div>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">Prochaine révision dans {SRS_INTERVALS[Math.min(srsLevel, 5)] } jour{SRS_INTERVALS[Math.min(srsLevel, 5)] > 1 ? "s" : ""}</p>
            </div>
        </div>
    );
}

// ─── Données des tracks ────────────────────────────────────────────────────────

interface TStep { icon: React.ReactNode; title: string; desc: string; tip?: string; cta?: { label: string; href: string }; demo: React.ReactNode; }
interface TTrack { id: string; label: string; short: string; icon: React.ReactNode; bg: string; dot: string; ring: string; color: string; steps: TStep[]; }

const TRACKS: TTrack[] = [
    {
        id: "cours", label: "Créer un cours", short: "Cours",
        icon: <BookOpen className="w-4 h-4" />,
        bg: "bg-indigo-500", dot: "bg-indigo-500", ring: "ring-indigo-300", color: "text-indigo-600",
        steps: [
            {
                icon: <BookOpen className="w-9 h-9 text-indigo-500" />,
                title: "Renseigner titre, matière et niveau",
                desc: "Dans le menu Cours → Créer un cours, remplissez les trois champs obligatoires. Le formulaire utilise une liste déroulante pour la matière et le niveau — voyez l'animation ci-dessous.",
                tip: "Un titre précis aide les élèves à trouver votre cours : préférez « Chapitre 3 — Les proportionnalités » à juste « Maths ».",
                cta: { label: "Créer un cours", href: "/dashboard/cours/nouveau" },
                demo: <CourseFormDemo />,
            },
            {
                icon: <BookOpen className="w-9 h-9 text-indigo-500" />,
                title: "Ajouter et réordonner les sections",
                desc: "Les sections correspondent aux chapitres de votre cours. Ajoutez-en avec le bouton « + Ajouter une section ». Glissez-déposez la poignée (≡) pour les réordonner — le système utilise dnd-kit, le même que dans le dashboard.",
                tip: "Visez 3 à 5 sections. Chaque section aura ensuite ses propres leçons, exercices et quiz.",
                demo: <SectionsDndDemo />,
            },
        ],
    },
    {
        id: "lecons", label: "Créer une leçon", short: "Leçons",
        icon: <FileText className="w-4 h-4" />,
        bg: "bg-violet-500", dot: "bg-violet-500", ring: "ring-violet-300", color: "text-violet-600",
        steps: [
            {
                icon: <FileText className="w-9 h-9 text-violet-500" />,
                title: "Choisir le cours puis la section",
                desc: "Dans Leçons → Nouvelle leçon, deux listes déroulantes apparaissent en cascade : sélectionnez d'abord le cours, puis la section dans laquelle insérer la leçon. Une leçon sans section ne sera pas visible.",
                tip: "Vous pouvez aussi créer une leçon directement depuis la page de gestion du cours.",
                cta: { label: "Gérer les leçons", href: "/dashboard/lessons" },
                demo: <LessonSelectDemo />,
            },
            {
                icon: <FileText className="w-9 h-9 text-violet-500" />,
                title: "Rédiger avec l'éditeur riche (TipTap)",
                desc: "L'éditeur ressemble à un traitement de texte moderne. La barre d'outils propose gras, italique, listes, liens, code… Mais surtout les boutons de blocs pédagogiques (📘 Définition, ⚡ Propriété, ✏️ Exemple…). Voyez comment ils s'insèrent dans la démo.",
                tip: "Cliquez sur l'emoji du bloc dans la toolbar — un bloc coloré s'insère immédiatement à la position du curseur.",
                demo: <EditorDemo />,
            },
            {
                icon: <FileText className="w-9 h-9 text-violet-500" />,
                title: "Insérer des formules LaTeX",
                desc: "Pour les mathématiques et sciences, entourez vos formules de $ pour inline ($f(x) = 2x$) ou $$ pour un bloc centré ($$\\int_0^1 ...$$). L'éditeur les convertit en rendu mathématique propre dès que vous quittez le champ.",
                tip: "La formule $a^2 + b^2 = c^2$ s'affiche automatiquement en LaTeX rendu. Pas besoin de connaître tout LaTeX — copiez les formules courantes.",
                demo: <LatexDemo />,
            },
            {
                icon: <FileText className="w-9 h-9 text-violet-500" />,
                title: "Sauvegarder et soumettre pour correction",
                desc: "Cliquez sur Sauvegarder. La leçon passe en statut « En attente de correction ». Un correcteur la relit et la valide — elle passe alors en « Validée » et est visible dans le cours publié.",
                tip: "Vous pouvez modifier une leçon même après soumission. Le statut repasse automatiquement à « En attente ».",
                demo: <LessonStatusDemo />,
            },
        ],
    },
    {
        id: "exercice", label: "Créer un exercice", short: "Exercice",
        icon: <FileText className="w-4 h-4" />,
        bg: "bg-orange-500", dot: "bg-orange-500", ring: "ring-orange-300", color: "text-orange-600",
        steps: [
            {
                icon: <FileText className="w-9 h-9 text-orange-500" />,
                title: "Choisir cours, section et titre",
                desc: "Dans Exercices → Nouvel exercice, deux listes déroulantes en cascade permettent de choisir le cours puis la section. La recherche est intégrée dans le sélecteur de cours : tapez quelques lettres pour filtrer.",
                tip: "Un exercice sans section ne sera jamais visible dans le cours — c'est le lien obligatoire.",
                cta: { label: "Gérer les exercices", href: "/dashboard/exercises" },
                demo: <LessonSelectDemo />,
            },
            {
                icon: <FileText className="w-9 h-9 text-orange-500" />,
                title: "Rédiger l'énoncé avec MDEditor",
                desc: "L'éditeur d'exercice est un MDEditor (Markdown + LaTeX). La barre d'outils offre titres, gras/italique, listes, liens, images et code. Basculez entre l'onglet Éditer et l'onglet Aperçu pour voir le rendu final.",
                tip: "Utilisez $formule$ pour les formules inline et $$formule$$ pour les blocs centrés — ils sont rendus en LaTeX dans l'aperçu.",
                demo: <ExerciceEnoncéDemo />,
            },
            {
                icon: <FileText className="w-9 h-9 text-orange-500" />,
                title: "Choisir la difficulté parmi 7 niveaux",
                desc: "Sélectionnez le niveau de difficulté parmi : Facile 1, Facile 2, Moyen 1, Moyen 2, Difficile 1, Difficile 2 ou Élite. Ce badge est visible par les élèves pour qu'ils calibrent leur effort.",
                tip: "Facile 1/2 = application directe du cours. Moyen = combinaison de notions. Difficile = raisonnement. Élite = hors programme ou très complexe.",
                demo: <ExerciceDifficultyDemo />,
            },
            {
                icon: <FileText className="w-9 h-9 text-orange-500" />,
                title: "Ajouter une image et rédiger la correction",
                desc: "Vous pouvez ajouter une image à l'énoncé (schéma, graphique, photo) via Uploadthing. Rédigez ensuite la correction complète : elle est révélée à l'élève uniquement après soumission. Vous pouvez aussi ajouter une image de correction.",
                tip: "La correction doit être auto-suffisante : l'élève la lit seul. Expliquez le raisonnement étape par étape.",
                demo: <ExerciceCorrectionDemo />,
            },
        ],
    },
    {
        id: "quiz", label: "Créer un quiz", short: "Quiz",
        icon: <Trophy className="w-4 h-4" />,
        bg: "bg-amber-500", dot: "bg-amber-500", ring: "ring-amber-300", color: "text-amber-600",
        steps: [
            {
                icon: <Trophy className="w-9 h-9 text-amber-500" />,
                title: "Créer le quiz, titre et section",
                desc: "Dans Quiz → Nouveau quiz, donnez un titre (ex. « Quiz — Les fonctions affines »), choisissez le cours et la section dans les listes déroulantes. Ajoutez une description courte optionnelle.",
                cta: { label: "Gérer les quiz", href: "/dashboard/quizzes" },
                demo: <CourseFormDemo />,
            },
            {
                icon: <Trophy className="w-9 h-9 text-amber-500" />,
                title: "Choisir le type parmi 8 formats de questions",
                desc: "Cliquez « + Question » puis sélectionnez le type dans la grille de 8 boutons colorés. Chaque type s'adapte à un usage pédagogique précis : mémorisation, compréhension, application, analyse.",
                tip: "Bonne pratique : Vrai/Faux pour vérifier la compréhension basique → QCM pour les concepts → Texte à trous pour les définitions → Classement pour les processus.",
                demo: <QuizTypeDemo />,
            },
            {
                icon: <Trophy className="w-9 h-9 text-amber-500" />,
                title: "QCM : rédiger les options et marquer la bonne réponse",
                desc: "Pour un QCM, tapez l'énoncé, ajoutez 3 à 5 options avec « + Option », puis cliquez le cercle à gauche de la bonne réponse — il devient vert. Pour QCM multiple, plusieurs cercles peuvent être sélectionnés.",
                tip: "Rédigez des distracteurs plausibles : les mauvaises réponses doivent être des erreurs courantes, pas des absurdités.",
                demo: <QuizQCMDemo />,
            },
            {
                icon: <Trophy className="w-9 h-9 text-amber-500" />,
                title: "Texte à trous, Classement et Glisser-déposer",
                desc: "Texte à trous : écrivez le texte avec {{blank}} pour chaque trou, puis renseignez la réponse attendue de chaque trou. Classement : listez les éléments dans le bon ordre — le système les mélangera. Glisser-déposer : créez des paires terme ↔ définition.",
                tip: "Le Glisser-déposer est parfait pour les associations (organite ↔ fonction, pays ↔ capitale, formule ↔ nom).",
                demo: <QuizOtherTypesDemo />,
            },
            {
                icon: <Trophy className="w-9 h-9 text-amber-500" />,
                title: "Configurer les points et l'explication par question",
                desc: "Chaque question a un nombre de points paramétrable et un champ Explication — affiché à l'élève après soumission. Ces explications sont la vraie valeur pédagogique du quiz : elles font comprendre pourquoi une réponse est juste.",
                tip: "Points suggérés : Vrai/Faux = 1pt, QCM = 2pts, Texte à trous = 2pts, Classement/Glisser = 3-4pts selon complexité.",
                demo: <QuizPointsExplanationDemo />,
            },
            {
                icon: <Trophy className="w-9 h-9 text-amber-500" />,
                title: "Lier aux compétences du programme officiel",
                desc: "Dans la section Compétences du formulaire, utilisez le SkillPicker pour rechercher et sélectionner des compétences du programme national (ex: C4-MATH-ALG-FA-01). Quand un élève obtient ≥ 80%, ces compétences passent automatiquement en « Maîtrisée ».",
                tip: "Vous pouvez lier plusieurs compétences par quiz. Le système de répétition espacée (SRS) planifiera automatiquement les prochaines révisions.",
                demo: <SkillPickerDemo />,
            },
            {
                icon: <Trophy className="w-9 h-9 text-amber-500" />,
                title: "Activer le bonus et le malus de temps",
                desc: "Deux toggles configurent le gamification temporelle. Le bonus de rapidité récompense les élèves qui finissent avant un temps cible. Le malus de lenteur pénalise les dépassements — avec un plafond configurable pour ne pas bloquer.",
                tip: "Pour les collégiens, préférez le bonus seul. Le malus combiné est plus adapté aux lycéens ou aux révisions de concours.",
                demo: <QuizTimerDemo />,
            },
        ],
    },
    {
        id: "competences", label: "Système de compétences", short: "Compétences",
        icon: <Target className="w-4 h-4" />,
        bg: "bg-emerald-600", dot: "bg-emerald-600", ring: "ring-emerald-300", color: "text-emerald-700",
        steps: [
            {
                icon: <Target className="w-9 h-9 text-emerald-600" />,
                title: "Qu'est-ce qu'une compétence ?",
                desc: "Une compétence est une unité d'apprentissage du programme officiel, identifiée par un code unique (ex: C4-MATH-ALG-FA-01). Elle décrit précisément ce qu'un élève doit savoir faire. Chaque quiz ou exercice peut valider une ou plusieurs compétences.",
                tip: "Les codes suivent le format : Cycle-Matière-Thème-Chapitre-Numéro. C4 = Cycle 4 (5ème-3ème), LY = Lycée.",
                demo: <SkillPickerDemo />,
            },
            {
                icon: <Target className="w-9 h-9 text-emerald-600" />,
                title: "Les 4 statuts de progression",
                desc: "Chaque compétence d'un élève a un statut : Non commencée (aucune tentative), En cours (score entre 40% et 79%), Échouée (dernier score < 40%), Maîtrisée (score ≥ 80% + au moins 2 révisions). Voyez l'animation montrant la progression.",
                tip: "Une compétence ne passe Maîtrisée qu'avec ≥ 80% ET ≥ 2 révisions. Cela évite la mémorisation à court terme.",
                demo: <CompetencyProgressDemo />,
            },
            {
                icon: <Target className="w-9 h-9 text-emerald-600" />,
                title: "La répétition espacée (SRS)",
                desc: "Le Spaced Repetition System planifie automatiquement les révisions. Après une bonne note, le niveau SRS monte (1→2→3…) et les intervalles s'allongent : 1j, 3j, 7j, 14j, 30j, 60j. L'élève reçoit des rappels au bon moment pour consolider la mémoire à long terme.",
                tip: "Ce système est basé sur la courbe de l'oubli d'Ebbinghaus. Réviser au bon moment est 3x plus efficace que réviser souvent au hasard.",
                demo: <CompetencyProgressDemo />,
            },
        ],
    },
];

// ─── Composant principal ───────────────────────────────────────────────────────

export interface TutorialModalProps { open: boolean; onClose: () => void; }

export default function TutorialModal({ open, onClose }: TutorialModalProps) {
    const [tIdx, setTIdx] = useState(0);
    const [sIdx, setSIdx] = useState(0);
    const [dir, setDir] = useState(1);

    const track = TRACKS[tIdx];
    const step = track.steps[sIdx];

    const goTo = (n: number) => { setDir(n > sIdx ? 1 : -1); setSIdx(n); };
    const switchTrack = (i: number) => { setTIdx(i); setSIdx(0); setDir(1); };

    useEffect(() => {
        if (!open) return;
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [open, onClose]);

    const variants = {
        enter: (d: number) => ({ x: d > 0 ? 28 : -28, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? -28 : 28, opacity: 0 }),
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

                    <motion.div key="m" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none"
                    >
                        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col" style={{ maxHeight: "94vh" }} onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                                <div className="flex gap-1 flex-wrap">
                                    {TRACKS.map((t, i) => (
                                        <button key={t.id} onClick={() => switchTrack(i)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${i === tIdx ? `${t.bg} text-white shadow-sm` : "text-gray-500 hover:bg-gray-100"}`}
                                        >
                                            {t.icon}<span className="hidden sm:inline">{t.short}</span>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors ml-2">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1 bg-gray-100 flex-shrink-0">
                                <motion.div className={track.bg} animate={{ width: `${((sIdx + 1) / track.steps.length) * 100}%` }} transition={{ duration: 0.4, ease: "easeOut" }} style={{ height: "100%" }} />
                            </div>

                            {/* Body */}
                            <div className="flex flex-1 min-h-0 overflow-hidden">
                                {/* Left nav */}
                                <div className="w-44 flex-shrink-0 hidden sm:flex flex-col border-r border-gray-100 bg-gray-50/60 py-4 px-2 gap-0.5 overflow-y-auto">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">{track.label}</p>
                                    {track.steps.map((s, i) => (
                                        <button key={i} onClick={() => goTo(i)}
                                            className={`flex items-start gap-2 px-2 py-2 rounded-lg text-left transition-all ${i === sIdx ? "bg-white shadow-sm" : "hover:bg-white/60"}`}
                                        >
                                            <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5 transition-all ${i < sIdx ? "bg-gray-300 text-white" : i === sIdx ? `${track.dot} text-white` : "bg-gray-200 text-gray-400"}`}>
                                                {i < sIdx ? "✓" : i + 1}
                                            </span>
                                            <span className={`text-[11px] leading-tight ${i === sIdx ? `${track.color} font-semibold` : i < sIdx ? "text-gray-400 line-through" : "text-gray-500"}`}>
                                                {s.title}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="flex-1 overflow-y-auto">
                                        <AnimatePresence mode="wait" custom={dir}>
                                            <motion.div key={`${tIdx}-${sIdx}`} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: "easeInOut" }} className="p-5 space-y-4">
                                                {/* Title */}
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${track.bg}/10`}>{step.icon}</div>
                                                    <div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{track.label} — Étape {sIdx + 1}</div>
                                                        <h2 className="text-base font-bold text-gray-900 leading-snug">{step.title}</h2>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>

                                                {/* Demo */}
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">{step.demo}</div>

                                                {/* Tip */}
                                                {step.tip && (
                                                    <div className="flex items-start gap-2.5 px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                                                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-xs text-amber-800 leading-relaxed">{step.tip}</p>
                                                    </div>
                                                )}

                                                {/* CTA */}
                                                {step.cta && (
                                                    <Link href={step.cta.href} onClick={onClose} className={`inline-flex items-center gap-2 px-4 py-2.5 ${track.bg} text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity`}>
                                                        {step.cta.label}<ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    {/* Footer nav */}
                                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-white flex-shrink-0">
                                        <button onClick={() => sIdx > 0 ? goTo(sIdx - 1) : tIdx > 0 && switchTrack(tIdx - 1)} disabled={sIdx === 0 && tIdx === 0}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Précédent
                                        </button>

                                        <div className="flex gap-1.5">
                                            {track.steps.map((_, i) => (
                                                <button key={i} onClick={() => goTo(i)} className={`rounded-full transition-all duration-200 ${i === sIdx ? `w-5 h-2 ${track.dot}` : i < sIdx ? `w-2 h-2 ${track.dot} opacity-40` : "w-2 h-2 bg-gray-200"}`} />
                                            ))}
                                        </div>

                                        {sIdx < track.steps.length - 1 ? (
                                            <button onClick={() => goTo(sIdx + 1)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white ${track.bg} rounded-xl hover:opacity-90 transition-opacity`}>
                                                Suivant <ChevronRight className="w-4 h-4" />
                                            </button>
                                        ) : tIdx < TRACKS.length - 1 ? (
                                            <button onClick={() => switchTrack(tIdx + 1)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors">
                                                {TRACKS[tIdx + 1].short} <ChevronRight className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button onClick={onClose} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors">
                                                <CheckCircle className="w-4 h-4" /> Terminé !
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
