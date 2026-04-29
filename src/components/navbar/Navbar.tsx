"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AuthPage from "@/components/forms/RegisterForm";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
    InstagramLogoIcon,
    TwitterLogoIcon,
    DiscordLogoIcon,
    ChevronDownIcon,
    VideoIcon,
    LinkedInLogoIcon,
    Cross2Icon,
    HamburgerMenuIcon,
    PersonIcon,
    ExitIcon,
    FileTextIcon,
    ChatBubbleIcon,
    StarIcon,
    StarFilledIcon
} from "@radix-ui/react-icons";
import {
    MessageSquare,
    FileText,
    BookOpen,
    Newspaper,
    Heart,
    ChevronRight,
    Gift,
    Search,
    Ticket,
    ArrowUpRight,
} from "lucide-react";
import ProfileCard from "@/components/ui/ProfileCard";
import SearchCommandPalette from "@/components/SearchCommandPalette";
import StreakIndicator from "@/components/ui/StreakIndicator";
import MushroomIndicator from "@/components/ui/MushroomIndicator";
import NotificationBell from "@/components/NotificationBell";
import BookmarkBell from "@/components/BookmarkBell";
import QuestsPanel from "@/components/quests/QuestsPanel";

const navLinks = [
    { href: "/cours", label: "Cours", icon: BookOpen },
    { href: "/fiches", label: "Fiches", icon: FileText },
    { href: "/forum", label: "Forum", icon: MessageSquare },
];

const blogLinks = [
    { href: "https://blog.workyt.fr/category/actualites/", label: "Actualités", icon: Newspaper },
    { href: "https://blog.workyt.fr/category/conseils-methodes/", label: "Conseils & Méthodes", icon: BookOpen },
    { href: "https://blog.workyt.fr/category/culture/", label: "Culture", icon: BookOpen },
    { href: "https://blog.workyt.fr/category/orientation-scolaire/", label: "Orientation scolaire", icon: BookOpen },
];

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isQuestsOpen, setIsQuestsOpen] = useState(false);
    const [isBlogOpenMobile, setIsBlogOpenMobile] = useState(false);
    const [isBlogOpen, setIsBlogOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const blogRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();
    const pathname = usePathname();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024 && isMenuOpen) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMenuOpen]);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        if (isProfileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (blogRef.current && !blogRef.current.contains(e.target as Node)) {
                setIsBlogOpen(false);
            }
        };
        if (isBlogOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isBlogOpen]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('session_expired') === 'true' && !session) {
                setIsAuthOpen(true);
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, [session]);

    const closeMobileMenu = () => {
        setIsMenuOpen(false);
        setIsBlogOpenMobile(false);
    };

    const handleSignOut = () => {
        setIsProfileOpen(false);
        closeMobileMenu();
        signOut();
    };

    const isActive = (href: string) => pathname.startsWith(href);
    const linkBase = "relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors";

    return (
        <>
            <header className="sticky top-0 z-[100] px-3 pt-3 sm:px-4 sm:pt-4 safe-area-top">
                <div className="mx-auto max-w-[1400px]">
                    <nav className="flex items-center justify-between rounded-full border border-[rgba(26,21,18,0.1)] bg-white/75 px-3 py-2 backdrop-blur-md shadow-[0_6px_24px_rgba(26,21,18,0.06)] sm:px-4 sm:py-2.5">
                        {/* Logo */}
                        <Link href="/" className="flex flex-shrink-0 items-center gap-2 pl-1">
                            <Image
                                src="/workyt_fr.svg"
                                alt="Workyt"
                                width={70}
                                height={32}
                                className="h-6 w-auto sm:h-7"
                            />
                        </Link>

                        {/* Desktop nav */}
                        <div className="hidden flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`${linkBase} ${
                                        isActive(link.href)
                                            ? "text-orange-600"
                                            : "text-[rgba(26,21,18,0.75)] hover:bg-[rgba(26,21,18,0.05)] hover:text-[var(--wk-ink)]"
                                    }`}
                                >
                                    {link.label}
                                    {isActive(link.href) && (
                                        <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500" />
                                    )}
                                </Link>
                            ))}

                            {/* Blog dropdown */}
                            <div ref={blogRef} className="relative">
                                <button
                                    onClick={() => setIsBlogOpen(!isBlogOpen)}
                                    className={`${linkBase} flex items-center gap-1 outline-none ${
                                        pathname.includes("blog")
                                            ? "text-orange-600"
                                            : "text-[rgba(26,21,18,0.75)] hover:bg-[rgba(26,21,18,0.05)] hover:text-[var(--wk-ink)]"
                                    }`}
                                >
                                    Blog
                                    <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${isBlogOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isBlogOpen && (
                                    <div className="absolute left-1/2 top-full z-[200] mt-2 w-[220px] -translate-x-1/2 rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white py-2 shadow-xl">
                                        {blogLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-700"
                                                onClick={() => setIsBlogOpen(false)}
                                            >
                                                <link.icon className="h-4 w-4 text-gray-400" />
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Search */}
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="ml-1 flex items-center gap-1.5 rounded-full border border-[rgba(26,21,18,0.1)] bg-[rgba(26,21,18,0.04)] px-3 py-1.5 text-sm text-gray-500 transition hover:bg-[rgba(26,21,18,0.08)] hover:text-[var(--wk-ink)] xl:gap-2"
                                aria-label="Rechercher"
                            >
                                <Search className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden text-xs xl:inline">Rechercher…</span>
                                <kbd className="hidden rounded border border-[rgba(26,21,18,0.15)] bg-white px-1.5 py-0.5 font-mono-ui text-[10px] xl:inline">
                                    Ctrl K
                                </kbd>
                            </button>
                        </div>

                        {/* Desktop right side */}
                        <div className="hidden flex-shrink-0 items-center gap-2 lg:flex xl:gap-3">
                            {/* Don */}
                            <Link
                                href="https://www.helloasso.com/associations/workyt/formulaires/1"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-full border border-pink-200 px-3 py-1.5 text-sm font-medium text-pink-600 transition hover:bg-pink-50 hover:text-pink-700"
                            >
                                <Heart className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden xl:inline">Faire un don</span>
                                <span className="xl:hidden">Don</span>
                            </Link>

                            {session ? (
                                <>
                                    <div className="flex items-center gap-1 rounded-full bg-[rgba(26,21,18,0.05)] px-2 py-1">
                                        <StreakIndicator userId={session.user.id} />
                                        <div className="h-4 w-px bg-[rgba(26,21,18,0.15)]" />
                                        <MushroomIndicator userId={session.user.id} />
                                    </div>
                                    <BookmarkBell />
                                    <NotificationBell />

                                    <div ref={profileRef} className="relative">
                                        <button
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            className="flex items-center gap-1.5 outline-none transition-opacity hover:opacity-80"
                                        >
                                            <ProfileCard
                                                username={session.user.username}
                                                points={session.user.points}
                                                userId={session.user.id}
                                                role={session.user.role}
                                                showChevron={false}
                                            />
                                            <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        {isProfileOpen && (
                                            <div className="absolute right-0 top-full z-[200] mt-2 w-64 rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white py-2 shadow-xl">
                                                <div className="border-b border-gray-100 px-4 py-2.5">
                                                    <p className="truncate text-xs text-gray-400">{session.user?.email}</p>
                                                </div>

                                                <div className="py-1">
                                                    <Link href={`/compte/${session.user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>
                                                        <PersonIcon className="h-4 w-4 text-gray-400" />
                                                        Mon Compte
                                                    </Link>
                                                    <Link href="/award" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>
                                                        <Ticket className="h-4 w-4 text-orange-400" />
                                                        Workyt Award
                                                    </Link>
                                                    <Link href="/recompenses" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>
                                                        <StarIcon className="h-4 w-4 text-gray-400" />
                                                        Récompenses
                                                    </Link>
                                                    <Link href="/gems" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>
                                                        <StarFilledIcon className="h-4 w-4 text-gray-400" />
                                                        Gemmes
                                                    </Link>
                                                </div>

                                                <div className="my-1 h-px bg-gray-100" />

                                                <button
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        setIsQuestsOpen(true);
                                                    }}
                                                    className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                                >
                                                    <Gift className="mr-2 h-4 w-4" />
                                                    Quêtes
                                                </button>

                                                <div className="my-1 h-px bg-gray-100" />

                                                <div className="py-1">
                                                    <Link href="/fiches/creer" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>
                                                        <FileTextIcon className="h-4 w-4 text-gray-400" />
                                                        Partager une fiche
                                                    </Link>
                                                    <Link href="/forum/creer" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>
                                                        <ChatBubbleIcon className="h-4 w-4 text-gray-400" />
                                                        Déposer une question
                                                    </Link>
                                                </div>

                                                <div className="my-1 h-px bg-gray-100" />

                                                <Link href="https://dc.gg/workyt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700" onClick={() => setIsProfileOpen(false)}>
                                                    <DiscordLogoIcon className="h-4 w-4 text-indigo-500" />
                                                    Discord
                                                </Link>

                                                <div className="my-1 h-px bg-gray-100" />

                                                <div className="flex items-center justify-center gap-3 px-4 py-2.5">
                                                    <a href="https://twitter.com/workyt_fr?lang=fr" target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 transition-colors hover:text-blue-400">
                                                        <TwitterLogoIcon className="h-4 w-4" />
                                                    </a>
                                                    <a href="https://www.instagram.com/workyt/?hl=fr" target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 transition-colors hover:text-pink-500">
                                                        <InstagramLogoIcon className="h-4 w-4" />
                                                    </a>
                                                    <a href="https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg" target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 transition-colors hover:text-red-500">
                                                        <VideoIcon className="h-4 w-4" />
                                                    </a>
                                                    <a href="https://www.linkedin.com/company/workyt" target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 transition-colors hover:text-blue-600">
                                                        <LinkedInLogoIcon className="h-4 w-4" />
                                                    </a>
                                                </div>

                                                <div className="my-1 h-px bg-gray-100" />

                                                <button onClick={handleSignOut} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50">
                                                    <ExitIcon className="h-4 w-4" />
                                                    Déconnexion
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsAuthOpen(true)}
                                    className="wk-btn-orange wk-animate-shine !px-4 !py-2 text-sm"
                                >
                                    Connexion <ArrowUpRight className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Mobile right side */}
                        <div className="ml-2 flex flex-1 items-center justify-end gap-1 lg:hidden sm:gap-2">
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-gray-500 transition-colors touch-manipulation active:bg-[rgba(26,21,18,0.08)]"
                                aria-label="Rechercher"
                            >
                                <Search className="h-5 w-5" />
                            </button>
                            {session && <BookmarkBell />}
                            {session && <NotificationBell />}
                            <button
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-gray-700 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-orange-200 active:bg-[rgba(26,21,18,0.08)]"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                            >
                                <HamburgerMenuIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Mobile Slide-over Overlay */}
            <div
                className={`fixed inset-0 z-[101] bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
                    isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                onClick={closeMobileMenu}
                aria-hidden="true"
            />

            {/* Mobile Slide-over Panel */}
            <div
                className={`fixed right-0 top-0 z-[102] flex h-full w-[min(320px,90vw)] flex-col bg-white pb-safe shadow-2xl transition-transform duration-300 ease-out lg:hidden sm:w-80 ${
                    isMenuOpen ? "translate-x-0" : "translate-x-full"
                }`}
                role="dialog"
                aria-modal="true"
                aria-label="Menu de navigation"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4 safe-area-top">
                    <Image src="/workyt_fr.svg" alt="Workyt" width={60} height={28} className="h-6 w-auto" />
                    <button
                        onClick={closeMobileMenu}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-500 transition-colors touch-manipulation hover:bg-gray-100 active:bg-gray-200"
                        aria-label="Fermer le menu"
                    >
                        <Cross2Icon className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain py-2">
                    <div className="py-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex min-h-[48px] items-center justify-between px-5 py-3 text-base font-medium transition-colors active:bg-gray-100 ${
                                        isActive(link.href)
                                            ? "bg-orange-50/80 text-orange-600"
                                            : "text-gray-700"
                                    }`}
                                    onClick={closeMobileMenu}
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon className="h-5 w-5 shrink-0" />
                                        {link.label}
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                                </Link>
                            );
                        })}

                        <button
                            onClick={() => setIsBlogOpenMobile(!isBlogOpenMobile)}
                            className={`flex min-h-[48px] w-full items-center justify-between px-5 py-3 text-base font-medium transition-colors active:bg-gray-100 ${
                                isBlogOpenMobile ? "bg-orange-50/80 text-orange-600" : "text-gray-700"
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <Newspaper className="h-5 w-5 shrink-0" />
                                Blog
                            </span>
                            <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-300 transition-transform duration-200 ${isBlogOpenMobile ? "rotate-180" : ""}`} />
                        </button>
                        {isBlogOpenMobile && (
                            <div className="bg-gray-50/50">
                                {blogLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="flex min-h-[44px] items-center pl-14 pr-5 text-sm text-gray-600 transition-colors active:bg-gray-100 active:text-orange-600"
                                        onClick={closeMobileMenu}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mx-4 my-2 h-px bg-gray-100" />

                    <Link
                        href="https://www.helloasso.com/associations/workyt/formulaires/1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[48px] items-center gap-3 px-5 py-3 text-base font-medium text-pink-600 transition-colors active:bg-pink-50"
                        onClick={closeMobileMenu}
                    >
                        <Heart className="h-5 w-5 shrink-0" />
                        Faire un don
                    </Link>

                    <div className="mx-4 my-2 h-px bg-gray-100" />

                    {session ? (
                        <>
                            <div className="p-4 pb-2">
                                <ProfileCard
                                    username={session.user.username}
                                    points={session.user.points}
                                    userId={session.user.id}
                                    role={session.user.role}
                                />
                            </div>

                            <div className="py-1">
                                <Link href={`/compte/${session.user.id}`} className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-sm text-gray-700 transition-colors active:bg-gray-50" onClick={closeMobileMenu}>
                                    <PersonIcon className="h-4 w-4 shrink-0 text-gray-400" />
                                    Mon Compte
                                </Link>
                                <Link href="/award" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-sm text-gray-700 transition-colors active:bg-gray-50" onClick={closeMobileMenu}>
                                    <Ticket className="h-4 w-4 shrink-0 text-orange-400" />
                                    Workyt Award
                                </Link>
                                <Link href="/recompenses" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-sm text-gray-700 transition-colors active:bg-gray-50" onClick={closeMobileMenu}>
                                    <StarIcon className="h-4 w-4 shrink-0 text-gray-400" />
                                    Récompenses
                                </Link>
                                <Link href="/gems" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-sm text-gray-700 transition-colors active:bg-gray-50" onClick={closeMobileMenu}>
                                    <StarFilledIcon className="h-4 w-4 shrink-0 text-gray-400" />
                                    Gemmes
                                </Link>
                            </div>

                            <div className="mx-4 my-2 h-px bg-gray-100" />

                            <div className="px-2 py-1">
                                <button
                                    onClick={() => {
                                        closeMobileMenu();
                                        setIsQuestsOpen(true);
                                    }}
                                    className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    <Gift className="mr-2 h-4 w-4" />
                                    Quêtes
                                </button>
                            </div>

                            <div className="mx-4 my-2 h-px bg-gray-100" />

                            <div className="py-1">
                                <Link href="/fiches/creer" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-sm text-gray-700 transition-colors active:bg-gray-50" onClick={closeMobileMenu}>
                                    <FileTextIcon className="h-4 w-4 shrink-0 text-gray-400" />
                                    Partager une fiche
                                </Link>
                                <Link href="/forum/creer" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-sm text-gray-700 transition-colors active:bg-gray-50" onClick={closeMobileMenu}>
                                    <ChatBubbleIcon className="h-4 w-4 shrink-0 text-gray-400" />
                                    Déposer une question
                                </Link>
                            </div>

                            <div className="mx-4 my-2 h-px bg-gray-100" />

                            <Link href="https://dc.gg/workyt" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-sm text-gray-700 transition-colors active:bg-indigo-50 active:text-indigo-700" onClick={closeMobileMenu}>
                                <DiscordLogoIcon className="h-4 w-4 shrink-0 text-indigo-500" />
                                Discord
                            </Link>

                            <div className="mx-4 my-2 h-px bg-gray-100" />

                            <div className="flex items-center justify-center gap-1">
                                <a href="https://twitter.com/workyt_fr?lang=fr" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-400 transition-colors active:text-blue-400">
                                    <TwitterLogoIcon className="h-5 w-5" />
                                </a>
                                <a href="https://www.instagram.com/workyt/?hl=fr" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-400 transition-colors active:text-pink-500">
                                    <InstagramLogoIcon className="h-5 w-5" />
                                </a>
                                <a href="https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-400 transition-colors active:text-red-500">
                                    <VideoIcon className="h-5 w-5" />
                                </a>
                                <a href="https://www.linkedin.com/company/workyt" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-400 transition-colors active:text-blue-600">
                                    <LinkedInLogoIcon className="h-5 w-5" />
                                </a>
                            </div>

                            <div className="mx-4 my-2 h-px bg-gray-100" />

                            <button onClick={handleSignOut} className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-5 py-3 text-sm font-medium text-red-600 transition-colors active:bg-red-50">
                                <ExitIcon className="h-4 w-4 shrink-0" />
                                Déconnexion
                            </button>
                        </>
                    ) : (
                        <div className="p-4">
                            <button
                                onClick={() => {
                                    setIsAuthOpen(true);
                                    closeMobileMenu();
                                }}
                                className="wk-btn-orange wk-animate-shine w-full justify-center !py-3 text-base"
                            >
                                Connexion <ArrowUpRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Auth Dialog */}
            <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Connexion / Inscription</DialogTitle>
                    </DialogHeader>
                    <AuthPage />
                </DialogContent>
            </Dialog>

            {session && (
                <QuestsPanel externalOpen={isQuestsOpen} onOpenChange={setIsQuestsOpen} />
            )}

            <SearchCommandPalette open={isSearchOpen} onOpenChange={setIsSearchOpen} />
        </>
    );
}
