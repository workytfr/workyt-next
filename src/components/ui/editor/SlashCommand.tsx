'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { Extension, type Editor, type Range } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion';
import { Heading2, Heading3, List, ListOrdered, Table as TableIcon, Code, type LucideIcon } from 'lucide-react';
import { BLOCK_TYPES } from './blockTypes';

/**
 * Menu « / » : taper / en début de ligne ouvre la liste de ce qu'on peut
 * insérer (blocs pédagogiques, titres, listes, tableau). On filtre en tapant
 * (« /def » → Définition), on valide avec Entrée.
 */

interface SlashItem {
    title: string;
    hint: string;
    icon: LucideIcon;
    group: 'Blocs' | 'Mise en forme';
    keywords: string;
    run: (editor: Editor, range: Range) => void;
}

const ITEMS: SlashItem[] = [
    ...BLOCK_TYPES.map<SlashItem>((b) => ({
        title: b.label,
        hint: b.hint,
        icon: b.icon,
        group: 'Blocs',
        keywords: b.type,
        run: (editor, range) => editor.chain().focus().deleteRange(range).setCustomBlock(b.type).run(),
    })),
    {
        title: 'Titre',
        hint: 'Grande partie de la leçon',
        icon: Heading2,
        group: 'Mise en forme',
        keywords: 'h2 titre partie',
        run: (editor, range) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
    },
    {
        title: 'Sous-titre',
        hint: 'Sous-partie',
        icon: Heading3,
        group: 'Mise en forme',
        keywords: 'h3 sous titre',
        run: (editor, range) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
    },
    {
        title: 'Liste à puces',
        hint: 'Tab pour une sous-partie',
        icon: List,
        group: 'Mise en forme',
        keywords: 'liste puces ul',
        run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
        title: 'Liste numérotée',
        hint: 'Étapes dans l\'ordre',
        icon: ListOrdered,
        group: 'Mise en forme',
        keywords: 'liste numero ol etapes',
        run: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
        title: 'Tableau',
        hint: '3 × 3 avec en-tête',
        icon: TableIcon,
        group: 'Mise en forme',
        keywords: 'tableau table',
        run: (editor, range) =>
            editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
        title: 'Code',
        hint: 'Bloc de code',
        icon: Code,
        group: 'Mise en forme',
        keywords: 'code programme',
        run: (editor, range) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
];

// « theoreme » doit trouver « Théorème » : on compare sans accents
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function filterItems(query: string): SlashItem[] {
    const q = norm(query.trim());
    if (!q) return ITEMS;
    return ITEMS.filter((it) => norm(`${it.title} ${it.keywords}`).includes(q));
}

interface MenuHandle {
    onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const SlashMenu = forwardRef<MenuHandle, SuggestionProps<SlashItem>>(function SlashMenu(props, ref) {
    const { items, command } = props;
    const [selected, setSelected] = useState(0);

    // Nouvelle recherche → on repart du premier résultat
    const [prevItems, setPrevItems] = useState(items);
    if (items !== prevItems) {
        setPrevItems(items);
        setSelected(0);
    }

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (items.length === 0) return false;
            if (event.key === 'ArrowDown') {
                setSelected((i) => (i + 1) % items.length);
                return true;
            }
            if (event.key === 'ArrowUp') {
                setSelected((i) => (i - 1 + items.length) % items.length);
                return true;
            }
            if (event.key === 'Enter' || event.key === 'Tab') {
                command(items[selected]);
                return true;
            }
            return false;
        },
    }));

    if (items.length === 0) {
        return <div className="wk-slash-menu wk-slash-menu--empty">Aucun résultat</div>;
    }

    return (
        <div className="wk-slash-menu" role="listbox">
            {items.map((item, index) => {
                const Icon = item.icon;
                const showGroup = index === 0 || items[index - 1].group !== item.group;
                return (
                    <div key={item.title}>
                        {showGroup && <div className="wk-slash-menu__group">{item.group}</div>}
                        <button
                            type="button"
                            role="option"
                            aria-selected={index === selected}
                            className="wk-slash-menu__item"
                            onMouseEnter={() => setSelected(index)}
                            // mousedown : on garde le focus dans l'éditeur
                            onMouseDown={(e) => {
                                e.preventDefault();
                                command(item);
                            }}
                        >
                            <span className="wk-slash-menu__icon"><Icon /></span>
                            <span className="wk-slash-menu__text">
                                <span className="wk-slash-menu__title">{item.title}</span>
                                <span className="wk-slash-menu__hint">{item.hint}</span>
                            </span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
});

/** Positionne le menu sous le curseur, en restant dans la fenêtre. */
function place(el: HTMLElement, rect: DOMRect | null | undefined) {
    if (!rect) return;
    const menuH = el.offsetHeight || 320;
    const below = rect.bottom + 6;
    const top = below + menuH > window.innerHeight ? Math.max(8, rect.top - menuH - 6) : below;
    const left = Math.min(rect.left, window.innerWidth - (el.offsetWidth || 280) - 8);
    el.style.top = `${top}px`;
    el.style.left = `${Math.max(8, left)}px`;
}

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addProseMirrorPlugins() {
        return [
            Suggestion<SlashItem, SlashItem>({
                editor: this.editor,
                char: '/',
                // Pas dans un bloc de code : « / » y est un vrai caractère
                allow: ({ state, range }) => {
                    const $from = state.doc.resolve(range.from);
                    return $from.parent.type.name !== 'codeBlock';
                },
                items: ({ query }) => filterItems(query),
                command: ({ editor, range, props }) => props.run(editor, range),
                render: () => {
                    let renderer: ReactRenderer<MenuHandle, SuggestionProps<SlashItem>> | null = null;
                    let host: HTMLDivElement | null = null;

                    return {
                        onStart: (props) => {
                            renderer = new ReactRenderer(SlashMenu, { props, editor: props.editor });
                            host = document.createElement('div');
                            host.className = 'wk-slash-host';
                            host.appendChild(renderer.element);
                            document.body.appendChild(host);
                            requestAnimationFrame(() => host && place(host, props.clientRect?.()));
                        },
                        onUpdate: (props) => {
                            renderer?.updateProps(props);
                            if (host) place(host, props.clientRect?.());
                        },
                        onKeyDown: (props) => {
                            if (props.event.key === 'Escape') {
                                // Masqué jusqu'à la fin de la saisie : « / » reste du texte
                                if (host) host.style.display = 'none';
                                return true;
                            }
                            if (host?.style.display === 'none') return false;
                            return renderer?.ref?.onKeyDown(props) ?? false;
                        },
                        onExit: () => {
                            host?.remove();
                            renderer?.destroy();
                            host = null;
                            renderer = null;
                        },
                    };
                },
            }),
        ];
    },
});
