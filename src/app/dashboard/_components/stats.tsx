import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function Stats() {
    return (
        <div className="grid grid-cols-4 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Cours</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">25</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Leçons</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">120</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Quizz</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">50</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">320</p>
                </CardContent>
            </Card>
        </div>
    );
}
