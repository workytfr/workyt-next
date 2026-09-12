"use client";

import React, { useMemo } from "react";
import CodeMirror, { EditorView, type Extension } from "@uiw/react-codemirror";
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { php } from "@codemirror/lang-php";
import { sql } from "@codemirror/lang-sql";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";

/**
 * Thème Workyt pour CodeMirror : mêmes couleurs que les blocs de code
 * statiques (`code-block.css`), pour que lire et écrire du code sur la
 * plateforme donnent exactement la même impression.
 */
const workytTheme = createTheme({
    theme: "dark",
    settings: {
        background: "transparent",
        backgroundImage: "",
        foreground: "#e8e6e3",
        caret: "#f97316",
        selection: "rgba(249, 115, 22, 0.25)",
        selectionMatch: "rgba(249, 115, 22, 0.15)",
        lineHighlight: "rgba(255, 255, 255, 0.03)",
        gutterBackground: "transparent",
        gutterForeground: "#6b6258",
        gutterBorder: "transparent",
        fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
    },
    styles: [
        { tag: [t.comment, t.quote], color: "#7d7669", fontStyle: "italic" },
        { tag: [t.keyword, t.operatorKeyword, t.modifier], color: "#ff9d5c" },
        { tag: [t.string, t.special(t.string), t.regexp], color: "#9fd28a" },
        { tag: [t.number, t.bool, t.null, t.atom], color: "#e5c07b" },
        { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#7dc4e4" },
        { tag: [t.typeName, t.className, t.namespace], color: "#d9a7e8" },
        { tag: [t.propertyName, t.attributeName], color: "#e8e6e3" },
        { tag: [t.variableName, t.definition(t.variableName)], color: "#e8e6e3" },
        { tag: [t.tagName], color: "#7dc4e4" },
        { tag: [t.meta, t.punctuation, t.bracket], color: "#8a8178" },
        { tag: [t.invalid], color: "#f2777a" },
    ],
});

/** Langages proposés à l'auteur d'un quiz, avec leur extension CodeMirror. */
const LANGUAGE_EXTENSIONS: Record<string, () => Extension> = {
    javascript: () => javascript(),
    typescript: () => javascript({ typescript: true }),
    python: () => python(),
    java: () => java(),
    cpp: () => cpp(),
    c: () => cpp(),
    csharp: () => java(), // syntaxe assez proche pour la coloration
    php: () => php(),
    sql: () => sql(),
    xml: () => html(),
    css: () => css(),
    json: () => json(),
};

/** Le langage a-t-il un mode d'édition dédié ? */
export function hasEditorSupport(language: string | null): boolean {
    return !!language && language in LANGUAGE_EXTENSIONS;
}

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    /** Identifiant normalisé (voir `normalizeLanguage`). */
    language: string | null;
    placeholder?: string;
    minHeight?: string;
    readOnly?: boolean;
    "aria-label"?: string;
}

/**
 * Éditeur de code : coloration à la frappe, indentation automatique,
 * numéros de ligne. Utilisé par les questions de type « Code ».
 *
 * Le composant est lourd (~150 Ko) : il est chargé en `dynamic()` par ses
 * appelants, pour ne peser que sur les quiz qui en ont besoin.
 */
export default function CodeEditor({
    value,
    onChange,
    language,
    placeholder,
    minHeight = "180px",
    readOnly = false,
    "aria-label": ariaLabel,
}: CodeEditorProps) {
    const extensions = useMemo(() => {
        const base = [EditorView.lineWrapping];
        const factory = language ? LANGUAGE_EXTENSIONS[language] : undefined;
        return factory ? [...base, factory()] : base;
    }, [language]);

    return (
        <CodeMirror
            value={value}
            onChange={onChange}
            theme={workytTheme}
            extensions={extensions}
            placeholder={placeholder}
            readOnly={readOnly}
            minHeight={minHeight}
            aria-label={ariaLabel}
            basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                highlightActiveLine: !readOnly,
                highlightActiveLineGutter: !readOnly,
                autocompletion: false,
                searchKeymap: false,
                // L'élève écrit quelques lignes : les aides lourdes de l'IDE
                // encombreraient plus qu'elles n'aideraient.
                bracketMatching: true,
                closeBrackets: true,
                indentOnInput: true,
            }}
        />
    );
}
