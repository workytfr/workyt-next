import Stats from "./_components/stats"
import PartnerStats from "./_components/partnerStats"

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold mb-4">Statistiques Générales</h2>
                <Stats />
            </div>
            
            <div>
                <h2 className="text-xl font-bold mb-4">Statistiques des Partenaires</h2>
                <PartnerStats />
            </div>
            
            <div>
                <h2 className="text-xl font-bold mb-4">Bienvenue sur le tableau de bord</h2>
                <p className="text-gray-600">Sélectionnez une section dans la barre latérale pour gérer le contenu.</p>
            </div>
        </div>
    );
}
