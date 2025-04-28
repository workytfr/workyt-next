"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import AuthPage from "@/components/forms/RegisterForm";
import { useState, useEffect } from "react";
import {
    InstagramLogoIcon,
    TwitterLogoIcon,
    DiscordLogoIcon,
    ChevronDownIcon,
    VideoIcon,
    LinkedInLogoIcon,
    Cross2Icon,
    HamburgerMenuIcon
} from "@radix-ui/react-icons";
import ProfileAvatar from "@/components/ui/profile";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [mobileDropdowns, setMobileDropdowns] = useState({
        blog: false
    });
    const { data: session } = useSession();

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

    // Handle mobile dropdown toggle
    const toggleMobileDropdown = (key: keyof typeof mobileDropdowns) => {
        setMobileDropdowns(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Close mobile menu (useful for links)
    const closeMobileMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <nav className="bg-white border-b border-gray-200 py-4 sticky top-0 z-50">
            <div className="container mx-auto px-4 flex justify-between items-center">
                {/* Left side: Logo */}
                <div className="flex items-center">
                    <Link href="/">
                        <Image
                            src="/workyt_fr.svg"
                            alt="Logo"
                            width={100}
                            height={100}
                            className="cursor-pointer"
                        />
                    </Link>
                </div>

                {/* Menu Items for Large Screens */}
                <div className="hidden lg:flex items-center space-x-6">
                    <Link href="/forum" className="text-gray-700 font-semibold hover:text-primary transition-colors">
                        Forum
                    </Link>

                    <Link href="/fiches" className="text-gray-700 font-semibold hover:text-primary transition-colors">
                        Fiches
                    </Link>

                    <Link href="/cours" className="text-gray-700 font-semibold hover:text-primary transition-colors">
                        Cours
                    </Link>

                    {/* Blog Dropdown */}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger className="text-gray-700 font-semibold cursor-pointer flex items-center hover:text-primary transition-colors">
                            Blog <ChevronDownIcon className="ml-1" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="bg-white border border-gray-100 rounded-lg shadow-lg mt-2 py-2 z-50 min-w-[200px]">
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/actualites/" className="text-gray-700 px-4 py-2 hover:bg-gray-50 block transition-colors">
                                        Actualités
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/conseils-methodes/" className="text-gray-700 px-4 py-2 hover:bg-gray-50 block transition-colors">
                                        Conseils & Méthodes
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/culture/" className="text-gray-700 px-4 py-2 hover:bg-gray-50 block transition-colors">
                                        Culture
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/test-produit/" className="text-gray-700 px-4 py-2 hover:bg-gray-50 block transition-colors">
                                        Nos Tests
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/orientation-scolaire/" className="text-gray-700 px-4 py-2 hover:bg-gray-50 block transition-colors">
                                        Orientation scolaire
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/le-bon-plan/" className="text-gray-700 px-4 py-2 hover:bg-gray-50 block transition-colors">
                                        Le Bon Plan
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/nos-interviews/" className="text-gray-700 px-4 py-2 hover:bg-gray-50 block transition-colors">
                                        Nos Interviews
                                    </Link>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                    <Link href="https://workyt.fr/kits/" className="text-gray-700 font-semibold hover:text-primary transition-colors">
                        Nos Kits
                    </Link>
                </div>

                {/* Right side: Social, Donate & Auth - Desktop */}
                <div className="hidden lg:flex items-center space-x-4">
                    <Link href="https://www.helloasso.com/associations/workyt/formulaires/1" className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
                        Faire un don
                    </Link>

                    <a href="https://twitter.com/workyt_fr?lang=fr" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-400 transition-colors p-2">
                        <TwitterLogoIcon className="w-4 h-4" />
                    </a>
                    <a href="https://www.instagram.com/workyt/?hl=fr" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-pink-500 transition-colors p-2">
                        <InstagramLogoIcon className="w-4 h-4" />
                    </a>
                    <a href="https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-red-500 transition-colors p-2">
                        <VideoIcon className="w-4 h-4" />
                    </a>
                    <a href="https://www.linkedin.com/company/workyt" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-800 transition-colors p-2">
                        <LinkedInLogoIcon className="w-4 h-4" />
                    </a>
                    <Link href="https://dc.gg/workyt" className="bg-white text-black px-4 py-2 rounded-full flex items-center space-x-2 border border-gray-200 hover:bg-gray-50 transition-colors">
                        <DiscordLogoIcon className="w-4 h-4" />
                        <span>Rejoindre</span>
                    </Link>

                    {/* Auth - Desktop */}
                    {session ? (
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger className="flex items-center space-x-2 text-gray-700 font-semibold cursor-pointer">
                                <ProfileAvatar
                                    username={session.user.username}
                                    points={session.user.points}
                                />
                                <span>{session.user?.username || "Utilisateur"}</span>
                                <ChevronDownIcon className="w-4 h-4" />
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    className="bg-white border border-gray-100 rounded-lg shadow-lg mt-2 py-2 z-50 w-48"
                                    align="end"
                                >
                                    <DropdownMenu.Item
                                        className="px-4 py-2 text-sm text-gray-500 cursor-default"
                                    >
                                        <span>{session.user?.email}</span>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator className="border-t my-1" />
                                    <DropdownMenu.Item asChild>
                                        <Link href={`/compte/${session.user.id}`} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 block transition-colors">
                                            Mon Compte
                                        </Link>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item asChild>
                                        <Link href={`/fiches/creer`} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 block transition-colors">
                                            Partager une fiche
                                        </Link>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item asChild>
                                        <Link href={`/forum/creer`} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 block transition-colors">
                                            Déposer une question
                                        </Link>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator className="border-t my-1" />
                                    <DropdownMenu.Item>
                                        <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors">
                                            Déconnexion
                                        </button>
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    ) : (
                        <button
                            onClick={() => setIsAuthOpen(true)}
                            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            Connexion
                        </button>
                    )}
                </div>

                {/* Mobile: Hamburger button */}
                <button
                    className="lg:hidden flex items-center text-gray-700 focus:outline-none"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                >
                    {isMenuOpen ? (
                        <Cross2Icon className="h-6 w-6" />
                    ) : (
                        <HamburgerMenuIcon className="h-6 w-6" />
                    )}
                </button>
            </div>

            {/* Mobile Menu - Slide from right */}
            <div
                className={`lg:hidden fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
                    isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                } flex flex-col h-full`}
            >
                {/* Mobile menu header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <span className="font-semibold text-lg">Menu</span>
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="p-2 rounded-full hover:bg-gray-100"
                        aria-label="Fermer le menu"
                    >
                        <Cross2Icon className="h-5 w-5" />
                    </button>
                </div>

                {/* Mobile menu content with scroll */}
                <div className="flex-1 overflow-y-auto py-2">
                    {/* Main navigation links */}
                    <div className="px-4">
                        <Link
                            href="/forum"
                            className="flex items-center py-3 border-b border-gray-100 text-gray-800"
                            onClick={closeMobileMenu}
                        >
                            Forum
                        </Link>

                        <Link
                            href="/fiches"
                            className="flex items-center py-3 border-b border-gray-100 text-gray-800"
                            onClick={closeMobileMenu}
                        >
                            Fiches
                        </Link>

                        <Link
                            href="/cours"
                            className="flex items-center py-3 border-b border-gray-100 text-gray-800"
                            onClick={closeMobileMenu}
                        >
                            Cours
                        </Link>

                        {/* Blog dropdown for mobile */}
                        <div className="py-3 border-b border-gray-100">
                            <button
                                className="flex justify-between items-center w-full text-gray-800"
                                onClick={() => toggleMobileDropdown('blog')}
                            >
                                <span>Blog</span>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${mobileDropdowns.blog ? 'rotate-180' : ''}`} />
                            </button>

                            {mobileDropdowns.blog && (
                                <div className="mt-2 ml-4 space-y-2">
                                    <Link
                                        href="https://blog.workyt.fr/category/actualites/"
                                        className="block py-2 text-gray-600"
                                        onClick={closeMobileMenu}
                                    >
                                        Actualités
                                    </Link>
                                    <Link
                                        href="https://blog.workyt.fr/category/conseils-methodes/"
                                        className="block py-2 text-gray-600"
                                        onClick={closeMobileMenu}
                                    >
                                        Conseils & Méthodes
                                    </Link>
                                    <Link
                                        href="https://blog.workyt.fr/category/culture/"
                                        className="block py-2 text-gray-600"
                                        onClick={closeMobileMenu}
                                    >
                                        Culture
                                    </Link>
                                    <Link
                                        href="https://blog.workyt.fr/category/test-produit/"
                                        className="block py-2 text-gray-600"
                                        onClick={closeMobileMenu}
                                    >
                                        Nos Tests
                                    </Link>
                                    <Link
                                        href="https://blog.workyt.fr/category/orientation-scolaire/"
                                        className="block py-2 text-gray-600"
                                        onClick={closeMobileMenu}
                                    >
                                        Orientation scolaire
                                    </Link>
                                    <Link
                                        href="https://blog.workyt.fr/category/le-bon-plan/"
                                        className="block py-2 text-gray-600"
                                        onClick={closeMobileMenu}
                                    >
                                        Le Bon Plan
                                    </Link>
                                    <Link
                                        href="https://blog.workyt.fr/category/nos-interviews/"
                                        className="block py-2 text-gray-600"
                                        onClick={closeMobileMenu}
                                    >
                                        Nos Interviews
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Link
                            href="https://workyt.fr/kits/"
                            className="flex items-center py-3 border-b border-gray-100 text-gray-800"
                            onClick={closeMobileMenu}
                        >
                            Nos Kits
                        </Link>
                    </div>

                    {/* User section - Mobile */}
                    {session ? (
                        <div className="px-4 py-4 mt-2 bg-gray-50">
                            <div className="flex items-center space-x-3 mb-4">
                                <ProfileAvatar
                                    username={session.user.username}
                                    points={session.user.points}
                                />
                                <div>
                                    <p className="font-semibold">{session.user?.username || "Utilisateur"}</p>
                                    <p className="text-sm text-gray-500">{session.user?.email}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Link
                                    href={`/compte/${session.user.id}`}
                                    className="block text-gray-600 py-2"
                                    onClick={closeMobileMenu}
                                >
                                    Mon Compte
                                </Link>
                                <Link
                                    href={`/fiches/creer`}
                                    className="block text-gray-600 py-2"
                                    onClick={closeMobileMenu}
                                >
                                    Partager une fiche
                                </Link>
                                <Link
                                    href={`/forum/creer`}
                                    className="block text-gray-600 py-2"
                                    onClick={closeMobileMenu}
                                >
                                    Déposer une question
                                </Link>
                                <button
                                    onClick={() => {
                                        signOut();
                                        closeMobileMenu();
                                    }}
                                    className="block text-red-500 py-2"
                                >
                                    Déconnexion
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 mt-4">
                            <button
                                onClick={() => {
                                    setIsAuthOpen(true);
                                    closeMobileMenu();
                                }}
                                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-opacity-90 transition-colors"
                            >
                                Connexion / Inscription
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile menu footer */}
                <div className="p-4 border-t border-gray-100">
                    {/* Donation button */}
                    <Link
                        href="https://www.helloasso.com/associations/workyt/formulaires/1"
                        className="block text-center bg-black text-white py-3 rounded-lg mb-4 font-medium"
                        onClick={closeMobileMenu}
                    >
                        Faire un don
                    </Link>

                    {/* Community link */}
                    <Link
                        href="https://dc.gg/workyt"
                        className="flex items-center justify-center bg-indigo-600 text-white py-3 rounded-lg mb-6"
                        onClick={closeMobileMenu}
                    >
                        <DiscordLogoIcon className="w-5 h-5 mr-2" />
                        Rejoindre la communauté
                    </Link>

                    {/* Social links grid */}
                    <div className="grid grid-cols-4 gap-2">
                        <a
                            href="https://twitter.com/workyt_fr?lang=fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            <TwitterLogoIcon className="w-5 h-5" />
                        </a>
                        <a
                            href="https://www.instagram.com/workyt/?hl=fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            <InstagramLogoIcon className="w-5 h-5" />
                        </a>
                        <a
                            href="https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            <VideoIcon className="w-5 h-5" />
                        </a>
                        <a
                            href="https://www.linkedin.com/company/workyt"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            <LinkedInLogoIcon className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Backdrop for mobile menu */}
            {isMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}

            {/* Auth Dialog */}
            <Dialog open={isAuthOpen} onOpenChange={(open) => setIsAuthOpen(open)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-black">Connexion / Inscription</DialogTitle>
                        <DialogDescription>
                            Veuillez entrer vos identifiants pour accéder à votre compte.
                        </DialogDescription>
                    </DialogHeader>
                    <AuthPage />
                </DialogContent>
            </Dialog>
        </nav>
    );
}