import React from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import ProfileAvatar from '@/components/ui/profile';

// Composant pour l'effet de fond "Noise"
const Noise: React.FC = () => {
    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0, // Pour être en arrière-plan
                backgroundImage: 'url(/noise.webp)',
                backgroundSize: '30%',
                transform: 'scale(1)', // Suppression de la transformation pour éviter le débordement
                opacity: 0.1,
                maskImage: 'radial-gradient(#fff, transparent, 75%)',
            }}
        ></div>
    );
};

// Interface pour les membres de l'organigramme
export interface Member {
    id: number;
    name: string;
    role: string;
    email?: string; // Optionnel
    team: string;
}

// Données des membres de l'association
const members: Member[] = [
    {
        id: 1,
        name: 'Nadir T.',
        role: 'Président & Fondateur',
        email: 'nadirtounsi@workyt.fr',
        team: 'Direction',
    },
    {
        id: 2,
        name: 'Enzo B.',
        role: 'Vice-Président',
        email: 'enzobregier@workyt.fr',
        team: 'Direction',
    },
    {
        id: 3,
        name: 'Margaux C.',
        role: 'Secrétaire',
        email: 'margaux@workyt.fr',
        team: 'Direction',
    },
    {
        id: 4,
        name: 'Laura B.',
        role: 'Trésorière',
        email: 'laura@workyt.fr',
        team: 'Direction',
    },
    {
        id: 5,
        name: 'Lorena G.',
        email: 'lorena@workyt.fr',
        role: 'Rédactrice en chef (Blog & Cours)',
        team: 'Responsables',
    },
    {
        id: 6,
        name: 'Antoine K.',
        role: 'Responsable en modération',
        email: 'agent6c@workyt.fr',
        team: 'Responsables',
    },
    {
        id: 7,
        name: 'Nina C.',
        role: 'Responsable des Helpeurs',
        email: 'canoennina@workyt.fr',
        team: 'Responsables',
    },
    {
        id: 8,
        name: 'Poste vacant',
        role: 'Responsable en communication',
        email: 'admin@workyt.fr',
        team: 'Responsables',
    },
    {
        id: 9,
        name: 'Poste vacant',
        role: 'Responsable en recrutement',
        email: 'admin@workyt.fr',
        team: 'Responsables',
    },
];

interface OrgNodeProps {
    member: Member;
    size?: 'large' | 'small';
}

const OrgNode: React.FC<OrgNodeProps> = ({ member, size = 'large' }) => {
    // Taille de l'avatar selon la taille spécifiée (grand ou petit)
    const avatarSize = size === 'large' ? 'large' : 'medium';
    const fontSize = size === 'large' ? 18 : 14;
    const roleFontSize = size === 'large' ? 14 : 12;

    return (
        <div style={{ textAlign: 'center', margin: '10px', width: '150px' }}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex justify-center">
                            <ProfileAvatar
                                username={member.name}
                                size="medium"
                                showPoints={false}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={5}>
                        <div style={{ padding: '10px', backgroundColor: '#222', color: '#fff', borderRadius: '4px' }}>
                            {member.email || 'Email non disponible'}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <div style={{ marginTop: '10px' }}>
                <div style={{ fontWeight: 'bold', fontSize, color: '#fff' }}>{member.name}</div>
                <div style={{ fontSize: roleFontSize, color: '#bbb' }}>{member.role}</div>
            </div>
        </div>
    );
};

const OrgChart: React.FC = () => {
    // Séparer les membres en deux groupes : Bureau et Responsables
    const bureau = members.filter((member) => member.team === 'Direction');
    const responsables = members.filter((member) => member.team === 'Responsables');

    return (
        <div
            style={{
                padding: '20px',
                backgroundColor: '#1a1a1a',
                position: 'relative',
                overflow: 'hidden', // Empêche le débordement
                maxHeight: '100vh', // Limite la hauteur maximale à la taille de la fenêtre
            }}
        >
            {/* Effet de fond "Noise" */}
            <Noise />

            {/* Titre et Description */}
            <div style={{ textAlign: 'center', marginBottom: '30px', color: '#fff' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '10px', fontWeight: 'bold'}}>Organigramme de l&apos;Association Workyt</h1>
                <p style={{ maxWidth: '800px', margin: '0 auto', fontSize: '16px', color: '#ccc' }}>
                    Le bureau de l&apos;association Workyt se compose l&apos;équipe de direction qui supervisent
                    les activités et prennent les décisions stratégiques. Les responsables, quant à eux, encadrent les bénévoles et
                    gèrent les opérations au quotidien dans leurs domaines respectifs. Ensemble, ils s&apos;assurent du bon fonctionnement
                    de l&apos;association et de la qualité des services proposés aux membres et au public.
                </p>
            </div>

            {/* Première ligne : Membres du bureau */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    marginBottom: '30px',
                    flexWrap: 'wrap',
                    position: 'relative',
                    zIndex: 1, // Placer au-dessus du fond
                    overflowX: 'auto', // Pour permettre un défilement horizontal sur mobile
                }}
            >
                {bureau.map((member) => (
                    <OrgNode key={member.id} member={member} size="large" />
                ))}
            </div>

            {/* Deuxième ligne : Membres responsables */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    flexWrap: 'wrap',
                    position: 'relative',
                    zIndex: 1, // Placer au-dessus du fond
                    overflowX: 'auto', // Pour permettre un défilement horizontal sur mobile
                }}
            >
                {responsables.map((member) => (
                    <OrgNode key={member.id} member={member} size="small" />
                ))}
            </div>
        </div>
    );
};

export default OrgChart;
