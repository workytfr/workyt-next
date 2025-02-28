import Sidebar from "./_components/sidebar"
import Header from "./_components/header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Barre latérale */}
            <Sidebar />
            {/* Contenu principal */}
            <div className="flex flex-col flex-1">
                <Header />
                <main className="p-6 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
