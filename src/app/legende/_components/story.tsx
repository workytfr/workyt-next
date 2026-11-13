import type { ReactNode } from "react";
import { FoxyMark } from "./art";
import Stamp from "./Stamp";

/*
 * Texte de la Légende de Workyt. La mise en scène vit dans LegendeStory.tsx,
 * les planches illustrées dans plates.tsx.
 *
 * Règle d'écriture : le récit reste entièrement dans la fiction. Aucun mot du site
 * (forum, quiz, badge…) dans le conte ; chaque élément du royaume a son équivalent
 * exact sur Workyt, et la correspondance n'est donnée qu'une fois, à la fin, dans la
 * « Légende de la carte » (KEY ci-dessous). Les chiffres, eux, sont les vrais :
 * à tenir à jour si lib/pointsService, questService, streakService, chestOdds,
 * mushroomService, heroService, adventureService, challengeService ou gemConfig changent.
 */
export const PIECE = "Wyt";
export const PIECES = "Wyts";
export const PIERRE = "Braise";
export const PIERRES = "Braises";

export type JournalKind = "carnet" | "ordre" | "parchemin" | "registre" | "gazette" | "forge";

export type Journal = {
    kind: JournalKind;
    title: string;
    subtitle?: string;
    content: ReactNode;
};

export type PlateKind =
    | "chemin"
    | "voyageur"
    | "lanterne"
    | "quetes"
    | "coffres"
    | "guildes"
    | "bibliotheque"
    | "clans"
    | "arene"
    | "veilleurs"
    | "forge"
    | "echoppe";

export type Chapter = {
    id: string;
    kicker: string;
    title: string;
    body: ReactNode;
    /** Planches illustrées affichées après le texte. */
    plates?: PlateKind[];
    journal?: Journal;
    /** Contenu de la bourse quand le lecteur atteint ce chapitre. */
    wallet: { wyts: number; braises: number };
};

/** Réplique de Foxy, avec son portrait. */
function Foxy({ children }: { children: ReactNode }) {
    return (
        <p className="legende-foxy flex gap-3">
            <FoxyMark className="mt-0.5 h-8 w-8 shrink-0" />
            <span>{children}</span>
        </p>
    );
}

export const CHAPTERS: Chapter[] = [
    {
        id: "prologue",
        kicker: "Prologue",
        title: "La Brume",
        wallet: { wyts: 20, braises: 0 },
        body: (
            <>
                <p>
                    On raconte qu&apos;il existe, au-delà des collines de l&apos;Ennui, un royaume nommé{" "}
                    <strong>Workyt</strong>. Au sommet de sa plus haute tour brûle une flamme orange. Les anciens disent
                    qu&apos;elle n&apos;a jamais vacillé, pas même pendant les années de la Brume.
                </p>
                <p>
                    La Brume, personne ne l&apos;a vue arriver. Elle n&apos;a pas de forme, pas de visage, et elle ne fait
                    aucun bruit. Elle se glisse dans les maisons le soir et murmure toujours la même phrase :{" "}
                    <em>« Demain. Tu feras ça demain. »</em> Ceux qui l&apos;écoutent trop longtemps ne meurent pas. Ils
                    s&apos;éteignent, doucement, de l&apos;intérieur. Dans le royaume, on l&apos;appelle{" "}
                    <strong>la Flemme</strong>, et on baisse la voix pour le dire.
                </p>
                <p>
                    Tu arrives à la grande porte un matin de pluie. La légende dit que celui qui atteint le sommet de la
                    tour obtient ce qu&apos;il est venu chercher. Toi, tu es venu chercher <strong>la réussite</strong>.
                    Celle qu&apos;on ne t&apos;a jamais promise.
                </p>
                <p>
                    Pour tout bagage : une besace, un peu de courage et une <strong>bourse vide</strong>.
                </p>
                <p>
                    Au poste de garde, une sentinelle te tend deux choses. D&apos;abord une poignée de pièces,{" "}
                    <strong>carrées</strong>, lourdes, frappées de la flamme.
                </p>
                <p className="legende-line">
                    — <strong>Vingt {PIECES}</strong>. Le royaume les offre à chaque nouveau venu. Les suivantes, tu
                    devras les gagner : ici, rien ne s&apos;achète, et chaque effort t&apos;en rapporte un peu.
                </p>
                <p>
                    Ensuite une petite <strong>lanterne</strong>. À l&apos;intérieur, une flamme pas plus grande
                    qu&apos;un ongle.
                </p>
                <p className="legende-line">
                    — Ta flamme. Elle grandit chaque jour où tu avances. Elle retombe le jour où tu cèdes. C&apos;est elle
                    que la Brume viendra chercher.
                </p>
                <p>
                    Sur la borne, à côté de la porte, un renard t&apos;observe. Roux, le poil usé, une cicatrice sur le
                    museau.
                </p>
                <Foxy>
                    — <strong>Foxy</strong>. Je connais le chemin. Je l&apos;ai fait. Je ne le ferai pas à ta place, mais
                    je peux t&apos;éviter de mourir bêtement dans les premiers jours.
                </Foxy>
                <p>Il jette un œil à ta lanterne.</p>
                <Foxy>— Petite. Normal. Elles le sont toutes au début.</Foxy>
            </>
        ),
        journal: {
            kind: "carnet",
            title: "Carnet de Foxy",
            subtitle: "Premier jour",
            content: (
                <>
                    <p>Un nouveau voyageur ce matin. Ils arrivent tous avec le même regard : la tour, puis le sol, puis la tour.</p>
                    <p>
                        La plupart ne passent pas le premier hiver. La Brume les trouve un soir de fatigue et leur lanterne
                        s&apos;éteint, pas dans un fracas, dans un soupir.
                    </p>
                    <p>Celui-là a compté ses vingt pièces deux fois avant de les ranger. Je ne sais pas encore ce que ça veut dire.</p>
                    <p>Je l&apos;accompagne. C&apos;est ce que je fais.</p>
                </>
            ),
        },
    },
    {
        id: "chemin",
        kicker: "Chapitre I",
        title: "Le chemin des jours",
        plates: ["chemin"],
        wallet: { wyts: 35, braises: 0 },
        body: (
            <>
                <p>
                    Derrière la porte, il n&apos;y a pas de route. Il y a un <strong>chemin de dalles</strong>, une par
                    jour, qui serpente jusqu&apos;au pied de la tour.
                </p>
                <p>
                    La règle est simple et elle ne pardonne pas : tu ne poses le pied que sur{" "}
                    <strong>la dalle du jour</strong>. Hier est passé, demain n&apos;existe pas encore. Une dalle manquée
                    reste grise pour toujours. Personne ne revient en arrière sur ce chemin.
                </p>
                <p>
                    Et sur chaque dalle, une <strong>bête</strong> monte la garde. Elle ne se bat pas à l&apos;épée : elle
                    pose <strong>une énigme</strong>. Réponds juste et elle s&apos;efface. Réponds de travers et elle
                    frappe. La dalle conquise te rapporte <strong>1 à 3 {PIECES}</strong>, parfois une{" "}
                    {PIERRE}. Les jours de fête, bien plus : jusqu&apos;à 15 {PIECES} ou 2 {PIERRES}.
                </p>
                <p>
                    Le <strong>15 de chaque mois</strong>, ce n&apos;est pas une bête qui t&apos;attend, c&apos;est le{" "}
                    <strong>Gardien</strong>. Il frappe deux fois plus fort. Mais il laisse toujours derrière lui une pièce
                    d&apos;équipement, et ce jour-là, la dalle cache un coffre.
                </p>
                <p>
                    Le mois est coupé en <strong>cinq tronçons</strong> : du 1er au 7, du 8 au 14, du 15 au 21, du 22 au 28,
                    puis la fin du mois. Marche chaque jour d&apos;un tronçon, sans en sauter un seul, et tu reçois sa{" "}
                    <strong>carte</strong>. Réunis toutes les cartes du mois : un <strong>coffre</strong> et une pièce
                    d&apos;équipement épique.
                </p>
                <p>
                    Chaque mois, le chemin change de décor. Il neige à Noël, des lanternes rouges pendent au Nouvel An
                    chinois, et les bêtes changent avec la saison.
                </p>
                <Foxy>— Le chemin ne demande pas d&apos;être fort. Il demande d&apos;être là. Tous les jours.</Foxy>
            </>
        ),
    },
    {
        id: "voyageur",
        kicker: "Chapitre II",
        title: "Ce que porte un voyageur",
        plates: ["voyageur"],
        wallet: { wyts: 45, braises: 0 },
        body: (
            <>
                <p>
                    Le troisième soir, Foxy te fait asseoir près du feu et te regarde comme un forgeron regarde une lame mal
                    trempée.
                </p>
                <Foxy>— Parlons de toi. Pas de ce que tu crois être. De ce que le chemin voit.</Foxy>
                <p>
                    Tu as des <strong>points de vie</strong>, une <strong>attaque</strong>, une <strong>défense</strong>.
                    Chaque bête vaincue te donne de l&apos;<strong>expérience</strong>, davantage si tu réponds vite et du
                    premier coup. L&apos;expérience te fait monter de <strong>niveau</strong>, et chaque niveau te rend
                    plus solide.
                </p>
                <p>
                    Chaque niveau te rapporte aussi <strong>10 {PIECES}</strong> et remet tes points de vie à plein. Tous
                    les 3 niveaux, un champignon. Tous les 5, deux {PIERRES}. Tous les 10, une pièce d&apos;équipement.
                </p>
                <p>
                    Ton équipement tient en trois emplacements : une <strong>arme</strong>, une <strong>armure</strong>,
                    une <strong>amulette</strong>. Commun, rare, épique, légendaire. On ne l&apos;achète pas, on le
                    ramasse : sur le Gardien, au bout des cartes du mois, en montant de niveau.
                </p>
                <p>
                    Si tes points de vie tombent à zéro, tu t&apos;<strong>évanouis</strong>. Plus d&apos;expérience, et
                    la dalle du jour t&apos;est fermée. Tu te relèves le lendemain, ou tout de suite si tu manges un
                    champignon.
                </p>
                <p>Foxy remue les braises du bout de la patte.</p>
                <Foxy>
                    — Et retiens ça. Chaque jour d&apos;école où tu ne te montres pas, passé le premier, la Brume te vole un
                    dixième de ce que tu as appris à ce niveau. Elle peut te faire redescendre. Pendant les vacances, elle
                    dort aussi. C&apos;est bien la seule chose que je lui accorde.
                </Foxy>
            </>
        ),
    },
    {
        id: "lanterne",
        kicker: "Chapitre III",
        title: "La lanterne",
        plates: ["lanterne"],
        wallet: { wyts: 60, braises: 0 },
        body: (
            <>
                <p>
                    Au septième matin, ta lanterne n&apos;a plus la même lumière. La flamme a grandi d&apos;un cran chaque
                    jour où tu as marché, ou chaque jour où tu as avancé une quête.
                </p>
                <p>
                    Elle a aussi sa règle : <strong>un seul jour sans rien</strong>, et elle retombe à une étincelle. Peu
                    importe qu&apos;elle ait brûlé trois jours ou trois mois.
                </p>
                <p>
                    Sur le chemin, certaines bornes marquent les grands paliers : <strong>3, 7, 14, 30, 60 et 100
                    jours</strong>. À chacune, une offrande t&apos;attend, de quelques {PIECES} au début jusqu&apos;à 200{" "}
                    {PIECES}, 5 {PIERRES} et 3 champignons à la centième. Personne ne te la donne : il faut aller la
                    réclamer à la borne.
                </p>
                <p>
                    Et une grande flamme éclaire mieux. Chaque jour d&apos;affilée ajoute <strong>2 %</strong> à
                    l&apos;expérience que tu gagnes, jusqu&apos;à <strong>+60 %</strong>.
                </p>
                <Foxy>
                    — La Brume ne s&apos;attaque jamais aux grandes flammes. Elle attend qu&apos;elles retombent. Ne lui
                    donne pas ce jour-là.
                </Foxy>
            </>
        ),
        journal: {
            kind: "carnet",
            title: "Carnet de Foxy",
            subtitle: "Septième jour",
            content: (
                <>
                    <p>Sept jours sans faillir. Il a réclamé son offrande à la borne sans même me demander où elle était.</p>
                    <p>Ce soir, il était épuisé. Il a quand même pris sa dalle. Cinq minutes, une énigme, au lit.</p>
                    <p>C&apos;est exactement ça. Pas besoin d&apos;un exploit chaque jour. Besoin d&apos;un pas.</p>
                </>
            ),
        },
    },
    {
        id: "quetes",
        kicker: "Chapitre IV",
        title: "Le tableau de l'auberge",
        plates: ["quetes"],
        wallet: { wyts: 90, braises: 0 },
        body: (
            <>
                <p>
                    À mi-chemin se dresse une auberge, et dans l&apos;auberge, un tableau de liège couvert de{" "}
                    <strong>quêtes</strong>.
                </p>
                <p>
                    Chaque matin, l&apos;aubergiste en tire <strong>trois au sort</strong> parmi neuf et les punaise au
                    tableau : <em>« Réponds à trois appels de la salle des guildes »</em>,{" "}
                    <em>« Réussis deux épreuves à la bibliothèque »</em>, <em>« Copie un feuillet »</em>. De petites
                    tâches, de petites récompenses : 5 à 10 {PIECES}, parfois un coffre.
                </p>
                <p>
                    À côté, les quêtes de la <strong>semaine</strong>, plus longues, avec un coffre rare au bout. Et tout en
                    haut, celles du <strong>mois</strong> : trente appels, vingt épreuves, deux grimoires terminés. Ce sont
                    les seules qui paient en {PIERRES}, avec des coffres qui vont jusqu&apos;au légendaire.
                </p>
                <p>
                    Chaque quête accomplie te donne aussi de l&apos;expérience : 15 pour une quête du jour, 40 pour la
                    semaine, 80 pour le mois.
                </p>
                <Foxy>
                    — Remarque une chose. Aucune de ces quêtes ne te demande quelque chose d&apos;inutile. Tu les remplis
                    en faisant ce que tu étais venu faire.
                </Foxy>
            </>
        ),
    },
    {
        id: "coffres",
        kicker: "Chapitre V",
        title: "Coffres et champignons",
        plates: ["coffres"],
        wallet: { wyts: 150, braises: 1 },
        body: (
            <>
                <p>
                    Le premier coffre que tu ouvres a une tête de renard qui pleure. Foxy fait semblant de ne pas le
                    remarquer.
                </p>
                <p>
                    Les coffres tombent des quêtes, du Gardien, des cartes du mois et des guerres de clans. Il en existe{" "}
                    <strong>quatre sortes</strong>. Le <strong>commun</strong> donne surtout des {PIECES}, de 30 à 100. Le{" "}
                    <strong>rare</strong> monte jusqu&apos;à 200 et lâche parfois jusqu&apos;à 3 {PIERRES}.
                    L&apos;<strong>épique</strong> et le <strong>légendaire</strong> se comptent en centaines de {PIECES},
                    en dizaines de {PIERRES} et en poignées de champignons. Au fond des plus beaux, une fois sur cent, un
                    portrait de Foxy qu&apos;on ne trouve nulle part ailleurs.
                </p>
                <p>
                    Ah, les <strong>champignons</strong>. Ils poussent dans les coffres, au pied des bornes de la
                    lanterne, et à chaque troisième niveau. En manger un te remet <strong>sur pied</strong>, quoi
                    qu&apos;il arrive. Mais selon la quantité, ils font autre chose.
                </p>
                <p>
                    <strong>Un</strong> : pendant 30 minutes, tout ce que tu gagnes vaut un quart de plus.{" "}
                    <strong>Deux</strong> : l&apos;aubergiste punaise une quatrième quête du jour pendant 24 heures.{" "}
                    <strong>Trois</strong> : le prochain coffre que tu ouvres a plus de chances d&apos;être généreux.
                </p>
                <Foxy>— Garde-les pour les mauvais soirs. Il y en a toujours un.</Foxy>
            </>
        ),
    },
    {
        id: "guildes",
        kicker: "Chapitre VI",
        title: "La salle des guildes",
        plates: ["guildes"],
        wallet: { wyts: 175, braises: 1 },
        body: (
            <>
                <p>
                    Au cœur de la ville basse se trouve une salle immense, enfumée, où l&apos;on parle fort. Sur un
                    panneau de chêne noirci, des centaines de parchemins sont cloués. Ce sont des{" "}
                    <strong>appels à l&apos;aide</strong>.
                </p>
                <p>
                    Certains sont écrits d&apos;une main sûre. D&apos;autres tremblent :{" "}
                    <em>« Contrôle demain. Je n&apos;ai rien compris au chapitre. Quelqu&apos;un ? »</em>
                </p>
                <p>
                    Ici, deux chemins : aider, ou être aidé. Ceux qui méprisent le second ne restent jamais longtemps dans
                    le royaume. Tout le monde, un jour, a cloué un parchemin.
                </p>
                <p>
                    Clouer un appel a un prix : tu y <strong>mises des {PIECES}</strong>, et chaque dessin en plus coûte une
                    pièce. Décrocher l&apos;appel d&apos;un autre et y répondre te rapporte <strong>2 {PIECES}</strong>,
                    plus <strong>1</strong> chaque fois qu&apos;un voyageur te remercie. Et si l&apos;auteur{" "}
                    <strong>valide</strong> ta réponse, toute sa mise est pour toi.
                </p>
                <p>Tu hésites devant le panneau, ton propre parchemin à la main. Foxy s&apos;assoit à côté de toi.</p>
                <Foxy>
                    — Tu sais ce qui éteint une lanterne plus sûrement que la Brume ? La honte de demander. La Brume adore
                    ça. Elle n&apos;a même pas besoin de murmurer.
                </Foxy>
                <p>Tu cloues le parchemin.</p>
            </>
        ),
        journal: {
            kind: "parchemin",
            title: "Parchemin cloué au panneau",
            subtitle: "Coin inférieur gauche",
            content: (
                <>
                    <p>
                        <em>Appel :</em> « Je ne comprends pas comment comparer deux fractions qui n&apos;ont pas le même
                        dénominateur. »
                    </p>
                    <p>
                        <em>Mise :</em> 5 {PIECES}
                    </p>
                    <p className="opacity-60">
                        <s>Réponse 1 : c&apos;est 3/4.</s> — non validée
                    </p>
                    <p>
                        Réponse 2 : « Deux pains coupés différemment, l&apos;un en 4 parts, l&apos;autre en 8. Pour savoir
                        lequel te donne plus, il faut les recouper de la même façon… »
                        <br />
                        <Stamp />
                    </p>
                    <p className="border-t border-dashed border-[rgba(26,21,18,0.25)] pt-3 text-[13px]">
                        <em>
                            En marge, de la main du maître de guilde : donne la démarche, pas seulement le résultat. Et toi qui
                            cloues un appel, écris ce que tu as déjà tenté. On aide plus vite celui qui a commencé à se battre.
                        </em>
                    </p>
                </>
            ),
        },
    },
    {
        id: "bibliotheque",
        kicker: "Chapitre VII",
        title: "Les rayonnages sans fin",
        plates: ["bibliotheque"],
        wallet: { wyts: 240, braises: 1 },
        body: (
            <>
                <p>
                    Passé le pont de pierre, une porte basse donne sur la <strong>Bibliothèque</strong>. On n&apos;en voit
                    pas le plafond. Les rayonnages se perdent dans l&apos;ombre.
                </p>
                <p>
                    Des bénévoles du royaume y ont rangé leurs <strong>grimoires</strong>, matière par matière, du collège
                    jusqu&apos;aux grandes écoles. Au bout de chaque leçon, une <strong>épreuve</strong>. Réussis-la et tu
                    gagnes autant de {PIECES} que ton score, la première fois. Les <strong>examens du maître</strong>,
                    eux, se notent sur vingt, et une copie parfaite rapporte 100 {PIECES}.
                </p>
                <p>
                    Au fond se trouve la <strong>salle des copistes</strong>. On y écrit des <strong>feuillets</strong>,
                    l&apos;essentiel d&apos;une leçon sur une seule page. Chaque feuillet copié rapporte 10 {PIECES}, et
                    chaque lecteur qui le juge utile en ajoute 5, même des mois après, même pendant que tu dors. Ceux qui
                    écrivent un grimoire entier reçoivent 20 {PIECES} par auteur.
                </p>
                <p>Il fait nuit quand vous sortez. Sur les marches, tu lèves ta lanterne pour voir où tu poses les pieds.</p>
                <p className="legende-glow">Tu n&apos;en as plus besoin. Elle éclaire toute la rue.</p>
                <p>Foxy la regarde, puis te regarde.</p>
                <Foxy>— Voilà. C&apos;est comme ça que ça commence.</Foxy>
            </>
        ),
        journal: {
            kind: "registre",
            title: "Registre de la Bibliothèque",
            subtitle: "Entrée de nuit, tenue par le Bibliothécaire",
            content: (
                <ul className="space-y-2.5">
                    <li>
                        Un voyageur, accompagné d&apos;un renard, a passé <strong>trois épreuves</strong> et un examen du
                        maître. Il est resté après la fermeture. Je l&apos;ai laissé faire.
                    </li>
                    <li>
                        Nouveau feuillet en salle des copistes : <em>Les fractions, sans détour</em>. Deux lecteurs
                        l&apos;ont déjà jugé utile.
                    </li>
                    <li>
                        <em>Note à l&apos;intention des combattants :</em> en temps de guerre, une épreuve par jour suffit à ne
                        jamais compter pour zéro.
                    </li>
                </ul>
            ),
        },
    },
    {
        id: "clans",
        kicker: "Chapitre VIII",
        title: "Les bannières du lundi",
        plates: ["clans"],
        wallet: { wyts: 270, braises: 1 },
        body: (
            <>
                <p>Le lundi, le cor sonne sur toute la plaine.</p>
                <p>
                    C&apos;est le jour où les <strong>clans se forment</strong>. Les voyageurs de rang voisin sont
                    rassemblés sous une même bannière, et chaque clan affronte un clan rival pendant{" "}
                    <strong>sept jours</strong>. Personne ne combat plus fort que lui. Le royaume y veille.
                </p>
                <p>
                    On te remet un rôle (<strong>attaquant</strong>, <strong>défenseur</strong> ou{" "}
                    <strong>soigneur</strong>) et une porte à tenir : nord, est ou sud.
                </p>
                <Foxy>
                    — Tu peux monter seul. Mais seul, la Brume te trouve plus vite. En clan, quelqu&apos;un remarque quand
                    ta lanterne baisse.
                </Foxy>
                <p>
                    Le premier soir, une vétérane s&apos;assoit près de toi. Elle a le regard de ceux qui ont perdu des
                    clans entiers.
                </p>
                <p className="legende-line">
                    — Ici, la force ne se mesure pas aux épées. Elle se mesure à{" "}
                    <strong>ce que chacun a gagné de {PIECES} dans la journée</strong>. Le total du clan, c&apos;est sa
                    puissance. Un soldat qui n&apos;a rien gagné aujourd&apos;hui n&apos;existe pas sur le champ de
                    bataille.
                </p>
                <p>Elle tisonne le feu.</p>
                <p className="legende-line">
                    — Et c&apos;est là que la Brume frappe. Elle n&apos;attaque jamais les remparts. Elle attaque les
                    soldats, un par un, le soir. Un clan ne tombe pas sous les coups de l&apos;ennemi. Il tombe parce que
                    trop des siens ont dit <em>demain</em>.
                </p>
            </>
        ),
        journal: {
            kind: "ordre",
            title: "Ordre de guerre",
            subtitle: "Par ordre de la Capitaine, affiché à l'entrée du camp",
            content: (
                <ol className="space-y-2.5">
                    <li>
                        <b>I.</b> Chaque jour de guerre, chacun ramène <strong>au moins un {PIECE}</strong>. Un seul suffit à
                        compter. Zéro, c&apos;est l&apos;absence.
                    </li>
                    <li>
                        <b>II.</b> La Capitaine doit se montrer <strong>chaque jour</strong>. Une seule journée sans gain et le
                        commandement passe au membre le plus actif. Aucune exception, pas même pour moi.
                    </li>
                    <li>
                        <b>III.</b> Le clan qui remporte le plus de journées <strong>monte d&apos;un rang</strong>. Le vaincu
                        descend. Seul son meilleur combattant garde sa place : on ne punit pas celui qui a porté les autres.
                    </li>
                    <li>
                        <b>IV.</b> Les vainqueurs ouvrent des <strong>coffres</strong>, du commun au légendaire, et leur meilleur
                        combattant en reçoit davantage. Les vaincus reçoivent <strong>20 à 120 {PIECES}</strong> selon le rang.
                        Le royaume n&apos;abandonne personne.
                    </li>
                </ol>
            ),
        },
    },
    {
        id: "arene",
        kicker: "Chapitre IX",
        title: "L'arène des compagnons",
        plates: ["arene"],
        wallet: { wyts: 280, braises: 1 },
        body: (
            <>
                <p>
                    Tu n&apos;es plus seul sur la route. D&apos;autres voyageurs sont devenus tes{" "}
                    <strong>compagnons</strong> : tu vois leur niveau, et tu sais, à la petite lueur près de leur nom,
                    lesquels marchent en ce moment même.
                </p>
                <p>
                    Derrière l&apos;auberge, un cercle de sable : l&apos;<strong>arène</strong>. Tu peux y défier un
                    compagnon. Le duel se joue en <strong>3 à 10 énigmes</strong>, quelques secondes pour chacune, et il
                    reste ouvert <strong>48 heures</strong>. Cinq duels à la fois, pas plus.
                </p>
                <p>
                    Personne n&apos;y est jamais blessé. On y gagne de l&apos;expérience, et quelques {PIECES} : 5 pour
                    une victoire, 3 pour un match nul, 1 pour une défaite, et jamais plus de 5 par jour. L&apos;arène sert
                    à s&apos;aiguiser, pas à s&apos;enrichir.
                </p>
                <p>
                    Au fil de la route, des <strong>blasons</strong> apparaissent sur ta cape sans que tu les demandes :
                    première réponse donnée, cent jours de flamme, premier clan victorieux. Il en existe plus de soixante.
                    Certains sont si rares que Foxy lui-même ne les a jamais vus.
                </p>
                <p>
                    Et parfois, des hérauts annoncent un <strong>tournoi</strong> : entre deux dates, celui qui gagne le
                    plus de {PIECES}, ou qui copie le plus de feuillets, l&apos;emporte. Le prix vient de bien au-delà des
                    murs.
                </p>
            </>
        ),
    },
    {
        id: "veilleurs",
        kicker: "Chapitre X",
        title: "Ceux qui veillent",
        plates: ["veilleurs"],
        wallet: { wyts: 320, braises: 1 },
        body: (
            <>
                <p>
                    Il y a dans le royaume des gens qui ne cherchent rien pour eux-mêmes. On les appelle les{" "}
                    <strong>Veilleurs</strong>. Ce sont d&apos;anciens voyageurs qui ont choisi de redescendre pour marcher
                    à côté de ceux qui débutent.
                </p>
                <p>
                    Un Veilleur ne prend que <strong>trois voyageurs</strong> à la fois, rarement plus. Il te confie des tâches, t&apos;aide
                    à fixer un objectif, et te répond en moins de <strong>48 heures</strong>. Chaque tâche accomplie te
                    rapporte 5 {PIECES}, un objectif atteint 10, et tous les quatorze jours, un point d&apos;étape en
                    rapporte 3.
                </p>
                <p>
                    Vous partagez une même flamme, la <strong>flamme du duo</strong>. Elle grandit chaque semaine où vous
                    avancez tous les deux. À 4, 8, 12, 20 et 30 semaines, chacun reçoit 15 {PIECES}.
                </p>
                <p>
                    Plus haut, sur les remparts, vivent les <strong>guetteurs</strong>. Longue-vue à l&apos;œil, ils
                    voient tout venir : les nouveaux sentiers, les méthodes qui marchent avant les grands examens, et la
                    Brume quand elle se rassemble à l&apos;horizon. Ils consignent tout dans leurs chroniques. Beaucoup de
                    voyageurs ne montent jamais les lire. Ce sont souvent les premiers que la Brume emporte.
                </p>
            </>
        ),
        journal: {
            kind: "gazette",
            title: "La Gazette des Remparts",
            subtitle: "Édition de l'aube",
            content: (
                <>
                    <p className="font-serif-display text-xl leading-tight text-[var(--wk-ink)] sm:text-2xl">
                        La Brume s&apos;épaissit avant la saison des examens
                    </p>
                    <p>
                        Nos guetteurs signalent une nette progression de la Brume aux abords des dortoirs, entre 21 h et
                        minuit. Méthode d&apos;approche habituelle : « Tu as le temps », puis « Juste un épisode », puis «
                        Demain ».
                    </p>
                    <div className="grid gap-3 border-t border-[rgba(26,21,18,0.2)] pt-3 text-[13px] sm:grid-cols-2">
                        <p>
                            <strong>Méthode.</strong> Réviser par blocs de 25 minutes : testée par nos guetteurs pendant un
                            mois.
                        </p>
                        <p>
                            <strong>Aperçu.</strong> Une lanterne d&apos;une intensité inhabituelle près de la Bibliothèque.
                            Son porteur voyage avec un vieux renard bien connu des remparts.
                        </p>
                    </div>
                </>
            ),
        },
    },
    {
        id: "mondes",
        kicker: "Chapitre XI",
        title: "De monde en monde",
        wallet: { wyts: 600, braises: 2 },
        body: (
            <>
                <p>La bourse s&apos;alourdit. Le chemin grimpe.</p>
                <p>
                    Chaque palier de {PIECES} t&apos;ouvre un nouveau <strong>rang</strong>, puis un nouveau{" "}
                    <strong>monde</strong>. Celui des <strong>Renards et des Fées</strong>, d&apos;où vient Foxy et où il
                    ne s&apos;attarde pas, puis d&apos;autres, plus loin, plus durs. Les plus obstinés atteignent le{" "}
                    <strong>Prestige</strong>, et peu en reviennent indifférents.
                </p>
                <p>
                    Retiens une chose, elle comptera plus tard : <strong>ton rang se lit dans ta bourse</strong>. Plus
                    elle est pleine, plus tu es fort, et plus les clans qu&apos;on te confie sont redoutables.
                </p>
            </>
        ),
        journal: {
            kind: "carnet",
            title: "Carnet de Foxy",
            subtitle: "Trente-quatrième jour",
            content: (
                <>
                    <p>Nouveau monde aujourd&apos;hui. Le voyageur ne regarde plus le sol. Il regarde la tour.</p>
                    <p>
                        Sa lanterne éclaire le chemin pour nous deux. Je marche derrière, maintenant. Il n&apos;a plus
                        besoin que je passe devant.
                    </p>
                    <p>
                        La Brume est venue ce soir. Je l&apos;ai sentie avant de la voir, ce froid sur la nuque. Elle a
                        murmuré « demain » au voyageur.
                    </p>
                    <p>Il a répondu « non, maintenant ». Il a ouvert son grimoire.</p>
                    <p>La Brume a reculé. Je ne suis pas intervenu. Je n&apos;ai pas eu à le faire.</p>
                </>
            ),
        },
    },
    {
        id: "forge",
        kicker: "Chapitre XII",
        title: `La forge des ${PIERRES}`,
        plates: ["forge", "echoppe"],
        wallet: { wyts: 300, braises: 5 },
        body: (
            <>
                <p>
                    Au pied de la tour, une forge rougeoie sans relâche. Le forgeron est un homme silencieux aux
                    avant-bras couverts de brûlures. Il fond les pièces.
                </p>
                <p>
                    <strong>Cent {PIECES}</strong> jetés au creuset donnent une seule pierre, sombre, fendue, avec un éclat
                    de flamme encore vivant à l&apos;intérieur : une <strong>{PIERRE}</strong>.
                </p>
                <p>
                    Les {PIERRES} ne servent pas à monter. Elles servent à se faire remarquer, et à passer les murs. Juste à
                    côté de la forge, l&apos;<strong>échoppe du tailleur</strong> : une teinture pour ton nom, un cadre
                    animé autour de ton portrait, des parures, des portraits de Foxy. Ce qui s&apos;y achète est à toi pour
                    toujours.
                </p>
                <p>
                    Et devant la porte de la ville attendent les <strong>marchands d&apos;au-delà des murs</strong>. Eux
                    vendent des choses qui existent hors du royaume, et certains n&apos;acceptent que les {PIERRES}.
                </p>
                <p>Le forgeron t&apos;arrête au moment où tu ouvres ta bourse.</p>
                <p className="legende-line">
                    — Une pièce fondue ne revient <strong>jamais</strong>. Et ton rang, il se lit où ?
                </p>
                <p className="legende-line">— Dans ma bourse.</p>
                <p>Il hoche la tête et reprend son marteau.</p>
            </>
        ),
        journal: {
            kind: "forge",
            title: "Registre de la forge",
            subtitle: "Gravé dans le bois de l'établi",
            content: (
                <>
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-[rgba(26,21,18,0.25)]">
                                <th className="py-1.5 font-semibold">Voyageur</th>
                                <th className="py-1.5 font-semibold">{PIECES} fondus</th>
                                <th className="py-1.5 font-semibold">{PIERRES}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-1.5">Le voyageur au renard</td>
                                <td className="py-1.5">300</td>
                                <td className="py-1.5 font-bold">3</td>
                            </tr>
                        </tbody>
                    </table>
                    <ul className="space-y-2">
                        <li>
                            <strong>100 {PIECES} = 1 {PIERRE}</strong>. Aucun retour possible.
                        </li>
                        <li>
                            Garde de quoi tenir ton rang. Ne fonds que le <strong>surplus</strong>.
                        </li>
                        <li>On ne vient pas à la forge sur un coup de tête. On y vient quand on sait ce qu&apos;on veut.</li>
                    </ul>
                </>
            ),
        },
    },
    {
        id: "epilogue",
        kicker: "Épilogue",
        title: "Le trésor",
        wallet: { wyts: 300, braises: 5 },
        body: (
            <>
                <p>
                    Vous atteignez le sommet une nuit sans lune. La flamme est là, immense, et sa chaleur te frappe au
                    visage.
                </p>
                <p>
                    Tu cherches un coffre, une couronne, de l&apos;or. Il n&apos;y a <strong>rien</strong>.
                </p>
                <p>
                    Puis tu t&apos;approches, et tu comprends. Ce n&apos;est pas un feu. Ce sont{" "}
                    <strong>des milliers de flammes</strong> mêlées, celles de tous les voyageurs qui sont montés avant
                    toi. Chaque appel résolu, chaque feuillet copié, chaque soir où quelqu&apos;un a répondu « non,
                    maintenant » à la Brume.
                </p>
                <p>C&apos;est pour ça qu&apos;elle ne s&apos;éteint jamais. Personne ne la protège. Tout le monde la nourrit.</p>
                <p>Tu regardes ta lanterne. Ta flamme a la même couleur.</p>
                <p>
                    Tu te retournes. En bas, le chemin parcouru : les dalles conquises, les voyageurs aidés, ceux qui
                    t&apos;ont tendu la main, tout ce que tu sais aujourd&apos;hui et que tu ignorais hier. Les {PIECES} et
                    les {PIERRES} n&apos;étaient que la trace de tes pas.
                </p>
                <p>
                    Ce que tu étais venu chercher, tu ne l&apos;as pas trouvé en haut. <strong>Tu l&apos;as construit en
                    montant.</strong>
                </p>
                <p>Foxy est resté sur la dernière marche.</p>
                <p className="legende-line">— Tu ne montes pas ?</p>
                <Foxy>— J&apos;y suis déjà allé. Il y a longtemps, un vieux renard m&apos;a attendu à la porte, moi aussi.</Foxy>
                <p>Il fait demi-tour vers l&apos;escalier.</p>
                <p>
                    Alors, la question reste entière : ce soir, quand la Brume viendra murmurer, qu&apos;est-ce que tu vas
                    lui répondre ? Et un jour, peut-être, qui attendras-tu à la porte ?
                </p>
            </>
        ),
        journal: {
            kind: "carnet",
            title: "Carnet de Foxy",
            subtitle: "Dernière page",
            content: (
                <>
                    <p>Il est arrivé en haut. Sa flamme a rejoint les autres.</p>
                    <p>Je ne lui ai pas donné le chemin. Je lui ai seulement évité de le faire seul.</p>
                    <p>Demain, quelqu&apos;un arrivera à la porte avec une bourse vide et le regard au sol.</p>
                    <p>Je retourne m&apos;asseoir sur la borne.</p>
                </>
            ),
        },
    },
];

/* ------------------------------------------------------------------ */
/* La légende de la carte : le seul endroit où le conte rejoint le site */
/* ------------------------------------------------------------------ */

export type KeyEntry = { fiction: string; reel: string; href?: string; external?: boolean };

export const KEY: KeyEntry[] = [
    { fiction: PIECES, reel: "Les points" },
    { fiction: PIERRES, reel: "Les gemmes" },
    { fiction: "La Brume", reel: "La procrastination" },
    { fiction: "Le chemin des jours", reel: "Le chemin de récompenses", href: "/recompenses" },
    { fiction: "Les bêtes et leurs énigmes", reel: "Le quiz du jour" },
    { fiction: "Ton niveau, tes points de vie, ton équipement", reel: "Ton héros" },
    { fiction: "La lanterne", reel: "Ta série de jours d'affilée" },
    { fiction: "Le tableau de l'auberge", reel: "Les quêtes du jour, de la semaine et du mois", href: "/recompenses" },
    { fiction: "Coffres et champignons", reel: "Coffres et boosts" },
    { fiction: "La salle des guildes", reel: "Le forum d'entraide", href: "/forum" },
    { fiction: "Grimoires, épreuves, examens du maître", reel: "Les cours, les quiz et les évaluations", href: "/cours" },
    { fiction: "Les feuillets des copistes", reel: "Les fiches de révision", href: "/fiches" },
    { fiction: "Les bannières du lundi", reel: "La Guerre des Clans", href: "/clan" },
    { fiction: "L'arène et les compagnons", reel: "Les défis entre amis", href: "/amis" },
    { fiction: "Les blasons", reel: "Les badges de ton profil" },
    { fiction: "Les tournois", reel: "Les concours", href: "/recompenses" },
    { fiction: "Les Veilleurs", reel: "Le suivi avec un bénévole", href: "/suivi" },
    { fiction: "Les guetteurs", reel: "Le blog", href: "https://blog.workyt.fr", external: true },
    { fiction: "Les mondes et les rangs", reel: "Ta progression", href: "/progression" },
    { fiction: "La forge et l'échoppe", reel: "La conversion et la boutique de gemmes", href: "/gems" },
    { fiction: "Les marchands d'au-delà des murs", reel: "Les offres partenaires", href: "/partenaires" },
];
