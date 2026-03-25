"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HelpCircle, MessageCircle, ChevronRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import TimeAgo from "@/components/ui/TimeAgo";
import ContextualQuestionModal from "./ContextualQuestionModal";
import { buildIdSlug } from "@/utils/slugify";

interface QuestionPreview {
    _id: string;
    title: string;
    user: { username: string };
    status: string;
    answerCount: number;
    createdAt: string;
    points: number;
}

interface LessonQASectionProps {
    lessonId: string;
    lessonTitle: string;
    courseId: string;
    sectionId: string;
}

export default function LessonQASection({
    lessonId,
    lessonTitle,
    courseId,
    sectionId,
}: LessonQASectionProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [questions, setQuestions] = useState<QuestionPreview[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch(
                    `/api/forum/questions/by-context?type=lesson&id=${lessonId}&limit=3`
                );
                const data = await res.json();
                if (data.success) {
                    setQuestions(data.data);
                    setTotal(data.pagination.totalQuestions);
                }
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [lessonId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Résolue":
                return "bg-green-100 text-green-700";
            case "Validée":
                return "bg-blue-100 text-blue-700";
            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };

    return (
        <>
            <div className="mt-12 pt-8 border-t border-[#e3e2e0]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <HelpCircle className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[#37352f]">
                                Questions & Aide
                            </h3>
                            <p className="text-sm text-[#9ca3af]">
                                {total > 0
                                    ? `${total} question${total > 1 ? "s" : ""} sur cette leçon`
                                    : "Aucune question pour le moment"}
                            </p>
                        </div>
                    </div>
                    {session?.user && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Poser une question</span>
                            <span className="sm:hidden">Question</span>
                        </button>
                    )}
                </div>

                {/* Questions list */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                            <div
                                key={i}
                                className="h-20 bg-[#f7f6f3] rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : questions.length > 0 ? (
                    <div className="space-y-3">
                        {questions.map((q, index) => (
                            <motion.div
                                key={q._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() =>
                                    router.push(`/forum/${buildIdSlug(q._id, q.title)}`)
                                }
                                className="group flex items-center gap-4 p-4 bg-[#f7f6f3] hover:bg-[#efeeeb] rounded-xl cursor-pointer transition-colors"
                            >
                                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                    <MessageCircle className="w-4 h-4 text-purple-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#37352f] truncate group-hover:text-purple-700 transition-colors">
                                        {q.title}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-[#9ca3af]">
                                        <span>{q.user.username}</span>
                                        <span>
                                            <TimeAgo date={q.createdAt} />
                                        </span>
                                        <span>{q.answerCount} réponse{q.answerCount !== 1 ? "s" : ""}</span>
                                    </div>
                                </div>
                                <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(q.status)}`}
                                >
                                    {q.status}
                                </span>
                                <ChevronRight className="w-4 h-4 text-[#bfbfbf] group-hover:text-purple-500 transition-colors" />
                            </motion.div>
                        ))}

                        {total > 3 && (
                            <button
                                onClick={() =>
                                    router.push(
                                        `/forum?contextType=lesson&contextId=${lessonId}`
                                    )
                                }
                                className="w-full py-3 text-sm text-purple-600 hover:text-purple-700 font-medium hover:bg-purple-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                Voir toutes les questions ({total})
                                <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-[#f7f6f3] rounded-xl">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3">
                            <MessageCircle className="w-6 h-6 text-[#9ca3af]" />
                        </div>
                        <p className="text-sm text-[#6b6b6b] mb-1">
                            Aucune question sur cette leçon
                        </p>
                        <p className="text-xs text-[#9ca3af]">
                            Soyez le premier à poser une question !
                        </p>
                    </div>
                )}

                {/* CTA for non-logged users */}
                {!session?.user && (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-xl text-center">
                        <p className="text-sm text-purple-700">
                            Connectez-vous pour poser une question sur cette leçon
                        </p>
                    </div>
                )}
            </div>

            <ContextualQuestionModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                contextType="lesson"
                contextId={lessonId}
                contextTitle={lessonTitle}
            />
        </>
    );
}
