import { NextResponse } from 'next/server';

/**
 * GET /api/curriculum/levels
 * Retourne la configuration complète des niveaux scolaires et supérieurs
 * Inclut tous les cycles, filières, spécialités et options
 */

const LEVELS_CONFIG = {
    cycle3: {
        label: 'Cycle 3',
        levels: [
            { value: '6eme', label: '6ème' },
        ],
        subjects: [
            'mathematiques', 'francais', 'histoire-geographie',
            'sciences-et-technologie', 'langues-vivantes',
            'arts-plastiques', 'education-musicale', 'eps',
        ],
    },
    cycle4: {
        label: 'Cycle 4',
        levels: [
            { value: '5eme', label: '5ème' },
            { value: '4eme', label: '4ème' },
            { value: '3eme', label: '3ème' },
        ],
        subjects: [
            'mathematiques', 'francais', 'histoire-geographie',
            'physique-chimie', 'svt', 'technologie',
            'langues-vivantes', 'arts-plastiques',
            'education-musicale', 'eps',
        ],
    },
    lycee: {
        label: 'Lycée',
        levels: [
            { value: '2nde', label: 'Seconde' },
            { value: '1ere', label: 'Première' },
            { value: 'terminale', label: 'Terminale' },
        ],
        tracks: [
            { value: 'generale', label: 'Générale' },
            { value: 'technologique', label: 'Technologique' },
            { value: 'professionnelle', label: 'Professionnelle' },
        ],
        // Tronc commun 2nde
        commonSubjects: [
            'mathematiques', 'francais', 'histoire-geographie',
            'physique-chimie', 'svt', 'ses',
            'langues-vivantes', 'eps', 'enseignement-scientifique',
            'emc', 'numerique-et-sciences-informatiques',
        ],
        // Spécialités 1ère/Term générale
        specialities: [
            { value: 'mathematiques', label: 'Mathématiques' },
            { value: 'physique-chimie', label: 'Physique-Chimie' },
            { value: 'svt', label: 'Sciences de la Vie et de la Terre' },
            { value: 'nsi', label: 'Numérique et Sciences Informatiques' },
            { value: 'ses', label: 'Sciences Économiques et Sociales' },
            { value: 'hggsp', label: 'Histoire-Géographie, Géopolitique et SP' },
            { value: 'llce', label: 'Langues, Littératures et Cultures Étrangères' },
            { value: 'humanites-litterature-philosophie', label: 'Humanités, Littérature et Philosophie' },
            { value: 'arts', label: 'Arts' },
            { value: 'biologie-ecologie', label: 'Biologie-Écologie' },
            { value: 'sciences-ingenieur', label: 'Sciences de l\'Ingénieur' },
            { value: 'langues-signes-francaises', label: 'Langues des Signes Françaises' },
            { value: 'langue-culture-anciennes', label: 'Langue et Culture des Antiques' },
        ],
        // Filières technologiques
        techTracks: [
            { value: 'sti2d', label: 'STI2D (Sciences et Technologies de l\'Industrie et du Développement Durable)' },
            { value: 'stl', label: 'STL (Sciences et Technologies de Laboratoire)' },
            { value: 'std2a', label: 'STD2A (Sciences et Technologies du Design et des Arts Appliqués)' },
            { value: 'stmg', label: 'STMG (Sciences et Technologies du Management et de la Gestion)' },
            { value: 'st2s', label: 'ST2S (Sciences et Technologies de la Santé et du Social)' },
            { value: 's2tmd', label: 'S2TMD (Sciences et Techniques du Théâtre, de la Musique et de la Danse)' },
            { value: 'sth', label: 'STH (Sciences et Technologies de l\'Hôtellerie)' },
        ],
        // Filières professionnelles (exemples principaux)
        proTracks: [
            { value: 'bac-pro-industriel', label: 'Bac Pro Industriel (Mécanique, Électrotechnique...)' },
            { value: 'bac-pro-tertiaire', label: 'Bac Pro Tertiaire (Gestion, Commerce...)' },
            { value: 'bac-pro-services', label: 'Bac Pro Services (Hôtellerie, Esthétique...)' },
            { value: 'bac-pro-agricole', label: 'Bac Pro Agricole' },
        ],
    },
    superieur: {
        label: 'Études Supérieures',
        categories: [
            {
                key: 'bts',
                label: 'BTS (Brevet de Technicien Supérieur)',
                levels: [
                    { value: 'bts1', label: 'BTS 1ère année' },
                    { value: 'bts2', label: 'BTS 2ème année' },
                ],
                tracks: [
                    // BTS Tertiaires
                    { value: 'bts-cg', label: 'BTS CG (Comptabilité et Gestion)' },
                    { value: 'bts-ndrc', label: 'BTS NDRC (Négociation et Digitalisation de la Relation Client)' },
                    { value: 'bts-sam', label: 'BTS SAM (Support à l\'Action Managériale)' },
                    { value: 'bts-mco', label: 'BTS MCO (Management Commercial Opérationnel)' },
                    { value: 'bts-ci', label: 'BTS CI (Commerce International)' },
                    { value: 'bts-gpme', label: 'BTS GPME (Gestion de la PME)' },
                    { value: 'bts-tourisme', label: 'BTS Tourisme' },
                    { value: 'bts-communication', label: 'BTS Communication' },
                    // BTS Informatique
                    { value: 'bts-sio', label: 'BTS SIO (Services Informatiques aux Organisations)' },
                    { value: 'bts-ciel', label: 'BTS CIEL (Cybersécurité, Informatique et Réseaux)' },
                    { value: 'bts-sn', label: 'BTS SN (Systèmes Numériques)' },
                    // BTS Industriels
                    { value: 'bts-cpi', label: 'BTS CPI (Conception des Processus Industriels)' },
                    { value: 'bts-ir', label: 'BTS IR (Informatique et Réseaux pour l\'Industrie)' },
                    { value: 'bts-ccn', label: 'BTS CCN (Contrôle et Compensation des Risques)' },
                    { value: 'bts-electrotechnique', label: 'BTS Électrotechnique' },
                    { value: 'bts-maintenance', label: 'BTS Maintenance des Systèmes' },
                    // BTS Santé/Social
                    { value: 'bts-sp3s', label: 'BTS SP3S (Santé, Prévention, Protection, Sécurité)' },
                    { value: 'bts-esf', label: 'BTS ESF (Économie Sociale et Familiale)' },
                    // BTS Design/Arts
                    { value: 'bts-design-graphique', label: 'BTS Design Graphique' },
                    { value: 'bts-design-espace', label: 'BTS Design d\'Espace' },
                    { value: 'bts-design-mode', label: 'BTS Design de Mode' },
                    { value: 'bts-metiers-mode', label: 'BTS Métiers de la Mode' },
                ],
            },
            {
                key: 'but',
                label: 'BUT (Bachelor Universitaire de Technologie)',
                levels: [
                    { value: 'but1', label: 'BUT 1ère année' },
                    { value: 'but2', label: 'BUT 2ème année' },
                    { value: 'but3', label: 'BUT 3ème année' },
                ],
                tracks: [
                    // BUT Informatique
                    { value: 'but-informatique', label: 'BUT Informatique' },
                    { value: 'but-reseaux-telecom', label: 'BUT Réseaux et Télécommunications' },
                    { value: 'but-statistique', label: 'BUT Statistique et Informatique Décisionnelle' },
                    // BUT Gestion/Commerce
                    { value: 'but-gestion', label: 'BUT Gestion des Entreprises et des Administrations' },
                    { value: 'but-commerce', label: 'BUT Techniques de Commercialisation' },
                    { value: 'but-glp', label: 'BUT Gestion Logistique et Transport' },
                    // BUT Industrie
                    { value: 'but-geii', label: 'BUT Génie Électrique et Informatique Industrielle' },
                    { value: 'but-gmp', label: 'BUT Génie Mécanique et Productique' },
                    { value: 'but-chimie', label: 'BUT Chimie' },
                    { value: 'but-biologie', label: 'BUT Biologie' },
                    // BUT Santé/Social
                    { value: 'but-carrieres-sociales', label: 'BUT Carrières Sociales' },
                    { value: 'but-stid', label: 'BUT Science et Génie des Matériaux' },
                    // BUT Médias/Communication
                    { value: 'but-mmi', label: 'BUT Métiers du Multimédia et de l\'Internet' },
                    { value: 'but-info-com', label: 'BUT Information-Communication' },
                    // BUT Sciences
                    { value: 'but-physique-chimie', label: 'BUT Physique-Chimie' },
                    { value: 'but-horticulture', label: 'BUT Biologie et Horticulture' },
                ],
            },
            {
                key: 'prepa',
                label: 'Classes Préparatoires',
                levels: [
                    { value: 'prepa1', label: 'Première année' },
                    { value: 'prepa2', label: 'Deuxième année' },
                ],
                tracks: [
                    // Scientifiques
                    { value: 'mpsi', label: 'MPSI (Mathématiques, Physique, Sciences de l\'Ingénieur)' },
                    { value: 'mp', label: 'MP (Mathématiques, Physique)' },
                    { value: 'pcsi', label: 'PCSI (Physique, Chimie, Sciences de l\'Ingénieur)' },
                    { value: 'pc', label: 'PC (Physique, Chimie)' },
                    { value: 'ptsi', label: 'PTSI (Physique, Technologie, Sciences de l\'Ingénieur)' },
                    { value: 'pt', label: 'PT (Physique, Technologie)' },
                    { value: 'tsi', label: 'TSI (Technologie et Sciences Industrielles)' },
                    { value: 'tb', label: 'TB (Technologie, Biologie)' },
                    { value: 'bcpst', label: 'BCPST (Biologie, Chimie, Physique, Sciences de la Terre)' },
                    // Économiques/Commerciales
                    { value: 'ecs', label: 'ECS (Économique et Commerciale Scientifique)' },
                    { value: 'ecg', label: 'ECG (Économique et Commerciale Générale)' },
                    { value: 'ect', label: 'ECT (Économique et Commerciale Technologique)' },
                    // Littéraires
                    { value: 'hypokhagne', label: 'Hypokhâgne (Lettres et Sciences Humaines)' },
                    { value: 'khagne', label: 'Khâgne (Lettres et Sciences Humaines)' },
                    { value: 'aes', label: 'A/L (Lettres)' },
                ],
            },
            {
                key: 'licence',
                label: 'Licence (Université)',
                levels: [
                    { value: 'licence1', label: 'Licence 1 (L1)' },
                    { value: 'licence2', label: 'Licence 2 (L2)' },
                    { value: 'licence3', label: 'Licence 3 (L3)' },
                ],
                tracks: [
                    // Sciences
                    { value: 'licence-mathematiques', label: 'Licence Mathématiques' },
                    { value: 'licence-informatique', label: 'Licence Informatique' },
                    { value: 'licence-physique', label: 'Licence Physique' },
                    { value: 'licence-chimie', label: 'Licence Chimie' },
                    { value: 'licence-biologie', label: 'Licence Biologie' },
                    { value: 'licence-svt', label: 'Licence Sciences de la Vie et de la Terre' },
                    { value: 'licence-ingenierie', label: 'Licence Sciences pour l\'Ingénieur' },
                    // Lettres/Langues
                    { value: 'licence-lettres', label: 'Licence Lettres (Français, Littérature)' },
                    { value: 'licence-langues', label: 'Licence Langues Étrangères' },
                    { value: 'licence-histoire', label: 'Licence Histoire' },
                    { value: 'licence-geographie', label: 'Licence Géographie' },
                    { value: 'licence-philosophie', label: 'Licence Philosophie' },
                    // Sciences Humaines
                    { value: 'licence-psychologie', label: 'Licence Psychologie' },
                    { value: 'licence-sociologie', label: 'Licence Sociologie' },
                    { value: 'licence-sciences-politiques', label: 'Licence Sciences Politiques' },
                    { value: 'licence-anthropologie', label: 'Licence Anthropologie' },
                    // Droit/Économie/Gestion
                    { value: 'licence-droit', label: 'Licence Droit' },
                    { value: 'licence-economie', label: 'Licence Économie' },
                    { value: 'licence-gestion', label: 'Licence Gestion' },
                    { value: 'licence-aeo', label: 'Licence Administration Économique et Sociale' },
                    { value: 'licence-miashs', label: 'Licence MIASHS (Maths et Informatique Appliquées aux SHS)' },
                    // Médecine/Santé
                    { value: 'pcem1', label: 'PCEM1 (Médecine PASS/L.AS)' },
                    { value: 'medecine', label: 'Médecine (hors PASS)' },
                    { value: 'pharmacie', label: 'Pharmacie' },
                    { value: 'odontologie', label: 'Odontologie' },
                    { value: 'maieutique', label: 'Maïeutique (Sage-femme)' },
                    { value: 'kinesitherapie', label: 'Kinésithérapie' },
                    { value: 'infirmier', label: 'Licence Soins Infirmiers' },
                    // Arts/Communication
                    { value: 'licence-arts', label: 'Licence Arts Plastiques' },
                    { value: 'licence-musicologie', label: 'Licence Musicologie' },
                    { value: 'licence-cinema', label: 'Licence Cinéma et Audiovisuel' },
                    { value: 'licence-info-com', label: 'Licence Information-Communication' },
                    // Sciences de l'ingénieur (filières universitaires)
                    { value: 'licence-sts', label: 'Licence STS (Sciences et Technologies)' },
                    // Éducation/Sport
                    { value: 'licence-sciences-education', label: 'Licence Sciences de l\'Éducation' },
                    { value: 'licence-staps', label: 'Licence STAPS (Sciences et Techniques des Activités Physiques et Sportives)' },
                ],
            },
            {
                key: 'master',
                label: 'Master',
                levels: [
                    { value: 'master1', label: 'Master 1 (M1)' },
                    { value: 'master2', label: 'Master 2 (M2)' },
                ],
                tracks: [
                    // Informatique/Data
                    { value: 'master-informatique', label: 'Master Informatique' },
                    { value: 'master-data-science', label: 'Master Data Science / Big Data' },
                    { value: 'master-intelligence-artificielle', label: 'Master Intelligence Artificielle' },
                    { value: 'master-cybersecurite', label: 'Master Cybersécurité' },
                    { value: 'master-genie-logiciel', label: 'Master Génie Logiciel' },
                    // Mathématiques
                    { value: 'master-mathematiques', label: 'Master Mathématiques' },
                    { value: 'master-mathematiques-appliquees', label: 'Master Mathématiques Appliquées' },
                    { value: 'master-actuariat', label: 'Master Actuariat' },
                    // Physique/Chimie
                    { value: 'master-physique', label: 'Master Physique' },
                    { value: 'master-chimie', label: 'Master Chimie' },
                    { value: 'master-physico-chimie', label: 'Master Physico-Chimie' },
                    { value: 'master-energie', label: 'Master Énergie' },
                    // Biologie/Santé
                    { value: 'master-biologie', label: 'Master Biologie' },
                    { value: 'master-biotechnologie', label: 'Master Biotechnologie' },
                    { value: 'master-ecologie', label: 'Master Écologie et Environnement' },
                    { value: 'master-neurosciences', label: 'Master Neurosciences' },
                    { value: 'master-sante-publique', label: 'Master Santé Publique' },
                    { value: 'master-genetique', label: 'Master Génétique' },
                    // Ingénierie
                    { value: 'master-genie-civil', label: 'Master Génie Civil' },
                    { value: 'master-genie-electrique', label: 'Master Génie Électrique' },
                    { value: 'master-genie-mecanique', label: 'Master Génie Mécanique' },
                    { value: 'master-genie-industriel', label: 'Master Génie Industriel' },
                    { value: 'master-aeronautique', label: 'Master Aéronautique et Spatial' },
                    { value: 'master-energetique', label: 'Master Énergétique' },
                    // Économie/Finance
                    { value: 'master-economie', label: 'Master Économie' },
                    { value: 'master-finance', label: 'Master Finance' },
                    { value: 'master-banque-finance', label: 'Master Banque et Finance' },
                    { value: 'master-econometrie', label: 'Master Économétrie' },
                    { value: 'master-actuariat-finance', label: 'Master Actuariat et Finance' },
                    // Gestion/Management
                    { value: 'master-management', label: 'Master Management' },
                    { value: 'master-administration-economique', label: 'Master Administration Économique et Sociale' },
                    { value: 'master-marketing', label: 'Master Marketing' },
                    { value: 'master-ressources-humaines', label: 'Master Ressources Humaines' },
                    { value: 'master-strategie', label: 'Master Stratégie et Management' },
                    { value: 'master-entrepreneuriat', label: 'Master Entrepreneuriat' },
                    { value: 'master-supply-chain', label: 'Master Supply Chain et Logistique' },
                    { value: 'master-achats', label: 'Master Achats' },
                    { value: 'master-audit-conseil', label: 'Master Audit et Conseil' },
                    { value: 'master-comptabilite', label: 'Master Comptabilité Contrôle' },
                    // Droit
                    { value: 'master-droit-prive', label: 'Master Droit Privé' },
                    { value: 'master-droit-public', label: 'Master Droit Public' },
                    { value: 'master-droit-affaires', label: 'Master Droit des Affaires' },
                    { value: 'master-droit-social', label: 'Master Droit Social' },
                    { value: 'master-droit-europeen', label: 'Master Droit Européen et International' },
                    { value: 'master-droit-fiscal', label: 'Master Droit Fiscal' },
                    { value: 'master-droit-numerique', label: 'Master Droit du Numérique' },
                    { value: 'master-notariat', label: 'Master Notariat' },
                    { value: 'master-avocat', label: 'Master Carrières Judiciaires (CRFPA)' },
                    // Lettres/Langues
                    { value: 'master-lettres', label: 'Master Lettres' },
                    { value: 'master-linguistique', label: 'Master Linguistique' },
                    { value: 'master-didactique-francais', label: 'Master Didactique du Français' },
                    { value: 'master-traduction', label: 'Master Traduction et Interprétation' },
                    { value: 'master-fle', label: 'Master Français Langue Étrangère (FLE)' },
                    // Histoire/Géographie
                    { value: 'master-histoire', label: 'Master Histoire' },
                    { value: 'master-geographie', label: 'Master Géographie' },
                    { value: 'master-histoire-art', label: 'Master Histoire de l\'Art' },
                    { value: 'master-archeologie', label: 'Master Archéologie' },
                    // Philosophie
                    { value: 'master-philosophie', label: 'Master Philosophie' },
                    // Sciences Humaines/Sociales
                    { value: 'master-psychologie', label: 'Master Psychologie' },
                    { value: 'master-psychologie-clinique', label: 'Master Psychologie Clinique' },
                    { value: 'master-psychologie-travail', label: 'Master Psychologie du Travail' },
                    { value: 'master-sociologie', label: 'Master Sociologie' },
                    { value: 'master-sciences-politiques', label: 'Master Sciences Politiques' },
                    { value: 'master-anthropologie', label: 'Master Anthropologie' },
                    { value: 'master-ethnologie', label: 'Master Ethnologie' },
                    { value: 'master-communication', label: 'Master Sciences de l\'Information et de la Communication' },
                    { value: 'master-journalisme', label: 'Master Journalisme' },
                    { value: 'master-documentaire', label: 'Master Sciences Documentaires' },
                    // Éducation
                    { value: 'master-mei', label: 'Master Métiers de l\'Enseignement, de l\'Éducation et de la Formation (MEEF)' },
                    { value: 'master-conseiller-principal', label: 'Master Conseiller Principal d\'Éducation' },
                    { value: 'master-enseignement-superieur', label: 'Master Enseignement Supérieur' },
                    { value: 'master-ingénierie-formation', label: 'Master Ingénierie de la Formation' },
                    // Arts/Design
                    { value: 'master-arts-plastiques', label: 'Master Arts Plastiques' },
                    { value: 'master-design', label: 'Master Design' },
                    { value: 'master-arts-du-spectacle', label: 'Master Arts du Spectacle' },
                    { value: 'master-musicologie', label: 'Master Musicologie' },
                    { value: 'master-patrimoine', label: 'Master Patrimoine' },
                    // Médecine/Santé (3ème cycle)
                    { value: 'diplome-etudes-specialisees', label: 'DES (Diplôme d\'Études Spécialisées)' },
                    { value: 'diplome-etat-doctorat-medecine', label: 'Doctorat de Médecine' },
                    { value: 'diplome-etat-pharmacie', label: 'Doctorat de Pharmacie' },
                    // Urbanisme/Aménagement
                    { value: 'master-urbanisme', label: 'Master Urbanisme et Aménagement' },
                    { value: 'master-geomatique', label: 'Master Géomatique' },
                    { value: 'master-developpement-territoires', label: 'Master Développement des Territoires' },
                    // Agriculture/Environnement
                    { value: 'master-agronomie', label: 'Master Agronomie' },
                    { value: 'master-sciences-aliments', label: 'Master Sciences des Aliments' },
                    { value: 'master-foret', label: 'Master Forêt et Milieux Naturels' },
                    // Tourisme/Hôtellerie
                    { value: 'master-tourisme', label: 'Master Tourisme' },
                    { value: 'master-hotellerie', label: 'Master Management Hôtelier' },
                    // Sciences de l'information
                    { value: 'master-bibliotheconomie', label: 'Master Bibliothéconomie' },
                    { value: 'master-archivistique', label: 'Master Archivistique' },
                ],
            },
            {
                key: 'doctorat',
                label: 'Doctorat / Recherche',
                levels: [
                    { value: 'doctorat1', label: 'Doctorat 1ère année' },
                    { value: 'doctorat2', label: 'Doctorat 2ème année' },
                    { value: 'doctorat3', label: 'Doctorat 3ème année' },
                ],
                tracks: [
                    { value: 'doctorat-sciences', label: 'Doctorat en Sciences' },
                    { value: 'doctorat-shs', label: 'Doctorat en Sciences Humaines et Sociales' },
                    { value: 'doctorat-droit', label: 'Doctorat en Droit' },
                    { value: 'doctorat-medecine', label: 'Doctorat en Médecine (PhD/Sciences)' },
                    { value: 'doctorat-lettres', label: 'Doctorat en Lettres' },
                ],
            },
            {
                key: 'ecole-commerce',
                label: 'École de Commerce / Management',
                levels: [
                    { value: 'esc1', label: 'Programme Bachelor / 1ère année' },
                    { value: 'esc2', label: '2ème année' },
                    { value: 'esc3', label: '3ème année' },
                    { value: 'msc1', label: 'MSc 1 / Programme Grande École 1' },
                    { value: 'msc2', label: 'MSc 2 / Programme Grande École 2' },
                ],
                tracks: [
                    { value: 'programme-grande-ecole', label: 'Programme Grande École (PGE)' },
                    { value: 'bachelor-business', label: 'Bachelor in Business Administration' },
                    { value: 'msc-finance', label: 'MSc Finance' },
                    { value: 'msc-marketing', label: 'MSc Marketing' },
                    { value: 'msc-strategie', label: 'MSc Stratégie et Management' },
                    { value: 'msc-entrepreneuriat', label: 'MSc Entrepreneuriat' },
                    { value: 'msc-supply-chain', label: 'MSc Supply Chain' },
                    { value: 'msc-luxe', label: 'MSc Luxe' },
                    { value: 'msc-ressources-humaines', label: 'MSc Ressources Humaines' },
                    { value: 'msc-data', label: 'MSc Data Science for Business' },
                    { value: 'msc-digital', label: 'MSc Marketing Digital' },
                ],
            },
            {
                key: 'ecole-ingenieur',
                label: 'École d\'Ingénieurs',
                levels: [
                    { value: 'inge1', label: '1ère année (PeiP ou équivalent)' },
                    { value: 'inge2', label: '2ème année' },
                    { value: 'inge3', label: '3ème année' },
                    { value: 'inge4', label: '4ème année' },
                    { value: 'inge5', label: '5ème année' },
                ],
                tracks: [
                    { value: 'filiere-classique', label: 'Filière Classique' },
                    { value: 'filiere-apprentissage', label: 'Formation par Apprentissage' },
                    { value: 'cycle-master', label: 'Cycle Master Spécialisé' },
                    // Spécialisations communes
                    { value: 'spe-informatique', label: 'Spé. Informatique et Numérique' },
                    { value: 'spe-electronique', label: 'Spé. Électronique' },
                    { value: 'spe-automatique', label: 'Spé. Automatique' },
                    { value: 'spe-telecom', label: 'Spé. Télécommunications' },
                    { value: 'spe-mecanique', label: 'Spé. Mécanique' },
                    { value: 'spe-materiaux', label: 'Spé. Matériaux' },
                    { value: 'spe-chimie', label: 'Spé. Génie Chimique' },
                    { value: 'spe-civil', label: 'Spé. Génie Civil' },
                    { value: 'spe-energetique', label: 'Spé. Énergétique' },
                    { value: 'spe-aeronautique', label: 'Spé. Aéronautique et Spatial' },
                    { value: 'spe-nucleaire', label: 'Spé. Génie Nucléaire' },
                    { value: 'spe-financier', label: 'Spé. Ingénierie Financière' },
                    { value: 'spe-data', label: 'Spé. Data Science et IA' },
                    { value: 'spe-cybersecurite', label: 'Spé. Cybersécurité' },
                    { value: 'spe-biologie', label: 'Spé. Biologie et Santé' },
                ],
            },
            {
                key: 'iut',
                label: 'IUT (DUT) - Parcours Avenir',
                levels: [
                    { value: 'dut1', label: 'DUT 1ère année' },
                    { value: 'dut2', label: 'DUT 2ème année' },
                ],
                tracks: [
                    { value: 'dut-informatique', label: 'DUT Informatique' },
                    { value: 'dut-gestion', label: 'DUT Gestion des Entreprises et des Administrations' },
                    { value: 'dut-tc', label: 'DUT Techniques de Commercialisation' },
                    { value: 'dut-geii', label: 'DUT Génie Électrique et Informatique Industrielle' },
                    { value: 'dut-gmp', label: 'DUT Génie Mécanique et Productique' },
                    { value: 'dut-chimie', label: 'DUT Chimie' },
                    { value: 'dut-biologie', label: 'DUT Biologie' },
                    { value: 'dut-carrieres-sociales', label: 'DUT Carrières Sociales' },
                    { value: 'dut-info-com', label: 'DUT Information-Communication' },
                    { value: 'dut-mmi', label: 'DUT Métiers du Multimédia et de l\'Internet' },
                ],
            },
            {
                key: 'formations-sanitaires',
                label: 'Formations Sanitaires et Sociales',
                levels: [
                    { value: 'de1', label: '1ère année' },
                    { value: 'de2', label: '2ème année' },
                    { value: 'de3', label: '3ème année' },
                ],
                tracks: [
                    { value: 'de-infirmier', label: 'DE Infirmier (IFSI)' },
                    { value: 'de-aide-soignant', label: 'DE Aide-Soignant (IFAS)' },
                    { value: 'de-puéricultrice', label: 'DE Puéricultrice' },
                    { value: 'de-manipulateur-radio', label: 'DE Manipulateur d\'Électroradiologie Médicale' },
                    { value: 'de-ambulancier', label: 'DE Ambulancier' },
                    { value: 'de-ergotherapeute', label: 'DE Ergothérapeute' },
                    { value: 'de-psychomotricien', label: 'DE Psychomotricien' },
                    { value: 'de-orthophoniste', label: 'DE Orthophoniste' },
                    { value: 'de-orthoptiste', label: 'DE Orthoptiste' },
                    { value: 'de-dieteticien', label: 'DE Diététicien' },
                    { value: 'de-travailleur-social', label: 'DE Travailleur Social' },
                    { value: 'de-conseiller-orientation', label: 'DE Conseiller d\'Orientation-Psychologue' },
                ],
            },
        ],
    },
};

export async function GET() {
    return NextResponse.json(LEVELS_CONFIG);
}
