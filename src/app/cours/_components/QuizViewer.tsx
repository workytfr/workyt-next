'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
    CheckCircle, XCircle, Trophy, Clock, ArrowLeft, ArrowRight,
    ChevronLeft, AlertCircle, Lightbulb, Send, ArrowUp, ArrowDown,
    GripVertical, Code2, SlidersHorizontal, Link2, Award, ChevronDown, ChevronUp
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

import { Quiz as SharedQuiz, QuizQuestion, QuizCompletionResult, QuizDetailedAnswer } from './types';

interface QuizViewerQuiz extends SharedQuiz {
    questions: QuizQuestion[];
    competencies?: string[];
}

interface CompetencyInfo {
    skillId: string;
    description: string;
    difficulty: number;
    status: "not_started" | "in_progress" | "failed" | "mastered";
    nextReview?: string;
}

interface QuizViewerProps {
    quiz: QuizViewerQuiz;
    onClose: () => void;
    onComplete: (result: QuizCompletionResult) => void;
    isCompleted?: boolean;
}

interface DetailedResults {
    score: number;
    maxScore: number;
    percentage: number;
    answers: QuizDetailedAnswer[];
    timeModifier?: number;
    timeModifierLabel?: string;
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

// --- Classement (Ordering) ---
function shuffleArray(arr: number[], seed: number): number[] {
    const shuffled = [...arr];
    // Fisher-Yates with simple seed-based pseudo-random
    let s = seed;
    for (let i = shuffled.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0x7fffffff;
        const j = s % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Avoid returning the already-correct order
    const isIdentity = shuffled.every((v, idx) => v === idx);
    if (isIdentity && shuffled.length > 1) {
        [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    return shuffled;
}

function ClassementInput({ items, value, onChange, renderLatex }: {
    items: string[];
    value: any;
    onChange: (v: number[]) => void;
    renderLatex: (text: string) => React.ReactNode;
}) {
    // Initialize with a shuffled order so the user must reorder
    const initialOrder = useMemo(() => {
        if (Array.isArray(value)) return value;
        const indices = items.map((_, i) => i);
        return shuffleArray(indices, items.length * 7 + 31);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const order: number[] = Array.isArray(value) ? value : initialOrder;

    // Set the shuffled order as the initial answer
    useEffect(() => {
        if (!Array.isArray(value)) {
            onChange(initialOrder);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const moveItem = (fromIdx: number, toIdx: number) => {
        if (toIdx < 0 || toIdx >= order.length) return;
        const newOrder = [...order];
        const [moved] = newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, moved);
        onChange(newOrder);
    };

    return (
        <div className="space-y-2">
            <p className="text-xs text-[#9ca3af] mb-3">Utilisez les flèches pour réorganiser les éléments dans le bon ordre.</p>
            {order.map((itemIndex, posIndex) => (
                <div
                    key={`${itemIndex}-${posIndex}`}
                    className="flex items-center gap-2 p-3 rounded-xl border-2 border-[#e3e2e0] bg-white"
                >
                    <GripVertical className="w-4 h-4 text-[#b4b4b0] flex-shrink-0" />
                    <span className="w-6 h-6 rounded-full bg-[#f7f6f3] flex items-center justify-center text-xs font-medium text-[#6b6b6b] flex-shrink-0">
                        {posIndex + 1}
                    </span>
                    <span className="flex-1 text-sm sm:text-base text-[#37352f]">
                        {renderLatex(items[itemIndex])}
                    </span>
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => moveItem(posIndex, posIndex - 1)}
                            disabled={posIndex === 0}
                            className="p-1 rounded hover:bg-[#f7f6f3] disabled:opacity-30 transition-colors"
                        >
                            <ArrowUp className="w-3.5 h-3.5 text-[#6b6b6b]" />
                        </button>
                        <button
                            type="button"
                            onClick={() => moveItem(posIndex, posIndex + 1)}
                            disabled={posIndex === order.length - 1}
                            className="p-1 rounded hover:bg-[#f7f6f3] disabled:opacity-30 transition-colors"
                        >
                            <ArrowDown className="w-3.5 h-3.5 text-[#6b6b6b]" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Glisser-déposer (Matching) ---
function MatchingInput({ question, value, onChange, renderLatex }: {
    question: QuizQuestion;
    value: any;
    onChange: (v: string[]) => void;
    renderLatex: (text: string) => React.ReactNode;
}) {
    // answers = left items, we need right items from the GET response
    // Right items are extracted from answers: first half = left, second half = right
    const leftItems = question.answers.slice(0, Math.ceil(question.answers.length / 2));
    const rightItems = question.answers.slice(Math.ceil(question.answers.length / 2));
    const selections: string[] = Array.isArray(value) ? value : new Array(leftItems.length).fill('');

    const handleSelect = (leftIdx: number, rightValue: string) => {
        const newSelections = [...selections];
        newSelections[leftIdx] = rightValue;
        onChange(newSelections);
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-[#9ca3af] mb-3 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                Associez chaque élément de gauche à son correspondant de droite.
            </p>
            {leftItems.map((leftItem, leftIdx) => (
                <div key={leftIdx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl border-2 border-[#e3e2e0] bg-white">
                    <div className="flex-1 text-sm sm:text-base text-[#37352f] font-medium">
                        {renderLatex(leftItem)}
                    </div>
                    <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-[#b4b4b0] hidden sm:block flex-shrink-0" />
                        <select
                            value={selections[leftIdx] || ''}
                            onChange={(e) => handleSelect(leftIdx, e.target.value)}
                            className={`w-full sm:w-48 p-2.5 rounded-lg border-2 text-sm transition-colors ${
                                selections[leftIdx]
                                    ? 'border-[#f97316] bg-[#fff7ed] text-[#37352f]'
                                    : 'border-[#e3e2e0] bg-[#fafaf9] text-[#6b6b6b]'
                            }`}
                        >
                            <option value="">Choisir...</option>
                            {rightItems.map((rightItem, rightIdx) => (
                                <option key={rightIdx} value={rightItem}>
                                    {rightItem}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Slider (Estimation) ---
function SliderInput({ question, value, onChange }: {
    question: QuizQuestion;
    value: any;
    onChange: (v: number) => void;
}) {
    // answers[0]=min, answers[1]=max, answers[2]=step, answers[3]=unit, answers[4]=tolerance
    const min = parseFloat(question.answers[0] || '0');
    const max = parseFloat(question.answers[1] || '100');
    const step = parseFloat(question.answers[2] || '1');
    const unit = question.answers[3] || '';
    const tolerance = question.answers[4] ? parseFloat(question.answers[4]) : 0;
    const currentValue = value !== undefined ? parseFloat(String(value)) : (min + max) / 2;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <SlidersHorizontal className="w-4 h-4 text-[#9ca3af]" />
                <span className="text-xs text-[#9ca3af]">
                    Ajustez le curseur pour donner votre estimation
                    {tolerance > 0 && ` (tolérance : ±${tolerance}${unit})`}
                </span>
            </div>
            <div className="bg-white border-2 border-[#e3e2e0] rounded-xl p-5">
                <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-[#f97316]">
                        {currentValue}
                    </span>
                    {unit && <span className="text-lg text-[#6b6b6b] ml-1">{unit}</span>}
                </div>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#e3e2e0] rounded-lg appearance-none cursor-pointer accent-[#f97316]"
                />
                <div className="flex justify-between text-xs text-[#9ca3af] mt-2">
                    <span>{min}{unit}</span>
                    <span>{max}{unit}</span>
                </div>
            </div>
        </div>
    );
}

// --- Texte à trous (Fill in the blanks) ---
function FillBlanksInput({ question, value, onChange }: {
    question: QuizQuestion;
    value: any;
    onChange: (v: string | string[]) => void;
}) {
    const template = question.answers[0] || '';
    const blanks = template.match(/\{\{blank\}\}/g) || [];
    const blankCount = blanks.length;
    const parts = template.split('{{blank}}');

    if (blankCount > 1) {
        const currentValues: string[] = Array.isArray(value) ? value : new Array(blankCount).fill('');

        const handleBlankChange = (idx: number, val: string) => {
            const newValues = [...currentValues];
            newValues[idx] = val;
            onChange(newValues);
        };

        return (
            <div className="space-y-3">
                <p className="text-xs text-[#9ca3af] mb-2">Complétez les trous dans le texte ci-dessous.</p>
                <div className="bg-white border-2 border-[#e3e2e0] rounded-xl p-4">
                    <p className="text-sm sm:text-base text-[#37352f] leading-relaxed whitespace-pre-wrap">
                        {parts.map((part, idx) => (
                            <span key={idx}>
                                <span>{part}</span>
                                {idx < blankCount && (
                                    <input
                                        type="text"
                                        value={currentValues[idx] || ''}
                                        onChange={(e) => handleBlankChange(idx, e.target.value)}
                                        placeholder={`trou ${idx + 1}`}
                                        className="inline-block bg-[#fafaf9] border-2 border-[#f97316] rounded-lg px-2 py-0.5 text-[#37352f] text-sm min-w-[80px] focus:outline-none focus:ring-1 focus:ring-[#f97316] placeholder-[#b4b4b0] mx-1"
                                        style={{ width: `${Math.max(80, (currentValues[idx] || '').length * 9 + 20)}px` }}
                                    />
                                )}
                            </span>
                        ))}
                    </p>
                </div>
            </div>
        );
    }

    // Single blank
    const currentValue = typeof value === 'string' ? value : (Array.isArray(value) ? value[0] || '' : '');

    return (
        <div className="space-y-3">
            <p className="text-xs text-[#9ca3af] mb-2">Complétez le trou dans le texte ci-dessous.</p>
            <div className="bg-white border-2 border-[#e3e2e0] rounded-xl p-4">
                <p className="text-sm sm:text-base text-[#37352f] leading-relaxed whitespace-pre-wrap">
                    {parts.map((part, idx) => (
                        <span key={idx}>
                            <span>{part}</span>
                            {idx === 0 && blankCount === 1 && (
                                <input
                                    type="text"
                                    value={currentValue}
                                    onChange={(e) => onChange(e.target.value)}
                                    placeholder="votre réponse"
                                    className="inline-block bg-[#fafaf9] border-2 border-[#f97316] rounded-lg px-2 py-0.5 text-[#37352f] text-sm min-w-[100px] focus:outline-none focus:ring-1 focus:ring-[#f97316] placeholder-[#b4b4b0] mx-1"
                                    style={{ width: `${Math.max(100, currentValue.length * 9 + 20)}px` }}
                                />
                            )}
                        </span>
                    ))}
                </p>
            </div>
        </div>
    );
}

// --- Code (Complete code) ---
function CodeInput({ question, value, onChange }: {
    question: QuizQuestion;
    value: any;
    onChange: (v: string | string[]) => void;
}) {
    // answers[0] = language, answers[1] = code template with {{blank}} markers
    const language = question.answers[0] || 'text';
    const template = question.answers[1] || '';
    const blanks = template.match(/\{\{blank\}\}/g) || [];
    const blankCount = blanks.length;

    if (blankCount > 1) {
        // Multiple blanks
        const currentValues: string[] = Array.isArray(value) ? value : new Array(blankCount).fill('');
        const parts = template.split('{{blank}}');

        const handleBlankChange = (idx: number, val: string) => {
            const newValues = [...currentValues];
            newValues[idx] = val;
            onChange(newValues);
        };

        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-4 h-4 text-[#9ca3af]" />
                    <span className="text-xs text-[#9ca3af]">
                        Complétez le code ({language})
                    </span>
                </div>
                <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto">
                    <pre className="text-sm font-mono text-[#d4d4d4] whitespace-pre-wrap">
                        {parts.map((part, idx) => (
                            <span key={idx}>
                                <span>{part}</span>
                                {idx < blankCount && (
                                    <input
                                        type="text"
                                        value={currentValues[idx] || ''}
                                        onChange={(e) => handleBlankChange(idx, e.target.value)}
                                        placeholder={`blank ${idx + 1}`}
                                        className="inline-block bg-[#2d2d2d] border border-[#f97316] rounded px-2 py-0.5 text-[#f97316] font-mono text-sm min-w-[80px] focus:outline-none focus:ring-1 focus:ring-[#f97316] placeholder-[#555]"
                                        style={{ width: `${Math.max(80, (currentValues[idx] || '').length * 9 + 20)}px` }}
                                    />
                                )}
                            </span>
                        ))}
                    </pre>
                </div>
            </div>
        );
    }

    // Single blank or free-form code input
    const currentValue = typeof value === 'string' ? value : (Array.isArray(value) ? value[0] || '' : '');

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <Code2 className="w-4 h-4 text-[#9ca3af]" />
                <span className="text-xs text-[#9ca3af]">
                    {blankCount === 1 ? `Complétez le code (${language})` : `Écrivez votre code (${language})`}
                </span>
            </div>
            {blankCount === 1 ? (
                <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto">
                    <pre className="text-sm font-mono text-[#d4d4d4] whitespace-pre-wrap">
                        {template.split('{{blank}}').map((part, idx) => (
                            <span key={idx}>
                                <span>{part}</span>
                                {idx === 0 && (
                                    <input
                                        type="text"
                                        value={currentValue}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="votre réponse"
                                        className="inline-block bg-[#2d2d2d] border border-[#f97316] rounded px-2 py-0.5 text-[#f97316] font-mono text-sm min-w-[100px] focus:outline-none focus:ring-1 focus:ring-[#f97316] placeholder-[#555]"
                                        style={{ width: `${Math.max(100, currentValue.length * 9 + 20)}px` }}
                                    />
                                )}
                            </span>
                        ))}
                    </pre>
                </div>
            ) : (
                <textarea
                    value={currentValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`// Écrivez votre code ${language} ici...`}
                    rows={6}
                    className="w-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm rounded-xl border-2 border-[#333] focus:border-[#f97316] focus:ring-0 focus:outline-none transition-colors resize-y"
                    spellCheck={false}
                />
            )}
        </div>
    );
}

export default function QuizViewer({ quiz, onClose, onComplete, isCompleted }: QuizViewerProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [timeSpent, setTimeSpent] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState<DetailedResults | null>(null);
    const [direction, setDirection] = useState(0);
    const [networkError, setNetworkError] = useState<string | null>(null);
    const [showCompetencies, setShowCompetencies] = useState(false);
    const [competencyDetails, setCompetencyDetails] = useState<CompetencyInfo[]>([]);
    const [loadingCompetencies, setLoadingCompetencies] = useState(false);

    useEffect(() => {
        if (!session) {
            router.push('/api/auth/signin');
            return;
        }

        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [session, router]);

    // Fetch competency details
    useEffect(() => {
        if (quiz.competencies && quiz.competencies.length > 0) {
            fetchCompetencyDetails();
        }
    }, [quiz.competencies]);

    const fetchCompetencyDetails = async () => {
        if (!quiz.competencies || quiz.competencies.length === 0) return;
        
        setLoadingCompetencies(true);
        try {
            const response = await fetch(`/api/competencies/by-skills?skills=${quiz.competencies.join(',')}`);
            if (response.ok) {
                const data = await response.json();
                setCompetencyDetails(data.competencies || []);
            }
        } catch (error) {
            console.error("Error fetching competency details:", error);
        } finally {
            setLoadingCompetencies(false);
        }
    };

    const answeredCount = useMemo(() => {
        return quiz.questions.filter((q, i) => {
            const a = answers[i];
            // Classement and Slider are always considered answered (have defaults)
            if (q.questionType === 'Classement' || q.questionType === 'Slider') return true;
            if (q.questionType === 'Glisser-déposer') return Array.isArray(a) && a.every((v: string) => !!v);
            return a !== undefined && a !== '';
        }).length;
    }, [answers, quiz.questions]);

    const allAnswered = answeredCount === quiz.questions.length;

    const handleAnswerChange = useCallback((answer: any) => {
        setAnswers(prev => ({ ...prev, [currentQuestion]: answer }));
    }, [currentQuestion]);

    const goToQuestion = useCallback((index: number) => {
        setDirection(index > currentQuestion ? 1 : -1);
        setCurrentQuestion(index);
    }, [currentQuestion]);

    const handleNext = useCallback(() => {
        if (currentQuestion < quiz.questions.length - 1) {
            setDirection(1);
            setCurrentQuestion(prev => prev + 1);
        }
    }, [currentQuestion, quiz.questions.length]);

    const handlePrevious = useCallback(() => {
        if (currentQuestion > 0) {
            setDirection(-1);
            setCurrentQuestion(prev => prev - 1);
        }
    }, [currentQuestion]);

    const handleSubmit = async () => {
        if (!session || isSubmitting) return;

        if (isCompleted) {
            return;
        }

        // Validate all answers
        const unanswered = quiz.questions.reduce<number[]>((acc, q, i) => {
            const a = answers[i];
            if (a === undefined || a === '') {
                // Classement and Slider have defaults, so they're always considered answered
                if (q.questionType !== 'Classement' && q.questionType !== 'Slider') {
                    acc.push(i + 1);
                }
            }
            // For Glisser-déposer, check all selections are filled
            if (q.questionType === 'Glisser-déposer' && Array.isArray(a) && a.some((v: string) => !v)) {
                acc.push(i + 1);
            }
            return acc;
        }, []);

        if (unanswered.length > 0) {
            setNetworkError(`Veuillez répondre à toutes les questions. Questions manquantes : ${unanswered.join(', ')}`);
            return;
        }

        setIsSubmitting(true);
        setNetworkError(null);

        try {
            // Build answers array in order, providing defaults for types that have them
            const orderedAnswers = quiz.questions.map((q, i) => {
                if (answers[i] !== undefined) return answers[i];
                if (q.questionType === 'Classement') return q.answers.map((_: string, idx: number) => idx);
                if (q.questionType === 'Slider') {
                    const min = parseFloat(q.answers[0] || '0');
                    const max = parseFloat(q.answers[1] || '100');
                    return (min + max) / 2;
                }
                return answers[i];
            });

            const response = await fetch(`/api/quizzes/${quiz._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: orderedAnswers, timeSpent }),
            });

            if (response.ok) {
                const result = await response.json();
                setResults(result);
                setShowResults(true);
                
                // Record competency progress for each skill
                if (quiz.competencies && quiz.competencies.length > 0) {
                    await recordCompetencyProgress(result.percentage);
                }
                
                onComplete(result);
            } else {
                const error = await response.json();
                setNetworkError(error.error || 'Erreur lors de la soumission du quiz');
            }
        } catch {
            setNetworkError('Erreur réseau. Vérifiez votre connexion et réessayez.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const recordCompetencyProgress = async (percentage: number) => {
        if (!quiz.competencies || quiz.competencies.length === 0) return;
        
        try {
            // Record progress for each competency
            const promises = quiz.competencies.map(async (skillId) => {
                const response = await fetch('/api/competencies/record', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        skillId,
                        score: percentage,
                        source: 'quiz',
                        sourceId: quiz._id,
                    }),
                });
                return response.ok;
            });
            
            await Promise.all(promises);
        } catch (error) {
            console.error("Error recording competency progress:", error);
        }
    };

    const renderLatexContent = (text: string) => {
        const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
        return parts.map((part, index) => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
                return (
                    <div key={index} className="my-2">
                        <BlockMath math={part.slice(2, -2)} />
                    </div>
                );
            } else if (part.startsWith('$') && part.endsWith('$')) {
                return (
                    <span key={index}>
                        <InlineMath math={part.slice(1, -1)} />
                    </span>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    const renderQuestion = (question: QuizQuestion, index: number) => {
        const currentAnswer = answers[index];

        switch (question.questionType) {
            case 'QCM':
                return (
                    <div className="space-y-3">
                        {question.answers.map((answer, answerIndex) => {
                            const isSelected = question.answerSelectionType === 'single'
                                ? currentAnswer === answerIndex
                                : Array.isArray(currentAnswer) && currentAnswer.includes(answerIndex);

                            return (
                                <button
                                    key={answerIndex}
                                    type="button"
                                    onClick={() => {
                                        if (question.answerSelectionType === 'single') {
                                            handleAnswerChange(answerIndex);
                                        } else {
                                            const prev = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                                            if (prev.includes(answerIndex)) {
                                                handleAnswerChange(prev.filter((i: number) => i !== answerIndex));
                                            } else {
                                                handleAnswerChange([...prev, answerIndex]);
                                            }
                                        }
                                    }}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 ${
                                        isSelected
                                            ? 'border-[#f97316] bg-[#fff7ed] shadow-sm'
                                            : 'border-[#e3e2e0] bg-white hover:border-[#d1d0ce] hover:bg-[#fafaf9]'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                        isSelected
                                            ? 'border-[#f97316] bg-[#f97316]'
                                            : 'border-[#d1d0ce]'
                                    }`}>
                                        {isSelected && (
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <span className="text-[#37352f] text-sm sm:text-base leading-relaxed">
                                        {renderLatexContent(answer)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                );

            case 'Vrai/Faux':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        {['true', 'false'].map((value) => {
                            const isSelected = currentAnswer === value;
                            const label = value === 'true' ? 'Vrai' : 'Faux';
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleAnswerChange(value)}
                                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-center font-medium text-lg ${
                                        isSelected
                                            ? value === 'true'
                                                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm'
                                                : 'border-red-400 bg-red-50 text-red-700 shadow-sm'
                                            : 'border-[#e3e2e0] bg-white hover:border-[#d1d0ce] hover:bg-[#fafaf9] text-[#37352f]'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                );

            case 'Réponse courte':
                return (
                    <input
                        type="text"
                        value={currentAnswer || ''}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Tapez votre réponse..."
                        className="w-full p-4 border-2 border-[#e3e2e0] rounded-xl text-[#37352f] placeholder-[#b4b4b0] focus:border-[#f97316] focus:ring-0 focus:outline-none transition-colors bg-white text-sm sm:text-base"
                    />
                );

            case 'Classement':
                return <ClassementInput items={question.answers} value={currentAnswer} onChange={handleAnswerChange} renderLatex={renderLatexContent} />;

            case 'Glisser-déposer':
                return <MatchingInput question={question} value={currentAnswer} onChange={handleAnswerChange} renderLatex={renderLatexContent} />;

            case 'Slider':
                return <SliderInput question={question} value={currentAnswer} onChange={handleAnswerChange} />;

            case 'Code':
                return <CodeInput question={question} value={currentAnswer} onChange={handleAnswerChange} />;

            case 'Texte à trous':
                return <FillBlanksInput question={question} value={currentAnswer} onChange={handleAnswerChange} />;

            default:
                return <div className="text-[#6b6b6b]">Type de question non supporté</div>;
        }
    };

    // --- RESULTS SCREEN ---
    if (showResults && results) {
        const scorePercent = results.percentage;
        const scoreColor = scorePercent >= 80 ? 'text-emerald-600' : scorePercent >= 50 ? 'text-amber-600' : 'text-red-600';
        const scoreBg = scorePercent >= 80 ? 'bg-emerald-50' : scorePercent >= 50 ? 'bg-amber-50' : 'bg-red-50';

        return (
            <div className="w-full">
                {/* Back button */}
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#37352f] transition-colors mb-6"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Retour aux quiz
                </button>

                {/* Score header */}
                <div className={`${scoreBg} rounded-2xl p-6 sm:p-8 mb-8 text-center`}>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center">
                        <Trophy className={`w-8 h-8 ${scoreColor}`} />
                    </div>
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className={`text-4xl sm:text-5xl font-bold ${scoreColor} mb-2`}
                    >
                        {results.percentage}%
                    </motion.div>
                    <p className="text-[#6b6b6b] text-sm sm:text-base">
                        {results.score}/{results.maxScore} points
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3 text-sm text-[#9ca3af]">
                        <Clock className="w-4 h-4" />
                        {formatTime(timeSpent)}
                    </div>
                    {results.timeModifierLabel && (
                        <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-medium ${
                            (results.timeModifier || 0) > 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {results.timeModifierLabel}
                        </div>
                    )}
                    <Progress value={results.percentage} className="h-2 mt-4 max-w-md mx-auto" />
                </div>

                {/* Competencies validated */}
                {quiz.competencies && quiz.competencies.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 sm:p-6 mb-6 border-2 border-orange-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Award className="w-5 h-5 text-orange-500" />
                            <h3 className="font-semibold text-gray-900">Compétences validées</h3>
                        </div>
                        {competencyDetails.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {competencyDetails.map((comp) => {
                                    const isMastered = results.percentage >= 80;
                                    const isFailed = results.percentage < 40;
                                    const statusColors: Record<string, string> = {
                                        not_started: "bg-gray-100 text-gray-600",
                                        in_progress: "bg-amber-100 text-amber-700",
                                        failed: "bg-red-100 text-red-700",
                                        mastered: "bg-emerald-100 text-emerald-700",
                                    };
                                    return (
                                        <Badge
                                            key={comp.skillId}
                                            className={`text-sm px-3 py-1 ${
                                                isMastered 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : isFailed 
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {comp.skillId}
                                            {isMastered && <CheckCircle className="w-3.5 h-3.5 ml-1 inline" />}
                                            {!isMastered && !isFailed && <Clock className="w-3.5 h-3.5 ml-1 inline" />}
                                        </Badge>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {quiz.competencies.map((skillId) => (
                                    <Badge
                                        key={skillId}
                                        className={`text-sm px-3 py-1 ${
                                            results.percentage >= 80 
                                                ? 'bg-emerald-100 text-emerald-700' 
                                                : results.percentage < 40 
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {skillId}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-3">
                            {results.percentage >= 80 
                                ? "🎉 Bravo ! Ces compétences sont maintenant maîtrisées."
                                : results.percentage >= 60 
                                    ? "👍 Bon travail ! Continuez à pratiquer pour maîtriser ces compétences."
                                    : results.percentage >= 40 
                                        ? "💪 Encore un peu d'effort ! Revoyez les concepts et réessayez."
                                        : "📚 Ces compétences nécessitent plus de travail. Consultez les cours associés."}
                        </p>
                    </div>
                )}

                {/* Detailed answers */}
                <h3 className="text-lg font-semibold text-[#37352f] mb-4">Détail des réponses</h3>
                <div className="space-y-4">
                    {results.answers.map((answer, index) => {
                        const question = quiz.questions[index];
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`rounded-xl border-2 p-4 sm:p-5 ${
                                    answer.isCorrect
                                        ? 'border-emerald-200 bg-emerald-50/50'
                                        : 'border-red-200 bg-red-50/50'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {answer.isCorrect ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="font-medium text-[#37352f] text-sm sm:text-base">
                                                Question {index + 1}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {answer.pointsEarned}/{question?.point || 0} pt{(question?.point || 0) > 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-[#6b6b6b] mb-2">
                                            {question && renderLatexContent(question.question)}
                                        </p>

                                        {/* Show correct answer if wrong */}
                                        {!answer.isCorrect && answer.correctAnswer !== undefined && question && (
                                            <div className="text-sm mt-2 p-2 bg-white/60 rounded-lg">
                                                <span className="text-[#9ca3af]">Bonne réponse : </span>
                                                <span className="text-emerald-700 font-medium">
                                                    {question.questionType === 'QCM' && question.answers
                                                        ? question.answers[parseInt(String(answer.correctAnswer))]
                                                        : question.questionType === 'Vrai/Faux'
                                                            ? (String(answer.correctAnswer).toLowerCase() === 'true' ? 'Vrai' : 'Faux')
                                                            : question.questionType === 'Classement'
                                                                ? (Array.isArray(answer.correctAnswer) ? answer.correctAnswer.map((idx: number) => question.answers[idx]).join(' → ') : String(answer.correctAnswer))
                                                                : question.questionType === 'Glisser-déposer'
                                                                    ? (Array.isArray(answer.correctAnswer) ? answer.correctAnswer.join(', ') : String(answer.correctAnswer))
                                                                    : question.questionType === 'Slider'
                                                                        ? `${answer.correctAnswer}${question.answers[3] || ''}`
                                                                        : question.questionType === 'Code'
                                                                            ? (Array.isArray(answer.correctAnswer) ? answer.correctAnswer.join(', ') : String(answer.correctAnswer))
                                                                            : question.questionType === 'Texte à trous'
                                                                                ? (Array.isArray(answer.correctAnswer) ? answer.correctAnswer.join(', ') : String(answer.correctAnswer))
                                                                                : String(answer.correctAnswer)
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        {/* Explanation */}
                                        {answer.explanation && (
                                            <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-blue-800">{answer.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom action */}
                <div className="mt-8 pb-4">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Retour aux quiz
                    </Button>
                </div>
            </div>
        );
    }

    // --- QUIZ SCREEN ---
    const currentQ = quiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
    const isLastQuestion = currentQuestion === quiz.questions.length - 1;

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
    };

    return (
        <div className="w-full">
            {/* Back button */}
            <button
                onClick={onClose}
                className="flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#37352f] transition-colors mb-6"
            >
                <ChevronLeft className="w-4 h-4" />
                Retour aux quiz
            </button>

            {/* Quiz header */}
            <div className="bg-[#f7f6f3] rounded-2xl p-5 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Trophy className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-[#37352f] text-lg leading-tight line-clamp-1">
                                {quiz.title}
                            </h2>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-[#9ca3af]">
                                <span className={`flex items-center gap-1 ${
                                    quiz.timeBonus?.enabled && timeSpent <= quiz.timeBonus.targetTime
                                        ? 'text-emerald-600 font-medium'
                                        : quiz.timePenalty?.enabled && quiz.timePenalty.maxTime > 0 && timeSpent > quiz.timePenalty.maxTime
                                            ? 'text-red-500 font-medium'
                                            : ''
                                }`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatTime(timeSpent)}
                                </span>
                                <span>{answeredCount}/{quiz.questions.length} répondues</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {isCompleted && (
                            <Badge variant="secondary" className="text-xs">
                                Déjà complété
                            </Badge>
                        )}
                        {quiz.timeBonus?.enabled && quiz.timeBonus.targetTime > 0 && (
                            <Badge variant="outline" className={`text-[10px] ${timeSpent <= quiz.timeBonus.targetTime ? 'border-emerald-300 text-emerald-600 bg-emerald-50' : 'border-gray-200 text-gray-400'}`}>
                                Bonus si &lt; {formatTime(quiz.timeBonus.targetTime)}
                            </Badge>
                        )}
                        {quiz.timePenalty?.enabled && quiz.timePenalty.maxTime > 0 && (
                            <Badge variant="outline" className={`text-[10px] ${timeSpent > quiz.timePenalty.maxTime ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-200 text-gray-400'}`}>
                                Malus si &gt; {formatTime(quiz.timePenalty.maxTime)}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Competencies Section */}
                {quiz.competencies && quiz.competencies.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#e3e2e0]">
                        <button
                            onClick={() => setShowCompetencies(!showCompetencies)}
                            className="flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#f97316] transition-colors w-full"
                        >
                            <Award className="w-4 h-4 text-orange-500" />
                            <span className="flex-1 text-left">
                                Ce quiz valide {quiz.competencies.length} compétence{quiz.competencies.length > 1 ? 's' : ''}
                            </span>
                            {showCompetencies ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>
                        
                        {showCompetencies && (
                            <div className="mt-3">
                                {loadingCompetencies ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <div className="w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />
                                        Chargement des compétences...
                                    </div>
                                ) : competencyDetails.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {competencyDetails.map((comp) => {
                                            const statusColors: Record<string, string> = {
                                                not_started: "bg-gray-100 text-gray-600 border-gray-200",
                                                in_progress: "bg-amber-100 text-amber-700 border-amber-200",
                                                failed: "bg-red-100 text-red-700 border-red-200",
                                                mastered: "bg-emerald-100 text-emerald-700 border-emerald-200",
                                            };
                                            return (
                                                <Badge
                                                    key={comp.skillId}
                                                    variant="outline"
                                                    className={`text-xs font-medium ${statusColors[comp.status] || statusColors.not_started}`}
                                                    title={comp.description}
                                                >
                                                    {comp.skillId}
                                                    {comp.status === "mastered" && <CheckCircle className="w-3 h-3 ml-1 inline" />}
                                                    {comp.status === "in_progress" && comp.nextReview && new Date(comp.nextReview) <= new Date() && (
                                                        <span className="ml-1 text-[10px]">À réviser</span>
                                                    )}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {quiz.competencies.map((skillId) => (
                                            <Badge
                                                key={skillId}
                                                variant="outline"
                                                className="text-xs font-medium bg-gray-50"
                                            >
                                                {skillId}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Progress bar */}
                <Progress value={progress} className="h-1.5 mb-3" />

                {/* Navigation dots */}
                <div className="flex flex-wrap gap-1.5">
                    {quiz.questions.map((_, i) => {
                        const isAnswered = answers[i] !== undefined && answers[i] !== '';
                        const isCurrent = i === currentQuestion;
                        return (
                            <button
                                key={i}
                                onClick={() => goToQuestion(i)}
                                className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                                    isCurrent
                                        ? 'bg-[#f97316] text-white shadow-sm'
                                        : isAnswered
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                            : 'bg-white text-[#6b6b6b] hover:bg-[#eae9e6] border border-[#e3e2e0]'
                                }`}
                                title={`Question ${i + 1}`}
                            >
                                {i + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Error message */}
            {networkError && (
                <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p>{networkError}</p>
                        <button
                            onClick={() => setNetworkError(null)}
                            className="text-red-500 underline text-xs mt-1"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            {/* Question area */}
            <div className="min-h-[300px] sm:min-h-[350px]">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentQuestion}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        {/* Question header */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h3 className="text-base sm:text-lg font-semibold text-[#37352f]">
                                Question {currentQuestion + 1}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                                {currentQ.point} pt{currentQ.point > 1 ? 's' : ''}
                            </Badge>
                        </div>

                        {/* Question text */}
                        <div className="text-[#37352f] text-sm sm:text-base leading-relaxed mb-5">
                            {renderLatexContent(currentQ.question)}
                        </div>

                        {/* Question image */}
                        {currentQ.questionPic && (
                            <img
                                src={currentQ.questionPic}
                                alt="Illustration de la question"
                                className="max-w-full h-auto rounded-xl shadow-sm mb-5 border border-[#e3e2e0]"
                            />
                        )}

                        {/* Answer options */}
                        <div className="mb-6">
                            {renderQuestion(currentQ, currentQuestion)}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#e3e2e0]">
                <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="order-2 sm:order-1"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Précédent
                </Button>

                <div className="flex gap-2 order-1 sm:order-2">
                    {isLastQuestion ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || isCompleted}
                            className={`flex-1 sm:flex-none ${allAnswered ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Soumission...
                                </>
                            ) : isCompleted ? (
                                'Quiz déjà complété'
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Terminer le quiz
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleNext} className="flex-1 sm:flex-none">
                            Suivant
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
