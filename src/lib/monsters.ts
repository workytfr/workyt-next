/**
 * Bestiaire du RPG « Workyt Quest ».
 * Les monstres sont générés de façon DÉTERMINISTE par date (même technique
 * que calendarService : sin(dateHash)) — jamais stockés en base.
 *
 * Chaque monstre a 4 types de répliques :
 * - taunts      : provocations avant le combat
 * - mockQuotes  : moqueries quand le héros se trompe de réponse
 * - defeatQuotes: phrases quand il est vaincu
 * - critQuotes  : réaction au coup critique
 */

export interface MonsterDef {
  id: string;
  name: string;
  emoji: string;
  taunts: string[];
  mockQuotes: string[];
  defeatQuotes: string[];
  critQuotes: string[];
}

export interface DailyMonster extends MonsterDef {
  hp: number;
  attack: number;
  isBoss: boolean;
  sleeping: boolean; // true si aucun quiz publié ce jour (victoire gratuite)
  power: 'poison' | 'brutal' | null; // Pouvoir spécial du monstre
  powerLabel: string | null; // Libellé affiché (ex. « 🧪 Empoisonneur »)
}

const GENERIC_MONSTERS: MonsterDef[] = [
  {
    id: 'slime',
    name: 'Slime Distrait',
    emoji: '🟢',
    taunts: [
      'Bloup bloup... Tu veux VRAIMENT me combattre ?',
      'J\'ai mangé tes devoirs. Ils étaient fades.',
      'Même ma grand-mère répond plus vite que toi !',
      'Je suis 90% eau, 10% mauvaise foi.',
      'Hier j\'ai battu un escargot. Mon record est impressionnant.',
      'Tu révises avec quel manuel ? Celui des perdants ?'
    ],
    mockQuotes: [
      'Bloup ! Raté ! Même en gluant je vois que c\'est faux !',
      'HA ! Mon petit doigt gélatineux le savait !',
      'Tu fais exprès ? Dis-moi que tu fais exprès.',
      'C\'est pas comme ça qu\'on devient un héros, bloup.',
      'Je te donne un indice : c\'est pas celle-là. Gratuit. De rien.'
    ],
    defeatQuotes: [
      'Bloup... je redeviens une flaque...',
      'Tu m\'as eu... dis à mes petits slimes que je les aimais...',
      'Je savais que j\'aurais dû rester dans ma mare...',
      'Éclaboussé par la connaissance... quel destin...'
    ],
    critQuotes: ['AÏE ! En plein dans le bloup !', 'Critique ?! Mais c\'est de la triche !', 'Je suis transpercé de SAVOIR !']
  },
  {
    id: 'goblin',
    name: 'Gobelin Frimeur',
    emoji: '👺',
    taunts: [
      'T\'as vu mes muscles ? Non ? Regarde mieux.',
      'J\'ai volé 3 trousses ce matin. La tienne est la prochaine !',
      'Un QCM ? Même pas peur, j\'ai eu 8/20 en maths !',
      'Ma tatouage dit "force". Elle est au feutre. Elle tient 2 jours.',
      'J\'ai un abonnement à la salle. J\'y suis allé une fois. Pour voler des serviettes.',
      'T\'es le héros ? T\'es sûr ? T\'es petit pour un héros.'
    ],
    mockQuotes: [
      'MOUHAHA ! Ma grand-mère gobeline aurait trouvé !',
      'Raté ! Je note ça dans mon carnet de moqueries.',
      'T\'as répondu avec tes pieds ou quoi ?',
      'Encore une comme ça et je t\'offre un trophée de la lose.',
      'C\'est ça le niveau des héros de nos jours ? Pff.'
    ],
    defeatQuotes: [
      'OK OK je rends la trousse !',
      'Maman gobeline va pas être contente...',
      'Ma frimousse... mon seul bien... brisée...',
      'Je reviendrai ! Avec des muscles plus gros ! Enfin, dessinés plus gros.'
    ],
    critQuotes: ['Mes frimouscles !!', 'Aïe ! Direct dans l\'ego !', 'Ma tatouage au feutre coule de douleur !']
  },
  {
    id: 'skeleton',
    name: 'Squelette Sarcastique',
    emoji: '💀',
    taunts: [
      'J\'ai un os à régler avec toi.',
      'Tu sais pourquoi je n\'ai pas peur ? J\'ai déjà tout perdu. Sauf mon humour.',
      'Ta réponse sera-t-elle aussi solide que mes os ? Spoiler : non.',
      'Je n\'ai pas de cerveau, et pourtant je sens que je vais gagner.',
      'Dans mon ancienne vie, j\'étais prof. Le pire cauchemar des élèves.',
      'J\'ai le temps. Je suis mort depuis 300 ans. Toi tu as un contrôle demain.'
    ],
    mockQuotes: [
      'Clac clac clac ! C\'est le bruit de mes os qui rient.',
      'Faux. Et je dis ça sans même avoir de langue.',
      'Même mon fémur aurait trouvé la réponse.',
      'Tu creuses ta tombe académique, petit.',
      'Oh non. Oh non non non. C\'était vraiment ton choix ?'
    ],
    defeatQuotes: [
      'Je tombe... en morceaux. Littéralement.',
      'Bien joué. J\'en perds mes os.',
      'Ramasse mes os, ils valent cher sur le marché noir.',
      'De la poussière à la poussière... avec style.'
    ],
    critQuotes: ['Mes côtes ! Elles étaient neuves !', 'En plein dans le fémur !', 'CRAC ! Même pas mort que je le sens !']
  },
  {
    id: 'bat',
    name: 'Chauve-Souris Vantarde',
    emoji: '🦇',
    taunts: [
      'Je vois dans le noir, mais même moi je ne vois pas ta victoire.',
      'Pss pss ! C\'est mon cri de guerre. Impressionnant, non ?',
      'J\'ai survolé 3 cimetières pour en arriver là. Respecte.',
      'Je dors la tête en bas. Comme tes notes si tu perds.',
      'Mon sonar détecte les mauvaises réponses. Il BIP TRÈS FORT près de toi.',
      'Dracula est mon cousin. Enfin, mon voisin de grotte. Enfin, je l\'ai vu une fois.'
    ],
    mockQuotes: [
      'BIP BIP BIP ! Mon sonar anti-erreur explose !',
      'Raté ! Et moi qui volais si haut pour toi...',
      'Je vais raconter celle-là à toute la grotte.',
      'Même à l\'envers, je voyais que c\'était faux.',
      'Tu veux que je te guide avec mon sonar ? Ça coûte 3 mouches.'
    ],
    defeatQuotes: [
      'Je retourne dans ma grotte... pour toujours... enfin presque.',
      'Ma sonar-réputation est ruinée !',
      'Je m\'écrase... avec élégance tout de même.',
      'Dis à Dracula... que j\'ai essayé...'
    ],
    critQuotes: ['Mon aile ! Tu l\'as fait exprès !', 'Un écho de douleur !', 'Ma sonar-fierté est anéantie !']
  },
  {
    id: 'mushroom_evil',
    name: 'Champignon Toxique',
    emoji: '🍄',
    taunts: [
      'Ne me mange pas. Sérieux. Mauvaise idée.',
      'Je suis le cousin maléfique de tes potions. Gênant, hein ?',
      'Mes spores font dormir... comme tes cours de 8h.',
      'Je pousse dans l\'ombre. Comme ta moyenne si tu perds.',
      'On m\'appelle "l\'Amanite Tue-Notes". Joli surnom, non ?',
      'Un jour je serai dans une soupe. Mais PAS AUJOURD\'HUI.'
    ],
    mockQuotes: [
      'Mes spores de confusion fonctionnent à merveille !',
      'Faux ! Respire un coup de mes spores, ça ira pas mieux.',
      'Tu confonds avec le champignon des réponses ?',
      'Pfiou, même un mycélium aurait trouvé.',
      'Je te maudis : ton prochain contrôle aura une question piège.'
    ],
    defeatQuotes: [
      'Cueilli... comme un vulgaire champignon de Paris...',
      'Je retourne au compost...',
      'Mes spores... ne me protégeront plus...',
      'Finis dans une poêle... quel destin funeste... et délicieux.'
    ],
    critQuotes: ['Mon chapeau !!', 'Sporcifère !!', 'En plein dans le pied !']
  },
  {
    id: 'ghost',
    name: 'Fantôme Râleur',
    emoji: '👻',
    taunts: [
      'Bouh ! ...Non ? Rien ? Pff, plus personne n\'a peur de rien.',
      'Je hante ce donjon depuis toujours et j\'en ai MARRE du service clients.',
      'Je traverse les murs. Sauf celui de tes lacunes, il est trop solide.',
      'Avant, j\'effrayais des chevaliers. Maintenant, des collégiens. La déchéance.',
      'Tu vois cette chaîne ? C\'est du décor. En vrai je suis freelance.'
    ],
    mockQuotes: [
      'BOUH ! Raté ! Enfin... tant pis, je le faisais quand même.',
      'Même mort, je réponds mieux que toi.',
      'Je vais hanter tes cauchemars avec cette erreur.',
      'C\'est faux, et je dis ça en lévitant, donc avec autorité.',
      'Cling cling ! C\'est le bruit de ma chaîne de la moquerie.'
    ],
    defeatQuotes: [
      'Je disparaîîîs... encore...',
      'Libéré de ma chaîne ! En fait elle me manquait déjà.',
      'Je retourne dans l\'au-delà... il paraît que le wifi y est nul.'
    ],
    critQuotes: ['Transpercé ! Déjà que je suis transparent !', 'OUIN ! Le savoir me traverse !']
  }
];

const BOSS_MONSTERS: MonsterDef[] = [
  {
    id: 'dragon',
    name: 'Dragon Procrastinateur',
    emoji: '🐉',
    taunts: [
      'Je devais détruire ce donjon... mais j\'ai repoussé à demain. Toi aussi tu procrastines ?',
      'MORTEL ! ...Pardon, je crie quand je suis content.',
      'J\'ai brûlé 100 héros. Enfin, 3. Enfin, j\'ai brûlé un marshmallow géant.',
      'C\'est le 15 du mois. Mon jour de gloire. J\'ai prévu un discours de 45 minutes.',
      'Je suis un BOSS. J\'ai une carte de visite et tout. "Dragon. Brûlage de trucs."',
      'J\'ai fait une liste de choses à faire : 1. Détruire un héros. Voilà, c\'est tout.'
    ],
    mockQuotes: [
      'HAHAHA ! Mon souffle rigole tout seul !',
      'Raté ! Tu veux que je repousse le combat à demain ? Non ? Dommage.',
      'Même en dormant, mes griffes répondent mieux.',
      'C\'est ça ton attaque spéciale ? Un mauvais choix ?',
      'Je note ton erreur dans mon journal intime. Chapitre 47.'
    ],
    defeatQuotes: [
      'Le boss... vaincu ?! Je vais me faire virer du syndicat des dragons...',
      'GG. Sérieux. GG.',
      'Ma procrastination m\'a perdu... j\'aurais dû m\'y prendre plus tôt...',
      'Rendez-moi à ma grotte, j\'ai une sieste à rattraper.'
    ],
    critQuotes: ['MES ÉCAILLES ! Assurées jusqu\'au 15 du mois !', 'Un critique ?! Sur LE boss ?!', 'MON CORNICHON DE TROPHÉE ! Enfin mon trophée !']
  }
];

const THEME_MONSTERS: Record<string, MonsterDef[]> = {
  christmas: [
    {
      id: 'snowman',
      name: 'Bonhomme de Neige Grincheux',
      emoji: '⛄',
      taunts: [
        'Je fonds lentement, et pourtant j\'ai plus de cran que toi.',
        'Noël est annulé. C\'est moi qui décide.',
        'Tu veux un cadeau ? Tiens : une mauvaise réponse. De rien.',
        'Je suis fait de 3 boules de neige et d\'1 boule de mauvaise humeur.',
        'Le Père Noël m\'a mis sur la liste des méchants. J\'en suis fier.'
      ],
      mockQuotes: [
        'Raté ! Ça me réchauffe le cœur. Enfin, ça me fait fondre un peu.',
        'Froid comme mes réponses, faux comme les tiennes.',
        'HO HO HO ! ...C\'est mon rire de méchant. Original, je sais.',
        'Même mon nez en carotte aurait trouvé.'
      ],
      defeatQuotes: [
        'Je fonds... d\'admiration...',
        'Dis au Père Noël... que je reviendrai l\'an prochain...',
        'De la neige j\'étais, à la flaque je retourne...'
      ],
      critQuotes: ['Ma carotte de nez !!', 'En pleine boule de neige !', 'Tu viens de casser mon record de fonte !']
    },
    {
      id: 'evil_reindeer',
      name: 'Renne Rebelle',
      emoji: '🦌',
      taunts: [
        'J\'en ai marre de tirer le traîneau. C\'est MOI le patron maintenant.',
        'Rudolph ? Un pistonné. Moi je suis un self-made renne.',
        'Mes bois sont certifiés 100% mauvaise humeur.',
        'Le Pôle Nord, c\'est fini. Je crée ma start-up : Renne & Vengeance SARL.'
      ],
      mockQuotes: [
        'Raté ! Je galope sur ta défaite !',
        'Même en tirant un traîneau, je réponds mieux.',
        'Ho ! Ho ! ...Attends, c\'est pas mon rire ça.',
        'Tes réponses sont comme le Pôle Sud : hors sujet.'
      ],
      defeatQuotes: [
        'OK, je retourne tirer le traîneau...',
        'Mes bois !! Mon capital sympathie !!',
        'Le syndicat des rennes va me radier...'
      ],
      critQuotes: ['Direct dans les bois !', 'Même le Père Noël ne frappe pas comme ça !', 'Mon sabot porte-malheur !']
    },
    {
      id: 'krampus_mini',
      name: 'P’tit Krampus',
      emoji: '😈',
      taunts: [
        'Je punis les enfants sages. Toi t\'as l\'air d\'un récidiviste.',
        'Mon père est le Krampus. Moi c\'est le Krampus Junior. Respecte la marque.',
        'T\'as été sage cette année ? Ta réponse m\'intéresse.'
      ],
      mockQuotes: [
        'CHARBON ! Voilà ce que tu mérites !',
        'Raté ! Dans ma liste des TRÈS méchants maintenant.',
        'Mon fouet à charbon frétille de joie !'
      ],
      defeatQuotes: ['Papa Krampus ! À l\'aide !', 'Je dis à mon père ! Tu es prévenu !'],
      critQuotes: ['Mes petites cornes !!', 'PAPAAAA !']
    }
  ],
  newyear: [
    {
      id: 'champagne_evil',
      name: 'Bouteille Possédée',
      emoji: '🍾',
      taunts: [
        'Je vais sauter ! Comme tes résolutions : ça part vite et ça finit mal.',
        'Millésime 1800, année de ma malédiction. Un grand cru de méchanceté.',
        'PSCHHHHT ! C\'est le bruit de ta défaite.'
      ],
      mockQuotes: [
        'Raté ! Trinquons à ça !',
        'Tu bulles n\'importe comment, comme moi.',
        'C\'était censé être quoi ? Un bouchon de réponse ?'
      ],
      defeatQuotes: ['Je suis... éventée...', 'Verse-moi dans la tombe... cul sec.'],
      critQuotes: ['Mon bouchon !!', 'Éclatée en mille bulles !']
    },
    {
      id: 'firework_rogue',
      name: 'Feu d’Artifice Fou',
      emoji: '🎆',
      taunts: [
        'Je vais exploser de gloire ! Toi tu vas exploser tout court.',
        'On m\'a tiré une fois en 1999. J\'attends ma revanche depuis.',
        'TIC TIC TIC... c\'est ma mèche. Ou ton stress ?'
      ],
      mockQuotes: [
        'Boum ! Raté ! Quel feu d\'artifice de l\'échec !',
        'Ta réponse est partie en fumée !',
        'Même mouillé, je pétillerais mieux que toi.'
      ],
      defeatQuotes: ['Je retombe... en cendres...', 'Mon grand final... gâché...'],
      critQuotes: ['MA MÈCHE !!', 'Explosé en plein vol !']
    }
  ],
  chinese_newyear: [
    {
      id: 'nian',
      name: 'Nian Capricieux',
      emoji: '🦁',
      taunts: [
        'GROAR ! ...Attends, laisse-moi finir ma sieste d\'abord.',
        'Je ne crains ni le rouge ni les pétards. Enfin si. Ne le dis à personne.',
        'Une fois par an je sors de ma montagne. C\'est pour TOI cette année.',
        'J\'ai faim de victoire. Et de raviolis. Surtout de raviolis.'
      ],
      mockQuotes: [
        'GROAR ! C\'est mon rire aussi, pratique.',
        'Raté ! Même la lanterne éteinte l\'aurait trouvé !',
        'Ton enveloppe rouge contient zéro bonne réponse.',
        'Mon horoscope disait : "un héros se trompera aujourd\'hui". Précis.'
      ],
      defeatQuotes: [
        'Je reviendrai l\'année prochaine... peut-être...',
        'Vaincu par un étudiant ?! Le déshonneur !',
        'Retour à ma montagne... avec mes raviolis de la honte.'
      ],
      critQuotes: ['Ma crinière !!', 'Même les pétards font moins mal !', 'Ma queue de lion !']
    },
    {
      id: 'lantern_ghost',
      name: 'Lanterne Possédée',
      emoji: '🏮',
      taunts: [
        'J\'éclaire le chemin... vers ta défaite.',
        'Suspendue au plafond du donjon, j\'ai tout vu. Même tes triches.',
        'Je suis rouge de colère. Enfin, rouge tout court.'
      ],
      mockQuotes: [
        'Raté ! Ma lumière vacille de rire !',
        'Même éteinte, je brille plus que tes réponses.',
        'Ton avenir est sombre. Moi je suis lanterne, je m\'y connais.'
      ],
      defeatQuotes: ['Je m\'éteins... pof...', 'Ma flamme... soufflée par le savoir...'],
      critQuotes: ['Mon papier de soie !!', 'Crevée ! Comme un ballon !']
    }
  ],
  eastern: [
    {
      id: 'genie',
      name: 'Génie Capricieux',
      emoji: '🧞',
      taunts: [
        'Tu as 3 vœux. Moi j\'en ai un : te voir perdre.',
        'Je sors de ma lampe après 1000 ans et je tombe sur TOI ?',
        'Attention : tes vœux seront exaucés... au premier degré. Toujours dangereux.',
        'J\'ai exaucé des sultans. Toi tu veux quoi ? Un 20/20 ? Trop ambitieux.'
      ],
      mockQuotes: [
        'Vœu exaucé : tu t\'es trompé ! De rien.',
        'Même ma lampe en laiton aurait trouvé !',
        'Tu veux un indice ? C\'est un vœu, et je refuse.',
        'Par la barbe du sable ! Quelle erreur !'
      ],
      defeatQuotes: [
        'Retour dans ma lampe... pour 1000 ans de plus...',
        'Tu es un maître cruel mais juste...',
        'Je t\'accorde ma défaite. C\'est cadeau.'
      ],
      critQuotes: ['Ma fumée bleue !!', 'En plein dans la lampe !']
    },
    {
      id: 'snake_charmer',
      name: 'Cobra Charmeur',
      emoji: '🐍',
      taunts: [
        'Sssssalut. Moi c\'est l\'hypnose, toi c\'est la sieste.',
        'Je danse au son de la flûte. Toi tu danses sur de fausses réponses.',
        'Mon venin est intellectuel : il paralyse les neurones.'
      ],
      mockQuotes: [
        'SSSS ! Raté ! Mon venin fait effet !',
        'Tes réponses rampent, moi je frappe !',
        'Même sans pattes, je cours plus vite que ton cerveau.'
      ],
      defeatQuotes: ['Je me ratatine... ssss...', 'Charmé... par ta réponse...'],
      critQuotes: ['Mes écaillessss !!', 'En plein dans le sssss !']
    }
  ],
  indian: [
    {
      id: 'royal_elephant',
      name: 'Éléphant Grincheux',
      emoji: '🐘',
      taunts: [
        'Je n\'oublie JAMAIS. Surtout tes mauvaises réponses.',
        'Je porte un maharaja. Toi tu portes tes lacunes. On est pas égaux.',
        'Ma trompe a voté : elle est contre toi.'
      ],
      mockQuotes: [
        'BARRIT ! C\'est mon rire. Raté !',
        'Ma mémoire d\'éléphant se souviendra de CET échec.',
        'Même mon défense d\'ivoire aurait trouvé !'
      ],
      defeatQuotes: ['Je plie les genoux... avec dignité...', 'Ma trompe se dégonfle de honte...'],
      critQuotes: ['Mon défense ! Enfin, MA défense !', 'Piétiné par la connaissance !']
    },
    {
      id: 'diya_spirit',
      name: 'Esprit de la Lampe',
      emoji: '🪔',
      taunts: [
        'Je suis la lumière de Diwali. Toi t\'es plutôt l\'ampoule grillée.',
        'Mille lumières brillent pour moi. Zéro pour ta réponse.',
        'Je danse entre les flammes. Attention, ça brûle.'
      ],
      mockQuotes: [
        'Raté ! Ma flamme vacille de rire !',
        'Même éteinte, j\'éclaire mieux que ton raisonnement.',
        'Tes réponses manquent d\'huile, petit.'
      ],
      defeatQuotes: ['Je m\'éteins... doucement...', 'Ma lumière rejoint le ciel de Diwali...'],
      critQuotes: ['Mon mèche ! Enfin, MA mèche !', 'Soufflée par le génie !']
    }
  ],
  japanese: [
    {
      id: 'tanuki',
      name: 'Tanuki Farceur',
      emoji: '🦝',
      taunts: [
        'Devine dans quelle feuille je me cache. Spoiler : tu as tort.',
        'Transformé en statue, j\'ai gagné 3 concours. De beauté.',
        'Je me suis transformé en toi une fois. Tout le monde a remarqué : je répondais juste.',
        'Ma queue est magique. Tes réponses, moins.'
      ],
      mockQuotes: [
        'Raté ! Transformation en taupe qui rit !',
        'Même déguisé en lampe, j\'aurais trouvé !',
        'C\'est toi le tanuki ou c\'est moi ? Parce que tu te déguises mal en héros.',
        'Pon ! Mauvaise réponse ! (C\'est mon cri : pon.)'
      ],
      defeatQuotes: [
        'Transformation... annulée...',
        'Tu as percé mon camouflage légendaire !',
        'Je reprends ma forme de perdant...'
      ],
      critQuotes: ['Ma queue n\'est PAS une cible !', 'En plein dans la feuille !', 'PON ! Ça fait mal, pon !']
    },
    {
      id: 'kappa',
      name: 'Kappa Taquin',
      emoji: '🥒',
      taunts: [
        'Donne-moi un concombre et j\'envisage de t\'épargner.',
        'Mon assiette sur la tête ? C\'est de la haute couture aquatique.',
        'Je vis dans la rivière mais mes vannes sont bien trempées.'
      ],
      mockQuotes: [
        'Raté ! Ça vaut pas même un concombre !',
        'Blub blub ! C\'est moi qui ris sous l\'eau.',
        'Même mon assiette vide aurait trouvé !'
      ],
      defeatQuotes: ['Je replonge... avec un concombre pour la route...', 'Mon assiette... fêlée...'],
      critQuotes: ['MON ASSIETTE !!', 'En plein dans le concombre !']
    }
  ],
  canadian: [
    {
      id: 'beaver_boss',
      name: 'Castor Bûcheron',
      emoji: '🦫',
      taunts: [
        'Je rase des forêts entières. Toi, je te rase en 30 secondes.',
        'Mon barrage est le meilleur du Canada. Ma méchanceté aussi.',
        'Tu veux du sirop d\'érable ? T\'en auras pas. Na.'
      ],
      mockQuotes: [
        'Raté ! J\'abats ta réponse comme un érable !',
        'Mes dents sont plus affûtées que ton esprit.',
        'Même ma queue plate aurait trouvé !'
      ],
      defeatQuotes: ['Mon barrage... détruit...', 'Je retourne à ma hutte... ronger mon frein...'],
      critQuotes: ['Mes incisives !!', 'En plein dans le barrage !']
    },
    {
      id: 'hockey_goon',
      name: 'Hockeyeur Bagarreur',
      emoji: '🏒',
      taunts: [
        '5 minutes de pénalité ? Je les fais en 2, moi.',
        'Mon palet est ta défaite. Ça va shooter sec.',
        'J\'ai été expulsé de la ligue pour excès de méchanceté. Une fierté.'
      ],
      mockQuotes: [
        'BUT ! Enfin... raté pour toi, but pour moi !',
        'Ta réponse est partie dans les gradins !',
        'Même avec une crosse cassée, je marque mieux que toi.'
      ],
      defeatQuotes: ['Je file au banc des pénalités... à jamais...', 'Mon casque... cabossé...'],
      critQuotes: ['Ma crosse !!', 'Direct dans le palet !']
    }
  ],
  french_civil: [
    {
      id: 'baguette_warrior',
      name: 'Baguette de Combat',
      emoji: '🥖',
      taunts: [
        'Croustillante dehors, impitoyable dedans.',
        'Je suis sortie du four avec un seul but : te battre.',
        'Tradition française : te battre à la baguette. Littéralement.'
      ],
      mockQuotes: [
        'Raté ! Tu es mou comme une vieille baguette !',
        'Même rassie, je réponds mieux que toi.',
        'Ta réponse manque de croûte !'
      ],
      defeatQuotes: ['Je me casse... en deux...', 'Réduite en chapelure...'],
      critQuotes: ['Ma croûte !!', 'Coupée en rondelles !']
    },
    {
      id: 'rooster_general',
      name: 'Général Coq',
      emoji: '🐓',
      taunts: [
        'COCORICO ! C\'est mon ordre de charge !',
        'Je chante à l\'aube. Ta défaite, je la chante à toute heure.',
        'Mes ergots ont conquis mille basse-cours.'
      ],
      mockQuotes: [
        'COT COT COT ! Raté ! Je le chante sur tous les toits !',
        'Même ma poule aurait trouvé ! Et elle est pas futée.',
        'Ta réponse vaut un grain de maïs. Pas plus.'
      ],
      defeatQuotes: ['Je retourne au poulailler... la tête basse...', 'Mon cocorico... étouffé...'],
      critQuotes: ['Ma crête !!', 'En plein ergot !']
    }
  ],
  french_cultural: [
    {
      id: 'evil_mime',
      name: 'Mime Maléfique',
      emoji: '🎭',
      taunts: [
        '... (Il te provoque en silence. C\'est très irritant.)',
        '... (Il mime une boîte. Tu es DANS la boîte. De sa méchanceté.)',
        '... (Il mime ta défaite. Il est très bon, malheureusement.)'
      ],
      mockQuotes: [
        '... (Il rit silencieusement. C\'est pire qu\'un vrai rire.)',
        '... (Il mime ta mauvaise réponse avec une précision blessante.)',
        '... (Il applaudit lentement. Ironiquement.)'
      ],
      defeatQuotes: ['... (Il mime sa propre mort. Standing ovation.)', '... (Silence de défaite.)'],
      critQuotes: ['... !!! (Il mime une douleur intense.)', '... (Il s\'effondre en silence.)']
    },
    {
      id: 'chef_critique',
      name: 'Chef Ultra-Critique',
      emoji: '👨‍🍳',
      taunts: [
        'Ta réponse, je la goûte ? Même pas pour un guide Michelin.',
        'J\'ai 3 étoiles. Toi tu as 3 neurones. Fais le compte.',
        'Ma cuisine est un art. Ta culture est un brouillon.'
      ],
      mockQuotes: [
        'FADE ! INSIPIDE ! RATÉ !',
        'Cette réponse, même mon chien la refuse.',
        'Je te renvoie en cuisine refaire tes fondamentaux !'
      ],
      defeatQuotes: ['Je rends mon tablier...', 'Ma toque... s\'affaisse...'],
      critQuotes: ['MA TOQUE !!', 'Flambé ! Comme une crêpe Suzette !']
    }
  ]
};

function hashDate(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Génère le monstre d'un jour donné, de façon déterministe.
 * @param dateStr Date au format 'YYYY-MM-DD'
 * @param theme Thème saisonnier dominant du mois
 * @param heroLevel Niveau du héros (léger scaling)
 * @param sleeping Aucun quiz publié ce jour → monstre endormi (victoire gratuite)
 */
export function getMonsterForDate(
  dateStr: string,
  theme: string = 'default',
  heroLevel: number = 1,
  sleeping: boolean = false
): DailyMonster {
  const seed = hashDate(dateStr);
  const dayOfMonth = parseInt(dateStr.slice(8, 10), 10);
  const weekIndex = Math.floor((dayOfMonth - 1) / 7); // 0..4
  const isBoss = dayOfMonth === 15;

  // Pool : monstres du thème + génériques (le boss vient toujours du pool boss)
  const themePool = THEME_MONSTERS[theme] || [];
  const pool = isBoss ? BOSS_MONSTERS : [...themePool, ...GENERIC_MONSTERS];
  const base = pool[Math.floor(pseudoRandom(seed) * pool.length) % pool.length];

  // Scaling par intention : on ne règle pas des constantes, on décide
  // COMBIEN D'ERREURS le héros encaisse avant de tomber, et on en déduit
  // l'attaque. Sans ça, les +4 PV/niveau écrasent la montée en dégâts et le
  // jeu devient 3× plus facile en montant en niveau (c'était le cas avant).
  //
  // Tolérance de base : 3 erreurs au début, 1,5 à haut niveau.
  //   niv 1-9 → 3 · 10-19 → 2,5 · 20-29 → 2 · 30+ → 1,5
  // Puis le mois se durcit (-0,25/semaine) et le boss coûte une erreur de plus.
  const levelHits = Math.max(1.5, 3 - Math.floor(heroLevel / 10) * 0.5);
  const targetHits = isBoss
    ? Math.max(1, levelHits - 1)
    : Math.max(1, levelHits - weekIndex * 0.25);

  const heroHpMax = 20 + 4 * heroLevel;
  const heroDef = 1 + Math.floor(heroLevel / 2);

  const hp = (isBoss ? 30 : 10) + weekIndex * 5 + Math.floor(heroLevel * 1.5);
  const baseAttack = Math.round(heroHpMax / targetHits) + heroDef;

  // Variance d'attaque déterministe ±15% : deux monstres du même type ne frappent pas pareil
  const variance = 0.85 + pseudoRandom(seed + 55) * 0.3;
  const attack = Math.max(1, Math.round(baseAttack * variance));

  // Pouvoir spécial déterministe : 30% poison, 20% brutal, 50% aucun (boss : toujours un pouvoir)
  const powerRoll = pseudoRandom(seed + 77);
  let power: DailyMonster['power'] = null;
  let powerLabel: string | null = null;
  if (isBoss) {
    power = powerRoll < 0.5 ? 'poison' : 'brutal';
  } else if (powerRoll < 0.3) {
    power = 'poison';
  } else if (powerRoll < 0.5) {
    power = 'brutal';
  }
  if (power === 'poison') powerLabel = '🧪 Empoisonneur (+2 dégâts)';
  if (power === 'brutal') powerLabel = '🔥 Brutal (critique 35%)';

  return {
    ...base, // toutes les répliques complètes (l'UI choisit celles à afficher)
    hp,
    attack,
    isBoss,
    sleeping,
    power,
    powerLabel
  };
}

/** Répliques du héros / narrateur pour le BattleModal */
export const BATTLE_NARRATION = {
  heroVictory: [
    'Encore un monstre de moins dans le donjon !',
    'La connaissance est ta meilleure épée. ⚔️',
    'Victoire ! Le donjon tremble devant toi.',
    'Ce monstre racontera ta légende à ses petits-enfants.',
    'Les autres monstres chuchotent déjà ton nom...',
    'KO académique ! Propre et sans bavure.'
  ],
  heroDefeat: [
    'Aïe... le monstre riposte ! Réessaie, tu peux le faire !',
    'Touché ! Mais un vrai héros se relève toujours.',
    'Le monstre ricane... Fais-le taire avec la bonne réponse !',
    'Ça pique, mais ton armure de connaissances tient bon !',
    'Un faux pas n\'arrête pas une légende !'
  ],
  sleeping: [
    'Le monstre d\'aujourd\'hui ronfle paisiblement... victoire gratuite ! 😴'
  ],
  fainted: [
    'Ton héros est évanoui ! Utilise un champignon pour le ranimer 💫'
  ]
};
