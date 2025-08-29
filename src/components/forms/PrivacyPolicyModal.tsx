import * as Dialog from '@radix-ui/react-dialog';
import React from 'react';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onAccept, onDecline }) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={() => {}}>
            <Dialog.Portal>
                <Dialog.Overlay className="bg-black bg-opacity-50 fixed inset-0 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto z-50">
                    <Dialog.Title className="text-2xl font-bold mb-6 text-center" style={{ color: "black" }}>
                        Politique de Confidentialité - Workyt
                    </Dialog.Title>
                    
                    <Dialog.Description className="space-y-4 mb-6" style={{ color: "black" }}>
                        <div className="text-center mb-6">
                            <p className="text-lg text-gray-600">
                                En créant un compte sur Workyt, vous acceptez notre politique de confidentialité et nos conditions d&apos;utilisation.
                            </p>
                        </div>

                        <h3 className="text-xl font-semibold text-blue-600">1. Collecte des données personnelles</h3>
                        <p>
                            Lors de votre inscription, Workyt collecte les informations suivantes :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Informations d&apos;identification :</strong> Nom, prénom, nom d&apos;utilisateur, adresse email</li>
                            <li><strong>Informations de profil :</strong> Bio, avatar, niveau d&apos;éducation, matières d&apos;intérêt</li>
                            <li><strong>Données de connexion :</strong> Adresse IP, type de navigateur, système d&apos;exploitation</li>
                            <li><strong>Données d&apos;activité :</strong> Cours suivis, fiches créées, participations au forum, quiz réalisés</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-blue-600">2. Utilisation des données collectées</h3>
                        <p>
                            Vos données personnelles sont utilisées pour :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Créer et gérer votre compte utilisateur</li>
                            <li>Personnaliser votre expérience d&apos;apprentissage</li>
                            <li>Suivre votre progression et attribuer des badges</li>
                            <li>Gérer le système de points et de récompenses</li>
                            <li>Modérer le contenu et assurer la sécurité de la plateforme</li>
                            <li>Améliorer nos services et développer de nouvelles fonctionnalités</li>
                            <li>Communiquer avec vous concernant votre compte et nos services</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-blue-600">3. Système de badges et gamification</h3>
                        <p>
                            Workyt utilise vos données d&apos;activité pour :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Attribuer automatiquement des badges selon vos réalisations</li>
                            <li>Calculer votre score et votre classement</li>
                            <li>Déterminer votre éligibilité aux récompenses</li>
                            <li>Analyser les tendances d&apos;apprentissage pour améliorer la plateforme</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-blue-600">4. Partage et publication de contenu</h3>
                        <p>
                            En utilisant Workyt, vous acceptez que :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Le contenu que vous créez (fiches, réponses au forum) soit visible par tous les utilisateurs</li>
                            <li>Votre nom d&apos;utilisateur et avatar soient affichés avec vos contributions</li>
                            <li>Vos statistiques (points, badges, niveau) soient visibles par la communauté</li>
                            <li>Workyt puisse utiliser vos contributions pour améliorer les services (anonymisées si nécessaire)</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-blue-600">5. Cookies et technologies de suivi</h3>
                        <p>
                            Workyt utilise des cookies et technologies similaires pour :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Maintenir votre session de connexion</li>
                            <li>Mémoriser vos préférences et paramètres</li>
                            <li>Analyser l&apos;utilisation de la plateforme</li>
                            <li>Personnaliser votre expérience</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-blue-600">6. Conservation des données</h3>
                        <p>
                            Vos données sont conservées :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Pendant la durée de votre compte :</strong> Tant que votre compte est actif</li>
                            <li><strong>Après suppression :</strong> 30 jours pour la récupération, puis anonymisation</li>
                            <li><strong>Contenu public :</strong> Peut être conservé pour maintenir l&apos;intégrité de la plateforme</li>
                            <li><strong>Données légales :</strong> Selon les obligations légales et réglementaires</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-blue-600">7. Vos droits</h3>
                        <p>
                            Conformément au RGPD, vous avez le droit de :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Accès :</strong> Consulter toutes vos données personnelles</li>
                            <li><strong>Rectification :</strong> Modifier vos informations de profil</li>
                            <li><strong>Effacement :</strong> Demander la suppression de votre compte</li>
                            <li><strong>Portabilité :</strong> Exporter vos données dans un format structuré</li>
                            <li><strong>Opposition :</strong> Refuser le traitement de vos données</li>
                            <li><strong>Limitation :</strong> Restreindre l&apos;utilisation de vos données</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-blue-600">8. Sécurité des données</h3>
                        <p>
                            Workyt met en place des mesures de sécurité pour protéger vos données :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Chiffrement des données sensibles</li>
                            <li>Accès restreint aux données personnelles</li>
                            <li>Surveillance continue de la sécurité</li>
                            <li>Sauvegardes régulières et sécurisées</li>
                            <li>Formation du personnel à la protection des données</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-blue-600">9. Transferts de données</h3>
                        <p>
                            Vos données peuvent être transférées :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Au sein de l&apos;UE :</strong> Conformément aux standards européens</li>
                            <li><strong>Vers des sous-traitants :</strong> Hébergeur, services d&apos;analyse (avec garanties appropriées)</li>
                            <li><strong>Autorités publiques :</strong> Sur demande légale ou pour protéger nos droits</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-blue-600">10. Modifications de la politique</h3>
                        <p>
                            Workyt se réserve le droit de modifier cette politique de confidentialité. En cas de modification importante :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Vous serez informé par email</li>
                            <li>La nouvelle politique sera affichée sur la plateforme</li>
                            <li>Votre utilisation continue de Workyt constituera votre acceptation</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-blue-600">11. Contact et réclamations</h3>
                        <p>
                            Pour toute question ou réclamation concernant vos données personnelles :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Email :</strong> admin@workyt.fr</li>
                            <li><strong>Adresse :</strong> Association Workyt, </li>
                            <li><strong>CNIL :</strong> Vous pouvez également déposer une réclamation auprès de la CNIL</li>
                        </ul>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important</h4>
                            <p className="text-yellow-700 text-sm">
                                En créant votre compte, vous confirmez avoir lu, compris et accepté cette politique de confidentialité. 
                                Vous consentez au traitement de vos données personnelles dans les conditions décrites ci-dessus.
                            </p>
                        </div>
                    </Dialog.Description>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={onDecline}
                            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Refuser
                        </button>
                        <button
                            onClick={onAccept}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            J&apos;accepte la politique de confidentialité
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default PrivacyPolicyModal; 