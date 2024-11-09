"use client";
import React, { useState, useEffect, useRef } from "react";
import { Label } from "@radix-ui/react-label";

const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_SHORT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const CYCLE_THRESHOLD = 4;

export default function PomodoroTimer() {
    const [workDuration, setWorkDuration] = useState(DEFAULT_WORK_MINUTES);
    const [breakDuration, setBreakDuration] = useState(DEFAULT_SHORT_BREAK_MINUTES);
    const [timeLeft, setTimeLeft] = useState(workDuration * 60);
    const [isActive, setIsActive] = useState(false);
    const [isWorkSession, setIsWorkSession] = useState(true);
    const [cycleCount, setCycleCount] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    const sendNotification = (message: string) => {
        if (Notification.permission === "granted") {
            new Notification("Pomodoro Études", { body: message });
        }
    };

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;
        if (isActive && timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (timeLeft === 0) {
            if (isWorkSession) {
                sendNotification("Session de travail terminée ! Prends une pause.");
                playNotificationSound();
                setCycleCount((prev) => prev + 1);
                setIsWorkSession(false);
                setTimeLeft(
                    (cycleCount + 1) % CYCLE_THRESHOLD === 0
                        ? DEFAULT_LONG_BREAK_MINUTES * 60
                        : breakDuration * 60
                );
            } else {
                sendNotification("Pause terminée ! Retour au travail.");
                playNotificationSound();
                setIsWorkSession(true);
                setTimeLeft(workDuration * 60);
            }
            setIsActive(false);
        }
        return () => clearTimeout(timer);
    }, [timeLeft, isActive, isWorkSession, cycleCount, workDuration, breakDuration]);

    const startTimer = () => setIsActive(true);
    const pauseTimer = () => setIsActive(false);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(isWorkSession ? workDuration * 60 : breakDuration * 60);
    };

    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const seconds = String(timeLeft % 60).padStart(2, '0');

    const sessionLabel = isWorkSession
        ? "Session de Travail"
        : (cycleCount + 1) % CYCLE_THRESHOLD === 0
            ? "Pause Longue"
            : "Pause Courte";

    const sessionExplanation = isWorkSession
        ? "Travaillez avec concentration pendant la durée de la session de travail."
        : (cycleCount + 1) % CYCLE_THRESHOLD === 0
            ? "Prenez une pause longue bien méritée !"
            : "Pause courte pour récupérer avant la prochaine session.";

    const progressColor = isWorkSession
        ? "blue-500"
        : (cycleCount + 1) % CYCLE_THRESHOLD === 0
            ? "purple-500"
            : "green-500";

    const totalTime = isWorkSession
        ? workDuration * 60
        : (cycleCount + 1) % CYCLE_THRESHOLD === 0
            ? DEFAULT_LONG_BREAK_MINUTES * 60
            : breakDuration * 60;
    const progressPercentage = timeLeft / totalTime;
    const circumference = 48 * 2 * Math.PI;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div
                className="flex flex-col items-center p-6 w-full h-full max-w-full mx-auto bg-white rounded-lg space-y-6">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center"
                    style={{
                        background: "linear-gradient(90deg, #FFA500, #FF1493)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                    }}
                >
                    Pomodoro Moderne pour Études
                </h1>
                <p className="text-center text-gray-700">{sessionExplanation}</p>
                <div className="flex space-x-4">
                    <div>
                        <label className="text-gray-700">Durée de Travail (min):</label>
                        <input
                            type="number"
                            min="1"
                            placeholder={`${DEFAULT_WORK_MINUTES}`}
                            onChange={(e) => setWorkDuration(Number(e.target.value) || DEFAULT_WORK_MINUTES)}
                            className="mt-1 p-2 border rounded w-20"
                        />
                    </div>
                    <div>
                        <label className="text-gray-700">Durée de Pause (min):</label>
                        <input
                            type="number"
                            min="1"
                            placeholder={`${DEFAULT_SHORT_BREAK_MINUTES}`}
                            onChange={(e) => setBreakDuration(Number(e.target.value) || DEFAULT_SHORT_BREAK_MINUTES)}
                            className="mt-1 p-2 border rounded w-20"
                        />
                    </div>
                </div>

                <div className="relative flex items-center justify-center w-64 h-64">
                    <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                        <circle
                            cx="50%"
                            cy="50%"
                            r="48%"
                            stroke="lightgray"
                            strokeWidth="8"
                            fill="none"
                        />
                        <circle
                            cx="50%"
                            cy="50%"
                            r="48%"
                            stroke={`var(--${progressColor})`}
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - progressPercentage)}
                            style={{transition: 'stroke-dashoffset 1s linear'}}
                        />
                    </svg>
                    <div className="absolute text-4xl font-semibold text-blue-600">
                        {minutes}:{seconds}
                    </div>
                </div>

                <Label className="text-lg font-medium">{sessionLabel}</Label>
                <div className="flex space-x-4">
                    {isActive ? (
                        <button
                            onClick={pauseTimer}
                            className="bg-black text-white px-4 py-2 rounded-full"
                        > Pause </button>
                    ) : (
                        <button
                            onClick={startTimer}
                            className="bg-green-400 text-white px-4 py-2 rounded-full"
                        > Démarrer </button>
                    )}
                    <button onClick={resetTimer}
                            className="bg-red-400 text-white px-4 py-2 rounded-full"> Réinitialiser
                    </button>
                </div>
                <div className="text-center text-gray-500">
                    <p>Cycle actuel : {cycleCount}</p>
                    {cycleCount > 0 && (
                        <p>Sessions complétées : {Math.floor(cycleCount / CYCLE_THRESHOLD)} cycle(s) complet(s)</p>
                    )}
                </div>

                <audio ref={audioRef} src="/notification.mp3"/>
            </div>
        </div>
    );
}
