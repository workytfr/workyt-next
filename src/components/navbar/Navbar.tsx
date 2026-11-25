"use client";

import { hasRole } from "@/lib/userRoles";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useRef, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
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
    ExitIcon,
} from "@radix-ui/react-icons";
import { Heart, ChevronRight, Search, ArrowUpRight } from "lucide-react";

// Rôles ayant accès au tableau de bord (cf. dashboard/layout.tsx)
const STAFF_ROLES = ["Admin", "Rédacteur", "Correcteur", "Modérateur", "Helpeur"];
import WorkytLogo from "@/components/ui/WorkytLogo";
import {
    ActualitesIcon,
    BlogIcon,
    ConseilsMethodesIcon,
    CoursIcon,
    CultureIcon,
    DiplomeIcon,
    EleveIcon,
    FavoriIcon,
    FicheIcon,
    ForumIcon,
    MedailleIcon,
    ObjectifIcon,
    OrientationScolaireIcon,
    ProgressionIcon,
    TableauIcon,
} from "@/components/ui/WkIcons";

// Chargés à la demande : modales (à l'ouverture) et outils de l'espace connecté
// (seulement si session). Sinon tout finit dans le chunk du layout, payé par
// chaque visiteur anonyme sur chaque page.
const AuthPage = dynamic(() => import("@/components/forms/RegisterForm"), { ssr: false });
const SearchCommandPalette = dynamic(() => import("@/components/SearchCommandPalette"), { ssr: false });
const QuestsPanel = dynamic(() => import("@/components/quests/QuestsPanel"), { ssr: false });
const StatusCluster = dynamic(() => import("@/components/navbar/StatusCluster"), { ssr: false });
const NotificationBell = dynamic(() => import("@/components/NotificationBell"), { ssr: false });
const BookmarkBell = dynamic(() => import("@/components/BookmarkBell"), { ssr: false });
// Avatar seul dans la barre (emplacement réservé = pas de saut) ; la carte
// complète (niveau, points, gemmes) vit en tête du menu du compte. Dans la
// barre, ses deux lignes faisaient passer la pilule de 61 à 84 px.
const ProfileAvatar = dynamic(() => import("@/components/ui/profile"), {
    ssr: false,
    loading: () => <span className="block h-12 w-12 animate-pulse rounded-full bg-[rgba(26,21,18,0.06)]" aria-hidden="true" />,
});
const ProfileCard = dynamic(() => import("@/components/ui/ProfileCard"), { ssr: false });

const navLinks = [
    { href: "/cours", label: "Cours", icon: CoursIcon },
    { href: "/fiches", label: "Fiches", icon: FicheIcon },
    { href: "/forum", label: "Forum", icon: ForumIcon },
];

const blogLinks = [
    { href: "https://blog.workyt.fr/category/actualites/", label: "Actualités", icon: ActualitesIcon },
    { href: "https://blog.workyt.fr/category/conseils-methodes/", label: "Conseils & Méthodes", icon: ConseilsMethodesIcon },
    { href: "https://blog.workyt.fr/category/culture/", label: "Culture", icon: CultureIcon },
    { href: "https://blog.workyt.fr/category/orientation-scolaire/", label: "Orientation scolaire", icon: OrientationScolaireIcon },
];

const DONATE_URL = "https://www.helloasso.com/associations/workyt/formulaires/1";

const socialLinks = [
    { href: "https://twitter.com/workyt_fr?lang=fr", label: "X (Twitter)", icon: TwitterLogoIcon },
    { href: "https://www.instagram.com/workyt/?hl=fr", label: "Instagram", icon: InstagramLogoIcon },
    { href: "https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg", label: "YouTube", icon: VideoIcon },
    { href: "https://www.linkedin.com/company/workyt", label: "LinkedIn", icon: LinkedInLogoIcon },
];

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isQuestsOpen, setIsQuestsOpen] = useState(false);
    const [isBlogOpenMobile, setIsBlogOpenMobile] = useState(false);
    const [isBlogOpen, setIsBlogOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    // Le panneau des quêtes reste monté après la 1re ouverture (animation de fermeture).
    const [questsMounted, setQuestsMounted] = useState(false);
    // Les cloches existent en version desktop et mobile (bascule CSS) : on n'en
    // monte qu'une, sinon chaque timer de polling tourne en double.
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
    if (isQuestsOpen && !questsMounted) setQuestsMounted(true);
    const profileRef = useRef<HTMLDivElement>(null);
    const blogRef = useRef<HTMLDivElement>(null);
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const isStaff = !!session && hasRole(session.user, ...STAFF_ROLES);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const update = () => setIsDesktop(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

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

    // Échap referme les menus déroulants de la barre
    useEffect(() => {
        if (!isProfileOpen && !isBlogOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsProfileOpen(false);
                setIsBlogOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isProfileOpen, isBlogOpen]);

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
    const isBlogActive = pathname.includes("blog");
    // Connecté (ou session en cours de résolution) : la barre porte la couche
    // gamifiée, les liens se replient en icônes sous xl — sauf le lien actif,
    // qui garde son libellé pour qu'on sache toujours où l'on est.
    const compact = status !== "unauthenticated";
    const labelClass = (active: boolean) => (active || !compact ? "" : "hidden xl:inline");

    // Entrées des menus déroulants (Blog, profil)
    const menuItem = "mx-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--wk-ink)] transition-colors hover:bg-[var(--wk-paper)] active:bg-[var(--wk-paper-2)]";
    const menuIcon = "h-[18px] w-[18px] shrink-0 text-[rgba(26,21,18,0.45)]";
    const menuSep = "mx-3 my-1.5 h-px bg-[rgba(26,21,18,0.07)]";
    const panel = "wk-pop absolute top-[calc(100%+10px)] z-[200] rounded-2xl border border-[rgba(26,21,18,0.08)] bg-white py-1.5 shadow-[0_18px_48px_rgba(26,21,18,0.14)]";

    // Tiroir mobile
    const drawerRow = "flex min-h-[48px] items-center gap-3 px-5 py-3 text-[15px] font-medium text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]";
    const drawerIcon = "h-5 w-5 shrink-0 text-[rgba(26,21,18,0.45)]";
    const drawerSep = "mx-5 my-2 h-px bg-[rgba(26,21,18,0.07)]";
    // Cible tactile pleine (44px) dans la barre mobile
    const touchBtn = "wk-nav-btn !h-11 !w-10 !min-w-0 !px-0 sm:!w-11";

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
                        Le fond quasi opaque remplace le flou.

                        Barre en cases : logo et compte ont chacun la leur,
                        séparée sur toute la hauteur ; au milieu, des groupes
                        séparés par un trait court. Hauteur fixe, identique
                        connecté ou non. */}
                    <nav
                        aria-label="Navigation principale"
                        className="flex h-14 items-stretch rounded-[20px] border border-[rgba(26,21,18,0.08)] bg-white/95 shadow-[0_1px_2px_rgba(26,21,18,0.04),0_10px_30px_rgba(26,21,18,0.06)] sm:h-16 sm:rounded-[22px]"
                    >
                        {/* ── Logo ── */}
                        <Link
                            href="/"
                            aria-label="Workyt — accueil"
                            className="flex shrink-0 items-center px-3.5 sm:px-5 lg:border-r lg:px-4 xl:px-5 lg:border-[rgba(26,21,18,0.07)]"
                        >
                            <WorkytLogo className="h-[22px] sm:h-7" />
                        </Link>

                        {/* ── Desktop : navigation ── */}
                        <div className="hidden flex-1 items-center gap-0.5 px-2 lg:flex xl:gap-1 xl:px-3">
                            {navLinks.map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        title={compact ? link.label : undefined}
                                        aria-label={link.label}
                                        aria-current={active ? "page" : undefined}
                                        className="wk-nav-btn"
                                    >
                                        <link.icon className="h-5 w-5 shrink-0" />
                                        <span className={labelClass(active)}>{link.label}</span>
                                    </Link>
                                );
                            })}

                            <div ref={blogRef} className="relative">
                                <button
                                    onClick={() => setIsBlogOpen(!isBlogOpen)}
                                    aria-expanded={isBlogOpen}
                                    aria-haspopup="menu"
                                    aria-label="Blog"
                                    aria-current={isBlogActive ? "page" : undefined}
                                    className="wk-nav-btn !gap-1.5"
                                >
                                    <BlogIcon className="h-5 w-5 shrink-0" />
                                    <span className={labelClass(isBlogActive)}>Blog</span>
                                    <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200 ${isBlogOpen ? "rotate-180" : ""} ${labelClass(isBlogActive)}`} />
                                </button>

                                {isBlogOpen && (
                                    <div role="menu" className={`${panel} left-0 w-60`} style={{ "--wk-origin": "top left" } as CSSProperties}>
                                        {blogLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                role="menuitem"
                                                className={menuItem}
                                                onClick={() => setIsBlogOpen(false)}
                                            >
                                                <link.icon className="h-[18px] w-[18px] shrink-0 text-[var(--wk-accent)]" />
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <span className="wk-nav-sep mx-1 xl:mx-1.5" aria-hidden="true" />

                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="wk-nav-btn"
                                aria-label="Rechercher"
                                title="Rechercher (Ctrl K)"
                            >
                                <Search className="h-5 w-5 shrink-0" />
                                <kbd className="hidden rounded-md border border-[rgba(26,21,18,0.12)] bg-[var(--wk-paper)] px-1.5 py-0.5 font-mono-ui text-[10px] font-medium leading-none text-[rgba(26,21,18,0.55)] min-[1440px]:inline-block">
                                    Ctrl K
                                </kbd>
                            </button>
                        </div>

                        {/* ── Desktop : outils ── */}
                        <div className="hidden shrink-0 items-center gap-0.5 pr-1.5 lg:flex xl:gap-1 xl:pr-2">
                            {session && isDesktop && (
                                <>
                                    <StatusCluster userId={session.user.id} />
                                    <span className="wk-nav-sep mx-1 xl:mx-1.5" aria-hidden="true" />
                                    <BookmarkBell />
                                    <NotificationBell />
                                    <span className="wk-nav-sep mx-1 xl:mx-1.5" aria-hidden="true" />
                                </>
                            )}

                            <Link
                                href={DONATE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Faire un don à Workyt"
                                title="Faire un don"
                                className="wk-nav-btn"
                            >
                                <Heart className="h-[18px] w-[18px] shrink-0 fill-[var(--wk-accent)] text-[var(--wk-accent)]" />
                                {/* Connecté, la barre est pleine : le cœur seul suffit */}
                                {!compact && <span>Don</span>}
                            </Link>

                            {status === "unauthenticated" && (
                                <button
                                    onClick={() => setIsAuthOpen(true)}
                                    className="wk-btn-orange ml-1 !h-10 !gap-2 !px-4 !py-0 text-sm"
                                >
                                    Connexion <ArrowUpRight className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* ── Desktop : compte ── */}
                        {session && (
                            <div ref={profileRef} className="relative hidden shrink-0 items-center border-l border-[rgba(26,21,18,0.07)] px-2 lg:flex">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    aria-expanded={isProfileOpen}
                                    aria-haspopup="menu"
                                    aria-label="Mon compte"
                                    className={`flex items-center gap-0.5 rounded-2xl py-0.5 pl-0.5 pr-1.5 outline-none transition-[background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[rgba(255,106,26,0.5)] active:scale-[0.97] ${
                                        isProfileOpen ? "bg-[var(--wk-paper-2)]" : "hover:bg-[var(--wk-paper)]"
                                    }`}
                                >
                                    <ProfileAvatar
                                        username={session.user.username}
                                        points={session.user.points}
                                        userId={session.user.id}
                                        role={session.user.role}
                                        size="small"
                                    />
                                    <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-[rgba(26,21,18,0.45)] transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isProfileOpen && (
                                    <div role="menu" className={`${panel} right-2 w-72`} style={{ "--wk-origin": "top right" } as CSSProperties}>
                                        <div className="px-2 pb-1.5 pt-0.5">
                                            <ProfileCard
                                                username={session.user.username}
                                                points={session.user.points}
                                                userId={session.user.id}
                                                role={session.user.role}
                                                showChevron={false}
                                                className="!rounded-xl"
                                            />
                                            {session.user?.email && (
                                                <p className="mt-1.5 truncate px-1 text-xs text-[rgba(26,21,18,0.5)]">{session.user.email}</p>
                                            )}
                                        </div>

                                        {isStaff && (
                                            <Link href="/dashboard" className="mx-1.5 mb-1 flex items-center gap-3 rounded-xl bg-[rgba(255,106,26,0.1)] px-3 py-2.5 text-sm font-semibold text-[#c24a0a] transition-colors hover:bg-[rgba(255,106,26,0.16)]" onClick={() => setIsProfileOpen(false)}>
                                                <TableauIcon className="h-[18px] w-[18px] shrink-0" />
                                                Tableau de bord
                                            </Link>
                                        )}

                                        <Link href={`/compte/${session.user.id}`} className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                            <EleveIcon className={menuIcon} />
                                            Mon compte
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setIsProfileOpen(false);
                                                setIsQuestsOpen(true);
                                            }}
                                            className={`${menuItem} w-[calc(100%-0.75rem)] text-left`}
                                        >
                                            <ObjectifIcon className={menuIcon} />
                                            Quêtes
                                        </button>
                                        <Link href="/progression" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                            <ProgressionIcon className="h-[18px] w-[18px] shrink-0 text-emerald-600" />
                                            Ma progression
                                        </Link>
                                        <Link href="/recompenses" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                            <DiplomeIcon className={menuIcon} />
                                            Récompenses
                                        </Link>
                                        <Link href="/gems" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                            <Image src="/badge/braise.svg" alt="" width={18} height={18} className="h-[18px] w-[18px] shrink-0" />
                                            Gemmes
                                        </Link>
                                        <Link href="/award" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                            <MedailleIcon className="h-[18px] w-[18px] shrink-0 text-[var(--wk-accent)]" />
                                            Workyt Award
                                        </Link>

                                        <div className={menuSep} />

                                        <Link href="/fiches/creer" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                            <FicheIcon className={menuIcon} />
                                            Partager une fiche
                                        </Link>
                                        <Link href="/forum/creer" className={menuItem} onClick={() => setIsProfileOpen(false)}>
                                            <ForumIcon className={menuIcon} />
                                            Déposer une question
                                        </Link>

                                        <div className={menuSep} />

                                        <div className="flex items-center justify-between px-3 py-1">
                                            <Link href="https://dc.gg/workyt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm font-medium text-[var(--wk-ink)] transition-colors hover:text-indigo-600" onClick={() => setIsProfileOpen(false)}>
                                                <DiscordLogoIcon className="h-4 w-4 text-indigo-500" />
                                                Discord
                                            </Link>
                                            <div className="flex items-center">
                                                {socialLinks.map((s) => (
                                                    <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label} className="rounded-lg p-1.5 text-[rgba(26,21,18,0.4)] transition-colors hover:bg-[var(--wk-paper)] hover:text-[var(--wk-ink)]">
                                                        <s.icon className="h-4 w-4" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={menuSep} />

                                        <button onClick={handleSignOut} className="mx-1.5 flex w-[calc(100%-0.75rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
                                            <ExitIcon className="h-4 w-4" />
                                            Déconnexion
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Mobile / tablette ──
                            StatusCluster choisit sa forme selon la largeur :
                            aligné à partir de md, replié en un bouton dessous.
                            Les favoris descendent dans le tiroir — à 360px,
                            cinq cibles de 44px plus le logo ne tiennent pas. */}
                        <div className="ml-auto flex min-w-0 items-center gap-0.5 pr-1.5 sm:gap-1 sm:pr-2.5 lg:hidden">
                            {session && isDesktop === false && <StatusCluster userId={session.user.id} />}
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className={touchBtn}
                                aria-label="Rechercher"
                            >
                                <Search className="h-5 w-5" />
                            </button>
                            {session && isDesktop === false && <NotificationBell />}
                            <button
                                className={touchBtn}
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-expanded={isMenuOpen}
                                aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                            >
                                <HamburgerMenuIcon className="h-5 w-5 text-[var(--wk-ink)]" />
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Mobile : voile */}
            <div
                className={`fixed inset-0 z-[101] bg-[rgba(26,21,18,0.4)] transition-opacity duration-300 lg:hidden ${
                    isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                onClick={closeMobileMenu}
                aria-hidden="true"
            />

            {/* Mobile : tiroir */}
            <div
                className={`fixed right-0 top-0 z-[102] flex h-full w-[min(320px,88vw)] flex-col bg-white pb-safe shadow-2xl transition-transform duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
                    isMenuOpen ? "translate-x-0" : "translate-x-full"
                }`}
                role="dialog"
                aria-modal="true"
                aria-label="Menu de navigation"
                inert={!isMenuOpen}
            >
                <div className="flex shrink-0 items-center justify-between border-b border-[rgba(26,21,18,0.07)] py-3 pl-5 pr-3 safe-area-top">
                    <WorkytLogo className="h-6" />
                    <button
                        onClick={closeMobileMenu}
                        className={touchBtn}
                        aria-label="Fermer le menu"
                    >
                        <Cross2Icon className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain py-2">
                    <div className="px-2 py-1">
                        {navLinks.map((link) => {
                            const active = isActive(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-current={active ? "page" : undefined}
                                    className={`flex min-h-[48px] items-center justify-between rounded-xl px-3 py-3 text-base font-semibold text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)] ${
                                        active ? "bg-[var(--wk-paper-2)]" : ""
                                    }`}
                                    onClick={closeMobileMenu}
                                >
                                    <span className="flex items-center gap-3">
                                        <link.icon className={`h-6 w-6 shrink-0 ${active ? "text-[var(--wk-accent)]" : "text-[rgba(26,21,18,0.55)]"}`} />
                                        {link.label}
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.3)]" />
                                </Link>
                            );
                        })}

                        <button
                            onClick={() => setIsBlogOpenMobile(!isBlogOpenMobile)}
                            aria-expanded={isBlogOpenMobile}
                            className={`flex min-h-[48px] w-full items-center justify-between rounded-xl px-3 py-3 text-base font-semibold text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)] ${
                                isBlogOpenMobile ? "bg-[var(--wk-paper)]" : ""
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <BlogIcon className="h-6 w-6 shrink-0 text-[rgba(26,21,18,0.55)]" />
                                Blog
                            </span>
                            <ChevronDownIcon className={`h-4 w-4 shrink-0 text-[rgba(26,21,18,0.35)] transition-transform duration-200 ${isBlogOpenMobile ? "rotate-180" : ""}`} />
                        </button>
                        {isBlogOpenMobile && (
                            <div className="pb-1">
                                {blogLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="flex min-h-[44px] items-center gap-3 rounded-xl pl-12 pr-3 text-[15px] font-medium text-[rgba(26,21,18,0.78)] transition-colors active:bg-[var(--wk-paper-2)]"
                                        onClick={closeMobileMenu}
                                    >
                                        <link.icon className="h-[18px] w-[18px] shrink-0 text-[var(--wk-accent)]" />
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={drawerSep} />

                    <Link
                        href={DONATE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${drawerRow} font-semibold`}
                        onClick={closeMobileMenu}
                    >
                        <Heart className="h-5 w-5 shrink-0 fill-[var(--wk-accent)] text-[var(--wk-accent)]" />
                        Faire un don
                    </Link>

                    <div className={drawerSep} />

                    {session ? (
                        <>
                            <div className="px-4 pb-2 pt-1">
                                <ProfileCard
                                    username={session.user.username}
                                    points={session.user.points}
                                    userId={session.user.id}
                                    role={session.user.role}
                                    showChevron={false}
                                    className="!rounded-xl"
                                />
                            </div>

                            {isStaff && (
                                <div className="py-1">
                                    <Link href="/dashboard" className="mx-4 flex min-h-[44px] items-center gap-3 rounded-xl bg-[rgba(255,106,26,0.1)] px-4 py-3 text-[15px] font-semibold text-[#c24a0a] transition-colors active:bg-[rgba(255,106,26,0.16)]" onClick={closeMobileMenu}>
                                        <TableauIcon className="h-5 w-5 shrink-0" />
                                        Tableau de bord
                                    </Link>
                                </div>
                            )}

                            <div className="py-1">
                                <Link href={`/compte/${session.user.id}`} className={drawerRow} onClick={closeMobileMenu}>
                                    <EleveIcon className={drawerIcon} />
                                    Mon compte
                                </Link>
                                {/* Reprise des favoris, retirés de la barre mobile
                                    pour ne pas dépasser quatre cibles à 360px. */}
                                <Link href="/fiches/favoris" className={drawerRow} onClick={closeMobileMenu}>
                                    <FavoriIcon className={drawerIcon} />
                                    Mes favoris
                                </Link>
                                <button
                                    onClick={() => {
                                        closeMobileMenu();
                                        setIsQuestsOpen(true);
                                    }}
                                    className={`${drawerRow} w-full text-left`}
                                >
                                    <ObjectifIcon className={drawerIcon} />
                                    Quêtes
                                </button>
                                <Link href="/recompenses" className={drawerRow} onClick={closeMobileMenu}>
                                    <DiplomeIcon className={drawerIcon} />
                                    Récompenses
                                </Link>
                                <Link href="/gems" className={drawerRow} onClick={closeMobileMenu}>
                                    <Image src="/badge/braise.svg" alt="" width={20} height={20} className="h-5 w-5 shrink-0" />
                                    Gemmes
                                </Link>
                                <Link href="/award" className={drawerRow} onClick={closeMobileMenu}>
                                    <MedailleIcon className="h-5 w-5 shrink-0 text-[var(--wk-accent)]" />
                                    Workyt Award
                                </Link>
                            </div>

                            <div className={drawerSep} />

                            <div className="py-1">
                                <Link href="/fiches/creer" className={drawerRow} onClick={closeMobileMenu}>
                                    <FicheIcon className={drawerIcon} />
                                    Partager une fiche
                                </Link>
                                <Link href="/forum/creer" className={drawerRow} onClick={closeMobileMenu}>
                                    <ForumIcon className={drawerIcon} />
                                    Déposer une question
                                </Link>
                            </div>

                            <div className={drawerSep} />

                            <Link href="https://dc.gg/workyt" target="_blank" rel="noopener noreferrer" className={drawerRow} onClick={closeMobileMenu}>
                                <DiscordLogoIcon className="h-5 w-5 shrink-0 text-indigo-500" />
                                Discord
                            </Link>

                            <div className="flex items-center justify-center gap-1 py-1">
                                {socialLinks.map((s) => (
                                    <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[rgba(26,21,18,0.5)] transition-colors active:bg-[var(--wk-paper-2)]">
                                        <s.icon className="h-5 w-5" />
                                    </a>
                                ))}
                            </div>

                            <div className={drawerSep} />

                            <button onClick={handleSignOut} className={`${drawerRow} w-full !text-red-600 active:!bg-red-50`}>
                                <ExitIcon className="h-5 w-5 shrink-0" />
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

            {session && questsMounted && (
                <QuestsPanel externalOpen={isQuestsOpen} onOpenChange={setIsQuestsOpen} />
            )}

            {isSearchOpen && <SearchCommandPalette open={isSearchOpen} onOpenChange={setIsSearchOpen} />}
        </>
    );
}
