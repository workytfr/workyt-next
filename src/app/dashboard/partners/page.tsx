import { Metadata } from 'next';
import PartnersAdminClient from './PartnersAdminClient';

export const metadata: Metadata = {
    title: 'Gestion des Partenaires - Dashboard Workyt',
    description: 'Administrez les partenaires et leurs offres exclusives pour les étudiants',
    robots: 'noindex, nofollow',
};

export default function PartnersAdminPage() {
    return <PartnersAdminClient />;
}
