"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
    getLanguageLabel,
    highlightToHast,
    normalizeLanguage,
    type HighlightNode,
} from "@/lib/codeHighlight";
import "./code-block.css";

interface CodeBlockProps {
    /** Le code brut à afficher. */
    code: string;
    /** Langage déclaré par l'auteur (« python », « language-js », alias tolérés). */
    language?: string | null;
    /** Affiche la gouttière de numéros de ligne. */
    showLineNumbers?: boolean;
    className?: string;
}

/**
 * Rend les noeuds hast de lowlight en éléments React.
 * L'arbre ne contient que des `span` de classe `hljs-*` et du texte, donc
 * quelques lignes suffisent — inutile de tirer une dépendance de conversion.
 */
function renderNodes(nodes: HighlightNode[], keyPrefix = ""): React.ReactNode {
    return nodes.map((node, index) => {
        const key = `${keyPrefix}-${index}`;

        if (node.type === "text") {
            return <React.Fragment key={key}>{node.value}</React.Fragment>;
        }

        const raw = node.properties?.className;
        const className = Array.isArray(raw) ? raw.join(" ") : raw;

        return (
            <span key={key} className={className}>
                {renderNodes(node.children ?? [], key)}
            </span>
        );
    });
}

/**
 * Bloc de code Workyt : barre de langage, bouton copier, coloration syntaxique.
 * Utilisé partout où du code est rendu par React (exercices, quiz, description
 * de cours). Les leçons produisent le même balisage côté serveur — voir
 * `highlightCodeBlocks` dans `@/lib/codeHighlight`.
 */
export default function CodeBlock({
    code,
    language,
    showLineNumbers = false,
    className = "",
}: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const trimmed = useMemo(() => code.replace(/\n$/, ""), [code]);
    const resolvedLanguage = useMemo(() => normalizeLanguage(language), [language]);
    const nodes = useMemo(
        () => highlightToHast(trimmed, resolvedLanguage),
        [trimmed, resolvedLanguage]
    );
    const lineCount = useMemo(() => trimmed.split("\n").length, [trimmed]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(trimmed);
            setCopied(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setCopied(false), 2000);
        } catch {
            // Presse-papiers indisponible (contexte non sécurisé, permission refusée) :
            // on laisse simplement l'élève sélectionner le code à la main.
        }
    }, [trimmed]);

    return (
        <div
            className={`wk-code ${showLineNumbers ? "wk-code--numbered" : ""} ${className}`.trim()}
            data-language={resolvedLanguage ?? "plaintext"}
        >
            <div className="wk-code__bar">
                <span className="wk-code__lang">{getLanguageLabel(resolvedLanguage)}</span>
                <button
                    type="button"
                    className="wk-code__copy"
                    data-copied={copied}
                    onClick={handleCopy}
                    aria-label={copied ? "Code copié" : "Copier le code"}
                >
                    {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                    {copied ? "Copié" : "Copier"}
                </button>
            </div>

            <pre className="wk-code__pre">
                {showLineNumbers && (
                    <span className="wk-code__gutter" aria-hidden="true">
                        {Array.from({ length: lineCount }, (_, i) => (
                            <span key={i}>{i + 1}</span>
                        ))}
                    </span>
                )}
                <code className={`hljs language-${resolvedLanguage ?? "plaintext"}`}>
                    {renderNodes(nodes)}
                </code>
            </pre>
        </div>
    );
}

/**
 * Surcharges à passer à `<ReactMarkdown components={...}>`.
 *
 * On intercepte `pre` plutôt que `code` : une clôture ```` ```lang ```` produit
 * un `<pre><code class="language-lang">`, tandis que le code inline n'est qu'un
 * `<code>` isolé. Distinguer au niveau du `pre` évite de confondre les deux.
 */
export const markdownCodeComponents = {
    pre({ children }: { children?: React.ReactNode }) {
        const child = React.Children.toArray(children)[0] as React.ReactElement<{
            className?: string;
            children?: React.ReactNode;
        }>;

        if (!React.isValidElement(child)) {
            return <pre>{children}</pre>;
        }

        const code = React.Children.toArray(child.props.children)
            .map((node) => (typeof node === "string" ? node : ""))
            .join("");

        return <CodeBlock code={code} language={child.props.className} />;
    },
};

/**
 * Branche les boutons « Copier » des blocs de code présents dans du HTML
 * injecté (leçons). Un seul écouteur délégué sur le conteneur, pour que les
 * blocs restent du HTML statique rendu côté serveur.
 */
export function useCodeBlockCopy(containerRef: React.RefObject<HTMLElement | null>) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const timers = new Set<ReturnType<typeof setTimeout>>();

        const handleClick = async (event: Event) => {
            const target = event.target as HTMLElement | null;
            const button = target?.closest<HTMLButtonElement>("[data-code-copy]");
            if (!button || !container.contains(button)) return;

            const code = button.closest(".wk-code")?.querySelector("code")?.textContent ?? "";
            if (!code) return;

            try {
                await navigator.clipboard.writeText(code);
            } catch {
                return;
            }

            button.dataset.copied = "true";
            button.textContent = "Copié";

            const timer = setTimeout(() => {
                button.dataset.copied = "false";
                button.textContent = "Copier";
                timers.delete(timer);
            }, 2000);
            timers.add(timer);
        };

        container.addEventListener("click", handleClick);
        return () => {
            container.removeEventListener("click", handleClick);
            timers.forEach(clearTimeout);
        };
    }, [containerRef]);
}
