"use client";

import { motion } from "framer-motion";
import {
    Printer,
    PencilLine,
    Camera,
    UploadCloud,
    BookOpen,
    ListChecks,
    CheckCircle2,
    Clock,
    ArrowRight,
    AlertTriangle,
} from "lucide-react";
import Mascot from "@/components/ui/Mascot";

interface Step {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    desc: string;
    tint: string;
}

interface EvaluationIntroProps {
    evaluation: any;
    timeLeftMs: number;
    onStart: () => void;
}

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
};

export default function EvaluationIntro({ evaluation, timeLeftMs, onStart }: EvaluationIntroProps) {
    const isPdf = evaluation.type === "pdf";
    const totalMin = Math.max(1, Math.round(timeLeftMs / 60000));

    // Budget conseillé : ~15% impression, ~20% dépôt, le reste pour composer.
    const printBudget = isPdf ? Math.max(2, Math.round(totalMin * 0.15)) : 0;
    const scanBudget = Math.max(3, Math.round(totalMin * 0.2));

    const steps: Step[] = isPdf
        ? [
              { icon: Printer, title: "Imprime ou ouvre le sujet", desc: `Prévois ~${printBudget} min pour imprimer (ou lis-le à l'écran).`, tint: "#6366f1" },
              { icon: PencilLine, title: "Compose sur ta feuille", desc: "Rédige tes réponses au propre, dans le temps imparti.", tint: "#f97316" },
              { icon: Camera, title: "Scanne / photographie tes copies", desc: "Une photo nette par page (JPEG, PNG ou PDF).", tint: "#ec4899" },
              { icon: UploadCloud, title: "Dépose tes copies ici", desc: `Garde ~${scanBudget} min à la fin pour scanner et déposer avant 0:00.`, tint: "#10b981" },
          ]
        : [
              { icon: BookOpen, title: "Lis chaque question", desc: "Prends le temps de bien comprendre l'énoncé.", tint: "#6366f1" },
              { icon: ListChecks, title: "Réponds dans le formulaire", desc: "Remplis toutes les réponses directement sur le site.", tint: "#f97316" },
              { icon: Camera, title: "Ajoute tes brouillons (option)", desc: "Tu peux joindre des photos de tes calculs.", tint: "#ec4899" },
              { icon: CheckCircle2, title: "Valide avant la fin du chrono", desc: `Garde ~${scanBudget} min pour relire et valider avant 0:00.`, tint: "#10b981" },
          ];

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white shadow-[0_20px_60px_rgba(26,21,18,0.12)] overflow-hidden"
            >
                {/* Bandeau dégradé animé */}
                <motion.div
                    variants={item}
                    className="relative px-6 py-7 text-white bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-[length:200%_100%]"
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                >
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Évaluation chronométrée</p>
                    <h1 className="mt-1 text-2xl font-bold leading-tight">{evaluation.title}</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                            <Clock className="w-4 h-4" /> {totalMin} min au total
                        </span>
                        {typeof evaluation.rewardPoints === "number" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                                ⭐ {evaluation.rewardPoints} pts
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Étapes */}
                <div className="px-6 py-6 space-y-3">
                    {/* Foxy accueille l'élève */}
                    <motion.div variants={item}>
                        <Mascot
                            name="foxy"
                            emotion="joyeux"
                            message={isPdf
                                ? "Salut, c'est Foxy ! Imprime ou lis le sujet, prends ton temps, et n'oublie pas de déposer ta copie avant la fin ⏳"
                                : "Salut, c'est Foxy ! Lis bien chaque question et réponds à ton rythme — je crois en toi ! 💪"}
                        />
                    </motion.div>

                    <motion.p variants={item} className="text-sm font-semibold text-[#37352f]">
                        Comment ça se passe&nbsp;:
                    </motion.p>

                    {steps.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <motion.div key={i} variants={item} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5">
                                <motion.div
                                    className="shrink-0 grid place-items-center w-11 h-11 rounded-xl text-white"
                                    style={{ backgroundColor: s.tint }}
                                    animate={{ scale: [1, 1.08, 1] }}
                                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                                >
                                    <Icon className="w-5 h-5" />
                                </motion.div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[#37352f]">
                                        <span className="text-gray-400 mr-1.5">{i + 1}.</span>
                                        {s.title}
                                    </p>
                                    <p className="text-xs text-[#6b6b6b] mt-0.5">{s.desc}</p>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Avertissement chrono */}
                    <motion.div variants={item} className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <strong>Le chrono tourne déjà</strong> depuis le tirage et ne se met pas en pause.
                            {isPdf && <> Pense à garder du temps à la fin pour <strong>scanner et déposer</strong> tes copies&nbsp;:</>}
                            {isPdf && <> un dépôt après <strong>0:00</strong> n&apos;est pas accepté (note 0/20).</>}
                            {!isPdf && <> Valide ton formulaire avant <strong>0:00</strong>, sinon la note est de 0/20.</>}
                        </p>
                    </motion.div>
                </div>

                {/* CTA */}
                <motion.div variants={item} className="px-6 pb-6">
                    <button
                        onClick={onStart}
                        className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1a1512] px-5 py-3.5 text-base font-semibold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        J&apos;ai compris, je commence
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="mt-2 text-center text-[11px] text-gray-400">
                        En continuant, tu accèdes au sujet&nbsp;; le temps restant s&apos;affiche en haut de l&apos;écran.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
