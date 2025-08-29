'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { CheckCircle, PlayCircle, Trophy, Lock, Clock, Target, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface QuizCardProps {
    quiz: {
        _id: string;
        title: string;
        description?: string;
        questionsCount: number;
        totalPoints: number;
        completed?: boolean;
        score?: number;
        maxScore?: number;
        percentage?: number;
    };
    onStartQuiz: (quizId: string) => void;
}

export default function QuizCard({ quiz, onStartQuiz }: QuizCardProps) {
    const { data: session } = useSession();
    const [isHovered, setIsHovered] = useState(false);

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadgeVariant = (percentage: number) => {
        if (percentage >= 80) return 'default';
        if (percentage >= 60) return 'secondary';
        return 'destructive';
    };

    return (
        <Card 
            className={`group relative overflow-hidden transition-all duration-300 cursor-pointer ${
                isHovered ? 'shadow-xl scale-105 -translate-y-1' : 'shadow-lg hover:shadow-xl'
            } ${
                quiz.completed 
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' 
                    : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onStartQuiz(quiz._id)}
        >
            {/* Effet de brillance au survol */}
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 transition-transform duration-500 ${
                isHovered ? 'translate-x-full' : '-translate-x-full'
            }`} />
            
            {/* Badge de statut */}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                {quiz.completed ? (
                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        <span className="hidden sm:inline">Terminé</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        <PlayCircle className="h-3 w-3" />
                        <span className="hidden sm:inline">Disponible</span>
                    </div>
                )}
            </div>

            <CardHeader className="pb-3 sm:pb-4 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-200 flex items-center gap-2">
                        {quiz.completed ? (
                            <div className="p-1 bg-green-100 rounded-full">
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            </div>
                        ) : (
                            <div className="p-1 bg-blue-100 rounded-full">
                                <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            </div>
                        )}
                        <span className="line-clamp-2">{quiz.title}</span>
                    </CardTitle>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6">
                {quiz.description && (
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {quiz.description}
                    </p>
                )}
                
                {/* Statistiques du quiz */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 p-2 bg-white/50 rounded-lg">
                        <Target className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                        <div>
                            <p className="text-xs text-gray-500">Questions</p>
                            <p className="text-xs sm:text-sm font-semibold text-gray-800">
                                {quiz.questionsCount}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-white/50 rounded-lg">
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                        <div>
                            <p className="text-xs text-gray-500">Points</p>
                            <p className="text-xs sm:text-sm font-semibold text-gray-800">
                                {quiz.totalPoints}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Résultats si complété */}
                {quiz.completed && quiz.percentage !== undefined && (
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                                <span className="text-xs sm:text-sm font-medium text-gray-700">Votre score</span>
                            </div>
                            <Badge 
                                variant={getScoreBadgeVariant(quiz.percentage)}
                                className="text-xs"
                            >
                                {quiz.percentage}%
                            </Badge>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600">Progression</span>
                                <span className={`font-semibold ${getScoreColor(quiz.percentage)}`}>
                                    {quiz.score}/{quiz.maxScore} points
                                </span>
                            </div>
                            <Progress 
                                value={quiz.percentage} 
                                className="h-2"
                            />
                        </div>
                    </div>
                )}
                
                {/* Bouton d'action */}
                {session?.user ? (
                    <Button 
                        className={`w-full mt-3 sm:mt-4 transition-all duration-200 text-sm sm:text-base ${
                            quiz.completed 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onStartQuiz(quiz._id);
                        }}
                    >
                        {quiz.completed ? (
                            <>
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                Revoir le quiz
                            </>
                        ) : (
                            <>
                                <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                Commencer le quiz
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-xs sm:text-sm font-medium">Connectez-vous pour participer</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 