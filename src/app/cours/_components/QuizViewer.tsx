'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { CheckCircle, XCircle, Trophy, Clock, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface Question {
    question: string;
    questionType: 'QCM' | 'Réponse courte' | 'Vrai/Faux' | 'Association' | 'Texte à trous';
    questionPic?: string;
    answerSelectionType: 'single' | 'multiple';
    answers: string[];
    point: number;
}

interface Quiz {
    _id: string;
    title: string;
    description?: string;
    questions: Question[];
}

interface QuizViewerProps {
    quiz: Quiz;
    onClose: () => void;
    onComplete: (result: any) => void;
    isCompleted?: boolean;
}

export default function QuizViewer({ quiz, onClose, onComplete, isCompleted }: QuizViewerProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<any[]>([]);
    const [timeSpent, setTimeSpent] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState<any>(null);

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

    const handleAnswerChange = (answer: any) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = answer;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestion < quiz.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = async () => {
        if (!session) return;
        
        if (isCompleted) {
            alert('Vous avez déjà complété ce quiz. Vous ne pouvez pas le refaire pour gagner des points.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/quizzes/${quiz._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers: answers,
                    timeSpent: timeSpent
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setResults(result);
                setShowResults(true);
                onComplete(result);
            } else {
                const error = await response.json();
                alert(error.error || 'Erreur lors de la soumission du quiz');
            }
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            alert('Erreur lors de la soumission du quiz');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderLatexContent = (text: string) => {
        // Remplacer les expressions LaTeX inline ($...$) et en bloc ($$...$$)
        const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
        
        return parts.map((part, index) => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
                // LaTeX en bloc
                const latex = part.slice(2, -2);
                return (
                    <div key={index} className="my-2">
                        <BlockMath math={latex} />
                    </div>
                );
            } else if (part.startsWith('$') && part.endsWith('$')) {
                // LaTeX inline
                const latex = part.slice(1, -1);
                return (
                    <span key={index}>
                        <InlineMath math={latex} />
                    </span>
                );
            } else {
                // Texte normal
                return <span key={index}>{part}</span>;
            }
        });
    };

    const renderQuestion = (question: Question, index: number) => {
        const currentAnswer = answers[index];

        switch (question.questionType) {
            case 'QCM':
                return (
                    <div className="space-y-2 sm:space-y-3">
                        {question.answers.map((answer, answerIndex) => (
                            <label key={answerIndex} className="flex items-start space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <input
                                    type={question.answerSelectionType === 'single' ? 'radio' : 'checkbox'}
                                    name={`question-${index}`}
                                    value={answerIndex}
                                    checked={
                                        question.answerSelectionType === 'single'
                                            ? currentAnswer === answerIndex
                                            : Array.isArray(currentAnswer) && currentAnswer.includes(answerIndex)
                                    }
                                    onChange={(e) => {
                                        if (question.answerSelectionType === 'single') {
                                            handleAnswerChange(parseInt(e.target.value));
                                        } else {
                                            const newAnswer = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                                            if (e.target.checked) {
                                                newAnswer.push(answerIndex);
                                            } else {
                                                const index = newAnswer.indexOf(answerIndex);
                                                if (index > -1) {
                                                    newAnswer.splice(index, 1);
                                                }
                                            }
                                            handleAnswerChange(newAnswer);
                                        }
                                    }}
                                    className="mt-1 mr-2 sm:mr-3 flex-shrink-0"
                                />
                                <span className="text-sm sm:text-base leading-relaxed">{renderLatexContent(answer)}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'Vrai/Faux':
                return (
                    <div className="space-y-2 sm:space-y-3">
                        <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                name={`question-${index}`}
                                value="true"
                                checked={currentAnswer === true}
                                onChange={() => handleAnswerChange(true)}
                                className="mr-2 sm:mr-3"
                            />
                            <span className="text-sm sm:text-base">Vrai</span>
                        </label>
                        <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                name={`question-${index}`}
                                value="false"
                                checked={currentAnswer === false}
                                onChange={() => handleAnswerChange(false)}
                                className="mr-2 sm:mr-3"
                            />
                            <span className="text-sm sm:text-base">Faux</span>
                        </label>
                    </div>
                );

            case 'Réponse courte':
                return (
                    <input
                        type="text"
                        value={currentAnswer || ''}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Tapez votre réponse..."
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base"
                    />
                );

            default:
                return <div>Type de question non supporté</div>;
        }
    };

    if (showResults && results) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                    <CardHeader className="p-3 sm:p-4 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                            Résultats du quiz
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                                {results.score}/{results.maxScore} points
                            </div>
                            <div className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4">
                                {results.percentage}% de réussite
                            </div>
                            <Progress value={results.percentage} className="h-2 sm:h-3 mb-3 sm:mb-4" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm sm:text-base">Détail des réponses :</h3>
                            {results.answers.map((answer: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 p-2 rounded">
                                    {answer.isCorrect ? (
                                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                                    )}
                                    <span className="text-xs sm:text-sm">
                                        Question {index + 1}: {answer.pointsEarned} point{answer.pointsEarned > 1 ? 's' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button onClick={onClose} className="flex-1 text-sm sm:text-base py-2 sm:py-2.5">
                                Fermer
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const currentQ = quiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <Card className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                            <span className="line-clamp-2">{quiz.title}</span>
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                            </div>
                            <Badge variant="secondary" className="text-xs sm:text-sm">
                                Question {currentQuestion + 1}/{quiz.questions.length}
                            </Badge>
                        </div>
                    </div>
                    <Progress value={progress} className="h-2 mt-3" />
                </CardHeader>

                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                            <h3 className="text-base sm:text-lg font-semibold">
                                Question {currentQuestion + 1}
                            </h3>
                            <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                                {currentQ.point} point{currentQ.point > 1 ? 's' : ''}
                            </Badge>
                        </div>

                        <div className="text-gray-700 text-sm sm:text-base leading-relaxed">
                            {renderLatexContent(currentQ.question)}
                        </div>

                        {currentQ.questionPic && (
                            <img 
                                src={currentQ.questionPic} 
                                alt="Question" 
                                className="max-w-full h-auto rounded-md shadow-sm"
                            />
                        )}

                        <div className="mt-3 sm:mt-4">
                            {renderQuestion(currentQ, currentQuestion)}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-3 sm:pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentQuestion === 0}
                            className="text-sm sm:text-base py-2 sm:py-2.5 order-2 sm:order-1"
                        >
                            Précédent
                        </Button>

                        <div className="flex gap-2 order-1 sm:order-2">
                            {currentQuestion === quiz.questions.length - 1 ? (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || answers.length !== quiz.questions.length || isCompleted}
                                    className="text-sm sm:text-base py-2 sm:py-2.5"
                                >
                                    {isSubmitting ? 'Soumission...' : isCompleted ? 'Quiz déjà complété' : 'Terminer le quiz'}
                                </Button>
                            ) : (
                                <Button onClick={handleNext} className="text-sm sm:text-base py-2 sm:py-2.5">
                                    Suivant
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 