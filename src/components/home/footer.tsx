import React from 'react';
import * as Separator from '@radix-ui/react-separator';
import Link from 'next/link';
import Image from 'next/image';
import LegalMentionsModal from './LegalMentionsModal';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-100 text-gray-700 py-8 px-6">
            <div className="container mx-auto">
                <Separator.Root className="h-px bg-gray-300 my-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <Image src="/workyt_fr.svg" alt="Workyt" width={100} height={100} />
                        <p>admin@workyt.fr</p>
                        <p className="text-sm">
                            Association sous le régime de la loi du 1er juillet 1901. Les ressources d&apos;apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l&apos;éducation sont l&apos;accès, le manque de confiance et le coût.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Nos Services</h3>
                        <ul className="space-y-1">
                            <li><Link href="/cours" className="hover:text-blue-600">Cours</Link></li>
                            <li><Link href="/forum" className="hover:text-blue-600">Forum</Link></li>
                            <li><Link href="https://blog.workyt.fr/" className="hover:text-blue-600">Blog</Link></li>
                            <li><Link href="https://dc.gg/workyt" className="hover:text-blue-600">Discord</Link></li>
                        </ul>
                    </div>

                    {/* Colonne de droite */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Autres</h3>
                        <ul className="space-y-1">
                            <li><Link href="https://www.helloasso.com/associations/workyt/formulaires/1" className="hover:text-blue-600">Faire un don</Link></li>
                            <li><Link href="https://www.journal-officiel.gouv.fr/pages/associations-detail-annonce/?q.id=id:202200100800" className="hover:text-blue-600">Détails de l&apos;association</Link></li>
                            <li><Link href="mailto:/?to=admin@workyt.fr" className="hover:text-blue-600">Nous contacter</Link></li>
                            <li><Link href="" className="hover:text-blue-600">Notre Team</Link></li>
                            <li><Link href="" className="hover:text-blue-600">Nos partenaires</Link></li>
                            <li><LegalMentionsModal/></li>
                            <li><Link href="https://blog.workyt.fr/category/conseils-methodes/" className="hover:text-blue-600">Nos conseils</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
