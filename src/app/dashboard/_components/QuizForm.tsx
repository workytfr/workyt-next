'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
    Plus, Trash2, Save, X, Calculator, Loader2, ChevronDown, ChevronUp,
    HelpCircle, Image, Lightbulb, GripVertical, ArrowRight, ArrowUp, ArrowDown,
    Code2, SlidersHorizontal, ListOrdered, Link2, CheckCircle2, Type, ToggleLeft,
    Copy, Clock, Target
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import SkillPicker from '@/components/ui/SkillPicker';

interface ICourse {
    _id: string;
    title: string;
    sections: { _id: string; title: string }[];
}

type QuestionType = 'QCM' | 'Réponse courte' | 'Vrai/Faux' | 'Texte à trous' | 'Classement' | 'Glisser-déposer' | 'Slider' | 'Code';

interface Question {
    question: string;
    questionType: QuestionType;
    questionPic?: string;
    answerSelectionType: 'single' | 'multiple';
    answers: string[];
    correctAnswer: any;
    messageForCorrectAnswer?: string;
    messageForIncorrectAnswer?: string;
    explanation?: string;
    point: number;
}

interface QuizFormProps {
    sectionId?: string;
    onSave: (quiz: any) => void;
    onCancel: () => void;
    initialData?: any;
}

// Question type metadata for the selector
const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
    { value: 'QCM', label: 'QCM', icon: <CheckCircle2 className="w-4 h-4" />, description: 'Choix unique ou multiple parmi des options', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'Vrai/Faux', label: 'Vrai / Faux', icon: <ToggleLeft className="w-4 h-4" />, description: 'L\'élève choisit Vrai ou Faux', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'Réponse courte', label: 'Réponse courte', icon: <Type className="w-4 h-4" />, description: 'L\'élève tape sa réponse (texte libre)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { value: 'Classement', label: 'Classement', icon: <ListOrdered className="w-4 h-4" />, description: 'Remettre des éléments dans le bon ordre', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'Glisser-déposer', label: 'Glisser-déposer', icon: <Link2 className="w-4 h-4" />, description: 'Associer des paires (terme ↔ définition)', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    { value: 'Slider', label: 'Slider / Estimation', icon: <SlidersHorizontal className="w-4 h-4" />, description: 'Donner une valeur numérique avec tolérance', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { value: 'Code', label: 'Compléter du code', icon: <Code2 className="w-4 h-4" />, description: 'Remplir les blancs dans du code source', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    { value: 'Texte à trous', label: 'Texte à trous', icon: <Type className="w-4 h-4" />, description: 'Remplir les blancs dans un texte', color: 'bg-teal-50 text-teal-700 border-teal-200' },
];

function getTypeInfo(type: QuestionType) {
    return QUESTION_TYPES.find(t => t.value === type) || QUESTION_TYPES[0];
}

// Defaults when switching question type
function getDefaultsForType(type: QuestionType): Partial<Question> {
    switch (type) {
        case 'QCM':
            return { answers: ['', ''], correctAnswer: 0, answerSelectionType: 'single' };
        case 'Vrai/Faux':
            return { answers: [], correctAnswer: 'true', answerSelectionType: 'single' };
        case 'Réponse courte':
            return { answers: [], correctAnswer: '', answerSelectionType: 'single' };
        case 'Classement':
            return { answers: ['', '', ''], correctAnswer: [0, 1, 2], answerSelectionType: 'single' };
        case 'Glisser-déposer':
            return { answers: ['', '', '', ''], correctAnswer: ['', ''], answerSelectionType: 'single' };
        case 'Slider':
            return { answers: ['0', '100', '1', '', '5'], correctAnswer: 50, answerSelectionType: 'single' };
        case 'Code':
            return { answers: ['javascript', ''], correctAnswer: '', answerSelectionType: 'single' };
        case 'Texte à trous':
            return { answers: [''], correctAnswer: '', answerSelectionType: 'single' };
        default:
            return { answers: ['', ''], correctAnswer: 0, answerSelectionType: 'single' };
    }
}

export default function QuizForm({ sectionId: propSectionId, onSave, onCancel, initialData }: QuizFormProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [showLatexHelp, setShowLatexHelp] = useState(false);

    // Sélection cours/section
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedSectionId, setSelectedSectionId] = useState<string>(
        propSectionId || initialData?.sectionId?._id || initialData?.sectionId || ''
    );

    // Compétences liées
    const [competencies, setCompetencies] = useState<string[]>(initialData?.competencies || []);

    // Bonus / Malus temps
    const [timeBonusEnabled, setTimeBonusEnabled] = useState(initialData?.timeBonus?.enabled || false);
    const [timeBonusTarget, setTimeBonusTarget] = useState(initialData?.timeBonus?.targetTime ? Math.floor(initialData.timeBonus.targetTime / 60) : 2);
    const [timeBonusPercent, setTimeBonusPercent] = useState(initialData?.timeBonus?.bonusPercent || 15);
    const [timePenaltyEnabled, setTimePenaltyEnabled] = useState(initialData?.timePenalty?.enabled || false);
    const [timePenaltyMax, setTimePenaltyMax] = useState(initialData?.timePenalty?.maxTime ? Math.floor(initialData.timePenalty.maxTime / 60) : 10);
    const [timePenaltyPerMin, setTimePenaltyPerMin] = useState(initialData?.timePenalty?.penaltyPercentPerMin || 5);
    const [timePenaltyMaxPercent, setTimePenaltyMaxPercent] = useState(initialData?.timePenalty?.maxPenaltyPercent || 50);

    const needsCourseSelection = !propSectionId;

    useEffect(() => {
        if (!needsCourseSelection) return;
        async function fetchCourses() {
            setLoadingCourses(true);
            try {
                const res = await fetch('/api/courses?limit=200');
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                const loadedCourses = data.courses || [];
                setCourses(loadedCourses);
                if (initialData?.sectionId) {
                    const sId = initialData.sectionId?._id || initialData.sectionId;
                    for (const course of loadedCourses) {
                        if (course.sections.some((s: any) => s._id === sId)) {
                            setSelectedCourseId(course._id);
                            break;
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des cours :', error);
            } finally {
                setLoadingCourses(false);
            }
        }
        fetchCourses();
    }, [needsCourseSelection]);

    // Auto-expand new questions
    useEffect(() => {
        if (questions.length > 0 && !expandedQuestions.has(questions.length - 1)) {
            setExpandedQuestions(prev => new Set([...prev, questions.length - 1]));
        }
    }, [questions.length]);

    const filteredCourses = searchQuery.trim()
        ? courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : courses;

    const selectedCourse = courses.find(c => c._id === selectedCourseId);

    const toggleQuestion = (index: number) => {
        setExpandedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const addQuestion = () => {
        const newQuestion: Question = {
            question: '',
            questionType: 'QCM',
            answerSelectionType: 'single',
            answers: ['', ''],
            correctAnswer: 0,
            point: 1
        };
        setQuestions([...questions, newQuestion]);
    };

    const duplicateQuestion = (index: number) => {
        const original = questions[index];
        const copy: Question = JSON.parse(JSON.stringify(original));
        const newQuestions = [...questions];
        newQuestions.splice(index + 1, 0, copy);
        setQuestions(newQuestions);
        setExpandedQuestions(prev => new Set([...prev, index + 1]));
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
        setExpandedQuestions(prev => {
            const next = new Set<number>();
            prev.forEach(i => {
                if (i < index) next.add(i);
                else if (i > index) next.add(i - 1);
            });
            return next;
        });
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
        setQuestions(updatedQuestions);
    };

    const changeQuestionType = (index: number, newType: QuestionType) => {
        const updatedQuestions = [...questions];
        const defaults = getDefaultsForType(newType);
        updatedQuestions[index] = {
            ...updatedQuestions[index],
            questionType: newType,
            ...defaults,
        };
        setQuestions(updatedQuestions);
    };

    const addAnswer = (questionIndex: number) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].answers.push('');
        setQuestions(updatedQuestions);
    };

    const removeAnswer = (questionIndex: number, answerIndex: number) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].answers.splice(answerIndex, 1);
        setQuestions(updatedQuestions);
    };

    const updateAnswer = (questionIndex: number, answerIndex: number, value: string) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].answers[answerIndex] = value;
        setQuestions(updatedQuestions);
    };

    const renderLatexPreview = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
        return parts.map((part, index) => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
                return <div key={index} className="my-1"><BlockMath math={part.slice(2, -2)} /></div>;
            } else if (part.startsWith('$') && part.endsWith('$')) {
                return <span key={index}><InlineMath math={part.slice(1, -1)} /></span>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || questions.length === 0) {
            alert('Veuillez remplir le titre et ajouter au moins une question');
            return;
        }
        if (!selectedSectionId) {
            alert('Veuillez sélectionner un cours et une section');
            return;
        }
        setIsSubmitting(true);
        try {
            onSave({
                title,
                description,
                sectionId: selectedSectionId,
                questions,
                competencies,
                timeBonus: {
                    enabled: timeBonusEnabled,
                    targetTime: timeBonusTarget * 60, // convert minutes to seconds
                    bonusPercent: timeBonusPercent
                },
                timePenalty: {
                    enabled: timePenaltyEnabled,
                    maxTime: timePenaltyMax * 60, // convert minutes to seconds
                    penaltyPercentPerMin: timePenaltyPerMin,
                    maxPenaltyPercent: timePenaltyMaxPercent
                }
            });
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde du quiz');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPoints = questions.reduce((sum, q) => sum + (q.point || 0), 0);

    // ===== QUESTION TYPE-SPECIFIC FORMS =====

    const renderQCMFields = (question: Question, index: number) => (
        <div className="space-y-4">
            {/* Selection type */}
            <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <Label className="text-sm text-blue-700 font-medium whitespace-nowrap">Mode :</Label>
                <Select
                    value={question.answerSelectionType}
                    onValueChange={(value: any) => updateQuestion(index, 'answerSelectionType', value)}
                >
                    <SelectTrigger className="h-8 bg-white border-blue-200">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="single">Une seule bonne réponse</SelectItem>
                        <SelectItem value="multiple">Plusieurs bonnes réponses</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Answers */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">
                        Réponses
                        <span className="text-xs text-gray-400 font-normal ml-2">
                            {question.answerSelectionType === 'single' ? 'Sélectionnez la bonne réponse' : 'Cochez les bonnes réponses'}
                        </span>
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addAnswer(index)} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Option
                    </Button>
                </div>
                <div className="space-y-2">
                    {question.answers.map((answer, answerIndex) => {
                        const isCorrect = question.answerSelectionType === 'single'
                            ? question.correctAnswer === answerIndex
                            : Array.isArray(question.correctAnswer) && question.correctAnswer.includes(answerIndex);
                        return (
                            <div key={answerIndex} className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-colors ${isCorrect ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 bg-white'}`}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (question.answerSelectionType === 'single') {
                                            updateQuestion(index, 'correctAnswer', answerIndex);
                                        } else {
                                            const curr = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                                            updateQuestion(index, 'correctAnswer',
                                                curr.includes(answerIndex)
                                                    ? curr.filter((i: number) => i !== answerIndex)
                                                    : [...curr, answerIndex]
                                            );
                                        }
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                    {isCorrect && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>
                                <Input
                                    value={answer}
                                    onChange={(e) => updateAnswer(index, answerIndex, e.target.value)}
                                    placeholder={`Option ${answerIndex + 1}`}
                                    className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAnswer(index, answerIndex)}
                                    disabled={question.answers.length <= 2}
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderVraiFauxFields = (question: Question, index: number) => (
        <div>
            <Label className="text-sm font-medium mb-2 block">La bonne réponse est :</Label>
            <div className="grid grid-cols-2 gap-3">
                {[{ val: 'true', label: 'Vrai' }, { val: 'false', label: 'Faux' }].map(({ val, label }) => {
                    const isSelected = String(question.correctAnswer) === val;
                    return (
                        <button
                            key={val}
                            type="button"
                            onClick={() => updateQuestion(index, 'correctAnswer', val)}
                            className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${isSelected
                                ? val === 'true'
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                    : 'border-red-400 bg-red-50 text-red-700'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderReponseCourteFields = (question: Question, index: number) => {
        // Support array of alternatives or single string
        const alternatives: string[] = Array.isArray(question.correctAnswer)
            ? question.correctAnswer
            : question.correctAnswer ? [question.correctAnswer] : [''];

        const updateAlternative = (altIndex: number, value: string) => {
            const newAlts = [...alternatives];
            newAlts[altIndex] = value;
            // Store as array if multiple, string if single
            updateQuestion(index, 'correctAnswer', newAlts.length === 1 ? newAlts[0] : newAlts);
        };

        const addAlternative = () => {
            const newAlts = [...alternatives, ''];
            updateQuestion(index, 'correctAnswer', newAlts);
        };

        const removeAlternative = (altIndex: number) => {
            const newAlts = alternatives.filter((_: any, i: number) => i !== altIndex);
            updateQuestion(index, 'correctAnswer', newAlts.length === 1 ? newAlts[0] : newAlts);
        };

        return (
            <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-700 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        La comparaison est tolérante : elle ignore les accents, la ponctuation, les majuscules et les espaces multiples. Vous pouvez ajouter des réponses alternatives.
                    </p>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">
                            Réponse{alternatives.length > 1 ? 's' : ''} acceptée{alternatives.length > 1 ? 's' : ''}
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={addAlternative} className="h-7 text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            Alternative
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {alternatives.map((alt: string, altIndex: number) => (
                            <div key={altIndex} className="flex items-center gap-2">
                                {alternatives.length > 1 && (
                                    <span className="text-xs text-gray-400 w-5 flex-shrink-0 text-center">{altIndex + 1}.</span>
                                )}
                                <Input
                                    value={alt}
                                    onChange={(e) => updateAlternative(altIndex, e.target.value)}
                                    placeholder={altIndex === 0 ? "Réponse principale (ex: Déclaration des Droits de l'Homme)" : "Réponse alternative (ex: DDHC)"}
                                    className="text-sm flex-1"
                                />
                                {alternatives.length > 1 && (
                                    <Button
                                        type="button" variant="ghost" size="sm"
                                        onClick={() => removeAlternative(altIndex)}
                                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderClassementFields = (question: Question, index: number) => (
        <div className="space-y-3">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Ajoutez les éléments <strong>dans le bon ordre</strong>. L'élève les verra mélangés et devra les remettre en ordre.
                </p>
            </div>
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Éléments (dans l'ordre correct)</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                    addAnswer(index);
                    // Update correctAnswer to include new index
                    const newCorrect = [...(Array.isArray(question.correctAnswer) ? question.correctAnswer : []), question.answers.length];
                    updateQuestion(index, 'correctAnswer', newCorrect);
                }} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Élément
                </Button>
            </div>
            <div className="space-y-2">
                {question.answers.map((answer, answerIndex) => (
                    <div key={answerIndex} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white">
                        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                            {answerIndex + 1}
                        </span>
                        <Input
                            value={answer}
                            onChange={(e) => updateAnswer(index, answerIndex, e.target.value)}
                            placeholder={`Élément ${answerIndex + 1}`}
                            className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
                        />
                        <Button
                            type="button" variant="ghost" size="sm"
                            onClick={() => {
                                removeAnswer(index, answerIndex);
                                const newCorrect = question.answers.slice(0, -1).map((_: any, i: number) => i);
                                updateQuestion(index, 'correctAnswer', newCorrect);
                            }}
                            disabled={question.answers.length <= 2}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderGlisserDeposerFields = (question: Question, index: number) => {
        const halfLen = Math.ceil(question.answers.length / 2);
        const leftItems = question.answers.slice(0, halfLen);
        const rightItems = question.answers.slice(halfLen);
        const correctPairs: string[] = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];

        const addPair = () => {
            const updated = [...questions];
            const q = updated[index];
            const newLeft = [...q.answers.slice(0, halfLen), ''];
            const newRight = [...q.answers.slice(halfLen), ''];
            q.answers = [...newLeft, ...newRight];
            q.correctAnswer = [...correctPairs, ''];
            setQuestions(updated);
        };

        const removePair = (pairIndex: number) => {
            const updated = [...questions];
            const q = updated[index];
            const left = q.answers.slice(0, halfLen).filter((_: any, i: number) => i !== pairIndex);
            const right = q.answers.slice(halfLen).filter((_: any, i: number) => i !== pairIndex);
            q.answers = [...left, ...right];
            q.correctAnswer = correctPairs.filter((_: any, i: number) => i !== pairIndex);
            setQuestions(updated);
        };

        const updateLeft = (pairIndex: number, value: string) => {
            const updated = [...questions];
            const q = updated[index];
            const left = q.answers.slice(0, halfLen);
            const right = q.answers.slice(halfLen);
            left[pairIndex] = value;
            q.answers = [...left, ...right];
            setQuestions(updated);
        };

        const updateRight = (pairIndex: number, value: string) => {
            const updated = [...questions];
            const q = updated[index];
            const left = q.answers.slice(0, halfLen);
            const right = q.answers.slice(halfLen);
            right[pairIndex] = value;
            q.answers = [...left, ...right];
            // Also update correctAnswer
            const newCorrect = [...correctPairs];
            newCorrect[pairIndex] = value;
            q.correctAnswer = newCorrect;
            setQuestions(updated);
        };

        return (
            <div className="space-y-3">
                <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                    <p className="text-xs text-pink-700 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        Définissez des paires. L'élève verra les éléments de gauche et devra les associer aux éléments de droite (mélangés).
                    </p>
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Paires d'association</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPair} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Paire
                    </Button>
                </div>
                <div className="space-y-2">
                    {leftItems.map((leftItem, pairIndex) => (
                        <div key={pairIndex} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white">
                            <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-700 flex-shrink-0">
                                {pairIndex + 1}
                            </span>
                            <Input
                                value={leftItem}
                                onChange={(e) => updateLeft(pairIndex, e.target.value)}
                                placeholder="Terme"
                                className="h-8 border-gray-200 text-sm flex-1"
                            />
                            <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                            <Input
                                value={rightItems[pairIndex] || ''}
                                onChange={(e) => updateRight(pairIndex, e.target.value)}
                                placeholder="Définition"
                                className="h-8 border-gray-200 text-sm flex-1"
                            />
                            <Button
                                type="button" variant="ghost" size="sm"
                                onClick={() => removePair(pairIndex)}
                                disabled={leftItems.length <= 2}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderSliderFields = (question: Question, index: number) => {
        // answers[0]=min, [1]=max, [2]=step, [3]=unit, [4]=tolerance
        const answers = question.answers.length >= 5 ? question.answers : ['0', '100', '1', '', '5'];

        const updateSliderField = (fieldIndex: number, value: string) => {
            const updated = [...questions];
            const q = updated[index];
            while (q.answers.length < 5) q.answers.push('');
            q.answers[fieldIndex] = value;
            setQuestions(updated);
        };

        return (
            <div className="space-y-4">
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-700 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        L'élève déplace un curseur pour donner sa réponse. Définissez les bornes et la tolérance acceptée.
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                        <Label className="text-xs text-gray-500">Minimum</Label>
                        <Input
                            type="number"
                            value={answers[0]}
                            onChange={(e) => updateSliderField(0, e.target.value)}
                            placeholder="0"
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-500">Maximum</Label>
                        <Input
                            type="number"
                            value={answers[1]}
                            onChange={(e) => updateSliderField(1, e.target.value)}
                            placeholder="100"
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-500">Pas (incrément)</Label>
                        <Input
                            type="number"
                            value={answers[2]}
                            onChange={(e) => updateSliderField(2, e.target.value)}
                            placeholder="1"
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-500">Unité (optionnel)</Label>
                        <Input
                            value={answers[3]}
                            onChange={(e) => updateSliderField(3, e.target.value)}
                            placeholder="km, °C, %..."
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-500">Tolérance (±)</Label>
                        <Input
                            type="number"
                            value={answers[4]}
                            onChange={(e) => updateSliderField(4, e.target.value)}
                            placeholder="5"
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-500 font-medium">Valeur correcte</Label>
                        <Input
                            type="number"
                            value={question.correctAnswer ?? ''}
                            onChange={(e) => updateQuestion(index, 'correctAnswer', parseFloat(e.target.value) || 0)}
                            placeholder="50"
                            className="h-8 text-sm border-emerald-300 bg-emerald-50/50"
                        />
                    </div>
                </div>
                {answers[0] && answers[1] && question.correctAnswer !== undefined && (
                    <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                        Aperçu : L'élève choisira une valeur entre <strong>{answers[0]}{answers[3]}</strong> et <strong>{answers[1]}{answers[3]}</strong>.
                        Réponse acceptée : <strong>{Number(question.correctAnswer) - Number(answers[4] || 0)}{answers[3]}</strong> à <strong>{Number(question.correctAnswer) + Number(answers[4] || 0)}{answers[3]}</strong>
                    </div>
                )}
            </div>
        );
    };

    const renderTexteATrousFields = (question: Question, index: number) => {
        const template = question.answers[0] || '';
        const blankCount = (template.match(/\{\{blank\}\}/g) || []).length;

        const updateTemplate = (value: string) => {
            const updated = [...questions];
            updated[index].answers[0] = value;
            setQuestions(updated);
        };

        return (
            <div className="space-y-4">
                <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <p className="text-xs text-teal-700 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        Écrivez le texte et utilisez <code className="bg-teal-100 px-1 rounded font-mono text-[10px]">{'{{blank}}'}</code> pour marquer les trous à compléter.
                    </p>
                </div>
                <div>
                    <Label className="text-xs text-gray-500">
                        Texte à trous
                        <span className="text-gray-400 font-normal ml-1">
                            ({blankCount} trou{blankCount > 1 ? 's' : ''} détecté{blankCount > 1 ? 's' : ''})
                        </span>
                    </Label>
                    <Textarea
                        value={template}
                        onChange={(e) => updateTemplate(e.target.value)}
                        placeholder={`La capitale de la France est {{blank}} et elle se trouve en {{blank}}.`}
                        className="min-h-[100px] text-sm"
                    />
                </div>
                <div>
                    <Label className="text-xs text-gray-500 font-medium">
                        {blankCount > 1 ? `Réponses attendues (${blankCount} valeurs)` : 'Réponse attendue'}
                    </Label>
                    {blankCount > 1 ? (
                        <div className="space-y-2">
                            {Array.from({ length: blankCount }).map((_, blankIdx) => {
                                const correctArr = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer || ''];
                                return (
                                    <div key={blankIdx} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 w-16 flex-shrink-0">Trou {blankIdx + 1} :</span>
                                        <Input
                                            value={correctArr[blankIdx] || ''}
                                            onChange={(e) => {
                                                const newArr = [...correctArr];
                                                while (newArr.length <= blankIdx) newArr.push('');
                                                newArr[blankIdx] = e.target.value;
                                                updateQuestion(index, 'correctAnswer', newArr);
                                            }}
                                            placeholder={`Valeur du trou ${blankIdx + 1}`}
                                            className="h-8 text-sm border-emerald-300 bg-emerald-50/50"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <Input
                            value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                            onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                            placeholder="La réponse attendue"
                            className="h-8 text-sm border-emerald-300 bg-emerald-50/50"
                        />
                    )}
                </div>
            </div>
        );
    };

    const renderCodeFields = (question: Question, index: number) => {
        const language = question.answers[0] || 'javascript';
        const template = question.answers[1] || '';
        const blankCount = (template.match(/\{\{blank\}\}/g) || []).length;

        const updateCodeField = (fieldIndex: number, value: string) => {
            const updated = [...questions];
            const q = updated[index];
            while (q.answers.length < 2) q.answers.push('');
            q.answers[fieldIndex] = value;
            setQuestions(updated);
        };

        return (
            <div className="space-y-4">
                <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                    <p className="text-xs text-gray-700 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        Écrivez le code et utilisez <code className="bg-gray-200 px-1 rounded font-mono text-[10px]">{'{{blank}}'}</code> pour les trous à compléter. L'élève remplira les blancs.
                    </p>
                </div>
                <div>
                    <Label className="text-xs text-gray-500">Langage</Label>
                    <Select value={language} onValueChange={(v) => updateCodeField(0, v)}>
                        <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'html', 'css', 'sql', 'php', 'ruby', 'go', 'rust', 'bash'].map(lang => (
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-gray-500">
                        Code template
                        <span className="text-gray-400 font-normal ml-1">
                            ({blankCount} trou{blankCount > 1 ? 's' : ''} détecté{blankCount > 1 ? 's' : ''})
                        </span>
                    </Label>
                    <Textarea
                        value={template}
                        onChange={(e) => updateCodeField(1, e.target.value)}
                        placeholder={`function greet(name) {\n  return {{blank}} + name;\n}`}
                        className="min-h-[120px] font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] border-gray-600"
                        spellCheck={false}
                    />
                </div>
                <div>
                    <Label className="text-xs text-gray-500 font-medium">
                        {blankCount > 1 ? `Réponses attendues (${blankCount} valeurs, séparées par des virgules)` : 'Réponse attendue'}
                    </Label>
                    {blankCount > 1 ? (
                        <div className="space-y-2">
                            {Array.from({ length: blankCount }).map((_, blankIdx) => {
                                const correctArr = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer || ''];
                                return (
                                    <div key={blankIdx} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 w-16 flex-shrink-0">Trou {blankIdx + 1} :</span>
                                        <Input
                                            value={correctArr[blankIdx] || ''}
                                            onChange={(e) => {
                                                const newArr = [...correctArr];
                                                while (newArr.length <= blankIdx) newArr.push('');
                                                newArr[blankIdx] = e.target.value;
                                                updateQuestion(index, 'correctAnswer', newArr);
                                            }}
                                            placeholder={`Valeur du trou ${blankIdx + 1}`}
                                            className="h-8 text-sm font-mono border-emerald-300 bg-emerald-50/50"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <Input
                            value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                            onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                            placeholder="La réponse attendue"
                            className="h-8 text-sm font-mono border-emerald-300 bg-emerald-50/50"
                        />
                    )}
                </div>
            </div>
        );
    };

    // ===== MAIN QUESTION FORM RENDERER =====

    const renderQuestionForm = (question: Question, index: number) => {
        const isExpanded = expandedQuestions.has(index);
        const typeInfo = getTypeInfo(question.questionType);
        const hasQuestion = !!question.question.trim();

        return (
            <div key={index} className={`rounded-xl border-2 transition-all ${isExpanded ? 'border-gray-300 shadow-sm' : 'border-gray-200'}`}>
                {/* Collapsed header */}
                <button
                    type="button"
                    onClick={() => toggleQuestion(index)}
                    className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-gray-50/50 transition-colors rounded-t-xl"
                >
                    <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                        {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${typeInfo.color}`}>
                                {typeInfo.icon}
                                <span className="ml-1">{typeInfo.label}</span>
                            </Badge>
                            <span className="text-sm text-gray-700 truncate">
                                {hasQuestion ? question.question.slice(0, 60) + (question.question.length > 60 ? '...' : '') : 'Nouvelle question'}
                            </span>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 flex-shrink-0">
                        {question.point} pt{question.point > 1 ? 's' : ''}
                    </Badge>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                    <div className="border-t border-gray-200 p-4 space-y-4">
                        {/* Type selector + points */}
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                            <div>
                                <Label className="text-xs text-gray-500 mb-1.5 block">Type de question</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                                    {QUESTION_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => changeQuestionType(index, type.value)}
                                            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-all text-left ${
                                                question.questionType === type.value
                                                    ? `${type.color} border-current font-medium shadow-sm`
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {type.icon}
                                            <span className="truncate">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {question.questionType && (
                                    <p className="text-[11px] text-gray-400 mt-1.5 ml-0.5">
                                        {getTypeInfo(question.questionType).description}
                                    </p>
                                )}
                            </div>
                            <div className="sm:w-24">
                                <Label className="text-xs text-gray-500 mb-1.5 block">Points</Label>
                                <Input
                                    type="number"
                                    min="0.25"
                                    step="0.25"
                                    value={question.point}
                                    onChange={(e) => updateQuestion(index, 'point', parseFloat(e.target.value) || 0)}
                                    className="h-9 text-sm text-center"
                                />
                            </div>
                        </div>

                        {/* Question text */}
                        <div>
                            <Label className="text-xs text-gray-500 mb-1.5 block">Énoncé de la question</Label>
                            <Textarea
                                value={question.question}
                                onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                placeholder="Tapez votre question... (Utilisez $...$ pour du LaTeX)"
                                className="min-h-[80px] text-sm"
                            />
                            {question.question && question.question.includes('$') && (
                                <div className="mt-1.5 p-2 bg-gray-50 rounded-lg text-sm">
                                    {renderLatexPreview(question.question)}
                                </div>
                            )}
                        </div>

                        {/* Image URL */}
                        <div>
                            <Label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                                <Image className="w-3 h-3" />
                                Image (URL, optionnel)
                            </Label>
                            <Input
                                value={question.questionPic || ''}
                                onChange={(e) => updateQuestion(index, 'questionPic', e.target.value)}
                                placeholder="https://exemple.com/image.png"
                                className="h-8 text-sm text-gray-500"
                            />
                            {question.questionPic && (
                                <img src={question.questionPic} alt="Aperçu" className="mt-2 max-h-32 rounded-lg border" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            )}
                        </div>

                        {/* Type-specific fields */}
                        <div className="pt-1">
                            {question.questionType === 'QCM' && renderQCMFields(question, index)}
                            {question.questionType === 'Vrai/Faux' && renderVraiFauxFields(question, index)}
                            {question.questionType === 'Réponse courte' && renderReponseCourteFields(question, index)}
                            {question.questionType === 'Classement' && renderClassementFields(question, index)}
                            {question.questionType === 'Glisser-déposer' && renderGlisserDeposerFields(question, index)}
                            {question.questionType === 'Slider' && renderSliderFields(question, index)}
                            {question.questionType === 'Code' && renderCodeFields(question, index)}
                            {question.questionType === 'Texte à trous' && renderTexteATrousFields(question, index)}
                        </div>

                        {/* Explanation */}
                        <div>
                            <Label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                                <Lightbulb className="w-3 h-3" />
                                Explication (affichée après soumission, optionnel)
                            </Label>
                            <Textarea
                                value={question.explanation || ''}
                                onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                                placeholder="Pourquoi cette réponse est correcte ? L'explication aide l'élève à comprendre..."
                                className="min-h-[60px] text-sm"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button" variant="ghost" size="sm"
                                    onClick={() => duplicateQuestion(index)}
                                    className="h-7 text-xs text-gray-500"
                                >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Dupliquer
                                </Button>
                            </div>
                            <Button
                                type="button" variant="ghost" size="sm"
                                onClick={() => removeQuestion(index)}
                                className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Supprimer
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ===== MAIN RENDER =====

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            {/* Quiz info card */}
            <Card className="border-2">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Informations du quiz</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm">Titre du quiz *</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex : Quiz - Les fonctions dérivées"
                            required
                        />
                    </div>
                    <div>
                        <Label className="text-sm">Description (optionnel)</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Décrivez brièvement le contenu de ce quiz..."
                            className="min-h-[60px]"
                        />
                    </div>

                    {needsCourseSelection && (
                        <>
                            <div>
                                <Label className="text-sm">Cours *</Label>
                                <Input
                                    placeholder="Rechercher un cours..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="mb-2"
                                />
                                <Select
                                    value={selectedCourseId}
                                    onValueChange={(value) => { setSelectedCourseId(value); setSelectedSectionId(''); }}
                                    disabled={loadingCourses}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingCourses ? "Chargement..." : "Choisissez un cours"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loadingCourses ? (
                                            <div className="flex items-center justify-center py-4"><Loader2 className="animate-spin w-5 h-5" /></div>
                                        ) : filteredCourses.length > 0 ? (
                                            filteredCourses.map((course) => (
                                                <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-2 py-4 text-sm text-gray-500 text-center">Aucun cours trouvé</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedCourseId && selectedCourse && (
                                <div>
                                    <Label className="text-sm">Section *</Label>
                                    <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedCourse.sections.length > 0 ? (
                                                selectedCourse.sections.map((section) => (
                                                    <SelectItem key={section._id} value={section._id}>{section.title}</SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-4 text-sm text-gray-500 text-center">Aucune section dans ce cours</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Compétences liées */}
            <Card className="border-2">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-500" />
                        Compétences du programme
                        <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500 mb-3">
                        Liez ce quiz aux compétences du programme officiel. Les élèves valideront automatiquement ces compétences en réussissant le quiz.
                    </p>
                    <SkillPicker
                        selectedSkills={competencies}
                        onChange={setCompetencies}
                        placeholder="Rechercher une compétence (ex: équation, fraction, calcul...)"
                    />
                </CardContent>
            </Card>

            {/* Bonus / Malus temps */}
            <Card className="border-2">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Bonus / Malus temps
                        <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Bonus */}
                    <div className={`rounded-xl border-2 p-4 transition-colors ${timeBonusEnabled ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${timeBonusEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <ArrowUp className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Bonus de rapidité</p>
                                    <p className="text-xs text-gray-400">Récompense les élèves rapides</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTimeBonusEnabled(!timeBonusEnabled)}
                                className={`relative w-10 h-5 rounded-full transition-colors ${timeBonusEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                            >
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${timeBonusEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        {timeBonusEnabled && (
                            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-emerald-200">
                                <div>
                                    <Label className="text-xs text-gray-500">Temps cible (minutes)</Label>
                                    <Input
                                        type="number" min="1" step="1"
                                        value={timeBonusTarget}
                                        onChange={(e) => setTimeBonusTarget(parseInt(e.target.value) || 1)}
                                        className="h-8 text-sm"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Si fini avant ce temps → bonus</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Bonus (%)</Label>
                                    <Input
                                        type="number" min="1" max="100" step="1"
                                        value={timeBonusPercent}
                                        onChange={(e) => setTimeBonusPercent(parseInt(e.target.value) || 1)}
                                        className="h-8 text-sm"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Ex: 15 = +15% sur le score</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Malus */}
                    <div className={`rounded-xl border-2 p-4 transition-colors ${timePenaltyEnabled ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${timePenaltyEnabled ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <ArrowDown className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Malus de lenteur</p>
                                    <p className="text-xs text-gray-400">Pénalise les dépassements de temps</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTimePenaltyEnabled(!timePenaltyEnabled)}
                                className={`relative w-10 h-5 rounded-full transition-colors ${timePenaltyEnabled ? 'bg-red-500' : 'bg-gray-300'}`}
                            >
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${timePenaltyEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        {timePenaltyEnabled && (
                            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-red-200">
                                <div>
                                    <Label className="text-xs text-gray-500">Temps max (minutes)</Label>
                                    <Input
                                        type="number" min="1" step="1"
                                        value={timePenaltyMax}
                                        onChange={(e) => setTimePenaltyMax(parseInt(e.target.value) || 1)}
                                        className="h-8 text-sm"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Malus après ce temps</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Malus (%/min)</Label>
                                    <Input
                                        type="number" min="1" max="50" step="1"
                                        value={timePenaltyPerMin}
                                        onChange={(e) => setTimePenaltyPerMin(parseInt(e.target.value) || 1)}
                                        className="h-8 text-sm"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">% retiré par minute</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Malus max (%)</Label>
                                    <Input
                                        type="number" min="5" max="100" step="5"
                                        value={timePenaltyMaxPercent}
                                        onChange={(e) => setTimePenaltyMaxPercent(parseInt(e.target.value) || 5)}
                                        className="h-8 text-sm"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Plafond de pénalité</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    {(timeBonusEnabled || timePenaltyEnabled) && (
                        <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                            <p className="font-medium text-gray-700">Exemple sur un score de 8/10 :</p>
                            {timeBonusEnabled && (
                                <p className="text-emerald-600">
                                    Fini en {Math.max(1, timeBonusTarget - 1)} min → 8 × {(1 + timeBonusPercent / 100).toFixed(2)} = <strong>{Math.round(8 * (1 + timeBonusPercent / 100))}</strong> pts (+{timeBonusPercent}%)
                                </p>
                            )}
                            <p className="text-gray-500">Fini dans les temps → <strong>8</strong> pts (pas de modification)</p>
                            {timePenaltyEnabled && (
                                <p className="text-red-600">
                                    Fini en {timePenaltyMax + 2} min (2 min de dépassement) → 8 × {(1 - Math.min(2 * timePenaltyPerMin, timePenaltyMaxPercent) / 100).toFixed(2)} = <strong>{Math.round(8 * (1 - Math.min(2 * timePenaltyPerMin, timePenaltyMaxPercent) / 100))}</strong> pts (-{Math.min(2 * timePenaltyPerMin, timePenaltyMaxPercent)}%)
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Questions card */}
            <Card className="border-2">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Questions</CardTitle>
                            {questions.length > 0 && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {questions.length} question{questions.length > 1 ? 's' : ''} • {totalPoints} point{totalPoints > 1 ? 's' : ''} au total
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowLatexHelp(!showLatexHelp)} className="text-xs">
                                <Calculator className="h-3.5 w-3.5 mr-1" />
                                LaTeX
                            </Button>
                            <Button type="button" size="sm" onClick={addQuestion}>
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Question
                            </Button>
                        </div>
                    </div>

                    {showLatexHelp && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-700 space-y-1">
                            <p className="font-medium">Aide LaTeX :</p>
                            <p>• <code className="bg-blue-100 px-1 rounded">$x^2 + y^2$</code> → formule inline</p>
                            <p>• <code className="bg-blue-100 px-1 rounded">$$\frac{'{a}'}{'{b}'}$$</code> → formule en bloc</p>
                            <p>• Fonctionne dans les questions et les réponses QCM</p>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {questions.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Plus className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Aucune question</p>
                            <p className="text-xs text-gray-400 mb-4">Cliquez ci-dessous pour ajouter votre première question</p>
                            <Button type="button" onClick={addQuestion} size="sm">
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Ajouter une question
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {questions.map((question, index) => renderQuestionForm(question, index))}
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                Ajouter une question
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex items-center gap-3 sticky bottom-0 bg-white/80 backdrop-blur-sm py-4 border-t border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
                <Button type="submit" disabled={isSubmitting || !title || !selectedSectionId || questions.length === 0} className="flex-1 sm:flex-none">
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder le quiz'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Annuler
                </Button>
                {questions.length > 0 && (
                    <span className="text-xs text-gray-400 hidden sm:block ml-auto">
                        {questions.length} question{questions.length > 1 ? 's' : ''} • {totalPoints} pt{totalPoints > 1 ? 's' : ''}
                    </span>
                )}
            </div>
        </form>
    );
}
