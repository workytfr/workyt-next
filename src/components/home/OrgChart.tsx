"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PenTool, 
    Shield, 
    Heart, 
    Wallet, 
    Users, 
    UserCog, 
    MessageCircle, 
    CalendarDays, 
    Code2,
    X,
    ArrowDown,
    ChevronRight
} from 'lucide-react';
import ProfileAvatar from '@/components/ui/profile';

// Interface pour les pôles
interface Pole {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    volunteers: number;
    color: string;
    responsibilities: string[];
}

// Interface pour les membres
interface Member {
    id: number;
    name: string;
    role: string;
    email?: string;
    team: string;
    pole?: string;
}

// Données des pôles avec descriptions détaillées
const poles: Pole[] = [
    {
        id: 'redaction',
        name: 'Rédaction',
        icon: <PenTool className="w-5 h-5" />,
        description: "La rédaction est une compétence essentielle pour tout individu souhaitant communiquer efficacement. Que ce soit pour écrire un cours, un article, il est important de savoir comment organiser ses idées et les exprimer clairement.",
        volunteers: 30,
        color: 'from-pink-500 to-rose-600',
        responsibilities: ['Rédiger des articles de blog', 'Créer des fiches de révision', 'Proposer du contenu pédagogique']
    },
    {
        id: 'correction',
        name: 'Correction',
        icon: <PenTool className="w-5 h-5" />,
        description: "Les correcteurs assurent la qualité des contenus publiés en vérifiant l'orthographe, la grammaire et la cohérence des textes. Ils garantissent l'excellence des ressources proposées aux Workeurs.",
        volunteers: 15,
        color: 'from-amber-500 to-orange-600',
        responsibilities: ['Relire les articles', 'Corriger les fiches', 'Valider la qualité du contenu']
    },
    {
        id: 'moderation',
        name: 'Modération',
        icon: <Shield className="w-5 h-5" />,
        description: "En ligne, la modération est particulièrement importante pour maintenir des espaces de dialogue sains et respectueux. Les modérateurs ont pour rôle de veiller à ce que les règles soient respectées, de régler les conflits et de promouvoir un environnement positif.",
        volunteers: 3,
        color: 'from-blue-500 to-indigo-600',
        responsibilities: ['Surveiller le forum', 'Modérer les commentaires', 'Aider les nouveaux membres']
    },
    {
        id: 'helpeurs',
        name: 'Helpeurs',
        icon: <Heart className="w-5 h-5" />,
        description: "Les Helpeurs donnent de leur temps et de leur énergie pour aider les jeunes à réussir à l'école. Ils offrent un soutien indispensable, aidant les élèves à comprendre et à assimiler les matières scolaires. Leur travail contribue grandement à la réussite académique des jeunes.",
        volunteers: 20,
        color: 'from-red-500 to-red-600',
        responsibilities: ['Aider aux devoirs', 'Répondre aux questions', 'Faire du mentorat']
    },
    {
        id: 'recrutement',
        name: 'Recrutement',
        icon: <Users className="w-5 h-5" />,
        description: "Pour recruter des bénévoles, il est important de mettre en place une stratégie efficace. Il est également important de bien définir les profils recherchés et les missions à accomplir pour chaque poste.",
        volunteers: 3,
        color: 'from-purple-500 to-violet-600',
        responsibilities: ['Poster des offres', 'Sélectionner les candidats', 'Organiser des entretiens']
    },
    {
        id: 'territoriaux',
        name: 'Coordinateurs Territoriaux',
        icon: <UserCog className="w-5 h-5" />,
        description: "Les coordinateurs territoriaux développent l'association sur le terrain. Ils établissent des partenariats locaux, organisent des événements dans leur région et représentent Workyt auprès des établissements scolaires.",
        volunteers: 6,
        color: 'from-teal-500 to-emerald-600',
        responsibilities: ['Développer les partenariats locaux', 'Organiser des événements régionaux', 'Représenter Workyt sur le terrain']
    },
    {
        id: 'communication',
        name: 'Communication',
        icon: <MessageCircle className="w-5 h-5" />,
        description: "Les assistants en communication ont pour mission de communiquer efficacement avec les workeurs. Leur objectif est de bâtir une communauté en ligne solide et engagée grâce à des publications percutantes.",
        volunteers: 4,
        color: 'from-cyan-500 to-blue-600',
        responsibilities: ['Gérer les réseaux sociaux', 'Créer du contenu', 'Animer la communauté']
    },
    {
        id: 'animation',
        name: 'Animation',
        icon: <CalendarDays className="w-5 h-5" />,
        description: "Pour des réunions productives, il est essentiel de planifier le temps et les interventions de chaque membre d'association, et de bien organiser les tâches et les responsabilités. La communication claire est également nécessaire pour éviter les malentendus.",
        volunteers: 4,
        color: 'from-yellow-500 to-orange-600',
        responsibilities: ['Organiser des événements', 'Animer des ateliers', 'Coordonner les réunions']
    }
];

// Données des membres
const members: Member[] = [
    { id: 1, name: 'Nadir T.', role: 'Président', email: 'nadirtounsi@workyt.fr', team: 'Direction' },
    { id: 2, name: 'Enzo B.', role: 'Vice-Président', email: 'enzobregier@workyt.fr', team: 'Direction' },
    { id: 3, name: 'Margaux C.', role: 'Secrétaire', email: 'margaux@workyt.fr', team: 'Direction' },
    { id: 4, name: 'Laura B.', role: 'Trésorière', email: 'laura@workyt.fr', team: 'Direction', pole: 'tresorerie' },
    { id: 5, name: 'Lorena G.', email: 'lorena@workyt.fr', role: 'Rédactrice en chef', team: 'Responsables', pole: 'redaction' },
    { id: 6, name: 'Antoine K.', role: 'Resp. Modération', email: 'agent6c@workyt.fr', team: 'Responsables', pole: 'moderation' },
    { id: 7, name: 'Mathis B.', role: 'Resp. Helpeurs', email: 'mathis@workyt.fr', team: 'Responsables', pole: 'helpeurs' },
    { id: 8, name: 'Nina C.', role: 'Resp. Recrutement', email: 'canoennina@workyt.fr', team: 'Responsables', pole: 'recrutement' },
    { id: 9, name: 'Poste vacant', role: 'Resp. Com.', email: 'admin@workyt.fr', team: 'Responsables', pole: 'communication' },
];

// Composant Flèche de connexion
const ConnectorArrow: React.FC = () => (
    <div className="flex justify-center my-2">
        <motion.div
            initial={{ height: 0 }}
            animate={{ height: 24 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
        >
            <div className="w-0.5 h-4 bg-gradient-to-b from-purple-400 to-pink-400"></div>
            <ArrowDown className="w-4 h-4 text-pink-400" />
        </motion.div>
    </div>
);

// Composant Carte de Pôle compacte
const PoleCard: React.FC<{ pole: Pole; onClick: () => void }> = ({ pole, onClick }) => {
    return (
        <motion.button
            onClick={onClick}
            className={`w-full rounded-xl p-3 text-left bg-gradient-to-br ${pole.color} shadow-md hover:shadow-lg transition-all`}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex items-center justify-between">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    {pole.icon}
                </div>
                <div className="text-right">
                    <span className="text-xl font-bold text-white">{pole.volunteers}</span>
                    <p className="text-white/70 text-xs">bénévoles</p>
                </div>
            </div>
            <h3 className="text-sm font-bold text-white mt-2">{pole.name}</h3>
            <div className="flex items-center gap-1 text-white/70 text-xs mt-1">
                <span>En savoir plus</span>
                <ChevronRight className="w-3 h-3" />
            </div>
        </motion.button>
    );
};

// Modal pour afficher les détails d'un pôle
const PoleModal: React.FC<{ pole: Pole; onClose: () => void }> = ({ pole, onClose }) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className={`relative w-full max-w-md bg-gradient-to-br ${pole.color} rounded-2xl p-6 shadow-2xl`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Bouton fermer */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            {pole.icon}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">{pole.name}</h3>
                            <p className="text-white/80">{pole.volunteers} bénévoles actifs</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-black/20 rounded-xl p-4 mb-4">
                        <h4 className="text-white font-semibold mb-2">Description</h4>
                        <p className="text-white/90 text-sm leading-relaxed">{pole.description}</p>
                    </div>

                    {/* Responsabilités */}
                    <div className="bg-white/10 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-2">Responsabilités</h4>
                        <ul className="space-y-2">
                            {pole.responsibilities.map((resp, index) => (
                                <li key={index} className="flex items-start gap-2 text-white/90 text-sm">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 flex-shrink-0"></span>
                                    {resp}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Bouton rejoindre */}
                    <button
                        onClick={onClose}
                        className="w-full mt-4 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Fermer
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Composant Carte Membre - agrandi pour matcher avec les pôles
const MemberCard: React.FC<{ member: Member; size?: 'small' | 'medium' }> = ({ member, size = 'medium' }) => {
    const isSmall = size === 'small';
    
    return (
        <motion.div
            className={`bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow w-full min-w-[140px] ${isSmall ? 'max-w-[160px]' : 'max-w-[180px]'}`}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
        >
            <div className={`flex justify-center mb-3 ${isSmall ? 'scale-90' : ''}`}>
                <ProfileAvatar username={member.name} size="medium" showPoints={false} />
            </div>
            <h4 className={`font-bold text-white ${isSmall ? 'text-sm' : 'text-base'} truncate`}>{member.name}</h4>
            <p className={`text-white/80 ${isSmall ? 'text-xs' : 'text-sm'} mt-1 leading-tight`}>{member.role}</p>
        </motion.div>
    );
};

const OrgChart: React.FC = () => {
    const [selectedPole, setSelectedPole] = useState<Pole | null>(null);
    const bureau = members.filter((member) => member.team === 'Direction');
    const responsables = members.filter((member) => member.team === 'Responsables');

    return (
        <section className="py-10 bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Header compact */}
                <div className="text-center mb-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                                Organigramme Workyt
                            </span>
                        </h2>
                        <p className="text-gray-600 text-sm">
                            {poles.reduce((acc, p) => acc + p.volunteers, 0)}+ bénévoles actifs
                        </p>
                    </motion.div>
                </div>

                {/* Direction */}
                <div className="mb-2">
                    <h3 className="text-xs font-bold text-center text-gray-500 uppercase tracking-wider mb-3">Direction</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {bureau.map((member, index) => (
                            <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }} className="w-[calc(50%-6px)] sm:w-[calc(25%-9px)] lg:w-auto">
                                <MemberCard member={member} />
                            </motion.div>
                        ))}
                    </div>
                </div>

                <ConnectorArrow />

                {/* Responsables */}
                <div className="mb-2">
                    <h3 className="text-xs font-bold text-center text-gray-500 uppercase tracking-wider mb-3">Responsables</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {responsables.map((member, index) => (
                            <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }} className="w-[calc(50%-6px)] sm:w-[calc(33%-8px)] lg:w-auto">
                                <MemberCard member={member} size="small" />
                            </motion.div>
                        ))}
                    </div>
                </div>

                <ConnectorArrow />

                {/* Pôles - cliquables */}
                <div>
                    <h3 className="text-xs font-bold text-center text-gray-500 uppercase tracking-wider mb-2">Pôles (cliquez pour détails)</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {poles.map((pole, index) => (
                            <motion.div
                                key={pole.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.03 }}
                                className="w-[calc(50%-4px)] sm:w-[calc(25%-6px)] lg:w-[calc(12.5%-8px)] min-w-[130px]"
                            >
                                <PoleCard pole={pole} onClick={() => setSelectedPole(pole)} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal pour le pôle sélectionné */}
            {selectedPole && (
                <PoleModal pole={selectedPole} onClose={() => setSelectedPole(null)} />
            )}
        </section>
    );
};

export default OrgChart;
