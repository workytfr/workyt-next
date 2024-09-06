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
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg max-w-3xl max-h-[90vh] overflow-y-auto z-50">
                    <Dialog.Title className="text-xl font-semibold mb-4" style={{ color: "black" }}>Mentions légales de Workyt</Dialog.Title>
                    <Dialog.Description className="space-y-4" style={{ color: "black" }}>
                        <h2 className="text-2xl font-bold mt-6"> Présentation du site: </h2>
                        <p>
                         En vertu de l’article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique, il est précisé aux utilisateurs du site www.workyt.fr l’identité des différents intervenants dans le cadre de sa réalisation et de son suivi :
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
                        <h2 className="text-2xl font-bold mt-6"> Conditions générales d’utilisation du site et des
                            services proposés</h2>
                        <p>
                            L’utilisation du site www.workyt.fr implique l’acceptation pleine et entière des conditions générales d’utilisation ci-après décrites. Ces conditions d’utilisation sont susceptibles d’être modifiées ou complétées à tout moment, les utilisateurs du site www.workyt.fr sont donc invités à les consulter de manière régulière.
                        </p>
                        <p>
                            Ce site est normalement accessible à tout moment aux utilisateurs. Une interruption pour raison de maintenance technique peut être toutefois décidée par Workyt ou l’hébergeur, qui s’efforcera alors de communiquer préalablement aux utilisateurs les dates et heures de l’intervention.
                        </p>
                        <p>
                            Le site www.workyt.fr est mis à jour régulièrement par les développeurs du projet. De la même façon, les mentions légales peuvent être modifiées à tout moment : elles s’imposent néanmoins à l’utilisateur qui est invité à s’y référer le plus souvent possible afin d’en prendre connaissance.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Description des services fournis</h2>
                        <p>
                            Le site www.workyt.fr a pour objet de fournir une information concernant l’ensemble des activités de la société. Le Président de Workyt s’efforce de fournir sur le site www.workyt.fr des informations aussi précises que possible. Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes et des carences dans la mise à jour, qu’elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.
                        </p>
                        <p>
                            Toutes les informations indiquées sur le site www.workyt.fr sont données à titre indicatif, et sont susceptibles d’évoluer. Par ailleurs, les renseignements figurant sur le site www.workyt.fr ne sont pas exhaustifs. Ils sont donnés sous réserve de modifications ayant été apportées depuis leur mise en ligne.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Limitations contractuelles sur les données techniques</h2>
                        <p>
                            Le site utilise la technologie JavaScript. Le Président de Workyt ne pourra être tenu responsable de dommages matériels liés à l’utilisation du site. De plus, l’utilisateur du site s’engage à accéder au site en utilisant un matériel récent, ne contenant pas de virus et avec un navigateur de dernière génération mis à jour.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Propriété intellectuelle et contrefaçons</h2>
                        <p>
                            Workyt est propriétaire des droits de propriété intellectuelle ou détient les droits d’usage sur tous les éléments accessibles sur le site, notamment les textes, images, graphismes, logo, icônes, sons, logiciels. Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable à : admin@workyt.fr.
                        </p>
                        <p>
                            Toute exploitation non autorisée du site ou de l’un quelconque des éléments qu’il contient sera considérée comme constitutive d’une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Limitations de responsabilité</h2>
                        <p>
                            Workyt ne pourra être tenue responsable des dommages directs et indirects causés au matériel de l’utilisateur, lors de l’accès au site www.workyt.fr, et résultant soit de l’utilisation d’un matériel ne répondant pas aux spécifications indiquées au point 4, soit de l’apparition d’un bug ou d’une incompatibilité.
                        </p>
                        <p>
                            Workyt ne pourra également être tenue responsable des dommages indirects (tels par exemple qu’une perte de marché ou perte d’une chance) consécutifs à l’utilisation du site www.workyt.fr. Les utilisateurs ont accès à la zone interactive. Workyt se réserve le droit de supprimer, sans mise en demeure préalable, tout contenu publié dans cet espace qui contreviendrait à la législation française en vigueur, notamment aux dispositions relatives à la protection des données.
                        </p>
                        <p>
                            Le cas échéant, Workyt se réserve également la possibilité de mettre en cause la responsabilité civile et/ou pénale de l’utilisateur, notamment en cas de message à caractère raciste, injurieux, diffamant, ou pornographique, quel que soit le support utilisé (texte, photographie…).
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Gestion des données personnelles</h2>
                        <p>
                            En France, les données personnelles sont notamment protégées par la loi n° 78-87 du 6 janvier 1978, la loi n° 2004-801 du 6 août 2004, l’article L. 226-13 du Code pénal et la Directive Européenne du 24 octobre 1995.
                        </p>
                        <p>
                            A l’occasion de l’utilisation du site www.workyt.fr, peuvent être recueillies : l’URL des liens par l’intermédiaire desquels l’utilisateur a accédé au site www.workyt.fr, le fournisseur d’accès de l’utilisateur, l’adresse de protocole Internet (IP) de l’utilisateur.
                        </p>
                        <p>
                            Les serveurs AD tiers ou les réseaux AD utilisent des technologies telles que des cookies, JavaScript ou des balises Web utilisées dans leurs publicités et liens respectifs qui apparaissent sur Workyt, qui sont envoyés directement au navigateur des utilisateurs. Ils reçoivent automatiquement votre adresse IP lorsque cela se produit. Ces technologies sont utilisées pour mesurer l’efficacité de leurs campagnes publicitaires et/ou de personnaliser le contenu publicitaire que vous voyez sur des sites Web que vous visitez.
                        </p>
                        <p>
                            Notez que Workyt n’a pas accès à ces cookies qui sont utilisés par des annonceurs tiers.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Commentaires</h2>
                        <p>
                            Nous recueillons les données indiquées dans le formulaire de commentaires, ainsi que l’adresse IP du visiteur et la chaîne d’agent utilisateur du navigateur pour faciliter la détection des spams. Une chaîne anonyme créée à partir de votre adresse électronique (également appelée hash) peut être fournie au service Gravatar pour savoir si vous l’utilisez. La politique de confidentialité du service Gravatar est disponible ici : <a href="https://automattic.com/privacy/" target="_blank" rel="noopener noreferrer">https://automattic.com/privacy/</a>. Après approbation de votre commentaire, votre photo de profil est visible par le public dans le contexte de votre commentaire.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Médias</h2>
                        <p>
                            Si vous téléchargez des images sur Workyt, vous devez éviter de le faire avec des données de localisation intégrées (GPS EXIF). Les visiteurs du site Web peuvent télécharger et extraire toutes les données de localisation des images sur le site Web.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Liens hypertextes et cookies</h2>
                        <p>
                            Comme tout autre site web, Workyt utilise des «cookies». Ces cookies sont utilisés pour stocker des informations, y compris les préférences des visiteurs et les pages du site Web accédées par le visiteur ou visité. Les informations sont utilisées pour optimiser l’expérience des utilisateurs en personnalisant notre contenu de page Web en fonction du type de navigateur des visiteurs et/ou d’autres informations.
                        </p>
                        <p>
                            Le site www.workyt.fr contient un certain nombre de liens hypertextes vers d’autres sites, mis en place avec l’autorisation du Président. Cependant, Workyt n’a pas la possibilité de vérifier le contenu des sites ainsi visités, et n’assumera en conséquence aucune responsabilité de ce fait.
                        </p>
                        <p>
                            La navigation sur le site www.workyt.fr est susceptible de provoquer l’installation de cookie(s) sur l’ordinateur de l’utilisateur. Un cookie est un fichier de petite taille, qui ne permet pas l’identification de l’utilisateur, mais qui enregistre des informations relatives à la navigation d’un ordinateur sur un site. Les données ainsi obtenues visent à faciliter la navigation ultérieure sur le site, et ont également vocation à permettre diverses mesures de fréquentation.
                        </p>
                        <p>
                            Combien de temps conservons nous vos données ? Si vous laissez un commentaire sur notre site, vous pouvez accepter que votre nom, votre adresse électronique et votre site Web soient enregistrés dans des cookies. Ces cookies vous permettent de ne pas avoir à remplir à nouveau vos coordonnées lorsque vous laissez un autre commentaire. Ces cookies ont une durée de vie d’un an.
                        </p>
                        <p>
                            Pour les utilisateurs qui s’inscrivent sur notre site web (le cas échéant), nous conservons également les informations personnelles qu’ils fournissent dans leur profil d’utilisateur. Tous les utilisateurs peuvent consulter, modifier ou supprimer leurs informations personnelles à tout moment (sauf qu’ils ne peuvent pas modifier leur nom d’utilisateur). Les administrateurs du site web peuvent également voir et modifier ces informations.
                        </p>
                        <p>
                            Si vous visitez notre page de connexion, nous installerons un cookie temporaire pour déterminer si votre navigateur accepte les cookies. Ce cookie ne contient aucune donnée personnelle et est supprimé lorsque vous fermez votre navigateur.
                        </p>
                        <p>
                            Lorsque vous vous connectez, nous installerons également plusieurs cookies pour enregistrer vos informations de connexion et vos choix d&apos;affichage d&apos;écran. Les cookies de connexion durent deux jours, et les cookies d&apos;options d&apos;écran durent un an. Si vous sélectionnez &apos;Se souvenir de moi&apos;, votre connexion sera conservée pendant deux semaines. Si vous vous déconnectez de votre compte, les cookies de connexion seront supprimés.
                        </p>
                        <p>
                            Si vous modifiez ou publiez un post (forum ou article), un cookie supplémentaire sera enregistré dans votre navigateur. Ce cookie ne comprend aucune donnée personnelle et indique simplement l’ID de poste de l’article que vous venez de modifier. Il expire après 1 jour.
                        </p>
                        <p>
                            Google est l’un des fournisseurs tiers sur notre site. Il utilise également des cookies, appelés Cookies de Dart, pour servir des publicités à nos visiteurs en fonction de leur visite sur d’autres sites sur Internet. Toutefois, les visiteurs peuvent choisir de refuser l’utilisation des cookies de DART en visitant la politique de confidentialité de Google AD et de Network Content à l’URL suivante : <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/ads</a>
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Contenu intégré d’autres sites Web</h2>
                        <p>
                            Les articles peuvent inclure du contenu intégré (par exemple des vidéos, des images, des articles, etc.). Le contenu intégré provenant d’autres sites web se comporte exactement de la même manière que si le visiteur avait visité l’autre site web.
                        </p>
                        <p>
                            Ces sites web peuvent collecter des données vous concernant, utiliser des cookies, intégrer un suivi supplémentaire par des tiers et surveiller votre interaction avec ce contenu intégré, y compris le suivi de votre interaction avec le contenu intégré si vous avez un compte et êtes connecté à ce site web.
                        </p>
                        <p>
                            Le refus d’installation d’un cookie peut entraîner l’impossibilité d’accéder à certains services.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Quels sont vos droits sur vos données ?</h2>
                        <p>
                            Si vous avez un compte sur ce site, ou si vous avez laissé des commentaires, vous pouvez demander à recevoir un fichier exporté des données personnelles que nous détenons à votre sujet, y compris les données que vous nous avez fournies. Vous pouvez également demander que nous effacions toutes les données personnelles que nous détenons à votre sujet. Cela n’inclut pas les données que nous sommes obligés de conserver à des fins administratives, juridiques ou de sécurité. Les commentaires des visiteurs peuvent être vérifiés par un service automatisé de détection des spams.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Information pour les enfants</h2>
                        <p>
                            Une autre partie de notre priorité est d’ajouter une protection des enfants lors de l’utilisation d’Internet. Nous encourageons les parents et les tuteurs à observer, participer, et/ou surveiller et guider leur activité en ligne. Workyt ne collecte pas sciemment aucune information personnelle identifiable à partir des enfants de moins de 13 ans. Si vous pensez que votre enfant a fourni ce type d’informations sur notre site Web, nous vous encourageons vivement à nous contacter immédiatement et nous ferons de nos meilleurs efforts pour supprimer rapidement ces informations de nos archives.
                        </p>

                        <h2 className="text-2xl font-bold mt-6">Consentement</h2>
                        <p>
                            En utilisant notre site Web, vous consentez par la présente à notre politique de confidentialité et acceptez ses termes et conditions.
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
