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
    Package,
    Heart,
    ChevronRight,
} from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import ProfileCard from "@/components/ui/ProfileCard";
import GemIndicator from "@/components/ui/GemIndicator";
import CustomUsername from "@/components/ui/CustomUsername";
import NotificationBell from "@/components/NotificationBell";
import BookmarkBell from "@/components/BookmarkBell";
import QuestsPanel from "@/components/quests/QuestsPanel";
import { Button } from "@/components/ui/button";

const navLinks = [
    { href: "/forum", label: "Forum", icon: MessageSquare },
    { href: "/fiches", label: "Fiches", icon: FileText },
    { href: "/cours", label: "Cours", icon: BookOpen },
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
    const [isBlogOpenMobile, setIsBlogOpenMobile] = useState(false);
    const [isBlogOpen, setIsBlogOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const profileBtnRef = useRef<HTMLButtonElement>(null);
    const [profilePos, setProfilePos] = useState({ top: 0, right: 0 });
    const blogRef = useRef<HTMLDivElement>(null);
    const blogBtnRef = useRef<HTMLButtonElement>(null);
    const [blogPos, setBlogPos] = useState({ top: 0, left: 0 });
    const { data: session } = useSession();
    const pathname = usePathname();

    // Close mobile menu when screen size changes
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024 && isMenuOpen) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMenuOpen]);

    // Lock body scroll when mobile menu is open
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

    // Close profile dropdown on click outside
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

    // Close blog dropdown on click outside
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

    // Auto-open auth dialog on session expiry
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

    return (
        <>
            <nav className="bg-white border-b border-gray-200/50 py-2.5 sticky top-0 z-[100] shadow-sm safe-area-top">
                <div className="container mx-auto px-3 sm:px-4 flex items-center min-h-12">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center">
                        <Image
                            src="/workyt_fr.svg"
                            alt="Workyt"
                            width={70}
                            height={32}
                            className="cursor-pointer h-6 sm:h-7 w-auto"
                        />
                    </Link>

                    {/* Desktop Navigation - Centered */}
                    <div className="hidden lg:flex flex-1 items-center justify-center space-x-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50 ${
                                    isActive(link.href)
                                        ? "text-orange-600"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {link.label}
                                {isActive(link.href) && (
                                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500" />
                                )}
                            </Link>
                        ))}

                        {/* Blog Dropdown */}
                        <div ref={blogRef}>
                            <button
                                ref={blogBtnRef}
                                onClick={() => {
                                    if (!isBlogOpen && blogBtnRef.current) {
                                        const rect = blogBtnRef.current.getBoundingClientRect();
                                        setBlogPos({
                                            top: rect.bottom + 8,
                                            left: rect.left + rect.width / 2 - 110,
                                        });
                                    }
                                    setIsBlogOpen(!isBlogOpen);
                                }}
                                className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50 flex items-center gap-1 outline-none ${
                                    pathname.includes("blog") ? "text-orange-600" : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                Blog
                                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${isBlogOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isBlogOpen && (
                                <div
                                    className="fixed w-[220px] bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-[200]"
                                    style={{ top: blogPos.top, left: blogPos.left }}
                                >
                                    {blogLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                                            onClick={() => setIsBlogOpen(false)}
                                        >
                                            <link.icon className="w-4 h-4 text-gray-400" />
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link
                            href="https://workyt.fr/kits/"
                            className="relative px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                        >
                            Kits
                        </Link>
                    </div>

                    {/* Right side - Desktop - légèrement descendu pour alignement visuel */}
                    <div className="hidden lg:flex flex-shrink-0 items-center space-x-3 mt-1">
                        {/* Faire un don - always visible */}
                        <Link
                            href="https://www.helloasso.com/associations/workyt/formulaires/1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors px-3 py-1.5 rounded-full border border-pink-200 hover:bg-pink-50"
                        >
                            <Heart className="w-3.5 h-3.5" />
                            Faire un don
                        </Link>

                        {session ? (
                            <>
                                <BookmarkBell />
                                <NotificationBell />

                                {/* Profile - custom dropdown (no Radix) */}
                                <div ref={profileRef}>
                                    <button
                                        ref={profileBtnRef}
                                        onClick={() => {
                                            if (!isProfileOpen && profileBtnRef.current) {
                                                const rect = profileBtnRef.current.getBoundingClientRect();
                                                setProfilePos({
                                                    top: rect.bottom + 8,
                                                    right: window.innerWidth - rect.right,
                                                });
                                            }
                                            setIsProfileOpen(!isProfileOpen);
                                        }}
                                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity outline-none"
                                    >
                                        <ProfileCard
                                            username={session.user.username}
                                            points={session.user.points}
                                            userId={session.user.id}
                                            role={session.user.role}
                                            showChevron={false}
                                        />
                                        <ChevronDownIcon className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${isProfileOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {/* Profile panel - fixed to viewport */}
                                    {isProfileOpen && (
                                        <div
                                            className="fixed w-64 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-[200]"
                                            style={{ top: profilePos.top, right: profilePos.right }}
                                        >
                                            {/* Email */}
                                            <div className="px-4 py-2.5 border-b border-gray-100">
                                                <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                                            </div>

                                            {/* Account links */}
                                            <div className="py-1">
                                                <Link href={`/compte/${session.user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                                    <PersonIcon className="w-4 h-4 text-gray-400" />
                                                    Mon Compte
                                                </Link>
                                                <Link href="/recompenses" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                                    <StarIcon className="w-4 h-4 text-gray-400" />
                                                    Récompenses
                                                </Link>
                                                <Link href="/gems" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                                    <StarFilledIcon className="w-4 h-4 text-gray-400" />
                                                    Gemmes
                                                </Link>
                                            </div>

                                            <div className="h-px bg-gray-100 my-1" />

                                            {/* Quests */}
                                            <QuestsPanel />

                                            <div className="h-px bg-gray-100 my-1" />

                                            {/* Actions */}
                                            <div className="py-1">
                                                <Link href="/fiches/creer" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                                    <FileTextIcon className="w-4 h-4 text-gray-400" />
                                                    Partager une fiche
                                                </Link>
                                                <Link href="/forum/creer" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                                    <ChatBubbleIcon className="w-4 h-4 text-gray-400" />
                                                    Déposer une question
                                                </Link>
                                            </div>

                                            <div className="h-px bg-gray-100 my-1" />

                                            {/* Discord */}
                                            <div className="py-1">
                                                <Link href="https://dc.gg/workyt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                                    <DiscordLogoIcon className="w-4 h-4 text-indigo-500" />
                                                    Discord
                                                </Link>
                                            </div>

                                            <div className="h-px bg-gray-100 my-1" />

                                            {/* Social links row */}
                                            <div className="flex items-center justify-center gap-3 px-4 py-2.5">
                                                <a href="https://twitter.com/workyt_fr?lang=fr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors p-1">
                                                    <TwitterLogoIcon className="w-4 h-4" />
                                                </a>
                                                <a href="https://www.instagram.com/workyt/?hl=fr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors p-1">
                                                    <InstagramLogoIcon className="w-4 h-4" />
                                                </a>
                                                <a href="https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                    <VideoIcon className="w-4 h-4" />
                                                </a>
                                                <a href="https://www.linkedin.com/company/workyt" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors p-1">
                                                    <LinkedInLogoIcon className="w-4 h-4" />
                                                </a>
                                            </div>

                                            <div className="h-px bg-gray-100 my-1" />

                                            {/* Logout */}
                                            <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                <ExitIcon className="w-4 h-4" />
                                                Déconnexion
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <Button
                                onClick={() => setIsAuthOpen(true)}
                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                                Connexion
                            </Button>
                        )}
                    </div>

                    {/* Mobile right side - touch targets min 44px */}
                    <div className="flex lg:hidden flex-1 justify-end items-center gap-1 sm:gap-2 ml-2">
                        {session && <BookmarkBell />}
                        {session && <NotificationBell />}
                        <button
                            className="flex items-center justify-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200 min-w-[44px] min-h-[44px] p-2 rounded-xl active:bg-gray-100 transition-colors touch-manipulation"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                        >
                            <HamburgerMenuIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Slide-over Overlay - backdrop blur */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[101] lg:hidden transition-opacity duration-300 ${
                    isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={closeMobileMenu}
                aria-hidden="true"
            />

            {/* Mobile Slide-over Panel */}
            <div
                className={`fixed right-0 top-0 h-full w-[min(320px,90vw)] sm:w-80 bg-white z-[102] shadow-2xl lg:hidden transition-transform duration-300 ease-out flex flex-col pb-safe ${
                    isMenuOpen ? "translate-x-0" : "translate-x-full"
                }`}
                role="dialog"
                aria-modal="true"
                aria-label="Menu de navigation"
            >
                {/* Panel header - sticky */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0 safe-area-top">
                    <Image src="/workyt_fr.svg" alt="Workyt" width={60} height={28} className="h-6 w-auto" />
                    <button
                        onClick={closeMobileMenu}
                        className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-500 touch-manipulation"
                        aria-label="Fermer le menu"
                    >
                        <Cross2Icon className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable content - touch-friendly padding */}
                <div className="flex-1 overflow-y-auto overscroll-contain py-2">
                    {/* Navigation links - min 48px touch targets */}
                    <div className="py-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center justify-between min-h-[48px] px-5 py-3 text-base font-medium transition-colors active:bg-gray-100 ${
                                        isActive(link.href)
                                            ? "text-orange-600 bg-orange-50/80"
                                            : "text-gray-700"
                                    }`}
                                    onClick={closeMobileMenu}
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon className="w-5 h-5 shrink-0" />
                                        {link.label}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                                </Link>
                            );
                        })}

                        {/* Blog accordion */}
                        <button
                            onClick={() => setIsBlogOpenMobile(!isBlogOpenMobile)}
                            className={`flex items-center justify-between w-full min-h-[48px] px-5 py-3 text-base font-medium transition-colors active:bg-gray-100 ${
                                isBlogOpenMobile ? "text-orange-600 bg-orange-50/80" : "text-gray-700"
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <Newspaper className="w-5 h-5 shrink-0" />
                                Blog
                            </span>
                            <ChevronDownIcon className={`w-4 h-4 text-gray-300 shrink-0 transition-transform duration-200 ${isBlogOpenMobile ? "rotate-180" : ""}`} />
                        </button>
                        {isBlogOpenMobile && (
                            <div className="bg-gray-50/50">
                                {blogLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="flex items-center min-h-[44px] pl-14 pr-5 text-sm text-gray-600 active:bg-gray-100 active:text-orange-600 transition-colors"
                                        onClick={closeMobileMenu}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}

                        <Link
                            href="https://workyt.fr/kits/"
                            className="flex items-center justify-between min-h-[48px] px-5 py-3 text-base font-medium text-gray-700 active:bg-gray-100 transition-colors"
                            onClick={closeMobileMenu}
                        >
                            <span className="flex items-center gap-3">
                                <Package className="w-5 h-5 shrink-0" />
                                Kits
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                        </Link>
                    </div>

                    <div className="h-px bg-gray-100 mx-4 my-2" />

                    {/* Faire un don - mobile */}
                    <Link
                        href="https://www.helloasso.com/associations/workyt/formulaires/1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 min-h-[48px] px-5 py-3 text-base font-medium text-pink-600 active:bg-pink-50 transition-colors"
                        onClick={closeMobileMenu}
                    >
                        <Heart className="w-5 h-5 shrink-0" />
                        Faire un don
                    </Link>

                    <div className="h-px bg-gray-100 mx-4 my-2" />

                    {/* Auth section */}
                    {session ? (
                        <>
                            {/* Profile section */}
                            <div className="p-4 pb-2">
                                <ProfileCard
                                    username={session.user.username}
                                    points={session.user.points}
                                    userId={session.user.id}
                                    role={session.user.role}
                                />
                            </div>

                            <div className="py-1">
                                <Link href={`/compte/${session.user.id}`} className="flex items-center gap-3 min-h-[44px] px-5 py-3 text-sm text-gray-700 active:bg-gray-50 transition-colors" onClick={closeMobileMenu}>
                                    <PersonIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                    Mon Compte
                                </Link>
                                <Link href="/recompenses" className="flex items-center gap-3 min-h-[44px] px-5 py-3 text-sm text-gray-700 active:bg-gray-50 transition-colors" onClick={closeMobileMenu}>
                                    <StarIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                    Récompenses
                                </Link>
                                <Link href="/gems" className="flex items-center gap-3 min-h-[44px] px-5 py-3 text-sm text-gray-700 active:bg-gray-50 transition-colors" onClick={closeMobileMenu}>
                                    <StarFilledIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                    Gemmes
                                </Link>
                            </div>

                            <div className="h-px bg-gray-100 mx-4 my-2" />

                            <div className="py-1 px-2">
                                <QuestsPanel />
                            </div>

                            <div className="h-px bg-gray-100 mx-4 my-2" />

                            <div className="py-1">
                                <Link href="/fiches/creer" className="flex items-center gap-3 min-h-[44px] px-5 py-3 text-sm text-gray-700 active:bg-gray-50 transition-colors" onClick={closeMobileMenu}>
                                    <FileTextIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                    Partager une fiche
                                </Link>
                                <Link href="/forum/creer" className="flex items-center gap-3 min-h-[44px] px-5 py-3 text-sm text-gray-700 active:bg-gray-50 transition-colors" onClick={closeMobileMenu}>
                                    <ChatBubbleIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                    Déposer une question
                                </Link>
                            </div>

                            <div className="h-px bg-gray-100 mx-4 my-2" />

                            {/* Discord */}
                            <Link href="https://dc.gg/workyt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 min-h-[44px] px-5 py-3 text-sm text-gray-700 active:bg-indigo-50 active:text-indigo-700 transition-colors" onClick={closeMobileMenu}>
                                <DiscordLogoIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                                Discord
                            </Link>

                            <div className="h-px bg-gray-100 mx-4 my-2" />

                            {/* Social icons - min 44px touch targets */}
                            <div className="flex items-center justify-center gap-1">
                                <a href="https://twitter.com/workyt_fr?lang=fr" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-400 active:text-blue-400 transition-colors rounded-full">
                                    <TwitterLogoIcon className="w-5 h-5" />
                                </a>
                                <a href="https://www.instagram.com/workyt/?hl=fr" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-400 active:text-pink-500 transition-colors rounded-full">
                                    <InstagramLogoIcon className="w-5 h-5" />
                                </a>
                                <a href="https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-400 active:text-red-500 transition-colors rounded-full">
                                    <VideoIcon className="w-5 h-5" />
                                </a>
                                <a href="https://www.linkedin.com/company/workyt" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-400 active:text-blue-600 transition-colors rounded-full">
                                    <LinkedInLogoIcon className="w-5 h-5" />
                                </a>
                            </div>

                            <div className="h-px bg-gray-100 mx-4 my-2" />

                            {/* Logout - bottom with safe area */}
                            <button onClick={handleSignOut} className="flex items-center gap-3 w-full min-h-[48px] px-5 py-3 text-sm font-medium text-red-600 active:bg-red-50 transition-colors rounded-lg">
                                <ExitIcon className="w-4 h-4 shrink-0" />
                                Déconnexion
                            </button>
                        </>
                    ) : (
                        <div className="p-4">
                            <Button
                                onClick={() => {
                                    setIsAuthOpen(true);
                                    closeMobileMenu();
                                }}
                                className="w-full min-h-[48px] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 text-white py-3 rounded-xl text-base font-medium transition-all duration-300 shadow-md active:scale-[0.98] touch-manipulation"
                            >
                                Connexion
                            </Button>
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
        </>
    );
}
