import { Metadata } from 'next';
import GemsPageClient from './GemsPageClient';

export const metadata: Metadata = {
  title: 'Gestionnaire de Gemmes | Workyt',
  description: 'Gérez vos gemmes et personnalisez votre profil avec des couleurs, images et contours uniques. Découvrez nos partenaires et profitez d\'offres exclusives partout en France !',
  keywords: 'gemmes, partenaires, offres, réductions, étudiants, Workyt',
  openGraph: {
    title: 'Gestionnaire de Gemmes | Workyt',
    description: 'Gérez vos gemmes et personnalisez votre profil. Découvrez nos partenaires et offres exclusives !',
    type: 'website',
    url: 'https://workyt.fr/gems',
    siteName: 'Workyt',
    locale: 'fr_FR',
    images: [{ url: 'https://workyt.fr/default-thumbnail.png', width: 1200, height: 630, alt: 'Gemmes Workyt' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@workyt_fr',
    creator: '@workyt_fr',
    title: 'Gestionnaire de Gemmes | Workyt',
    description: 'Gérez vos gemmes et personnalisez votre profil sur Workyt.',
    images: ['https://workyt.fr/default-thumbnail.png'],
  },
  alternates: {
    canonical: 'https://workyt.fr/gems',
  },
};

export default function GemsPage() {
  return <GemsPageClient />;
}
