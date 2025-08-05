# 🚀 Workyt - Plateforme d'Apprentissage Collaborative

**Version 4.0.0** - Plateforme d'apprentissage gratuite et collaborative

## 📋 Table des Matières

- [À propos](#-à-propos)
- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Architecture Technique](#-architecture-technique)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [API Endpoints](#-api-endpoints)
- [Contribution](#-contribution)
- [Licence](#-licence)

## 🎯 À propos

Workyt est une plateforme d'apprentissage collaborative qui vise à démocratiser l'accès à l'éducation. Notre mission est de fournir des ressources d'apprentissage gratuites de qualité, en mettant l'accent sur l'accessibilité, la collaboration et l'engagement des utilisateurs.

### 🎨 Design Philosophy
- **Interface moderne** avec Tailwind CSS et Radix UI
- **Expérience utilisateur intuitive** avec des animations fluides
- **Responsive design** pour tous les appareils
- **Thème sombre/clair** avec next-themes

## ✨ Fonctionnalités Principales

### 📚 Système de Cours
- **Cours structurés** avec sections, leçons et exercices
- **Éditeur de contenu riche** avec support Markdown et LaTeX
- **Système de validation** pour la qualité du contenu
- **Gestion des médias** (images, PDF, vidéos)
- **Quiz interactifs** avec différents types de questions
- **Exercices pratiques** avec corrections détaillées

### 📝 Fiches de Révision
- **Création collaborative** de fiches de révision
- **Système de likes** et commentaires
- **Certification** des fiches par les modérateurs
- **Recherche avancée** par matière et niveau
- **Support multi-fichiers** (images, PDF)

### 💬 Forum Communautaire
- **Questions et réponses** par matière et niveau
- **Système de validation** des réponses
- **Attribution de points** pour les bonnes réponses
- **Recherche de fiches** liées aux questions
- **Gestion des pièces jointes**

### 🏆 Système de Gamification
- **Points d'expérience** pour les actions
- **Badges** pour récompenser l'engagement
- **Système de rangs** (Apprenti, Rédacteur, Correcteur, Admin)
- **Récompenses** et défis communautaires
- **Graphiques de progression**

### 👥 Gestion des Utilisateurs
- **Authentification** avec NextAuth.js
- **Profils personnalisés** avec bio et statistiques
- **Système de rôles** et permissions
- **Réinitialisation de mot de passe** par email
- **Validation des comptes**

### 📊 Dashboard Administratif
- **Gestion des cours** et contenus
- **Modération** des fiches et questions
- **Statistiques** d'utilisation
- **Gestion des utilisateurs**
- **Système de certificats** pour bénévoles

### 🎨 Fonctionnalités Avancées
- **Éditeur d'équations** avec KaTeX
- **Support LaTeX** pour les mathématiques
- **Génération de PDF** pour les certificats
- **Upload de fichiers** avec UploadThing
- **Notifications** en temps réel
- **Système de recherche** global

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Base de données**: MongoDB avec Mongoose
- **Authentification**: NextAuth.js
- **Upload**: UploadThing, AWS S3
- **Éditeur**: TipTap, Markdown Editor
- **Mathématiques**: KaTeX, react-katex
- **PDF**: jsPDF, html2canvas

### Structure des Modèles



6. **Ouvrir dans le navigateur**
```
http://localhost:3000
```

## ⚙️ Configuration

### Base de Données
Le projet utilise MongoDB avec Mongoose. Assurez-vous que MongoDB est installé et en cours d'exécution.

### Upload de Fichiers
- **UploadThing** : Pour l'upload de fichiers dans l'interface utilisateur
- **AWS S3** : Pour le stockage des fichiers (optionnel)

### Email
Configurez un serveur SMTP pour les fonctionnalités de réinitialisation de mot de passe.

## 📖 Utilisation

### 👤 Créer un Compte
1. Accédez à `/compte/register`
2. Remplissez le formulaire d'inscription
3. Vérifiez votre email
4. Connectez-vous avec vos identifiants

### 📚 Créer un Cours
1. Connectez-vous en tant que Rédacteur ou Admin
2. Accédez au dashboard
3. Cliquez sur "Créer un cours"
4. Remplissez les informations du cours
5. Ajoutez des sections et leçons
6. Publiez le cours

### 📝 Créer une Fiche de Révision
1. Accédez à `/fiches/creer`
2. Remplissez le titre et le contenu
3. Sélectionnez la matière et le niveau
4. Ajoutez des fichiers si nécessaire
5. Publiez la fiche

### 💬 Poser une Question
1. Accédez au forum
2. Cliquez sur "Poser une question"
3. Remplissez les détails de votre question
4. Ajoutez des pièces jointes si nécessaire
5. Publiez la question

## 🤝 Contribution

### Structure du Projet
```
src/
├── app/                    # Pages Next.js 13+
│   ├── api/               # API Routes
│   ├── cours/             # Pages des cours
│   ├── fiches/            # Pages des fiches
│   ├── forum/             # Pages du forum
│   └── dashboard/         # Dashboard admin
├── components/            # Composants React
│   ├── ui/               # Composants UI de base
│   └── home/             # Composants de la page d'accueil
├── lib/                  # Utilitaires et services
├── models/               # Modèles Mongoose
└── types/                # Types TypeScript
```

### Guidelines de Contribution
1. **Fork** le projet
2. **Créez** une branche pour votre fonctionnalité
3. **Commitez** vos changements
4. **Poussez** vers la branche
5. **Ouvrez** une Pull Request

### Standards de Code
- **TypeScript** strict
- **ESLint** pour la qualité du code
- **Prettier** pour le formatage
- **Tests** pour les nouvelles fonctionnalités

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- **Next.js** pour le framework
- **Tailwind CSS** pour le styling
- **Radix UI** pour les composants
- **MongoDB** pour la base de données
- **UploadThing** pour l'upload de fichiers


**Workyt v4.0.0** - Fait avec ❤️ pour l'éducation gratuite
