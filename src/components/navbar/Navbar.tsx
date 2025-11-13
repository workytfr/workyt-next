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
    HamburgerMenuIcon,
    PersonIcon,
    GearIcon,
    ExitIcon,
    FileTextIcon,
    ChatBubbleIcon,
    StarIcon,
    StarFilledIcon
} from "@radix-ui/react-icons";
import ProfileAvatar from "@/components/ui/profile";
import ProfileCard from "@/components/ui/ProfileCard";
import GemIndicator from "@/components/ui/GemIndicator";
import CustomUsername from "@/components/ui/CustomUsername";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
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

    const closeMobileMenu = () => {
        setIsMenuOpen(false);
    };

    const handleSignOut = () => {
        setIsProfileOpen(false);
        signOut();
    };

    return (
        <>
            <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 py-3 sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/workyt_fr.svg"
                            alt="Workyt"
                            width={90}
                            height={40}
                            className="cursor-pointer"
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-8">
                        <Link href="/forum" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                            Forum
                        </Link>
                        <Link href="/fiches" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                            Fiches
                        </Link>
                        <Link href="/cours" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                            Cours
                        </Link>
                        
                        {/* Blog Dropdown */}
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger className="text-gray-700 hover:text-blue-600 transition-colors font-medium flex items-center">
                                Blog <ChevronDownIcon className="ml-1 w-3 h-3" />
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[200px]"
                                    align="start"
                                    sideOffset={5}
                                >
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
                                        <Link href="https://blog.workyt.fr/category/orientation-scolaire/" className="text-gray-700 px-4 py-2 hover:bg-gray-50 block transition-colors">
                                            Orientation scolaire
                                        </Link>
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>

                        <Link href="https://workyt.fr/kits/" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                            Kits
                        </Link>
                    </div>

                    {/* Right side - Desktop */}
                    <div className="hidden lg:flex items-center space-x-4">
                        {/* Social Links */}
                        <div className="flex items-center space-x-2">
                            <a href="https://twitter.com/workyt_fr?lang=fr" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors p-1">
                                <TwitterLogoIcon className="w-4 h-4" />
                            </a>
                            <a href="https://www.instagram.com/workyt/?hl=fr" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-500 transition-colors p-1">
                                <InstagramLogoIcon className="w-4 h-4" />
                            </a>
                            <a href="https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-500 transition-colors p-1">
                                <VideoIcon className="w-4 h-4" />
                            </a>
                            <a href="https://www.linkedin.com/company/workyt" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 transition-colors p-1">
                                <LinkedInLogoIcon className="w-4 h-4" />
                            </a>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-3">
                            {/* Discord Button */}
                            <Link 
                                href="https://dc.gg/workyt" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="relative bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden text-sm font-medium flex items-center gap-2"
                                style={{
                                    backgroundImage: `
                                        radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                        radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                        linear-gradient(135deg, #6366f1, #4f46e5)
                                    `,
                                    backgroundSize: '50px 50px, 80px 80px, 60px 60px, 100% 100%'
                                }}
                            >
                                <DiscordLogoIcon className="w-4 h-4" />
                                <span className="relative z-10">Discord</span>
                            </Link>

                            {/* Donate Button */}
                            <Link 
                                href="https://www.helloasso.com/associations/workyt/formulaires/1" 
                                className="relative bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-900 text-white px-4 py-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden text-sm font-medium"
                                style={{
                                    backgroundImage: `
                                        radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                                        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                        radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
                                        radial-gradient(circle at 60% 30%, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                                        linear-gradient(135deg, #1f2937, #000000)
                                    `,
                                    backgroundSize: '40px 40px, 70px 70px, 55px 55px, 85px 85px, 100% 100%'
                                }}
                            >
                                <span className="relative z-10">Faire un don</span>
                            </Link>
                        </div>

                        {/* Auth Section */}
                        {session ? (
                            <div className="flex items-center space-x-3">
                                <NotificationBell />
                                
                                <DropdownMenu.Root open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                                    <DropdownMenu.Trigger className="text-gray-700 hover:opacity-80 transition-opacity">
                                        <ProfileCard
                                            username={session.user.username}
                                            points={session.user.points}
                                            userId={session.user.id}
                                        />
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                            className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 w-56"
                                            align="end"
                                            sideOffset={5}
                                        >
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm text-gray-500">{session.user?.email}</p>
                                            </div>
                                            
                                            <DropdownMenu.Item asChild>
                                                <Link href={`/compte/${session.user.id}`} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                                    <PersonIcon className="w-4 h-4 mr-2" />
                                                    Mon Compte
                                                </Link>
                                            </DropdownMenu.Item>
                                            
                                            <DropdownMenu.Item asChild>
                                                <Link href="/recompenses" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                                    <StarIcon className="w-4 h-4 mr-2" />
                                                    Récompenses
                                                </Link>
                                            </DropdownMenu.Item>
                                            
                                            <DropdownMenu.Item asChild>
                                                <Link href="/gems" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                                    <StarFilledIcon className="w-4 h-4 mr-2" />
                                                    Gemmes
                                                </Link>
                                            </DropdownMenu.Item>
                                            
                                            <DropdownMenu.Separator className="my-1" />
                                            
                                            <DropdownMenu.Item asChild>
                                                <Link href="/fiches/creer" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                                    <FileTextIcon className="w-4 h-4 mr-2" />
                                                    Partager une fiche
                                                </Link>
                                            </DropdownMenu.Item>
                                            
                                            <DropdownMenu.Item asChild>
                                                <Link href="/forum/creer" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsProfileOpen(false)}>
                                                    <ChatBubbleIcon className="w-4 h-4 mr-2" />
                                                    Déposer une question
                                                </Link>
                                            </DropdownMenu.Item>
                                            
                                            <DropdownMenu.Separator className="my-1" />
                                            
                                            <DropdownMenu.Item>
                                                <button onClick={handleSignOut} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                    <ExitIcon className="w-4 h-4 mr-2" />
                                                    Déconnexion
                                                </button>
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                </DropdownMenu.Root>
                            </div>
                        ) : (
                            <Button
                                onClick={() => setIsAuthOpen(true)}
                                className="relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
                                style={{
                                    backgroundImage: `
                                        radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                        radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                        linear-gradient(135deg, #f97316, #ea580c)
                                    `,
                                    backgroundSize: '50px 50px, 80px 80px, 60px 60px, 100% 100%'
                                }}
                            >
                                <span className="relative z-10">Connexion</span>
                            </Button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden flex items-center text-gray-700 focus:outline-none p-2"
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

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-200">
                        <div className="container mx-auto px-4 py-4 space-y-4">
                            {/* Mobile Navigation Links */}
                            <div className="space-y-3">
                                <Link href="/forum" className="block text-gray-700 hover:text-blue-600 transition-colors font-medium" onClick={closeMobileMenu}>
                                    Forum
                                </Link>
                                <Link href="/fiches" className="block text-gray-700 hover:text-blue-600 transition-colors font-medium" onClick={closeMobileMenu}>
                                    Fiches
                                </Link>
                                <Link href="/cours" className="block text-gray-700 hover:text-blue-600 transition-colors font-medium" onClick={closeMobileMenu}>
                                    Cours
                                </Link>
                                <Link href="https://workyt.fr/kits/" className="block text-gray-700 hover:text-blue-600 transition-colors font-medium" onClick={closeMobileMenu}>
                                    Kits
                                </Link>
                            </div>

                            {/* Mobile Social Links */}
                            <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                                <a href="https://twitter.com/workyt_fr?lang=fr" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors">
                                    <TwitterLogoIcon className="w-5 h-5" />
                                </a>
                                <a href="https://www.instagram.com/workyt/?hl=fr" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-500 transition-colors">
                                    <InstagramLogoIcon className="w-5 h-5" />
                                </a>
                                <a href="https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-500 transition-colors">
                                    <VideoIcon className="w-5 h-5" />
                                </a>
                                <a href="https://dc.gg/workyt" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-500 transition-colors">
                                    <DiscordLogoIcon className="w-5 h-5" />
                                </a>
                            </div>

                            {/* Mobile Auth Section */}
                            <div className="pt-4 border-t border-gray-200">
                                {session ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <NotificationBell />
                                        </div>
                                        <ProfileCard
                                            username={session.user.username}
                                            points={session.user.points}
                                            userId={session.user.id}
                                        />
                                        <div className="space-y-2">
                                            <Link href={`/compte/${session.user.id}`} className="block text-gray-700 hover:text-blue-600 transition-colors" onClick={closeMobileMenu}>
                                                Mon Compte
                                            </Link>
                                            <Link href="/recompenses" className="block text-gray-700 hover:text-blue-600 transition-colors" onClick={closeMobileMenu}>
                                                Récompenses
                                            </Link>
                                            <Link href="/gems" className="block text-gray-700 hover:text-blue-600 transition-colors" onClick={closeMobileMenu}>
                                                Gemmes
                                            </Link>
                                            <Link href="/fiches/creer" className="block text-gray-700 hover:text-blue-600 transition-colors" onClick={closeMobileMenu}>
                                                Partager une fiche
                                            </Link>
                                            <Link href="/forum/creer" className="block text-gray-700 hover:text-blue-600 transition-colors" onClick={closeMobileMenu}>
                                                Déposer une question
                                            </Link>
                                            <button onClick={handleSignOut} className="block text-red-600 hover:text-red-700 transition-colors">
                                                Déconnexion
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            setIsAuthOpen(true);
                                            closeMobileMenu();
                                        }}
                                        className="w-full relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
                                        style={{
                                            backgroundImage: `
                                                radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                                radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                                linear-gradient(135deg, #f97316, #ea580c)
                                            `,
                                            backgroundSize: '50px 50px, 80px 80px, 60px 60px, 100% 100%'
                                        }}
                                    >
                                        <span className="relative z-10">Connexion</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

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