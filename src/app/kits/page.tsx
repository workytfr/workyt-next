import '@radix-ui/themes/styles.css';
import Navbar from "@/components/navbar/Navbar";
import Footer from '@/components/home/footer';
import { Vortex } from  '@/components/ui/vortex'
import PomodoroTimer from '@/components/extends/PomodoroTimer';
import FormBac2024 from '@/components/extends/BacForm';
import EquationSolver from '@/components/extends/EquationSolver';
import * as React from "react";
import { Metadata } from 'next'
import Link from "next/link";
import {DiscordLogoIcon} from "@radix-ui/react-icons";
import PartenairesView from "@/components/home/partenaires";


export const metadata: Metadata = {
    title: 'Workyt - La plate-forme d\'apprentissage gratuite',
    description: 'Les ressources d\'apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l\'éducation sont l\'accès, le manque de confiance et le coût.',
    twitter: {
        card: 'summary_large_image',
        site: '@workyt',
    },
}

export default function Home() {
    return (
        <div className=" bg-white">
            <Navbar/>
            <div className="w-full rounded-md h-screen overflow-hidden">
                <Vortex
                    backgroundColor="black"
                    rangeY={800}
                    particleCount={500}
                    baseHue={120}
                    className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full"
                >
                    <h2 className="animated-gradient-text text-2xl md:text-6xl font-bold text-center">
                        Mini-Kits Workyt : Ton Arme Secrète de Samouraï des Révisions
                    </h2>
                    <p className="text-white text-xs md:text-lg max-w-xl mt-6 text-center">
                        <span className="font-bold italic">Attention, jeunes samouraïs des études!</span> Voici
                        les <span className="font-bold italic">mini-kits de Workyt</span>,
                        ton arme secrète pendant tes révisions! Parce que bon, on ne sait jamais quand un <span
                        className="font-bold italic">boss final</span>
                        de révision va te tomber dessus... Prêt à dégainer ton <span className="font-bold italic">kit magique</span> en
                        pleine bataille
                        contre l’ennui et les formules incompréhensibles? Que la puissance du <span
                        className="font-bold italic">super-savoir</span> soit avec toi!
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
                        <Link href="https://workyt.fr/forum/" className="bg-white text-black px-4 py-2 rounded-full">
                            Notre Forum
                        </Link>
                        <Link href="https://dc.gg/workyt"
                              className="text-white px-4 py-2 rounded-full flex items-center space-x-2">
                            <DiscordLogoIcon/>
                            <span>Rejoindre la communauté Discord</span>
                        </Link>
                    </div>
                </Vortex>
            </div>
            <FormBac2024/>
            <PomodoroTimer/>
            <EquationSolver/>
            <div className="px-4 md:px-8 lg:px-16 py-8 w-full max-w-full overflow-x-hidden">
                <PartenairesView/>
            </div>
            <Footer/>
        </div>
    );
}
