"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import '@radix-ui/themes/styles.css';
import { InstagramLogoIcon, TwitterLogoIcon, DiscordLogoIcon, ChevronDownIcon , VideoIcon, LinkedInLogoIcon }  from "@radix-ui/react-icons";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

export default function Navbar() {
    return (
        <nav className="bg-white border-b border-gray-200 py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
                {/* Left side: Logo */}
                <div className="flex items-center">
                    {/* Logo */}
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

                {/* Centered Menu */}
                <div className="flex items-center space-x-6 justify-center">
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

                    {/* Cours Link */}
                    <Link href="/cours" className="text-gray-700 font-semibold cursor-pointer">
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

                    {/* Devenir Bénévole Dropdown */}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger className="text-gray-700 font-semibold cursor-pointer flex items-center">
                            <Image
                                src="/prefere.png"
                                alt="Devenir Bénévole"
                                width={16}
                                height={16}
                                className="mr-2"
                            />
                            Devenir Bénévole <ChevronDownIcon className="ml-1" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="bg-white border border-gray-200 rounded-md shadow-md mt-2 py-2 z-50">
                                <DropdownMenu.Item asChild>
                                    <Link href="https://www.jeveuxaider.gouv.fr/organisations/12113-workyt" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        JeVeuxAider
                                    </Link>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item asChild>
                                    <Link href="https://www.benevolt.fr/association/workyt-fr" className="text-gray-700 px-4 py-2 hover:bg-gray-100 block">
                                        Benevolt
                                    </Link>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </div>

                {/* Right Side: Social Icons, Donation Button, and Community Button */}
                <div className="flex items-center space-x-4">
                    {/* Faire un don Button */}
                    <HoverBorderGradient
                        containerClassName="rounded-full"
                        as="button"
                        className="dark:bg-black bg-black text-white dark:text-white flex items-center space-x-2"
                    >
                        <a
                            href="https://www.helloasso.com/associations/workyt/formulaires/1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dark:bg-black bg-black text-white dark:text-white flex items-center space-x-2 rounded-full hover:border-gradient"
                        >
                            <span>Faire un don</span>
                        </a>
                    </HoverBorderGradient>

                    {/* Social Icons */}
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
                    {/* Community Button */}
                    <HoverBorderGradient
                        containerClassName="rounded-full"
                        as="button"
                        className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2"
                    >
                        <DiscordLogoIcon />
                        <a
                            href="https://dc.gg/workyt"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 rounded-full hover:border-gradient"
                        >
                            <span>Rejoindre la communauté</span>
                        </a>
                    </HoverBorderGradient>
                </div>
            </div>
        </nav>
    );
}
