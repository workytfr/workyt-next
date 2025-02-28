"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils"; // ShadCN helper
import { Home, Book, FileText, Users, Settings, LibraryBig, CircleDot } from "lucide-react";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Cours", href: "/dashboard/cours", icon: Book },
    { name: "Leçons", href: "/dashboard/lessons", icon: FileText },
    { name: "Quizz", href: "/dashboard/quizzes", icon: CircleDot, disabled: true },
    { name: "Exercices", href: "/dashboard/exercises", icon: LibraryBig },
    { name: "Utilisateurs", href: "/dashboard/users", icon: Users, adminOnly: true },
    { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r p-4">
            <h1 className="text-xl font-bold mb-6">Dashboard</h1>
            <nav>
                {navItems.map(({ name, href, icon: Icon, adminOnly, disabled }) => (
                    <Link
                        key={href}
                        href={disabled ? "#" : href}
                        className={cn(
                            "flex items-center px-4 py-2 rounded-md hover:bg-gray-200 transition",
                            pathname === href ? "bg-gray-300 font-semibold" : "",
                            disabled ? "text-gray-400 cursor-not-allowed" : ""
                        )}
                        onClick={e => disabled && e.preventDefault()}
                    >
                        <Icon className="w-5 h-5 mr-2" />
                        {name}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
