'use client';

import { useState } from 'react';
import { CheckCircle, PlayCircle, Trophy, Target, Star, Lock, Zap, Timer, Award } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Quiz } from './types';
import "./styles/notion-theme.css";

interface QuizCardProps {
    quiz: Quiz;
    onStartQuiz: (quizId: string) => void;
}

export default function QuizCard({ quiz, onStartQuiz }: QuizCardProps) {
    const { data: session } = useSession();
    const [isHovered, setIsHovered] = useState(false);

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return '#10b981';
        if (percentage >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreBgColor = (percentage: number) => {
        if (percentage >= 80) return '#ecfdf5';
        if (percentage >= 60) return '#fffbeb';
        return '#fef2f2';
    };

    const getScoreLabel = (percentage: number) => {
        if (percentage >= 80) return 'Excellent';
        if (percentage >= 60) return 'Bien';
        return 'À revoir';
    };

    return (
        <div 
            className={`notion-card p-0 overflow-hidden transition-all duration-300 ${
                quiz.completed ? 'ring-2' : ''
            } ${
                session?.user ? 'cursor-pointer' : ''
            }`}
            style={{
                borderRadius: '24px',
                ['--tw-ring-color' as string]: quiz.completed ? getScoreColor(quiz.percentage || 0) : 'transparent'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => session?.user && onStartQuiz(quiz._id)}
        >
            {/* Header avec gradient */}
            <div 
                className={`px-6 py-5 relative overflow-hidden ${
                    quiz.completed 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                        : 'bg-gradient-to-r from-orange-50 to-amber-50'
                }`}
            >
                {/* Pattern de fond subtil */}
                <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
                
                <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div 
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                                quiz.completed 
                                    ? 'bg-white text-green-500' 
                                    : 'bg-white text-orange-500'
                            }`}
                        >
                            {quiz.completed ? (
                                <Award className="w-6 h-6" />
                            ) : (
                                <Zap className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#37352f] line-clamp-1 text-base">
                                {quiz.title}
                            </h3>
                            {quiz.completed && quiz.percentage !== undefined && (
                                <span 
                                    className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                                    style={{ 
                                        color: getScoreColor(quiz.percentage),
                                        backgroundColor: getScoreBgColor(quiz.percentage)
                                    }}
                                >
                                    {getScoreLabel(quiz.percentage)} • {quiz.percentage}%
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Badge de statut */}
                    <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            quiz.completed 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-orange-100 text-orange-600'
                        }`}
                    >
                        {quiz.completed ? <CheckCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    </div>
                </div>
            </div>
            
            {/* Content */}
            <div className="px-6 py-5">
                {quiz.description && (
                    <p className="text-sm text-[#6b6b6b] line-clamp-2 mb-4 leading-relaxed">
                        {quiz.description}
                    </p>
                )}
                
                {/* Stats en ligne */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-[#6b6b6b]">
                        <Target className="w-4 h-4 text-[#9ca3af]" />
                        <span>{quiz.questionsCount} questions</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-[#e3e2e0]" />
                    <div className="flex items-center gap-1.5 text-sm text-[#6b6b6b]">
                        <Trophy className="w-4 h-4 text-[#9ca3af]" />
                        <span>{quiz.totalPoints} pts</span>
                    </div>
                </div>
                
                {/* Score si complété */}
                {quiz.completed && quiz.percentage !== undefined && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#6b6b6b]">Votre score</span>
                            <span className="text-sm font-semibold" style={{ color: getScoreColor(quiz.percentage) }}>
                                {quiz.score}/{quiz.maxScore}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-[#f1f1ef] rounded-full overflow-hidden">
                            <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                    width: `${quiz.percentage}%`,
                                    backgroundColor: getScoreColor(quiz.percentage)
                                }}
                            />
                        </div>
                    </div>
                )}
                
                {/* Bouton d'action */}
                {session?.user ? (
                    <button 
                        className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            quiz.completed 
                                ? 'bg-[#ecfdf5] text-green-700 hover:bg-green-100 border border-green-200' 
                                : 'bg-[#37352f] text-white hover:bg-black'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onStartQuiz(quiz._id);
                        }}
                    >
                        {quiz.completed ? (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Revoir le quiz
                            </>
                        ) : (
                            <>
                                <PlayCircle className="w-4 h-4" />
                                Commencer
                            </>
                        )}
                    </button>
                ) : (
                    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-[#f1f1ef] rounded-xl text-sm text-[#9ca3af]">
                        <Lock className="w-4 h-4" />
                        <span>Connexion requise</span>
                    </div>
                )}
            </div>
        </div>
    );
}
