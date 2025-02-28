import Stats from "./_components/stats"

export default function DashboardPage() {
    return (
        <div>
            <Stats />
            <h2 className="text-xl font-bold mt-6">Bienvenue sur le tableau de bord</h2>
            <p className="text-gray-600">Sélectionnez une section dans la barre latérale.</p>
        </div>
    );
}
