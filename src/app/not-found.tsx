import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Page non trouvée | Workyt",
    description: "La page que vous recherchez n'existe pas ou a été déplacée.",
    robots: { index: false, follow: true },
};

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Page non trouvée
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
                La page que vous recherchez n&apos;existe pas ou a été déplacée.
            </p>
            <div className="flex gap-4">
                <Link
                    href="/"
                    className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                    Accueil
                </Link>
                <Link
                    href="/forum"
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                    Forum
                </Link>
                <Link
                    href="/fiches"
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                    Fiches
                </Link>
            </div>
        </div>
    );
}
