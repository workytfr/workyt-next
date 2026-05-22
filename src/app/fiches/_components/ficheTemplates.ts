// Modèles de fiches de révision. Strings statiques, aucun overhead runtime.
// L'utilisateur peut éditer librement après application.

export interface FicheTemplate {
    id: string;
    label: string;
    description: string;
    icon: string;          // nom lucide-react
    bestFor: string[];     // matières/contextes recommandés
    content: string;       // markdown pré-rempli
}

export const FICHE_TEMPLATES: FicheTemplate[] = [
    {
        id: "cours",
        label: "Fiche de cours classique",
        description: "Pour résumer un chapitre : définitions, propriétés, exemples, à retenir.",
        icon: "BookOpen",
        bestFor: ["Maths", "Physique", "SVT", "Histoire"],
        content: `## Objectifs du chapitre

- Ce que je dois savoir à la fin
- Les compétences évaluées

## Définitions clés

> **Mot-clé** : définition claire et concise, avec tes propres mots.

> **Autre notion** : reformule comme si tu l'expliquais à un camarade.

## Propriétés / théorèmes

- **Propriété 1** : énoncé court + condition d'application.
- **Propriété 2** :

## Exemple résolu

Énoncé : ...

Étape 1 — ...
Étape 2 — ...
Résultat : ...

## À retenir absolument

- [ ] Point 1
- [ ] Point 2
- [ ] Point 3

## Pièges à éviter

- Erreur fréquente : ...
- Confusion possible avec : ...
`,
    },
    {
        id: "methode",
        label: "Fiche méthode",
        description: "Pour un type d'exercice récurrent : marche à suivre pas-à-pas.",
        icon: "ListChecks",
        bestFor: ["Maths", "Physique", "Français (dissert)", "Histoire (analyse)"],
        content: `## Quand utiliser cette méthode ?

Décris en une phrase le type d'exercice où elle s'applique.

## Méthode pas à pas

1. **Lire l'énoncé** et repérer les mots-clés : ...
2. **Identifier les données** : ce qui est donné, ce qu'on cherche.
3. **Choisir l'outil/la formule** adaptée.
4. **Appliquer** en détaillant chaque étape.
5. **Vérifier** la cohérence du résultat (unité, ordre de grandeur, sens).

## Exemple résolu

> Énoncé type

**Solution rédigée :**

Étape 1 — ...
Étape 2 — ...

## Erreurs à éviter

- ❌ Oublier de ...
- ❌ Confondre ... avec ...
- ✅ Toujours vérifier ...

## Modèle de rédaction

Pour un correcteur, montre que tu maîtrises chaque étape :
> "D'après ..., on a ... donc ..."
`,
    },
    {
        id: "vocabulaire",
        label: "Fiche vocabulaire / langue",
        description: "Pour apprendre des mots, conjugaisons, expressions — avec tableau et exemples.",
        icon: "Languages",
        bestFor: ["Anglais", "Espagnol", "Allemand", "Français (lexique)"],
        content: `## Thème

Décris en un mot le thème du vocabulaire (ex. *les sentiments*, *le voyage*).

## Vocabulaire essentiel

| Mot / expression | Traduction | Exemple en contexte |
|---|---|---|
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

## Expressions idiomatiques

- **...** → signifie ...
- **...** → signifie ...

## Grammaire / conjugaison

Point précis à retenir :

| Forme | Exemple |
|---|---|
|  |  |

## Phrases types à réutiliser

1. ...
2. ...
3. ...

## Astuce mnémotechnique

Une image / une histoire pour mémoriser sans effort.
`,
    },
    {
        id: "exercices",
        label: "Fiche d'exercices corrigés",
        description: "Une série d'exercices avec corrigés repliables pour s'auto-évaluer.",
        icon: "PenSquare",
        bestFor: ["Maths", "Physique-Chimie", "SVT"],
        content: `## Niveau / chapitre concerné

Précise la notion travaillée et le niveau.

## Exercice 1 ⭐

**Énoncé**

...

<details>
<summary>Voir le corrigé</summary>

**Solution**

...

</details>

## Exercice 2 ⭐⭐

**Énoncé**

...

<details>
<summary>Voir le corrigé</summary>

**Solution**

...

</details>

## Exercice 3 ⭐⭐⭐

**Énoncé**

...

<details>
<summary>Voir le corrigé</summary>

**Solution**

...

</details>

## Pour aller plus loin

- Question ouverte : ...
- Variante plus difficile : ...
`,
    },
    {
        id: "mindmap",
        label: "Carte mentale (mind map)",
        description: "Vue d'ensemble d'un chapitre : concepts liés sous forme de branches.",
        icon: "Network",
        bestFor: ["Histoire-Géo", "SVT", "Philosophie", "Révisions globales"],
        content: `## Concept central

**Le sujet** (titre du chapitre)

## Branche 1 — ...

- Idée 1.1
  - sous-idée
  - sous-idée
- Idée 1.2

## Branche 2 — ...

- Idée 2.1
- Idée 2.2
  - sous-idée

## Branche 3 — ...

- Idée 3.1
- Idée 3.2

## Liens transversaux

- Branche 1 ↔ Branche 2 : ...
- Branche 2 ↔ Branche 3 : ...

## Mots-clés à retenir

\`mot1\` · \`mot2\` · \`mot3\` · \`mot4\`
`,
    },
    {
        id: "blank",
        label: "Démarrer de zéro",
        description: "Aucun modèle : page vide pour t'organiser à ta façon.",
        icon: "FilePlus",
        bestFor: [],
        content: "",
    },
];

export const PEDAGOGY_TIPS = [
    {
        title: "Reformule avec tes propres mots",
        text: "Ne recopie pas le cours. Réécris chaque notion comme si tu l'expliquais à un camarade. C'est ce qui fait la différence entre apprendre et retenir.",
    },
    {
        title: "Synthétise, ne résume pas",
        text: "Une bonne fiche tient sur 1 à 2 pages max par chapitre. Si tu dépasses, demande-toi ce qui peut sauter sans perdre l'essentiel.",
    },
    {
        title: "Visualise — schémas, formules, tableaux",
        text: "Le cerveau retient les images mieux que le texte. Insère des schémas (utilise le tableau blanc), des formules (touche Σ), des tableaux comparatifs.",
    },
    {
        title: "Mets en évidence",
        text: "Gras pour les mots-clés, citations pour les définitions importantes, couleurs pour différencier les catégories. Mais reste sobre : trop de surlignage = aucun surlignage.",
    },
    {
        title: "Donne des exemples concrets",
        text: "Une notion sans exemple ne se retient pas. Pour chaque définition / propriété / règle, ajoute au moins un exemple traité.",
    },
    {
        title: "Espace tes révisions",
        text: "Mieux vaut relire 5 fois ta fiche sur 2 semaines qu'une fois pendant 1h la veille. Pense à la dater et à la relire régulièrement.",
    },
];
