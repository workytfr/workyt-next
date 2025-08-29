import { Metadata } from 'next';
import GemsPageClient from './GemsPageClient';

export const metadata: Metadata = {
  title: 'Gestionnaire de Gemmes - Workyt',
  description: 'Gérez vos gemmes et personnalisez votre profil avec des couleurs, images et contours uniques. Découvrez nos partenaires et profitez d\'offres exclusives partout en France !',
  keywords: 'gemmes, partenaires, offres, réductions, étudiants, Workyt',
  openGraph: {
    title: 'Gestionnaire de Gemmes - Workyt',
    description: 'Gérez vos gemmes et personnalisez votre profil avec des couleurs, images et contours uniques. Découvrez nos partenaires et profitez d\'offres exclusives partout en France !',
    type: 'website',
  },
};

export default function GemsPage() {
  return <GemsPageClient />;
}
