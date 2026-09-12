// Configuration ESLint « flat » (ESLint 9+).
//
// ESLint 10 ne lit plus `.eslintrc.json`, et `next lint` a été retiré de
// Next.js 16 : sans ce fichier, plus aucun lint ne tournait. eslint-config-next
// exporte déjà des tableaux de config plats, il suffit de les étaler.

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
    {
        ignores: [
            ".next/**",
            "node_modules/**",
            "out/**",
            "build/**",
            "coverage/**",
            "public/**",
            "next-env.d.ts",
            // Outils et dossiers hors application
            ".qoder/**",
            ".design-ref/**",
            "claude-seo/**",
            "docs/**",
            "*.py",
        ],
    },

    ...nextCoreWebVitals,
    ...nextTypescript,

    {
        rules: {
            // Le code existant utilise largement `any` sur les réponses d'API
            // et les documents Mongoose : on le signale sans bloquer.
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    // Les déstructurations servent aussi à retirer des champs
                    // (ex. expurger correctAnswer d'un quiz) : la variable
                    // n'est alors pas destinée à être utilisée.
                    ignoreRestSiblings: true,
                },
            ],
        },
    },

    {
        // Les scripts de maintenance sont exécutés à la main, hors bundle.
        files: ["scripts/**/*.{js,mjs,cjs,ts}"],
        rules: {
            "no-console": "off",
            "@typescript-eslint/no-require-imports": "off",
        },
    },
];

export default config;
