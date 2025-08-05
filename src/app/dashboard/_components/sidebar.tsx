"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils"; // ShadCN helper
import { Home, Book, FileText, Users, Settings, LibraryBig, CircleDot, Award, Layers } from "lucide-react";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Cours", href: "/dashboard/cours", icon: Book },
    { name: "Sections", href: "/dashboard/sections", icon: Layers },
    { name: "Leçons", href: "/dashboard/lessons", icon: FileText },
    { name: "Quiz", href: "/dashboard/quizzes", icon: CircleDot },
    { name: "Exercices", href: "/dashboard/exercises", icon: LibraryBig },
    { name: "Certificats", href: "/dashboard/certificates", icon: Award },
    { name: "Utilisateurs", href: "/dashboard/users", icon: Users, adminOnly: true },
    { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    // 🔥 Forcer le mode clair sur le body
    useEffect(() => {
        document.body.classList.remove("dark"); // Supprime le mode sombre
        document.body.style.backgroundColor = "white"; // Force le fond en blanc
        document.body.style.color = "black"; // Force le texte en noir
    }, []);

    return (
        <aside className="w-64 bg-white text-black border-r border-gray-300 p-4">
            <h1 className="text-xl font-bold mb-6">Dashboard</h1>
            <nav>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center px-4 py-2 rounded-md hover:bg-gray-100 transition text-black",
                            pathname === item.href ? "bg-gray-200 font-semibold" : ""
                        )}
                    >
                        <item.icon className="w-5 h-5 mr-2" />
                        {item.name}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
