"use client";

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
    LayoutDashboard,
} from "lucide-react";

// Rôles ayant accès au tableau de bord (cf. dashboard/layout.tsx)
const STAFF_ROLES = ["Admin", "Rédacteur", "Correcteur", "Modérateur", "Helpeur"];
import WorkytLogo from "@/components/ui/WorkytLogo";
import ProfileCard from "@/components/ui/ProfileCard";
import SearchCommandPalette from "@/components/SearchCommandPalette";
import StatusCluster from "@/components/navbar/StatusCluster";
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
    const isStaff = !!session && STAFF_ROLES.includes((session.user as any)?.role);

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

    // Une page peut demander l'ouverture de la connexion (ex. « Se connecter
    // pour demander un suivi ») sans dupliquer le formulaire :
    // window.dispatchEvent(new Event('workyt:open-auth'))
    useEffect(() => {
        const open = () => setIsAuthOpen(true);
        window.addEventListener('workyt:open-auth', open);
        return () => window.removeEventListener('workyt:open-auth', open);
    }, []);

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
    const linkBase = "relative whitespace-nowrap rounded-full px-3 py-2 text-[15px] xl:px-3.5 2xl:px-4 font-semibold tracking-[-0.005em] transition-colors";
    const linkActive = "bg-[rgba(255,106,26,0.1)] text-[#c24a0a]";
    const linkIdle = "text-[rgba(26,21,18,0.82)] hover:bg-[var(--wk-paper-2)] hover:text-[var(--wk-ink)]";
    // Entrées des menus déroulants (Blog, profil)
    const menuItem = "mx-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--wk-ink)] transition-colors hover:bg-[var(--wk-paper-2)]";

    return (
        <>
            <header className="sticky top-0 z-[100] px-3 pt-3 sm:px-4 sm:pt-4 safe-area-top">
                <div className="mx-auto max-w-[1400px]">
                    {/* Pas de `backdrop-blur` ici, et ce n'est pas un choix
                        esthétique : un `backdrop-filter` fait de l'élément le
                        bloc conteneur de ses descendants en `position: fixed`.
                        Les panneaux de la série, des champignons, de la guerre
                        des clans, des notifications et des favoris se calculent
                        tous une position en coordonnées viewport — ils se
                        retrouvaient décalés de la position de la pilule.
                        Le fond quasi opaque remplace le flou. */}
                    <nav className="relative flex items-center justify-between rounded-full border border-[rgba(26,21,18,0.1)] bg-white/95 px-3 py-2 shadow-[0_6px_24px_rgba(26,21,18,0.06)] sm:px-4 sm:py-2.5">
                        {/* Logo */}
                        <Link href="/" aria-label="Workyt — accueil" className="group flex flex-shrink-0 items-center gap-2 pl-1">
                            <WorkytLogo className="h-6 sm:h-7" />
                        </Link>

                        {/* Desktop nav */}
                        <div className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`${linkBase} ${
                                        isActive(link.href) ? linkActive : linkIdle
                                    }`}
                                    aria-current={isActive(link.href) ? "page" : undefined}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {/* Blog dropdown */}
                            <div ref={blogRef} className="relative">
                                <button
                                    onClick={() => setIsBlogOpen(!isBlogOpen)}
                                    className={`${linkBase} flex items-center gap-1 outline-none ${
                                        pathname.includes("blog") || isBlogOpen ? linkActive : linkIdle
                                    }`}
                                >
                                    Blog
                                    <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${isBlogOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isBlogOpen && (
                                    <div className="absolute left-1/2 top-full z-[200] mt-2 w-[220px] -translate-x-1/2 rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white py-2 shadow-[0_18px_48px_rgba(26,21,18,0.14)]">
                                        {blogLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className={menuItem}
                                                onClick={() => setIsBlogOpen(false)}
                                            >
                                                <link.icon className="h-4 w-4 text-[var(--wk-accent)]" />
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Search */}
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="ml-1 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(26,21,18,0.1)] bg-[var(--wk-paper)] px-3 py-2 text-sm text-[rgba(26,21,18,0.62)] transition hover:border-[rgba(26,21,18,0.2)] hover:text-[var(--wk-ink)]"
                                aria-label="Rechercher"
                            >
                                <Search className="h-4 w-4 shrink-0" />
                                <span className="hidden font-medium 2xl:inline">Rechercher…</span>
                                <kbd className="hidden whitespace-nowrap rounded border border-[rgba(26,21,18,0.15)] bg-white px-1.5 py-0.5 font-mono-ui text-[10px] leading-none min-[1680px]:inline-block">
                                    Ctrl K
                                </kbd>
                            </button>
                        </div>

                        {/* Desktop right side */}
                        <div className="hidden flex-shrink-0 items-center gap-2 lg:flex">
                            {/* Don */}
                            <Link
                                href="https://www.helloasso.com/associations/workyt/formulaires/1"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-full border border-[rgba(26,21,18,0.12)] px-3.5 py-2 text-sm font-semibold text-[var(--wk-ink)] transition hover:border-[var(--wk-accent)] hover:text-[#c24a0a]"
                            >
                                <Heart className="h-4 w-4 shrink-0 fill-[var(--wk-accent)] text-[var(--wk-accent)]" />
                                <span className="hidden 2xl:inline">Faire un don</span>
                                <span className="2xl:hidden">Don</span>
                            </Link>

                            {session ? (
                                <>
                                    <StatusCluster userId={session.user.id} />
                                    <BookmarkBell />
                                    <NotificationBell />

                                    <div ref={profileRef} className="relative">
                                        <button
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            className="flex shrink-0 items-center gap-1 outline-none transition-opacity hover:opacity-80"
                                        >
                                            <ProfileCard
                                                username={session.user.username}
                                                points={session.user.points}
                                                userId={session.user.id}
                                                role={session.user.role}
                                                showChevron={false}
                                            />
                                            <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-[rgba(26,21,18,0.5)] transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        {isProfileOpen && (
                                            <div className="absolute right-0 top-full z-[200] mt-2 w-64 rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white py-2 shadow-[0_18px_48px_rgba(26,21,18,0.14)]">
                                                <div className="border-b border-[rgba(26,21,18,0.06)] px-4 pb-3 pt-1.5">
                                                    <p className="truncate text-sm font-semibold text-[var(--wk-ink)]">{session.user.username}</p>
                                                    <p className="truncate text-xs text-[rgba(26,21,18,0.55)]">{session.user?.email}</p>
                                                </div>

                                                {isStaff && (
                                                    <div className="py-1">
                                                        <Link href="/dashboard" className="mx-2 flex items-center gap-3 rounded-xl bg-[rgba(255,106,26,0.1)] px-3 py-2.5 text-sm font-semibold text-[#c24a0a] transition-colors hover:bg-[rgba(255,106,26,0.16)]" onClick={() => setIsProfileOpen(false)}>
                                                            <LayoutDashboard className="h-4 w-4" />
                                                            Tableau de bord
                                                        </Link>
                                                    </div>
                                                )}

                                                <div className="py-1">
                                                    <Link href={`/compte/${session.user.id}`} className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                                        <PersonIcon className="h-4 w-4 text-[rgba(26,21,18,0.5)]" />
                                                        Mon Compte
                                                    </Link>
                                                    <Link href="/award" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                                        <Ticket className="h-4 w-4 text-[var(--wk-accent)]" />
                                                        Workyt Award
                                                    </Link>
                                                    <Link href="/recompenses" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                                        <StarIcon className="h-4 w-4 text-[rgba(26,21,18,0.5)]" />
                                                        Récompenses
                                                    </Link>
                                                    <Link href="/gems" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                                        <StarFilledIcon className="h-4 w-4 text-[rgba(26,21,18,0.5)]" />
                                                        Gemmes
                                                    </Link>
                                                </div>

                                                <div className="my-1 h-px bg-[rgba(26,21,18,0.06)]" />

                                                <button
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        setIsQuestsOpen(true);
                                                    }}
                                                    className={`${menuItem} w-[calc(100%-1rem)] text-left`}
                                                >
                                                    <Gift className="h-4 w-4 text-[rgba(26,21,18,0.5)]" />
                                                    Quêtes
                                                </button>

                                                <div className="my-1 h-px bg-[rgba(26,21,18,0.06)]" />

                                                <div className="py-1">
                                                    <Link href="/fiches/creer" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                                        <FileTextIcon className="h-4 w-4 text-[rgba(26,21,18,0.5)]" />
                                                        Partager une fiche
                                                    </Link>
                                                    <Link href="/forum/creer" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                                        <ChatBubbleIcon className="h-4 w-4 text-[rgba(26,21,18,0.5)]" />
                                                        Déposer une question
                                                    </Link>
                                                </div>

                                                <div className="my-1 h-px bg-[rgba(26,21,18,0.06)]" />

                                                <Link href="https://dc.gg/workyt" target="_blank" rel="noopener noreferrer" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                                    <DiscordLogoIcon className="h-4 w-4 text-indigo-500" />
                                                    Discord
                                                </Link>

                                                <div className="my-1 h-px bg-[rgba(26,21,18,0.06)]" />

                                                <div className="flex items-center justify-center gap-3 px-4 py-2.5">
                                                    <a href="https://twitter.com/workyt_fr?lang=fr" target="_blank" rel="noopener noreferrer" className="rounded-full p-1.5 text-[rgba(26,21,18,0.45)] transition-colors hover:text-blue-400">
                                                        <TwitterLogoIcon className="h-4 w-4" />
                                                    </a>
                                                    <a href="https://www.instagram.com/workyt/?hl=fr" target="_blank" rel="noopener noreferrer" className="rounded-full p-1.5 text-[rgba(26,21,18,0.45)] transition-colors hover:text-pink-500">
                                                        <InstagramLogoIcon className="h-4 w-4" />
                                                    </a>
                                                    <a href="https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg" target="_blank" rel="noopener noreferrer" className="rounded-full p-1.5 text-[rgba(26,21,18,0.45)] transition-colors hover:text-red-500">
                                                        <VideoIcon className="h-4 w-4" />
                                                    </a>
                                                    <a href="https://www.linkedin.com/company/workyt" target="_blank" rel="noopener noreferrer" className="rounded-full p-1.5 text-[rgba(26,21,18,0.45)] transition-colors hover:text-blue-600">
                                                        <LinkedInLogoIcon className="h-4 w-4" />
                                                    </a>
                                                </div>

                                                <div className="my-1 h-px bg-[rgba(26,21,18,0.06)]" />

                                                <button onClick={handleSignOut} className="mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
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

                        {/* Mobile / tablette right side.
                            StatusCluster décide lui-même de sa forme selon la
                            largeur : aligné à partir de md, replié en dessous.
                            BookmarkBell descend dans le drawer — à 360px, cinq
                            cibles de 44px plus le logo ne tiennent pas. */}
                        <div className="ml-2 flex flex-1 items-center justify-end gap-1 lg:hidden sm:gap-2">
                            {session && <StatusCluster userId={session.user.id} />}
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-[rgba(26,21,18,0.7)] transition-colors touch-manipulation active:bg-[rgba(26,21,18,0.08)]"
                                aria-label="Rechercher"
                            >
                                <Search className="h-5 w-5" />
                            </button>
                            {session && <NotificationBell />}
                            <button
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-[var(--wk-ink)] transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-[rgba(255,106,26,0.3)] active:bg-[rgba(26,21,18,0.08)]"
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
                <div className="flex shrink-0 items-center justify-between border-b border-[rgba(26,21,18,0.06)] p-4 safe-area-top">
                    <WorkytLogo className="h-6" />
                    <button
                        onClick={closeMobileMenu}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[rgba(26,21,18,0.7)] transition-colors touch-manipulation hover:bg-[var(--wk-paper-2)] active:bg-[rgba(26,21,18,0.1)]"
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
                                    className={`flex min-h-[48px] items-center justify-between px-5 py-3 text-base font-semibold transition-colors active:bg-[var(--wk-paper-2)] ${
                                        isActive(link.href)
                                            ? "bg-[rgba(255,106,26,0.1)] text-[#c24a0a]"
                                            : "text-[var(--wk-ink)]"
                                    }`}
                                    onClick={closeMobileMenu}
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon className="h-5 w-5 shrink-0" />
                                        {link.label}
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.3)]" />
                                </Link>
                            );
                        })}

                        <button
                            onClick={() => setIsBlogOpenMobile(!isBlogOpenMobile)}
                            className={`flex min-h-[48px] w-full items-center justify-between px-5 py-3 text-base font-semibold transition-colors active:bg-[var(--wk-paper-2)] ${
                                isBlogOpenMobile ? "bg-[rgba(255,106,26,0.1)] text-[#c24a0a]" : "text-[var(--wk-ink)]"
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <Newspaper className="h-5 w-5 shrink-0" />
                                Blog
                            </span>
                            <ChevronDownIcon className={`h-4 w-4 shrink-0 text-[rgba(26,21,18,0.3)] transition-transform duration-200 ${isBlogOpenMobile ? "rotate-180" : ""}`} />
                        </button>
                        {isBlogOpenMobile && (
                            <div className="bg-[var(--wk-paper)]">
                                {blogLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="flex min-h-[44px] items-center pl-14 pr-5 text-[15px] font-medium text-[rgba(26,21,18,0.78)] transition-colors active:bg-[var(--wk-paper-2)] active:text-[#c24a0a]"
                                        onClick={closeMobileMenu}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mx-4 my-2 h-px bg-[rgba(26,21,18,0.06)]" />

                    <Link
                        href="https://www.helloasso.com/associations/workyt/formulaires/1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[48px] items-center gap-3 px-5 py-3 text-base font-semibold text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]"
                        onClick={closeMobileMenu}
                    >
                        <Heart className="h-5 w-5 shrink-0 fill-[var(--wk-accent)] text-[var(--wk-accent)]" />
                        Faire un don
                    </Link>

                    <div className="mx-4 my-2 h-px bg-[rgba(26,21,18,0.06)]" />

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

                            {isStaff && (
                                <div className="py-1">
                                    <Link href="/dashboard" className="mx-4 flex min-h-[44px] items-center gap-3 rounded-xl bg-[rgba(255,106,26,0.1)] px-4 py-3 text-[15px] font-semibold text-[#c24a0a] transition-colors active:bg-[rgba(255,106,26,0.16)]" onClick={closeMobileMenu}>
                                        <LayoutDashboard className="h-4 w-4 shrink-0" />
                                        Tableau de bord
                                    </Link>
                                </div>
                            )}

                            <div className="py-1">
                                <Link href={`/compte/${session.user.id}`} className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-[15px] font-medium text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]" onClick={closeMobileMenu}>
                                    <PersonIcon className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.5)]" />
                                    Mon Compte
                                </Link>
                                {/* Reprise du BookmarkBell, retiré de la barre mobile
                                    pour ne pas dépasser quatre cibles à 360px. */}
                                <Link href="/fiches/favoris" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-[15px] font-medium text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]" onClick={closeMobileMenu}>
                                    <StarIcon className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.5)]" />
                                    Mes favoris
                                </Link>
                                <Link href="/award" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-[15px] font-medium text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]" onClick={closeMobileMenu}>
                                    <Ticket className="h-4 w-4 shrink-0 text-[var(--wk-accent)]" />
                                    Workyt Award
                                </Link>
                                <Link href="/recompenses" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-[15px] font-medium text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]" onClick={closeMobileMenu}>
                                    <StarIcon className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.5)]" />
                                    Récompenses
                                </Link>
                                <Link href="/gems" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-[15px] font-medium text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]" onClick={closeMobileMenu}>
                                    <StarFilledIcon className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.5)]" />
                                    Gemmes
                                </Link>
                            </div>

                            <div className="mx-4 my-2 h-px bg-[rgba(26,21,18,0.06)]" />

                            <div className="px-2 py-1">
                                <button
                                    onClick={() => {
                                        closeMobileMenu();
                                        setIsQuestsOpen(true);
                                    }}
                                    className="flex min-h-[44px] w-full items-center gap-3 px-3 py-3 text-left text-[15px] font-medium text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]"
                                >
                                    <Gift className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.5)]" />
                                    Quêtes
                                </button>
                            </div>

                            <div className="mx-4 my-2 h-px bg-[rgba(26,21,18,0.06)]" />

                            <div className="py-1">
                                <Link href="/fiches/creer" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-[15px] font-medium text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]" onClick={closeMobileMenu}>
                                    <FileTextIcon className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.5)]" />
                                    Partager une fiche
                                </Link>
                                <Link href="/forum/creer" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-[15px] font-medium text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]" onClick={closeMobileMenu}>
                                    <ChatBubbleIcon className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.5)]" />
                                    Déposer une question
                                </Link>
                            </div>

                            <div className="mx-4 my-2 h-px bg-[rgba(26,21,18,0.06)]" />

                            <Link href="https://dc.gg/workyt" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center gap-3 px-5 py-3 text-[15px] font-medium text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]" onClick={closeMobileMenu}>
                                <DiscordLogoIcon className="h-4 w-4 shrink-0 text-indigo-500" />
                                Discord
                            </Link>

                            <div className="mx-4 my-2 h-px bg-[rgba(26,21,18,0.06)]" />

                            <div className="flex items-center justify-center gap-1">
                                <a href="https://twitter.com/workyt_fr?lang=fr" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[rgba(26,21,18,0.5)] transition-colors active:text-blue-400">
                                    <TwitterLogoIcon className="h-5 w-5" />
                                </a>
                                <a href="https://www.instagram.com/workyt/?hl=fr" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[rgba(26,21,18,0.5)] transition-colors active:text-pink-500">
                                    <InstagramLogoIcon className="h-5 w-5" />
                                </a>
                                <a href="https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[rgba(26,21,18,0.5)] transition-colors active:text-red-500">
                                    <VideoIcon className="h-5 w-5" />
                                </a>
                                <a href="https://www.linkedin.com/company/workyt" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[rgba(26,21,18,0.5)] transition-colors active:text-blue-600">
                                    <LinkedInLogoIcon className="h-5 w-5" />
                                </a>
                            </div>

                            <div className="mx-4 my-2 h-px bg-[rgba(26,21,18,0.06)]" />

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
