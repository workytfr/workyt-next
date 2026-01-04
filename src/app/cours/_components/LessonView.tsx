"use client";

import React from "react";
// SUPPRIMER : import ReactDOM from "react-dom";
import {
    FaBook,
    FaLightbulb,
    FaBookOpen,
    FaCalculator,
    FaExclamationCircle,
    FaInfoCircle
} from "react-icons/fa";

// Unified & Rehype
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

// KaTeX
import katex from "katex";
import "katex/dist/katex.min.css";

interface LessonViewProps {
    title: string;
    content: string; // HTML généré
}

const injectCustomCss = () => {
    if (typeof document !== "undefined" && !document.getElementById("lesson-custom-css")) {
        const style = document.createElement("style");
        style.id = "lesson-custom-css";
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800&display=swap');
            @keyframes fadeInUp {
                0% { opacity: 0; transform: translateY(40px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            /* Nouveau fond très doux et granuleux */
            .lesson-bg-animated {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                z-index: 0 !important;
                pointer-events: none;
                background: radial-gradient(circle at 60% 30%, #fff7ed 0%, #fffbe6 100%);
                /* Overlay granuleux subtil en SVG base64 */
                /* Source : https://svgbackgrounds.com/ ou générateur de grain */
                /* Le SVG est très léger et discret */
                opacity: 1;
            }
            .lesson-bg-animated::after {
                content: '';
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none;
                opacity: 0.18;
                background-image: url('data:image/svg+xml;utf8,<svg width="100%25" height="100%25" xmlns="http://www.w3.org/2000/svg"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%25" height="100%25" filter="url(%23grain)" opacity="0.35"/></svg>');
                background-repeat: repeat;
                background-size: cover;
            }
            .lesson-container {
                background: none !important;
                position: relative;
                z-index: 2 !important;
                min-height: 100vh;
                color: #222;
                padding-bottom: 4rem !important;
                width: 100%;
                max-width: 100%;
                overflow-x: hidden;
                padding-top: 0 !important;
            }
            @keyframes gradient-shift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            .lesson-header {
                position: relative;
                z-index: 2;
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1.25rem 1.5rem;
                margin: 0 0.5rem 1.5rem 0.5rem;
                width: fit-content;
                max-width: 100%;
                border-radius: 1rem;
                background: linear-gradient(135deg, rgba(255, 184, 107, 0.15) 0%, rgba(255, 237, 153, 0.1) 50%, rgba(255, 184, 107, 0.15) 100%);
                background-size: 200% 200%;
                animation: gradient-shift 8s ease infinite, fadeInUp 0.6s cubic-bezier(.4,0,.2,1);
                box-shadow: 
                    0 4px 20px rgba(255, 184, 107, 0.2),
                    0 0 0 1px rgba(255, 184, 107, 0.1) inset,
                    0 2px 8px rgba(0, 0, 0, 0.05);
                backdrop-filter: blur(10px) saturate(1.2);
                -webkit-backdrop-filter: blur(10px) saturate(1.2);
                border: 1px solid rgba(255, 184, 107, 0.2);
                overflow: hidden;
            }
            .lesson-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.4),
                    transparent
                );
                animation: shimmer 3s infinite;
            }
            .lesson-header::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(
                    90deg,
                    #ffb86b,
                    #ffd89b,
                    #ffb86b
                );
                background-size: 200% 100%;
                animation: gradient-shift 3s ease infinite;
            }
            .lesson-header h1 {
                font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 1.5rem;
                font-weight: 800;
                letter-spacing: -0.02em;
                background: linear-gradient(135deg, #ff6b35 0%, #ffb86b 50%, #ff8c42 100%);
                background-size: 200% 200%;
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: gradient-shift 5s ease infinite;
                text-shadow: none;
                position: relative;
                z-index: 1;
                line-height: 1.2;
                margin: 0;
            }
            .lesson-header .text-3xl {
                font-size: 1.5rem;
            }
            .lesson-block {
                position: relative;
                padding: 1.75rem 1.5rem;
                margin: 1.75rem 0;
                border-radius: 20px;
                overflow: hidden;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                animation: zoomIn 0.7s cubic-bezier(.4,0,.2,1);
                z-index: 2;
                /* Glassmorphism Apple 2025 */
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 
                    0 8px 32px 0 rgba(0, 0, 0, 0.06),
                    0 2px 8px 0 rgba(0, 0, 0, 0.04),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.5);
                color: #1d1d1f;
            }
            .lesson-block::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, transparent, currentColor, transparent);
                opacity: 0.3;
                border-radius: 20px 20px 0 0;
            }
            .lesson-block.sequential-appear {
                opacity: 0;
                transform: translateY(40px);
                animation: fadeInUp 0.7s cubic-bezier(.4,0,.2,1) forwards;
            }
            .lesson-block:hover {
                transform: translateY(-2px);
                box-shadow: 
                    0 12px 40px 0 rgba(0, 0, 0, 0.08),
                    0 4px 12px 0 rgba(0, 0, 0, 0.06),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.6);
                border-color: rgba(255, 255, 255, 0.4);
            }
            .lesson-block-title {
                font-weight: 700;
                margin-bottom: 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.875rem;
                font-size: 1.125rem;
                letter-spacing: -0.01em;
                color: #1d1d1f;
            }
            .lesson-block-title .block-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.5);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
                flex-shrink: 0;
            }
            .lesson-block-content {
                color: #1d1d1f;
                font-weight: 400;
                font-size: 1rem;
                line-height: 1.7;
                margin-top: 0.5rem;
            }
            .lesson-block-description {
                font-size: 0.875rem;
                color: rgba(29, 29, 31, 0.65);
                margin-bottom: 0.75rem;
                font-style: normal;
                font-weight: 500;
                letter-spacing: -0.01em;
            }
            /* Blocs spécifiques avec glassmorphism coloré */
            .definition-box {
                background: linear-gradient(135deg, rgba(255, 184, 107, 0.15) 0%, rgba(255, 255, 255, 0.7) 100%);
                border-color: rgba(255, 184, 107, 0.3);
            }
            .definition-box::before {
                background: linear-gradient(90deg, transparent, rgba(255, 184, 107, 0.6), transparent);
            }
            .definition-box .block-icon {
                background: linear-gradient(135deg, rgba(255, 184, 107, 0.2), rgba(255, 184, 107, 0.1));
                border-color: rgba(255, 184, 107, 0.3);
            }
            .propriete-box {
                background: linear-gradient(135deg, rgba(110, 193, 228, 0.15) 0%, rgba(255, 255, 255, 0.7) 100%);
                border-color: rgba(110, 193, 228, 0.3);
            }
            .propriete-box::before {
                background: linear-gradient(90deg, transparent, rgba(110, 193, 228, 0.6), transparent);
            }
            .propriete-box .block-icon {
                background: linear-gradient(135deg, rgba(110, 193, 228, 0.2), rgba(110, 193, 228, 0.1));
                border-color: rgba(110, 193, 228, 0.3);
            }
            .theoreme-box {
                background: linear-gradient(135deg, rgba(126, 217, 87, 0.15) 0%, rgba(255, 255, 255, 0.7) 100%);
                border-color: rgba(126, 217, 87, 0.3);
            }
            .theoreme-box::before {
                background: linear-gradient(90deg, transparent, rgba(126, 217, 87, 0.6), transparent);
            }
            .theoreme-box .block-icon {
                background: linear-gradient(135deg, rgba(126, 217, 87, 0.2), rgba(126, 217, 87, 0.1));
                border-color: rgba(126, 217, 87, 0.3);
            }
            .remarque-box {
                background: linear-gradient(135deg, rgba(178, 106, 0, 0.12) 0%, rgba(255, 255, 255, 0.7) 100%);
                border-color: rgba(178, 106, 0, 0.25);
                border-style: dashed;
            }
            .remarque-box::before {
                background: linear-gradient(90deg, transparent, rgba(178, 106, 0, 0.5), transparent);
            }
            .remarque-box .block-icon {
                background: linear-gradient(135deg, rgba(178, 106, 0, 0.15), rgba(178, 106, 0, 0.08));
                border-color: rgba(178, 106, 0, 0.25);
            }
            .attention-box {
                background: linear-gradient(135deg, rgba(255, 127, 80, 0.15) 0%, rgba(255, 255, 255, 0.7) 100%);
                border-color: rgba(255, 127, 80, 0.3);
            }
            .attention-box::before {
                background: linear-gradient(90deg, transparent, rgba(255, 127, 80, 0.6), transparent);
            }
            .attention-box .block-icon {
                background: linear-gradient(135deg, rgba(255, 127, 80, 0.2), rgba(255, 127, 80, 0.1));
                border-color: rgba(255, 127, 80, 0.3);
            }
            .exemple-box {
                background: linear-gradient(135deg, rgba(110, 193, 228, 0.15) 0%, rgba(255, 255, 255, 0.7) 100%);
                border-color: rgba(110, 193, 228, 0.3);
            }
            .exemple-box::before {
                background: linear-gradient(90deg, transparent, rgba(110, 193, 228, 0.6), transparent);
            }
            .exemple-box .block-icon {
                background: linear-gradient(135deg, rgba(110, 193, 228, 0.2), rgba(110, 193, 228, 0.1));
                border-color: rgba(110, 193, 228, 0.3);
            }
            .lesson-content {
                line-height: 1.8;
                width: 100%;
                max-width: 100%;
                overflow-x: hidden;
                word-wrap: break-word;
                overflow-wrap: break-word;
                /* Ne pas définir color ici pour préserver les styles inline */
            }
            .lesson-content p:not([style]) {
                margin-bottom: 1.25rem;
                color: #222;
                word-wrap: break-word;
                overflow-wrap: break-word;
            }
            .lesson-content p[style] {
                margin-bottom: 1.25rem;
                word-wrap: break-word;
                overflow-wrap: break-word;
                /* La couleur vient du style inline */
            }
            .lesson-content p:last-child {
                margin-bottom: 0;
            }
            /* Ne pas surcharger les styles inline - les laisser intacts */
            .lesson-content :not([class^='lesson-block']):not([style]) {
                color: #222;
                background: transparent;
            }
            /* Les éléments avec style inline gardent leur style - IMPORTANT: ne pas utiliser !important */
            .lesson-content [style] {
                /* Les styles inline ont automatiquement la priorité la plus élevée */
            }
            /* S'assurer que les spans avec style inline gardent leur couleur */
            .lesson-content span[style*="color"],
            .lesson-content p[style*="color"],
            .lesson-content div[style*="color"],
            .lesson-content strong[style*="color"],
            .lesson-content em[style*="color"] {
                /* Les styles inline ont la priorité absolue */
            }
            .lesson-content a:not([style]) {
                color: #b26a00;
                text-decoration: underline;
            }
            /* Les liens avec style inline gardent leur couleur */
            .lesson-content a[style*="color"] {
                /* La couleur vient du style inline */
            }
            .lesson-content img {
                filter: none !important;
                opacity: 1 !important;
                background: none !important;
                box-shadow: 0 2px 12px #ffecd1cc;
                max-width: 100% !important;
                width: 100% !important;
                height: auto !important;
                margin: 1.5rem 0;
                display: block;
                object-fit: contain;
            }
            .lesson-content div {
                margin-bottom: 1.25rem;
            }
            .lesson-content div:last-child {
                margin-bottom: 0;
            }
            /* Styles pour les listes à puce - décalage pour différenciation */
            .lesson-content ul,
            .lesson-content ol {
                margin-left: 1.5rem;
                margin-right: 0;
                margin-top: 1rem;
                margin-bottom: 1.25rem;
                padding-left: 0.5rem;
                list-style-position: outside;
            }
            .lesson-content ul {
                list-style-type: disc;
            }
            .lesson-content ol {
                list-style-type: decimal;
            }
            .lesson-content li {
                margin-bottom: 0.5rem;
                padding-left: 0.5rem;
                line-height: 1.8;
            }
            .lesson-content li:last-child {
                margin-bottom: 0;
            }
            /* Listes imbriquées */
            .lesson-content ul ul,
            .lesson-content ol ol,
            .lesson-content ul ol,
            .lesson-content ol ul {
                margin-top: 0.5rem;
                margin-bottom: 0.5rem;
                margin-left: 1.25rem;
            }
            /* Styles pour les tableaux - design moderne et cohérent */
            .lesson-content table {
                width: 100%;
                max-width: 100%;
                margin: 1.5rem 0;
                border-collapse: separate;
                border-spacing: 0;
                background: #fff;
                border-radius: 0.75rem;
                overflow: hidden;
                box-shadow: 
                    0 2px 8px rgba(255, 184, 107, 0.1),
                    0 0 0 1px rgba(255, 184, 107, 0.15);
                font-size: 0.95rem;
            }
            .lesson-content table thead {
                background: linear-gradient(135deg, rgba(255, 184, 107, 0.2) 0%, rgba(255, 237, 153, 0.15) 100%);
            }
            .lesson-content table th {
                padding: 0.875rem 1rem;
                text-align: left;
                font-weight: 700;
                color: #b26a00;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                border-bottom: 2px solid rgba(255, 184, 107, 0.3);
                background: linear-gradient(135deg, rgba(255, 184, 107, 0.15) 0%, rgba(255, 237, 153, 0.1) 100%);
            }
            .lesson-content table th:first-child {
                border-top-left-radius: 0.75rem;
            }
            .lesson-content table th:last-child {
                border-top-right-radius: 0.75rem;
            }
            .lesson-content table tbody tr {
                transition: background-color 0.2s ease;
            }
            .lesson-content table tbody tr:nth-child(even) {
                background: rgba(255, 247, 237, 0.5);
            }
            .lesson-content table tbody tr:nth-child(odd) {
                background: #fff;
            }
            .lesson-content table tbody tr:hover {
                background: rgba(255, 184, 107, 0.1);
            }
            .lesson-content table td {
                padding: 0.875rem 1rem;
                border-bottom: 1px solid rgba(255, 184, 107, 0.1);
                color: #222;
                line-height: 1.6;
            }
            .lesson-content table tbody tr:last-child td {
                border-bottom: none;
            }
            .lesson-content table tbody tr:last-child td:first-child {
                border-bottom-left-radius: 0.75rem;
            }
            .lesson-content table tbody tr:last-child td:last-child {
                border-bottom-right-radius: 0.75rem;
            }
            /* Tableaux responsives */
            .lesson-content table {
                display: block;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }
            .lesson-content table thead,
            .lesson-content table tbody,
            .lesson-content table tr {
                display: table;
                width: 100%;
                table-layout: fixed;
            }
            /* Les styles inline sont automatiquement préservés par le navigateur */
            /* On évite de les surcharger avec des règles CSS */
            .lesson-content h2 {
                font-size: 1.5rem;
                font-weight: 800;
                color: #ffb86b;
                margin-top: 2rem;
                margin-bottom: 1rem;
                position: relative;
                padding-left: 0.75rem;
                letter-spacing: 0.01em;
                text-shadow: 0 2px 12px #ffecd1cc;
            }
            .lesson-content h2::before {
                content: '';
                position: absolute;
                left: 0; top: 0.3rem;
                width: 4px; height: 70%;
                border-radius: 2px;
                background: linear-gradient(180deg, #ffb86b 0%, #fffbe6 100%);
                box-shadow: 0 2px 8px #ffecd1cc;
            }
            .lesson-content h3 {
                font-size: 1.2rem;
                font-weight: 700;
                color: #6ec1e4;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
                border-left: 3px solid #6ec1e4;
                padding-left: 0.5rem;
                background: linear-gradient(90deg, #e0f7fa 0%, #fffbe6 100%);
                border-radius: 0 0.5rem 0.5rem 0;
            }
            .lesson-content h4 {
                font-size: 1rem;
                font-weight: 700;
                color: #b26a00;
                margin-top: 1.25rem;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                display: inline-block;
                padding: 0.15em 0.5em;
                background: #fff7ed;
                border-radius: 0.5em;
                border-bottom: 2px solid #ffb86b;
                box-shadow: 0 1px 4px #ffecd144;
            }
            
            /* Responsive breakpoints */
            @media (min-width: 640px) {
                .lesson-header {
                    gap: 1.5rem;
                    padding: 1.5rem 2rem;
                    margin: 0 1rem 1.75rem 1rem;
                    border-radius: 1.25rem;
                }
                .lesson-header h1 {
                    font-size: 2rem;
                    letter-spacing: -0.025em;
                }
                .lesson-header .text-3xl {
                    font-size: 2rem;
                }
                .lesson-block {
                    padding: 2rem 1.75rem;
                    margin: 2rem 0;
                    border-radius: 24px;
                }
                .lesson-block-title {
                    gap: 1rem;
                    font-size: 1.25rem;
                    margin-bottom: 0.875rem;
                }
                .lesson-block-title .block-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                }
                .lesson-block-content {
                    font-size: 1.05rem;
                    line-height: 1.75;
                }
                .lesson-block-description {
                    font-size: 0.9375rem;
                    margin-bottom: 0.875rem;
                }
                .lesson-content h2 {
                    font-size: 1.8rem;
                    padding-left: 1rem;
                }
                .lesson-content h2::before {
                    width: 5px;
                }
                .lesson-content h3 {
                    font-size: 1.3rem;
                    padding-left: 0.6rem;
                    border-left: 4px solid #6ec1e4;
                }
                .lesson-content h4 {
                    font-size: 1.05rem;
                    padding: 0.18em 0.6em;
                }
                .definition-box, .propriete-box, .theoreme-box, .remarque-box, .attention-box, .exemple-box {
                    border-width: 1.5px;
                }
                .definition-box::before, .propriete-box::before, .theoreme-box::before, 
                .remarque-box::before, .attention-box::before, .exemple-box::before {
                    height: 5px;
                }
                .lesson-content ul,
                .lesson-content ol {
                    margin-left: 2rem;
                    padding-left: 0.75rem;
                }
                .lesson-content li {
                    padding-left: 0.75rem;
                }
                .lesson-content table {
                    font-size: 1rem;
                }
                .lesson-content table th,
                .lesson-content table td {
                    padding: 1rem 1.25rem;
                }
            }
            
            @media (min-width: 768px) {
                .lesson-header {
                    gap: 1.75rem;
                    padding: 1.75rem 2.5rem;
                    margin: 0 2rem 2rem 2rem;
                    border-radius: 1.5rem;
                }
                .lesson-header h1 {
                    font-size: 2.5rem;
                    letter-spacing: -0.03em;
                }
                .lesson-header .text-3xl {
                    font-size: 2.5rem;
                }
                .lesson-block {
                    padding: 1.5rem 1rem 1.5rem 2.5rem;
                    margin: 1.5rem 2rem;
                }
                .lesson-block-title {
                    font-size: 1.25rem;
                }
                .lesson-block-content {
                    font-size: 1.08rem;
                }
                .lesson-content h2 {
                    font-size: 2.1rem;
                    padding-left: 1.1rem;
                }
                .lesson-content h2::before {
                    width: 6px;
                }
                .lesson-content h3 {
                    font-size: 1.4rem;
                    padding-left: 0.7rem;
                    border-left: 4px solid #6ec1e4;
                }
                .lesson-content h4 {
                    font-size: 1.08rem;
                    padding: 0.18em 0.7em;
                }
                .definition-box, .propriete-box, .theoreme-box, .remarque-box, .attention-box, .exemple-box {
                    border-width: 2px;
                }
                .definition-box::before, .propriete-box::before, .theoreme-box::before, 
                .remarque-box::before, .attention-box::before, .exemple-box::before {
                    height: 6px;
                }
                .lesson-content ul,
                .lesson-content ol {
                    margin-left: 2.5rem;
                    padding-left: 1rem;
                }
                .lesson-content li {
                    padding-left: 1rem;
                }
                .lesson-content table {
                    font-size: 1.05rem;
                }
                .lesson-content table th,
                .lesson-content table td {
                    padding: 1.125rem 1.5rem;
                }
            }
            
            @media (min-width: 1024px) {
                .lesson-header {
                    padding: 2rem 3rem;
                    margin: 0 3rem 2rem 3rem;
                    border-radius: 1.75rem;
                }
                .lesson-header h1 {
                    font-size: 2.8rem;
                    letter-spacing: -0.035em;
                }
                .lesson-header .text-3xl {
                    font-size: 2.8rem;
                }
                .lesson-block {
                    padding: 1.5rem 1rem 1.5rem 2.5rem;
                    margin: 1.5rem 3rem;
                }
                .lesson-content h2 {
                    font-size: 2.1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

// Adapter le mapping d'icônes pour les noms français
const blockTypeConfig = {
    "definition": {
        icon: FaBookOpen,
        title: "Définition",
        description: "Une explication précise et concise d'un concept fondamental qui établit une base claire pour la compréhension."
    },
    "propriete": {
        icon: FaCalculator,
        title: "Propriété",
        description: "Une caractéristique ou un attribut spécifique qui décrit le comportement ou les relations d'un concept mathématique."
    },
    "theoreme": {
        icon: FaLightbulb,
        title: "Théorème",
        description: "Un énoncé mathématique démontrable qui établit une relation ou une vérité importante dans un domaine spécifique."
    },
    "remarque": {
        icon: FaInfoCircle,
        title: "Remarque",
        description: "Une observation ou un commentaire additionnel qui apporte des éclaircissements ou des nuances supplémentaires."
    },
    "attention": {
        icon: FaExclamationCircle,
        title: "Attention",
        description: "Un avertissement important ou un point critique à considérer avec une attention particulière."
    },
    "exemple": {
        icon: FaBook,
        title: "Exemple",
        description: "Une illustration concrète pour mieux comprendre le concept."
    }
};

function enhancedStylePlugin() {
    return (tree: any) => {
        visit(tree, (node: any) => {
            // Préserver les styles inline pour tous les éléments
            if (node.type === "element" && node.properties) {
                // S'assurer que les attributs style sont préservés comme des chaînes
                if (node.properties.style) {
                    if (typeof node.properties.style === 'object' && !Array.isArray(node.properties.style)) {
                        // Convertir l'objet style en chaîne
                        const styleObj = node.properties.style;
                        const styleString = Object.entries(styleObj)
                            .map(([key, value]) => {
                                // Convertir camelCase en kebab-case
                                const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                                return `${kebabKey}: ${value}`;
                            })
                            .join('; ');
                        node.properties.style = styleString;
                    }
                    // Si c'est déjà une chaîne, on la garde telle quelle
                }
            }
            
            // Traitement des blocs personnalisés
            // Vérifier à la fois blocktype et data-custom-block
            if (node.type === "element" && node.tagName === "div") {
                // Vérifier si c'est un bloc personnalisé
                let blockType: string | null = null;
                
                // Log de débogage pour voir toutes les propriétés (uniquement en développement)
                if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                    const hasCustomBlock = node.properties?.className && 
                        (Array.isArray(node.properties.className) 
                            ? node.properties.className.some((c: any) => String(c).includes('custom-block'))
                            : String(node.properties.className).includes('custom-block'));
                    
                    if (hasCustomBlock) {
                        console.log('Bloc personnalisé détecté:', {
                            className: node.properties.className,
                            blocktype: node.properties?.blocktype,
                            allProperties: Object.keys(node.properties || {}),
                            properties: node.properties
                        });
                    }
                }
                
                // Méthode 1: Vérifier la classe CSS en premier (plus fiable)
                if (node.properties?.className) {
                    let className: string;
                    if (Array.isArray(node.properties.className)) {
                        className = node.properties.className.join(' ');
                    } else {
                        className = String(node.properties.className);
                    }
                    
                    if (className.includes('custom-block')) {
                        // Essayer plusieurs patterns pour extraire le type
                        const patterns = [
                            /custom-block\s+(\w+)/,  // "custom-block exemple"
                            /\b(\w+)\s+custom-block/, // "exemple custom-block"
                            /custom-block-(\w+)/,     // "custom-block-exemple"
                        ];
                        
                        for (const pattern of patterns) {
                            const match = className.match(pattern);
                            if (match && match[1]) {
                                blockType = match[1];
                                break;
                            }
                        }
                        
                        // Si aucun pattern ne fonctionne, chercher le mot après "custom-block"
                        if (!blockType) {
                            const parts = className.split(/\s+/);
                            const customBlockIndex = parts.findIndex(p => p.includes('custom-block'));
                            if (customBlockIndex >= 0 && customBlockIndex < parts.length - 1) {
                                const nextPart = parts[customBlockIndex + 1];
                                // Vérifier si c'est un type de bloc valide
                                if (nextPart && blockTypeConfig[nextPart as keyof typeof blockTypeConfig]) {
                                    blockType = nextPart;
                                }
                            }
                        }
                    }
                }
                
                // Méthode 2: Vérifier l'attribut blocktype directement
                if (!blockType && node.properties?.blocktype) {
                    blockType = String(node.properties.blocktype);
                }
                
                // Méthode 3: Vérifier toutes les propriétés pour trouver blocktype (peut être dans différentes formes)
                if (!blockType && node.properties) {
                    // Vérifier toutes les clés des propriétés
                    for (const key in node.properties) {
                        if (key.toLowerCase() === 'blocktype') {
                            blockType = String(node.properties[key]);
                            break;
                        }
                    }
                }
                
                // Méthode 4: Vérifier l'attribut data-custom-block
                if (!blockType && node.properties?.['data-custom-block'] !== undefined) {
                    // Si data-custom-block existe mais qu'on n'a pas trouvé le type, utiliser 'remarque' par défaut
                    blockType = 'remarque';
                }
                
                // Si on a trouvé un blockType, traiter le bloc
                if (blockType) {
                    const config = blockTypeConfig[blockType as keyof typeof blockTypeConfig] || blockTypeConfig.remarque;
                    
                    // Gérer le cas où il n'y a pas d'enfants
                    let title = config.title;
                    let remainingChildren = node.children || [];
                    
                    if (remainingChildren.length > 0) {
                        const firstChild = remainingChildren[0];
                        // Si le premier enfant est un strong, l'utiliser comme titre
                        if (firstChild.type === 'element' && firstChild.tagName === 'strong') {
                            // Extraire le texte du strong
                            const extractText = (child: any): string => {
                                if (child.type === 'text') return child.value || '';
                                if (child.type === 'element' && child.children) {
                                    return child.children.map(extractText).join('');
                                }
                                return '';
                            };
                            title = extractText(firstChild) || config.title;
                            remainingChildren = remainingChildren.slice(1);
                        }
                    }
                    
                    // Structure SANS icône (l'icône sera injectée côté React)
                    node.children = [
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['lesson-block-title'] },
                            children: [
                                {
                                    type: 'element',
                                    tagName: 'span',
                                    properties: { className: ['block-icon'], 'data-blocktype': blockType },
                                    children: []
                                },
                                {
                                    type: 'element',
                                    tagName: 'span',
                                    children: [{ type: 'text', value: title }]
                                }
                            ]
                        },
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['lesson-block-description'] },
                            children: [
                                {
                                    type: 'text',
                                    value: config.description
                                }
                            ]
                        },
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['lesson-block-content'] },
                            children: remainingChildren
                        }
                    ];
                    
                    const blockClasses = [
                        `lesson-block`,
                        `${blockType}-box`,
                        "whitespace-normal"
                    ];
                    node.properties = {
                        ...node.properties,
                        className: blockClasses
                    };
                }
            }
        });
    };
}

// Ajouter la fonction utilitaire pour les SVG d'icônes
function getIconSVG(type: string) {
    switch (type) {
        case "definition":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#ffb86b"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>`;
        case "propriete":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#6ec1e4"><path d="M5 12h14M12 5v14"/></svg>`;
        case "theoreme":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#7ed957"><circle cx="12" cy="12" r="10"/></svg>`;
        case "remarque":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#b26a00"><circle cx="12" cy="12" r="10"/></svg>`;
        case "attention":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#ff7f50"><circle cx="12" cy="12" r="10"/></svg>`;
        case "exemple":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#6ec1e4"><rect x="4" y="4" width="16" height="16"/></svg>`;
        default:
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#b26a00"><circle cx="12" cy="12" r="10"/></svg>`;
    }
}

// Rest of the code remains the same as in the previous version...

export default function LessonView({ title, content }: LessonViewProps) {
    // Injecter le CSS personnalisé au montage du composant
    React.useEffect(() => {
        injectCustomCss();
        // Animation séquentielle sur les blocs
        setTimeout(() => {
            if (typeof document !== 'undefined') {
                const blocks = document.querySelectorAll('.lesson-block');
                blocks.forEach((block, i) => {
                    setTimeout(() => {
                        block.classList.add('sequential-appear');
                    }, i * 180);
                });
            }
        }, 200);
        // Injection dynamique des icônes React dans chaque bloc
        setTimeout(() => {
            if (typeof document !== 'undefined') {
                document.querySelectorAll('.block-icon').forEach((iconSpan) => {
                    const type = iconSpan.getAttribute('data-blocktype');
                    if (iconSpan.childNodes.length === 0) {
                        iconSpan.innerHTML = getIconSVG(type as string);
                    }
                });
            }
        }, 400);
    }, []);

    // Transformation du contenu avec préservation des styles inline
    // On traite le HTML pour transformer les blocs personnalisés tout en préservant les styles inline
    let processedHtml: string;
    
    try {
        // Pré-traiter le HTML pour s'assurer que les attributs blocktype sont bien présents
        // Rehype peut ne pas parser correctement les attributs personnalisés
        let preprocessedContent = content;
        
        // Transformer directement les blocs personnalisés en HTML stylisé avant le parsing
        // Cette approche garantit que les blocs sont transformés même si rehype ne les parse pas correctement
        // Utiliser une approche récursive pour gérer les divs imbriqués
        const transformCustomBlocks = (html: string): string => {
            // Pattern pour trouver les divs avec custom-block
            const pattern = /<div\s+([^>]*(?:data-custom-block|blocktype|class="[^"]*custom-block[^"]*")[^>]*)>([\s\S]*?)<\/div>/gi;
            let result = html;
            let match;
            const processed: Set<number> = new Set();
            
            // Trouver toutes les correspondances
            const matches: Array<{ start: number; end: number; attrs: string; content: string }> = [];
            while ((match = pattern.exec(html)) !== null) {
                const start = match.index;
                const end = start + match[0].length;
                matches.push({
                    start,
                    end,
                    attrs: match[1],
                    content: match[2]
                });
            }
            
            // Traiter les correspondances de la fin vers le début pour éviter les problèmes d'index
            for (let i = matches.length - 1; i >= 0; i--) {
                const { start, end, attrs, content } = matches[i];
                
                // Extraire le type depuis blocktype ou la classe
                let blockType: string | null = null;
                
                // Vérifier blocktype dans les attributs
                const blocktypeMatch = attrs.match(/blocktype="([^"]*)"/i);
                if (blocktypeMatch && blocktypeMatch[1]) {
                    blockType = blocktypeMatch[1];
                }
                
                // Sinon, extraire depuis la classe
                if (!blockType) {
                    const classMatch = attrs.match(/class="([^"]*)"/i);
                    if (classMatch && classMatch[1]) {
                        const className = classMatch[1];
                        const typeMatch = className.match(/custom-block\s+(\w+)/);
                        if (typeMatch && typeMatch[1]) {
                            blockType = typeMatch[1];
                        }
                    }
                }
                
                // Si on a trouvé un type de bloc valide, transformer le HTML
                if (blockType && blockTypeConfig[blockType as keyof typeof blockTypeConfig]) {
                    const config = blockTypeConfig[blockType as keyof typeof blockTypeConfig];
                    
                    // Extraire le titre si le premier élément est un <strong>
                    let title = config.title;
                    let blockContent = content.trim();
                    const strongMatch = blockContent.match(/^<strong>([^<]*)<\/strong>/);
                    if (strongMatch && strongMatch[1]) {
                        title = strongMatch[1];
                        blockContent = blockContent.replace(/^<strong>([^<]*)<\/strong>\s*/, '');
                    }
                    
                    // Construire le HTML transformé
                    const transformedHtml = `<div class="lesson-block ${blockType}-box whitespace-normal">
                        <div class="lesson-block-title">
                            <span class="block-icon" data-blocktype="${blockType}"></span>
                            <span>${title}</span>
                        </div>
                        <div class="lesson-block-description">${config.description}</div>
                        <div class="lesson-block-content">${blockContent}</div>
                    </div>`;
                    
                    // Remplacer dans le résultat
                    result = result.substring(0, start) + transformedHtml + result.substring(end);
                }
            }
            
            return result;
        };
        
        preprocessedContent = transformCustomBlocks(preprocessedContent);
        
        // Utiliser une approche qui préserve les attributs style et les attributs personnalisés
        const tree = unified()
            .use(rehypeParse, { 
                fragment: true,
                space: 'html'
            })
            .use(() => {
                // Plugin pour préserver les attributs personnalisés comme blocktype
                return (tree: any) => {
                    visit(tree, (node: any) => {
                        if (node.type === "element" && node.properties) {
                            // S'assurer que tous les attributs sont préservés
                            // rehype-parse devrait déjà les préserver, mais on s'assure qu'ils sont bien là
                        }
                    });
                };
            })
            .use(enhancedStylePlugin)
            .parse(preprocessedContent);
        
        // Convertir l'arbre en HTML en préservant les styles inline
        processedHtml = unified()
            .use(rehypeStringify)
            .stringify(tree);
            
        // Vérification de débogage : s'assurer que les styles inline sont présents
        if (typeof window !== 'undefined' && processedHtml.includes('style=')) {
            // Les styles inline sont présents dans le HTML généré
        }
    } catch (error) {
        // En cas d'erreur, utiliser le contenu original
        console.warn('Erreur lors du traitement HTML, utilisation du contenu original:', error);
        processedHtml = content;
    }

    // Fonction pour transformer le LaTeX en HTML KaTeX
    const transformLatex = (html: string): string => {
        return html.replace(/\$\$(.*?)\$\$|\$(.*?)\$/gs, (match, displayMode, inlineMode) => {
            const formula = displayMode || inlineMode;
            const isDisplayMode = !!displayMode;
            try {
                return katex.renderToString(formula, {
                    displayMode: isDisplayMode,
                    throwOnError: false
                });
            } catch (error) {
                return match;
            }
        });
    };

    const finalHtml = transformLatex(processedHtml);

    return (
        <>
            <div className="lesson-bg-animated" />
            <div className="lesson-container px-4 sm:px-6 md:px-8 pt-0 pb-8 min-h-screen animate-fadeInUp">
                {/* Titre principal */}
                <div className="lesson-header">
                    <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-orange-400/20 to-amber-400/20 backdrop-blur-sm border border-orange-300/30">
                            <FaBook className="text-xl sm:text-2xl md:text-3xl text-orange-600" />
                        </div>
                        <h1 className="animated-gradient-text font-montserrat">
                            {title}
                        </h1>
                    </div>
                </div>
                {/* Contenu principal */}
                <div
                    className="lesson-content max-w-none prose prose-lg max-w-none"
                    style={{ 
                        lineHeight: '1.8'
                        // Ne pas définir color ici pour éviter de surcharger les styles inline des enfants
                    } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: finalHtml }}
                />
            </div>
        </>
    );
}