# Changelog - Workyt

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [4.0.6] - 2026-01-04

### Ajouté
- Ajout de deux nouvelles photos de profil partenaires :
  - `FoxyLmdpc.webp` - Foxy chez Lemondedupc.fr (2 gemmes)
  - `FoxyStagey.webp` - Foxy chez Stagey.fr (2 gemmes)
- Badge "Partenaire" pour identifier les photos de profil des partenaires
- Support des tableaux markdown dans le forum avec style amélioré et responsive
- Système de rôles "Helpeur" avec permissions spécifiques
- Icônes de rôles affichées à côté des noms d'utilisateur
- Support de `remark-gfm` pour les tableaux markdown
- Plugin Tailwind Typography pour le style des tableaux

### Modifié
- Amélioration du design des tableaux markdown avec bordures arrondies, ombres et effets hover
- Amélioration de la responsivité des tableaux sur mobile avec scroll horizontal
- Mise à jour de `jspdf` de 3.0.1 à 4.0.0 pour corriger une vulnérabilité critique
- Mise à jour de `uploadthing` de 7.5.2 à 7.7.4
- Mise à jour de `@uploadthing/react` à 7.3.3
- Amélioration du système de permissions pour le rôle "Helpeur"
- Documentation des rôles et permissions mise à jour

### Corrigé
- Correction de l'affichage des images sur les cartes de cours
- Correction du rendu des tableaux markdown dans le forum et les exercices
- Correction des dépendances manquantes pour le rendu markdown

---

## [4.0.5] - 2025-12-15

### Ajouté
- **Calendrier des récompenses quotidiennes**
  - Système de calendrier avec récompenses quotidiennes
  - Configuration des jours fériés pour des récompenses spéciales
  - Composant calendrier pour l'interaction utilisateur
  - Routes API pour l'initialisation du calendrier, réclamation des récompenses et récupération des données

- **Réorganisation de la gamification**
  - Amélioration de l'organisation du système de gamification
  - Intégration des quêtes et coffres dans les interactions utilisateur

### Modifié
- Mise à jour de `.gitignore` pour inclure les fichiers sensibles et configurations d'environnement
- Mise à jour de Next.js vers 15.5.8
- Ajout de `pdf-parse` pour la gestion des PDF
- Mise à jour de `eslint-config-next` vers 15.5.8

---

## [4.0.4] - 2025-11-26

### Ajouté
- **Système de quêtes et coffres**
  - Nouvelles routes API pour la gestion des quêtes
  - Gestion des récompenses de coffres
  - Suivi de la progression des quêtes
  - Nouvelles images pour les coffres
  - Intégration des mises à jour de quêtes dans les interactions utilisateur

---

## [4.0.3] - 2025-11-13

### Ajouté
- Nouvelles images de badges pour les profils utilisateurs
- Amélioration des routes API pour la recherche
- Échappement regex pour les caractères spéciaux dans les requêtes de recherche

### Modifié
- Optimisation de la gestion des connexions MongoDB dans le middleware

---

## [4.0.2] - 2025-10-15

### Ajouté
- Intégration du composant `UsernameDisplay` dans diverses vues pour un affichage cohérent des utilisateurs
- Amélioration de l'expérience utilisateur avec des styles de nom d'utilisateur personnalisables

### Modifié
- Mise à jour de `nodemailer` vers 7.0.9
- Ajustement des versions de `cookie` et `oidc-token-hash`
- Modification du lien de service dans `nos-services.tsx` pour une navigation améliorée

---

## [4.0.1] - 2025-10-10

### Ajouté
- **Badge Halloween 2025**
  - Nouveau badge Halloween 2025 avec son icône
  - Mise à jour du service de badges pour gérer les conditions d'attribution des badges d'événements

---

## [4.0.0] - 2025-10-04

### Ajouté
- **Nouveaux contours de profil**
  - Nouveaux fichiers d'images pour les contours de profil
  - Mise à jour des routes API pour la personnalisation des utilisateurs
  - Amélioration de la gestion des fichiers dans le stockage
  - Intégration de la vérification des URLs
  - Mise à jour des configurations de gemmes pour les nouveaux contours

---

## [4.0.0] - 2025-09-29

### Ajouté
- **Authentification Discord**
  - Prise en charge de l'authentification via Discord
  - Mise à jour du modèle utilisateur pour inclure l'ID Discord et le statut de vérification
  - Amélioration de la validation des noms d'utilisateur

- **Système de notifications**
  - Script d'optimisation des notifications
  - Méthode pour notifier les utilisateurs lors de la validation de réponses
  - Amélioration de la gestion des notifications avec système d'archivage et de suppression
  - Nouveau type de notification 'answer_validated'

- **Gestion des fiches**
  - Bouton de suppression de fiche avec confirmation
  - Permissions pour la suppression par les créateurs et administrateurs
  - Suppression des fichiers associés dans le stockage cloud

- **Système de signalement**
  - Système de notifications pour informer les utilisateurs des nouvelles réponses et commentaires
  - Intégration d'un service de notification
  - Création de modèles pour les notifications et les signalements
  - Boutons de signalement et modales pour la gestion des signalements

- **Améliorations SEO**
  - Amélioration de la génération du sitemap avec récupération des questions depuis la base de données
  - Gestion des erreurs améliorée
  - Mise à jour des métadonnées pour les pages de forum

### Modifié
- Refactorisation de la logique de like avec opérations atomiques
- Amélioration de l'interface utilisateur pour la liste des utilisateurs ayant aimé
- Mise à jour des dépendances incluant `@emnapi/runtime` 1.5.0, `@img/colour` 1.0.0
- Mise à jour de plusieurs paquets vers la version 15.5.4
- Suppression de dépendances obsolètes
- Modification des liens de contenu dans la page de modération pour rediriger correctement les réponses de forum

### Corrigé
- Mise à jour de l'expression régulière pour la validation des adresses email dans le schéma utilisateur, permettant d'accepter des domaines de plus de 3 caractères

---

## [4.0.0] - 2025-08-31

### Ajouté
- **Système de gemmes et récompenses**
  - Système complet de gemmes pour les personnalisations
  - Boutique de cosmétiques (photos de profil, contours, couleurs de pseudo)
  - Nouveaux types de couleurs pour les personnalisations de noms d'utilisateur
  - Mise à jour des prix des gemmes
  - Amélioration des animations CSS pour une expérience utilisateur enrichie

- **Sections page d'accueil**
  - Ajout de sections Cours et Gamification sur la page d'accueil
  - Intégration de nouveaux fichiers d'images
  - Remplacement de la section Partenaires par une vue améliorée
  - Mise à jour de l'organigramme des membres

- **Badges et rangs**
  - Nouveaux fichiers SVG pour les badges de cours et de quiz
  - Mise à jour des fichiers de configuration
  - Amélioration des styles CSS pour l'optimisation mobile
  - Refactorisation des routes API pour la gestion des permissions utilisateur

---

## [4.0.0] - 2025-08-05

### Ajouté
- **Système de quiz pour les cours**
  - Ajout d'un système de quiz complet pour les cours
  - Gestion des quiz avec vérification des permissions utilisateur
  - Intégration des quiz dans les sections de cours

- **Référencement SEO**
  - Configuration SEO avec des en-têtes pour améliorer l'indexation
  - Ajout de fichiers `robots.txt` et `sitemap`
  - Mise à jour des dépendances pour la gestion des styles CSS

- **Badges de forum**
  - Nouveaux fichiers d'images pour les badges de forum
  - Mise à jour des styles CSS pour la grille de contribution
  - Refactorisation des routes API pour intégrer la gestion des quiz et des sections

### Modifié
- Refonte complète du fichier README.md pour la version 4.0.0 de Workyt
  - Ajout de sections détaillées sur les fonctionnalités
  - Architecture technique détaillée
  - Instructions d'installation et d'utilisation
- Mise à jour de la version de l'application à 4.0.0
- Modification des titres et des liens dans la page d'accueil pour refléter les nouvelles fonctionnalités

### Supprimé
- Suppression des fichiers d'images des badges de forum 1, 2 et 3

---

## [4.0.0] - 2025-07-23

### Ajouté
- **Système de certificats de bénévolat**
  - Gestion complète des certificats (création, récupération, mise à jour, suppression)
  - Génération de PDF pour les certificats

- **Système de rangs utilisateurs**
  - Gestion des rangs utilisateurs avec animation
  - Progression et affichage des badges
  - Styles CSS pour éviter les débordements

- **Badges**
  - Ajout de nouveaux badges SVG
  - Mise en place de scripts pour le seed et le test des badges

### Modifié
- Ajout des dépendances `@radix-ui/react-progress` et `dotenv`
- Mise à jour des dépendances et refactorisation des composants
- Amélioration de la structure et de la performance de l'application

### Corrigé
- Mise à jour des versions des dépendances `brace-expansion` et `tar-fs` pour corriger des problèmes de sécurité et améliorer la stabilité

---

## [4.0.0] - 2025-06-12

### Ajouté
- Migration vers Next.js 15
- Mise à jour des paramètres de route pour utiliser des Promises
- Amélioration de l'enregistrement des utilisateurs avec validation et suggestions

### Modifié
- Implémentation du rate limiting pour les likes
- Amélioration de la fonctionnalité de like avec support des transactions
- Amélioration de la logique de calcul des récompenses pour gérer correctement les pertes
- Amélioration des messages d'erreur

---

## [4.0.0] - 2025-05-30

### Ajouté
- **Système de récompenses**
  - Implémentation complète du système de récompenses avec opérations CRUD
  - Filtrage et améliorations de l'interface utilisateur

---

## [4.0.0] - 2025-05-02

### Modifié
- Amélioration de la fonctionnalité d'upload de fichiers
- Amélioration de l'interface utilisateur avec nouveaux filtres et ajustements de mise en page
- Amélioration des composants UI avec mises en page améliorées, icônes supplémentaires et fonctionnalité d'upload de fichiers améliorée

---

## [4.0.0] - 2025-04-29

### Modifié
- Amélioration de `CoursePage` et `LessonView` avec mise en page améliorée, skeleton de chargement et taille de texte augmentée
- Amélioration de l'interface utilisateur avec effets de grain améliorés, design responsive et sidebar optimisée

---

## [4.0.0] - 2025-08-05 (Version majeure)

### Ajouté
- **Système de Cours Complet**
  - Création et gestion de cours structurés avec sections et leçons
  - Éditeur de contenu riche avec support Markdown et LaTeX
  - Système de validation pour la qualité du contenu
  - Gestion des médias (images, PDF, vidéos)
  - Quiz interactifs avec différents types de questions
  - Exercices pratiques avec corrections détaillées

- **Fiches de Révision**
  - Création collaborative de fiches de révision
  - Système de likes et commentaires
  - Certification des fiches par les modérateurs
  - Recherche avancée par matière et niveau
  - Support multi-fichiers (images, PDF)

- **Forum Communautaire**
  - Questions et réponses par matière et niveau
  - Système de validation des réponses
  - Attribution de points pour les bonnes réponses
  - Recherche de fiches liées aux questions
  - Gestion des pièces jointes

- **Système de Gamification**
  - Points d'expérience pour les actions
  - Badges pour récompenser l'engagement
  - Système de rangs (Apprenti, Helpeur, Rédacteur, Correcteur, Modérateur, Admin)
  - Récompenses et défis communautaires
  - Graphiques de progression
  - Système de gemmes pour les personnalisations
  - Boutique de cosmétiques (photos de profil, contours, couleurs de pseudo)

- **Gestion des Utilisateurs**
  - Authentification avec NextAuth.js
  - Authentification Discord
  - Profils personnalisés avec bio et statistiques
  - Système de rôles et permissions hiérarchique
  - Réinitialisation de mot de passe par email
  - Validation des comptes

- **Dashboard Administratif**
  - Gestion des cours et contenus
  - Modération des fiches et questions
  - Statistiques d'utilisation
  - Gestion des utilisateurs
  - Système de certificats pour bénévoles

- **Fonctionnalités Avancées**
  - Éditeur d'équations avec KaTeX
  - Support LaTeX pour les mathématiques
  - Génération de PDF pour les certificats
  - Upload de fichiers avec UploadThing et AWS S3
  - Notifications en temps réel
  - Système de recherche global
  - Calendrier des récompenses quotidiennes
  - Système de quêtes (quotidiennes/hebdomadaires/mensuelles)
  - Système de signalement de contenu

### Modifié
- Migration vers Next.js 15
- Mise à jour vers React 18
- Refonte complète de l'interface utilisateur avec Tailwind CSS
- Amélioration de l'expérience utilisateur avec animations fluides
- Support du thème sombre/clair avec next-themes
- Amélioration de la responsivité sur mobile
- Optimisation des performances

---

## [0.2.0] - 2024-11-09

### Ajouté
- Mini-kits pour les utilisateurs

---

## Types de changements

- **Ajouté** : pour les nouvelles fonctionnalités
- **Modifié** : pour les changements dans les fonctionnalités existantes
- **Déprécié** : pour les fonctionnalités qui seront bientôt supprimées
- **Supprimé** : pour les fonctionnalités supprimées
- **Corrigé** : pour les corrections de bugs
- **Sécurité** : pour les vulnérabilités

---

## Liens utiles

- [Documentation complète](./README.md)
- [Rôles et Permissions](./ROLES_ET_PERMISSIONS.md)
- [Issues GitHub](https://github.com/workyt/issues)
