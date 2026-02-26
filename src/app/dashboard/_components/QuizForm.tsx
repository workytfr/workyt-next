'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Plus, Trash2, Save, X, Calculator, Loader2 } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface ICourse {
    _id: string;
    title: string;
    sections: { _id: string; title: string }[];
}

interface Question {
    question: string;
    questionType: 'QCM' | 'Réponse courte' | 'Vrai/Faux' | 'Association' | 'Texte à trous';
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

export default function QuizForm({ sectionId: propSectionId, onSave, onCancel, initialData }: QuizFormProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLatexPreview, setShowLatexPreview] = useState(false);

    // Sélection cours/section
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedSectionId, setSelectedSectionId] = useState<string>(
        propSectionId || initialData?.sectionId?._id || initialData?.sectionId || ''
    );

    // Si sectionId est fourni en prop, pas besoin de charger les cours
    const needsCourseSelection = !propSectionId;

    // Charger les cours une seule fois (seulement si pas de sectionId en prop)
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

                // En édition, pré-sélectionner le cours de la section existante
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

    const filteredCourses = searchQuery.trim()
        ? courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : courses;

    const selectedCourse = courses.find(c => c._id === selectedCourseId);

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

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
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
        const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

        return parts.map((part, index) => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
                const latex = part.slice(2, -2);
                return (
                    <div key={index} className="my-2">
                        <BlockMath math={latex} />
                    </div>
                );
            } else if (part.startsWith('$') && part.endsWith('$')) {
                const latex = part.slice(1, -1);
                return (
                    <span key={index}>
                        <InlineMath math={latex} />
                    </span>
                );
            } else {
                return <span key={index}>{part}</span>;
            }
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
            const quizData = {
                title,
                description,
                sectionId: selectedSectionId,
                questions
            };

            onSave(quizData);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde du quiz');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderQuestionForm = (question: Question, index: number) => (
        <Card key={index} className="mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Type de question</Label>
                        <Select
                            value={question.questionType}
                            onValueChange={(value: any) => updateQuestion(index, 'questionType', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="QCM">QCM</SelectItem>
                                <SelectItem value="Vrai/Faux">Vrai/Faux</SelectItem>
                                <SelectItem value="Réponse courte">Réponse courte</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Points</Label>
                        <Input
                            type="number"
                            min="1"
                            value={question.point}
                            onChange={(e) => updateQuestion(index, 'point', parseInt(e.target.value))}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <Label>Question</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLatexPreview(!showLatexPreview)}
                        >
                            <Calculator className="h-4 w-4 mr-1" />
                            {showLatexPreview ? 'Masquer' : 'Aperçu'} LaTeX
                        </Button>
                    </div>
                    <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        placeholder="Tapez votre question... Utilisez $...$ pour du LaTeX inline ou $$...$$ pour du LaTeX en bloc"
                        className="min-h-[100px]"
                    />
                    {showLatexPreview && question.question && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <Label className="text-sm text-gray-600 mb-2">Aperçu :</Label>
                            <div className="prose prose-sm max-w-none">
                                {renderLatexPreview(question.question)}
                            </div>
                        </div>
                    )}
                </div>

                {question.questionType === 'QCM' && (
                    <>
                        <div>
                            <Label>Type de sélection</Label>
                            <Select
                                value={question.answerSelectionType}
                                onValueChange={(value: any) => updateQuestion(index, 'answerSelectionType', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">Une seule réponse</SelectItem>
                                    <SelectItem value="multiple">Plusieurs réponses</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Réponses</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addAnswer(index)}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Ajouter
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {question.answers.map((answer, answerIndex) => (
                                    <div key={answerIndex} className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <Input
                                                value={answer}
                                                onChange={(e) => updateAnswer(index, answerIndex, e.target.value)}
                                                placeholder={`Réponse ${answerIndex + 1} (utilisez $...$ pour LaTeX)`}
                                            />
                                            {showLatexPreview && answer && (
                                                <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                                                    <div className="prose prose-xs max-w-none">
                                                        {renderLatexPreview(answer)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type={question.answerSelectionType === 'single' ? 'radio' : 'checkbox'}
                                            name={`correct-${index}`}
                                            checked={
                                                question.answerSelectionType === 'single'
                                                    ? question.correctAnswer === answerIndex
                                                    : Array.isArray(question.correctAnswer) && question.correctAnswer.includes(answerIndex)
                                            }
                                            onChange={(e) => {
                                                if (question.answerSelectionType === 'single') {
                                                    updateQuestion(index, 'correctAnswer', answerIndex);
                                                } else {
                                                    const currentCorrect = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                                                    if (e.target.checked) {
                                                        updateQuestion(index, 'correctAnswer', [...currentCorrect, answerIndex]);
                                                    } else {
                                                        updateQuestion(index, 'correctAnswer', currentCorrect.filter((i: number) => i !== answerIndex));
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeAnswer(index, answerIndex)}
                                            disabled={question.answers.length <= 2}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {question.questionType === 'Vrai/Faux' && (
                    <div>
                        <Label>Réponse correcte</Label>
                        <Select
                            value={question.correctAnswer?.toString() || ''}
                            onValueChange={(value) => updateQuestion(index, 'correctAnswer', value === 'true')}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Vrai</SelectItem>
                                <SelectItem value="false">Faux</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {question.questionType === 'Réponse courte' && (
                    <div>
                        <Label>Réponse correcte</Label>
                        <Input
                            value={question.correctAnswer || ''}
                            onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                            placeholder="Tapez la réponse correcte..."
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informations du quiz</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Titre du quiz *</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Titre du quiz..."
                            required
                        />
                    </div>
                    <div>
                        <Label>Description (optionnel)</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description du quiz..."
                        />
                    </div>

                    {/* Sélection cours / section (uniquement si pas de sectionId en prop) */}
                    {needsCourseSelection && (
                        <>
                            <div>
                                <Label>Cours *</Label>
                                <Input
                                    placeholder="Rechercher un cours..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="mb-2"
                                />
                                <Select
                                    value={selectedCourseId}
                                    onValueChange={(value) => {
                                        setSelectedCourseId(value);
                                        setSelectedSectionId('');
                                    }}
                                    disabled={loadingCourses}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingCourses ? "Chargement..." : "Choisissez un cours"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loadingCourses ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="animate-spin w-5 h-5" />
                                            </div>
                                        ) : filteredCourses.length > 0 ? (
                                            filteredCourses.map((course) => (
                                                <SelectItem key={course._id} value={course._id}>
                                                    {course.title}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-2 py-4 text-sm text-gray-500 text-center">
                                                Aucun cours trouvé
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedCourseId && selectedCourse && (
                                <div>
                                    <Label>Section *</Label>
                                    <Select
                                        value={selectedSectionId}
                                        onValueChange={setSelectedSectionId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedCourse.sections.length > 0 ? (
                                                selectedCourse.sections.map((section) => (
                                                    <SelectItem key={section._id} value={section._id}>
                                                        {section.title}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-4 text-sm text-gray-500 text-center">
                                                    Aucune section dans ce cours
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Questions</CardTitle>
                        <Button type="button" onClick={addQuestion}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une question
                        </Button>
                    </div>
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                        <strong>Aide LaTeX :</strong>
                        <ul className="mt-1 space-y-1">
                            <li>• Utilisez $...$ pour des formules inline</li>
                            <li>• Utilisez $$...$$ pour des formules en bloc</li>
                            <li>• Exemples : $x^2$, fractions, racines carrées</li>
                        </ul>
                    </div>
                </CardHeader>
                <CardContent>
                    {questions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Aucune question ajoutée. Cliquez sur &quot;Ajouter une question&quot; pour commencer.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((question, index) => renderQuestionForm(question, index))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting || !title || !selectedSectionId || questions.length === 0}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder le quiz'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Annuler
                </Button>
            </div>
        </form>
    );
}
