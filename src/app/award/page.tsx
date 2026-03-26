import { Metadata } from 'next';
import AwardPageClient from './AwardPageClient';

export const metadata: Metadata = {
  title: 'Workyt Award - Réductions exclusives | Workyt',
  description: 'Découvrez les réductions exclusives Workyt Award ! Utilisez vos gemmes pour obtenir des codes promo chez nos partenaires : tech, culture, sport et plus encore.',
  keywords: 'réductions, codes promo, partenaires, étudiants, gemmes, Workyt Award',
  openGraph: {
    title: 'Workyt Award - Réductions exclusives | Workyt',
    description: 'Obtenez des codes promo exclusifs chez nos partenaires avec vos gemmes Workyt.',
    type: 'website',
    url: 'https://workyt.fr/award',
    siteName: 'Workyt',
    locale: 'fr_FR',
    images: [{ url: 'https://workyt.fr/default-thumbnail.png', width: 1200, height: 630, alt: 'Workyt Award' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@workyt_fr',
    creator: '@workyt_fr',
    title: 'Workyt Award - Réductions exclusives | Workyt',
    description: 'Obtenez des codes promo exclusifs chez nos partenaires avec vos gemmes Workyt.',
    images: ['https://workyt.fr/default-thumbnail.png'],
  },
  alternates: {
    canonical: 'https://workyt.fr/award',
  },
};

export default function AwardPage() {
  return <AwardPageClient />;
}
