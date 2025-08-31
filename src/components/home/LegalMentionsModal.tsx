import * as Dialog from '@radix-ui/react-dialog';
import React from 'react';

const LegalMentionsModal: React.FC = () => {
    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <button className="hover:text-blue-600">Les Mentions légales</button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="bg-black bg-opacity-50 fixed inset-0 z-40" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto z-50">
                    <Dialog.Title className="text-xl font-semibold mb-4" style={{ color: "black" }}>Mentions légales de Workyt</Dialog.Title>
                    <Dialog.Description className="space-y-4" style={{ color: "black" }}>
                        <h2 className="text-2xl font-bold mt-6"> Présentation du site: </h2>
                        <p>
                         En vertu de l&apos;article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique, il est précisé aux utilisateurs du site www.workyt.fr l&apos;identité des différents intervenants dans le cadre de sa réalisation et de son suivi :
                        </p>
                        <p>
                            NUMÉRO RNA : W423014475 Association sous le régime de la loi du 1er juillet 1901
                        </p>
                        <p>
                            Propriétaire : Nadir T.
                            <br />
                            Créateur : Nadir T.
                            <br />
                            Responsable publication : Nadir T. (nadirtounsi@workyt.fr). Le responsable publication est une personne physique ou une personne morale.
                            <br />
                            Webmaster : Nadir T. – nadirtounsi@workyt.fr
                            <br />
                            Hébergeur : Shfitek IT, 39 La Guillaudais 44170 La Grigonnais
                        </p>

                        <h2 className="text-2xl font-bold mt-6"> Conditions générales d&apos;utilisation du site et des
                            services proposés</h2>
                        <p>
                            L&apos;utilisation du site www.workyt.fr implique l&apos;acceptation pleine et entière des conditions générales d&apos;utilisation ci-après décrites. Ces conditions d&apos;utilisation sont susceptibles d&apos;être modifiées ou complétées à tout moment, les utilisateurs du site www.workyt.fr sont donc invités à les consulter de manière régulière.
                        </p>
                        <p>
                            Ce site est normalement accessible à tout moment aux utilisateurs. Une interruption pour raison de maintenance technique peut être toutefois décidée par Workyt ou l&apos;hébergeur, qui s&apos;efforcera alors de communiquer préalablement aux utilisateurs les dates et heures de l&apos;intervention.
                        </p>
                        <p>
                            Le site www.workyt.fr est mis à jour régulièrement par les développeurs du projet. De la même façon, les mentions légales peuvent être modifiées à tout moment : elles s&apos;imposent néanmoins à l&apos;utilisateur qui est invité à s&apos;y référer le plus souvent possible afin d&apos;en prendre connaissance.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Description des services fournis</h2>
                        <p>
                            Le site www.workyt.fr a pour objet de fournir une plateforme éducative complète incluant :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Cours et leçons :</strong> Contenu éducatif structuré par matières et niveaux</li>
                            <li><strong>Fiches de révision :</strong> Ressources créées par la communauté et les bénévoles</li>
                            <li><strong>Forum d&apos;entraide :</strong> Système de questions-réponses avec validation communautaire</li>
                            <li><strong>Exercices et quiz :</strong> Évaluations interactives pour tester les connaissances</li>
                            <li><strong>Système de badges :</strong> Récompenses pour l&apos;engagement et la progression</li>
                            <li><strong>Certificats :</strong> Attestations de participation et de réussite</li>
                            <li><strong>Système de points :</strong> Gamification pour encourager la participation</li>
                            <li><strong>Récompenses :</strong> Concours et événements avec prix</li>
                        </ul>
                        <p>
                            Le Président de Workyt s&apos;efforce de fournir sur le site www.workyt.fr des informations aussi précises que possible. Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes et des carences dans la mise à jour, qu&apos;elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.
                        </p>
                        <p>
                            Toutes les informations indiquées sur le site www.workyt.fr sont données à titre indicatif, et sont susceptibles d&apos;évoluer. Par ailleurs, les renseignements figurant sur le site www.workyt.fr ne sont pas exhaustifs. Ils sont donnés sous réserve de modifications ayant été apportées depuis leur mise en ligne.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Système de badges et récompenses</h2>
                        <p>
                            Workyt propose un système de badges pour récompenser l&apos;engagement et la progression des utilisateurs. Les badges sont attribués automatiquement selon différents critères :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Badges de progression :</strong> Récompensent l&apos;achèvement de cours et la réussite aux quiz</li>
                            <li><strong>Badges d&apos;engagement :</strong> Récompensent la création de fiches et la participation au forum</li>
                            <li><strong>Badges de performance :</strong> Récompensent les réponses validées et les quiz réussis</li>
                            <li><strong>Badges spéciaux :</strong> Récompensent l&apos;ancienneté et les contributions exceptionnelles</li>
                        </ul>
                        <p>
                            Les badges ont différents niveaux de rareté : commun, rare, épique et légendaire. L&apos;attribution des badges est automatique et basée sur des algorithmes transparents.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Système de points et gamification</h2>
                        <p>
                            Workyt utilise un système de points pour encourager la participation et récompenser les contributions :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Création de fiches :</strong> 10 points par fiche créée</li>
                            <li><strong>Likes reçus :</strong> 5 points par like reçu sur une fiche</li>
                            <li><strong>Réponses validées :</strong> Points selon la difficulté de la question (1 à 15 points)</li>
                            <li><strong>Réussite aux quiz :</strong> Points selon la performance</li>
                        </ul>
                        <p>
                            Les points peuvent être utilisés pour poser des questions sur le forum ou participer à des événements spéciaux. Le système est conçu pour être équitable et transparent.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Statuts des fiches et certification</h2>
                        <p>
                            Les fiches de révision sur Workyt peuvent avoir différents statuts de certification :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Certifiée :</strong> Contenu rédigé par un bénévole de l&apos;association Workyt, garantissant la qualité et l&apos;exactitude</li>
                            <li><strong>Vérifiée :</strong> Contenu rédigé par un utilisateur de la communauté et vérifié par un bénévole</li>
                            <li><strong>Non Certifiée :</strong> Contenu créé par un utilisateur de la communauté, en attente de vérification</li>
                        </ul>
                        <p>
                            La certification est un processus continu qui garantit la qualité du contenu éducatif disponible sur la plateforme.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Forum d&apos;entraide et validation</h2>
                        <p>
                            Le forum d&apos;entraide permet aux utilisateurs de poser des questions et de recevoir de l&apos;aide de la communauté :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Questions :</strong> Les utilisateurs peuvent poser des questions en engageant des points</li>
                            <li><strong>Réponses :</strong> La communauté peut répondre aux questions</li>
                            <li><strong>Validation :</strong> Les meilleures réponses peuvent être validées par l&apos;auteur de la question</li>
                            <li><strong>Modération :</strong> Le contenu est modéré pour maintenir la qualité</li>
                        </ul>
                        <p>
                            Les réponses validées rapportent des points aux contributeurs et contribuent à la réputation de la plateforme.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Certificats et attestations</h2>
                        <p>
                            Workyt délivre des certificats et attestations pour reconnaître les contributions et la participation :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Certificats de participation :</strong> Attestent de l&apos;engagement dans les activités de la plateforme</li>
                            <li><strong>Certificats de bénévole :</strong> Reconnaissent les contributions des bénévoles de l&apos;association</li>
                            <li><strong>Attestations de réussite :</strong> Certifient l&apos;achèvement de cours ou la réussite aux évaluations</li>
                        </ul>
                        <p>
                            Ces certificats sont générés automatiquement et peuvent être téléchargés au format PDF.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Limitations contractuelles sur les données techniques</h2>
                        <p>
                            Le site utilise la technologie JavaScript et nécessite un navigateur moderne pour fonctionner correctement. Le Président de Workyt ne pourra être tenu responsable de dommages matériels liés à l&apos;utilisation du site. De plus, l&apos;utilisateur du site s&apos;engage à accéder au site en utilisant un matériel récent, ne contenant pas de virus et avec un navigateur de dernière génération mis à jour.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Propriété intellectuelle et contrefaçons</h2>
                        <p>
                            Workyt est propriétaire des droits de propriété intellectuelle ou détient les droits d&apos;usage sur tous les éléments accessibles sur le site, notamment les textes, images, graphismes, logo, icônes, sons, logiciels. Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable à : admin@workyt.fr.
                        </p>
                        <p>
                            Toute exploitation non autorisée du site ou de l&apos;un quelconque des éléments qu&apos;il contient sera considérée comme constitutive d&apos;une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
                        </p>
                        <p>
                            <strong>Contenu utilisateur :</strong> Les utilisateurs conservent leurs droits sur le contenu qu&apos;ils créent (fiches, réponses au forum, etc.). En publiant du contenu sur Workyt, ils accordent à la plateforme une licence non-exclusive d&apos;utilisation et de distribution de ce contenu dans le cadre des services de Workyt.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Limitations de responsabilité</h2>
                        <p>
                            Workyt ne pourra être tenue responsable des dommages directs et indirects causés au matériel de l&apos;utilisateur, lors de l&apos;accès au site www.workyt.fr, et résultant soit de l&apos;utilisation d&apos;un matériel ne répondant pas aux spécifications indiquées au point 4, soit de l&apos;apparition d&apos;un bug ou d&apos;une incompatibilité.
                        </p>
                        <p>
                            Workyt ne pourra également être tenue responsable des dommages indirects (tels par exemple qu&apos;une perte de marché ou perte d&apos;une chance) consécutifs à l&apos;utilisation du site www.workyt.fr. Les utilisateurs ont accès à la zone interactive. Workyt se réserve le droit de supprimer, sans mise en demeure préalable, tout contenu publié dans cet espace qui contreviendrait à la législation française en vigueur, notamment aux dispositions relatives à la protection des données.
                        </p>
                        <p>
                            Le cas échéant, Workyt se réserve également la possibilité de mettre en cause la responsabilité civile et/ou pénale de l&apos;utilisateur, notamment en cas de message à caractère raciste, injurieux, diffamant, ou pornographique, quel que soit le support utilisé (texte, photographie…).
                        </p>
                        <p>
                            <strong>Contenu éducatif :</strong> Bien que Workyt s&apos;efforce de maintenir la qualité du contenu éducatif, la plateforme ne peut garantir l&apos;exactitude absolue de toutes les informations. Les utilisateurs sont encouragés à vérifier les informations et à consulter plusieurs sources.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Gestion des données personnelles</h2>
                        <p>
                            En France, les données personnelles sont notamment protégées par la loi n° 78-87 du 6 janvier 1978, la loi n° 2004-801 du 6 août 2004, l&apos;article L. 226-13 du Code pénal et la Directive Européenne du 24 octobre 1995.
                        </p>
                        <p>
                            A l&apos;occasion de l&apos;utilisation du site www.workyt.fr, peuvent être recueillies : l&apos;URL des liens par l&apos;intermédiaire desquels l&apos;utilisateur a accédé au site www.workyt.fr, le fournisseur d&apos;accès de l&apos;utilisateur, l&apos;adresse de protocole Internet (IP) de l&apos;utilisateur.
                        </p>
                        <p>
                            <strong>Données de profil :</strong> Workyt collecte et traite les informations de profil utilisateur, les points, badges, et l&apos;historique des activités pour fournir les services de la plateforme et améliorer l&apos;expérience utilisateur.
                        </p>
                        <p>
                            <strong>Contenu créé :</strong> Les fiches, réponses au forum, et autres contenus créés par les utilisateurs sont stockés et traités pour fournir les services de la plateforme.
                        </p>
                        <p>
                            Les serveurs AD tiers ou les réseaux AD utilisent des technologies telles que des cookies, JavaScript ou des balises Web utilisées dans leurs publicités et liens respectifs qui apparaissent sur Workyt, qui sont envoyés directement au navigateur des utilisateurs. Ils reçoivent automatiquement votre adresse IP lorsque cela se produit. Ces technologies sont utilisées pour mesurer l&apos;efficacité de leurs campagnes publicitaires et/ou de personnaliser le contenu publicitaire que vous voyez sur des sites Web que vous visitez.
                        </p>
                        <p>
                            Notez que Workyt n&apos;a pas accès à ces cookies qui sont utilisés par des annonceurs tiers.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Commentaires et contributions</h2>
                        <p>
                            Nous recueillons les données indiquées dans le formulaire de commentaires, ainsi que l&apos;adresse IP du visiteur et la chaîne d&apos;agent utilisateur du navigateur pour faciliter la détection des spams. Une chaîne anonyme créée à partir de votre adresse électronique (également appelée hash) peut être fournie au service Gravatar pour savoir si vous l&apos;utilisez. La politique de confidentialité du service Gravatar est disponible ici : <a href="https://automattic.com/privacy/" target="_blank" rel="noopener noreferrer">https://automattic.com/privacy/</a>. Après approbation de votre commentaire, votre photo de profil est visible par le public dans le contexte de votre commentaire.
                        </p>
                        <p>
                            <strong>Contributions au forum :</strong> Les questions et réponses publiées sur le forum sont visibles par tous les utilisateurs de la plateforme. Les informations personnelles partagées dans ces contributions sont également visibles publiquement.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Médias et fichiers</h2>
                        <p>
                            Si vous téléchargez des images sur Workyt, vous devez éviter de le faire avec des données de localisation intégrées (GPS EXIF). Les visiteurs du site Web peuvent télécharger et extraire toutes les données de localisation des images sur le site Web.
                        </p>
                        <p>
                            <strong>Upload de fichiers :</strong> Workyt permet l&apos;upload de fichiers pour enrichir les fiches et les questions du forum. Les utilisateurs sont responsables du contenu des fichiers qu&apos;ils partagent et s&apos;engagent à respecter les droits d&apos;auteur et la législation en vigueur.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Liens hypertextes et cookies</h2>
                        <p>
                            Comme tout autre site web, Workyt utilise des «cookies». Ces cookies sont utilisés pour stocker des informations, y compris les préférences des visiteurs et les pages du site Web accédées par le visiteur ou visité. Les informations sont utilisées pour optimiser l&apos;expérience des utilisateurs en personnalisant notre contenu de page Web en fonction du type de navigateur des visiteurs et/ou d&apos;autres informations.
                        </p>
                        <p>
                            Le site www.workyt.fr contient un certain nombre de liens hypertextes vers d&apos;autres sites, mis en place avec l&apos;autorisation du Président. Cependant, Workyt n&apos;a pas la possibilité de vérifier le contenu des sites ainsi visités, et n&apos;assumera en conséquence aucune responsabilité de ce fait.
                        </p>
                        <p>
                            La navigation sur le site www.workyt.fr est susceptible de provoquer l&apos;installation de cookie(s) sur l&apos;ordinateur de l&apos;utilisateur. Un cookie est un fichier de petite taille, qui ne permet pas l&apos;identification de l&apos;utilisateur, mais qui enregistre des informations relatives à la navigation d&apos;un ordinateur sur un site. Les données ainsi obtenues visent à faciliter la navigation ultérieure sur le site, et ont également vocation à permettre diverses mesures de fréquentation.
                        </p>
                        <p>
                            Combien de temps conservons nous vos données ? Si vous laissez un commentaire sur notre site, vous pouvez accepter que votre nom, votre adresse électronique et votre site Web soient enregistrés dans des cookies. Ces cookies vous permettent de ne pas avoir à remplir à nouveau vos coordonnées lorsque vous laissez un autre commentaire. Ces cookies ont une durée de vie d&apos;un an.
                        </p>
                        <p>
                            Pour les utilisateurs qui s&apos;inscrivent sur notre site web (le cas échéant), nous conservons également les informations personnelles qu&apos;ils fournissent dans leur profil d&apos;utilisateur. Tous les utilisateurs peuvent consulter, modifier ou supprimer leurs informations personnelles à tout moment (sauf qu&apos;ils ne peuvent pas modifier leur nom d&apos;utilisateur). Les administrateurs du site web peuvent également voir et modifier ces informations.
                        </p>
                        <p>
                            Si vous visitez notre page de connexion, nous installerons un cookie temporaire pour déterminer si votre navigateur accepte les cookies. Ce cookie ne contient aucune donnée personnelle et est supprimé lorsque vous fermez votre navigateur.
                        </p>
                        <p>
                            Lorsque vous vous connectez, nous installerons également plusieurs cookies pour enregistrer vos informations de connexion et vos choix d&apos;affichage d&apos;écran. Les cookies de connexion durent deux jours, et les cookies d&apos;options d&apos;écran durent un an. Si vous sélectionnez &apos;Se souvenir de moi&apos;, votre connexion sera conservée pendant deux semaines. Si vous vous déconnectez de votre compte, les cookies de connexion seront supprimés.
                        </p>
                        <p>
                            Si vous modifiez ou publiez un post (forum ou article), un cookie supplémentaire sera enregistré dans votre navigateur. Ce cookie ne comprend aucune donnée personnelle et indique simplement l&apos;ID de poste de l&apos;article que vous venez de modifier. Il expire après 1 jour.
                        </p>
                        <p>
                            Google est l&apos;un des fournisseurs tiers sur notre site. Il utilise également des cookies, appelés Cookies de Dart, pour servir des publicités à nos visiteurs en fonction de leur visite sur d&apos;autres sites sur Internet. Toutefois, les visiteurs peuvent choisir de refuser l&apos;utilisation des cookies de DART en visitant la politique de confidentialité de Google AD et de Network Content à l&apos;URL suivante : <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/ads</a>
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Contenu intégré d&apos;autres sites Web</h2>
                        <p>
                            Les articles peuvent inclure du contenu intégré (par exemple des vidéos, des images, des articles, etc.). Le contenu intégré provenant d&apos;autres sites web se comporte exactement de la même manière que si le visiteur avait visité l&apos;autre site web.
                        </p>
                        <p>
                            Ces sites web peuvent collecter des données vous concernant, utiliser des cookies, intégrer un suivi supplémentaire par des tiers et surveiller votre interaction avec ce contenu intégré, y compris le suivi de votre interaction avec le contenu intégré si vous avez un compte et êtes connecté à ce site web.
                        </p>
                        <p>
                            Le refus d&apos;installation d&apos;un cookie peut entraîner l&apos;impossibilité d&apos;accéder à certains services.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Quels sont vos droits sur vos données ?</h2>
                        <p>
                            Si vous avez un compte sur ce site, ou si vous avez laissé des commentaires, vous pouvez demander à recevoir un fichier exporté des données personnelles que nous détenons à votre sujet, y compris les données que vous nous avez fournies. Vous pouvez également demander que nous effacions toutes les données personnelles que nous détenons à votre sujet. Cela n&apos;inclut pas les données que nous sommes obligés de conserver à des fins administratives, juridiques ou de sécurité. Les commentaires des visiteurs peuvent être vérifiés par un service automatisé de détection des spams.
                        </p>
                        <p>
                            <strong>Droit à l&apos;effacement :</strong> Vous pouvez demander la suppression de votre compte et de vos données personnelles. Notez que le contenu que vous avez créé (fiches, réponses au forum) peut être conservé pour maintenir l&apos;intégrité de la plateforme, mais sera anonymisé.
                        </p>
                        <p>
                            <strong>Droit à la portabilité :</strong> Vous pouvez demander l&apos;export de vos données personnelles dans un format structuré et lisible par machine.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Information pour les enfants</h2>
                        <p>
                            Une autre partie de notre priorité est d&apos;ajouter une protection des enfants lors de l&apos;utilisation d&apos;Internet. Nous encourageons les parents et les tuteurs à observer, participer, et/ou surveiller et guider leur activité en ligne. Workyt ne collecte pas sciemment aucune information personnelle identifiable à partir des enfants de moins de 13 ans. Si vous pensez que votre enfant a fourni ce type d&apos;informations sur notre site Web, nous vous encourageons vivement à nous contacter immédiatement et nous ferons de nos meilleurs efforts pour supprimer rapidement ces informations de nos archives.
                        </p>
                        <p>
                            <strong>Contenu éducatif :</strong> Workyt propose du contenu éducatif adapté à différents niveaux scolaires. Les parents et tuteurs sont encouragés à superviser l&apos;utilisation de la plateforme par les mineurs et à s&apos;assurer que le contenu consulté est approprié à leur niveau et à leur âge.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Sécurité et modération</h2>
                        <p>
                            Workyt met en place des mesures de sécurité et de modération pour maintenir la qualité de la plateforme :
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Modération automatique :</strong> Système de détection des spams et du contenu inapproprié</li>
                            <li><strong>Modération humaine :</strong> Équipe de modérateurs pour vérifier le contenu signalé</li>
                            <li><strong>Signalement :</strong> Les utilisateurs peuvent signaler du contenu inapproprié</li>
                            <li><strong>Sanctions :</strong> Système de sanctions progressives pour les utilisateurs qui ne respectent pas les règles</li>
                        </ul>

                        <h2 className="text-2xl font-bold mt-6">Consentement</h2>
                        <p>
                            En utilisant notre site Web, vous consentez par la présente à notre politique de confidentialité et acceptez ses termes et conditions.
                        </p>
                        <p>
                            <strong>Mise à jour des conditions :</strong> Workyt se réserve le droit de modifier ces mentions légales à tout moment. Les utilisateurs seront informés des modifications importantes via la plateforme ou par email.
                        </p>
                    </Dialog.Description>
                    <Dialog.Close asChild>
                        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Fermer</button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default LegalMentionsModal;
