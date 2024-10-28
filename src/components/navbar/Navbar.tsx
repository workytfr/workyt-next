"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { InstagramLogoIcon, TwitterLogoIcon, DiscordLogoIcon, ChevronDownIcon , VideoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="bg-white border-b border-gray-200 py-4">
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

                {/* Hamburger Menu for Mobile */}
                <button
                    className="lg:hidden flex items-center text-gray-700 focus:outline-none"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span className="sr-only">Open main menu</span>
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {isMenuOpen ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16m-7 6h7"
                            />
                        )}
                    </svg>
                </button>

                {/* Menu Items for Large Screens */}
                <div className="hidden lg:flex items-center space-x-6">
                    {/* Forum Dropdown */}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger className="text-gray-700 font-semibold cursor-pointer flex items-center">
                            Forum <ChevronDownIcon className="ml-1" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="bg-white border border-gray-200 rounded-md shadow-md mt-2 py-2 z-50">
                                <DropdownMenu.Item asChild>
                                    <Link href="https://workyt.fr/forum/t/math-matiques" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Mathématiques
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://workyt.fr/forum/t/fran-ais" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Français
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://workyt.fr/forum/t/physique-et-chimie" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Physique-Chimie
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://workyt.fr/forum/t/svt" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        SVT
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://workyt.fr/forum/t/histoire-et-geographie" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Histoire-Géographie
                                    </Link>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>

                    <Link href="https://cours.workyt.fr/" className="text-gray-700 font-semibold">
                        Cours
                    </Link>

                    {/* Blog Dropdown */}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger className="text-gray-700 font-semibold cursor-pointer flex items-center">
                            Blog <ChevronDownIcon className="ml-1" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="bg-white border border-gray-200 rounded-md shadow-md mt-2 py-2 z-50">
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/actualites/" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Actualités
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/conseils-methodes/" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Conseils & Méthodes
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/culture/" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Culture
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/test-produit/" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Nos Tests
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/orientation-scolaire/" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Orientation scolaire
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/le-bon-plan/" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Le Bon Plan
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://blog.workyt.fr/category/nos-interviews/" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Nos Interviews
                                    </Link>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </div>

                {/* Social Icons and Donation for Large Screens */}
                <div className="hidden lg:flex items-center space-x-4">
                    <Link href="https://www.helloasso.com/associations/workyt/formulaires/1" className="bg-black text-white px-4 py-2 rounded-full">
                        Faire un don
                    </Link>

                    <a href="https://twitter.com/workyt_fr?lang=fr" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-400">
                        <TwitterLogoIcon />
                    </a>
                    <a href="https://www.instagram.com/workyt/?hl=fr" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-pink-500">
                        <InstagramLogoIcon />
                    </a>
                    <a href="https://www.youtube.com/channel/UCp1tqlZATPdyB1FxIAqQeJg" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-red-500">
                        <VideoIcon />
                    </a>
                    <a href="https://www.linkedin.com/company/workyt" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-800">
                        <LinkedInLogoIcon />
                    </a>
                    <Link href="https://dc.gg/workyt" className="bg-white text-black px-4 py-2 rounded-full flex items-center space-x-2">
                        <DiscordLogoIcon />
                        <span>Rejoindre la communauté</span>
                    </Link>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="lg:hidden mt-4 space-y-6 flex flex-col items-center">
                    {/* Menu items centered and styled */}
                    <Link
                        href="https://workyt.fr/forum/"
                        className="block text-gray-700 text-lg font-semibold hover:text-blue-500 transition duration-300"
                    >
                        Forum
                    </Link>
                    <Link
                        href="https://cours.workyt.fr/"
                        className="block text-gray-700 text-lg font-semibold hover:text-blue-500 transition duration-300"
                    >
                        Cours
                    </Link>
                    <Link
                        href="https://blog.workyt.fr/"
                        className="block text-gray-700 text-lg font-semibold hover:text-blue-500 transition duration-300"
                    >
                        Blog
                    </Link>
                    <Link
                        href="https://www.helloasso.com/associations/workyt/formulaires/1"
                        className="block text-gray-700 text-lg font-semibold hover:text-blue-500 transition duration-300"
                    >
                        Faire un don
                    </Link>
                    <Link
                        href="https://dc.gg/workyt"
                        className="bg-black text-white px-4 py-2 rounded-full font-semibold hover:bg-gray-800 transition duration-300"
                    >
                        Rejoindre la communauté
                    </Link>

                    {/* Social Icons with some spacing */}
                    <div className="flex space-x-6 mt-4">
                        <a
                            href="https://twitter.com/workyt_fr?lang=fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-blue-400 transition duration-300"
                        >
                            <TwitterLogoIcon className="w-6 h-6" />
                        </a>
                        <a
                            href="https://www.instagram.com/workyt/?hl=fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-pink-500 transition duration-300"
                        >
                            <InstagramLogoIcon className="w-6 h-6" />
                        </a>
                        <a
                            href="https://www.linkedin.com/company/workyt"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-blue-800 transition duration-300"
                        >
                            <LinkedInLogoIcon className="w-6 h-6" />
                        </a>
                    </div>
                </div>
            )}
        </nav>
    );
}
