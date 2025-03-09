"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useSession } from "next-auth/react";

export default function Stats() {
    const { data: session } = useSession();
    const [stats, setStats] = useState({
        courses: 0,
        lessons: 0,
        quizzes: 0,
        users: 0,
        questions: 0,
        answers: 0
    });

    useEffect(() => {
        async function fetchStats() {
            if (!session?.accessToken) return;
            try {
                const response = await fetch("/api/dashboard/stats", {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });
                if (!response.ok) throw new Error("Erreur lors de la récupération des statistiques");
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error(error);
            }
        }
        fetchStats();
    }, [session]);

    return (
        <div className="grid grid-cols-3 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Cours</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.courses}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Leçons</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.lessons}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Quizz</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.quizzes}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.users}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Questions du forum</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.questions}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Réponses du forum</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.answers}</p>
                </CardContent>
            </Card>
        </div>
    );
}
