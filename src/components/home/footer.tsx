"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LegalMentionsModal from './LegalMentionsModal';
import {
    InstagramLogoIcon,
    TwitterLogoIcon,
    DiscordLogoIcon,
    LinkedInLogoIcon,
} from "@radix-ui/react-icons";

const Footer: React.FC = () => {
    return (
        <footer className="relative overflow-hidden">
            {/* Vague de flamme animée — transition douce depuis le contenu */}
            <div className="relative w-full h-20 md:h-28 bg-transparent">
                <svg
                    viewBox="0 0 1440 100"
                    className="absolute bottom-0 left-0 w-full h-full"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fdba74" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#fff7ed" />
                        </linearGradient>
                        <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#fff7ed" />
                        </linearGradient>
                        <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#fff7ed" />
                        </linearGradient>
                    </defs>
                    {/* Vague arrière — lente */}
                    <path fill="url(#waveGrad3)" opacity="0.6">
                        <animate
                            attributeName="d"
                            dur="6s"
                            repeatCount="indefinite"
                            values="
                                M0,60 C180,20 360,80 540,40 C720,0 900,70 1080,35 C1260,0 1350,50 1440,30 L1440,100 L0,100 Z;
                                M0,45 C180,70 360,15 540,55 C720,80 900,20 1080,50 C1260,75 1350,25 1440,55 L1440,100 L0,100 Z;
                                M0,60 C180,20 360,80 540,40 C720,0 900,70 1080,35 C1260,0 1350,50 1440,30 L1440,100 L0,100 Z
                            "
                        />
                    </path>
                    {/* Vague milieu — moyenne */}
                    <path fill="url(#waveGrad2)" opacity="0.5">
                        <animate
                            attributeName="d"
                            dur="4s"
                            repeatCount="indefinite"
                            values="
                                M0,70 C200,40 400,85 600,50 C800,20 1000,75 1200,45 C1350,25 1400,60 1440,40 L1440,100 L0,100 Z;
                                M0,55 C200,80 400,30 600,65 C800,85 1000,35 1200,60 C1350,80 1400,40 1440,65 L1440,100 L0,100 Z;
                                M0,70 C200,40 400,85 600,50 C800,20 1000,75 1200,45 C1350,25 1400,60 1440,40 L1440,100 L0,100 Z
                            "
                        />
                    </path>
                    {/* Vague avant — rapide */}
                    <path fill="url(#waveGrad1)" opacity="0.7">
                        <animate
                            attributeName="d"
                            dur="3s"
                            repeatCount="indefinite"
                            values="
                                M0,75 C160,55 320,90 480,60 C640,35 800,80 960,55 C1120,30 1280,70 1440,50 L1440,100 L0,100 Z;
                                M0,65 C160,85 320,45 480,75 C640,90 800,50 960,70 C1120,85 1280,45 1440,70 L1440,100 L0,100 Z;
                                M0,75 C160,55 320,90 480,60 C640,35 800,80 960,55 C1120,30 1280,70 1440,50 L1440,100 L0,100 Z
                            "
                        />
                    </path>
                </svg>
            </div>

            {/* Corps du footer — fond crème chaud */}
            <div className="bg-[#fff7ed] relative">
                {/* Lueur décorative */}
                <div className="absolute -top-16 left-1/3 w-80 h-32 bg-orange-300/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-10 right-1/4 w-60 h-24 bg-orange-200/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
                        {/* Colonne principale */}
                        <div className="md:col-span-5 space-y-5">
                            <Image src="/workyt_fr.svg" alt="Workyt" width={110} height={40} />
                            <p className="text-sm text-[#78716c] leading-relaxed max-w-sm">
                                Association sous le régime de la loi du 1er juillet 1901. Les ressources d&apos;apprentissage gratuites sont au c&oelig;ur de notre mission sociale.
                            </p>
                            <a href="mailto:admin@workyt.fr" className="inline-flex items-center gap-2 text-sm text-[#f97316] hover:text-[#ea580c] font-medium transition-colors">
                                admin@workyt.fr
                            </a>
                            {/* Réseaux sociaux */}
                            <div className="flex items-center gap-2.5 pt-1">
                                {[
                                    { href: "https://discord.gg/workyt", icon: DiscordLogoIcon, label: "Discord" },
                                    { href: "https://instagram.com/workyt.fr", icon: InstagramLogoIcon, label: "Instagram" },
                                    { href: "https://twitter.com/workyt_fr", icon: TwitterLogoIcon, label: "Twitter" },
                                    { href: "https://linkedin.com/company/workyt", icon: LinkedInLogoIcon, label: "LinkedIn" },
                                ].map((social) => (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={social.label}
                                        className="w-9 h-9 rounded-xl bg-white hover:bg-orange-50 border border-orange-100 hover:border-orange-300 flex items-center justify-center text-[#a8a29e] hover:text-[#f97316] transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-orange-100/50 hover:-translate-y-0.5"
                                    >
                                        <social.icon className="w-4 h-4" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Services */}
                        <div className="md:col-span-3 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#f97316]">
                                Nos Services
                            </h3>
                            <ul className="space-y-2.5">
                                {[
                                    { href: "/cours", label: "Cours" },
                                    { href: "/fiches", label: "Fiches" },
                                    { href: "/forum", label: "Forum" },
                                    { href: "https://blog.workyt.fr/", label: "Blog" },
                                    { href: "https://blog.workyt.fr/category/conseils-methodes/", label: "Nos conseils" },
                                ].map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="text-sm text-[#78716c] hover:text-[#f97316] transition-colors duration-200">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* À propos */}
                        <div className="md:col-span-4 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#f97316]">
                                À propos
                            </h3>
                            <ul className="space-y-2.5">
                                {[
                                    { href: "/partenaires", label: "Nos partenaires" },
                                    { href: "https://www.helloasso.com/associations/workyt/formulaires/1", label: "Faire un don" },
                                    { href: "https://www.journal-officiel.gouv.fr/pages/associations-detail-annonce/?q.id=id:202200100800", label: "Détails de l'association" },
                                    { href: "mailto:admin@workyt.fr", label: "Nous contacter" },
                                    { href: "https://discord.gg/workyt", label: "Discord" },
                                ].map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="text-sm text-[#78716c] hover:text-[#f97316] transition-colors duration-200">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                                <li><LegalMentionsModal /></li>
                            </ul>
                        </div>
                    </div>

                    {/* Séparateur + copyright */}
                    <div className="mt-10 pt-5 border-t border-orange-200/50">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-xs text-[#a8a29e]">
                                &copy; {new Date().getFullYear()} Workyt. Tous droits réservés.
                            </p>
                            <p className="text-xs text-[#c4b5a4]">
                                Fait avec passion pour les étudiants
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
