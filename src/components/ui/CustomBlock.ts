import { Node, mergeAttributes, RawCommands } from '@tiptap/core'

/**
 * 1. On étend l'interface Commands de Tiptap pour déclarer la commande setCustomBlock.
 *    Ainsi, TypeScript saura qu'elle existe sur `editor.chain()`.
 */
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        customBlock: {
            /**
             * Insère un nœud customBlock avec un attribut blockType (ex: "definition").
             */
            setCustomBlock: (blockType: string) => ReturnType
        }
    }
}

export interface CustomBlockOptions {
    HTMLAttributes: Record<string, any>
}

export const CustomBlock = Node.create<CustomBlockOptions>({
    name: 'customBlock',

    group: 'block',         // Il s'agit d'un bloc
    content: 'block*',      // Accepter tout type de bloc (paragraphes, listes, tables, etc.)
    draggable: false,        // Permettre ou non le drag & drop
    inline: false,           // C'est un bloc, pas inline
    atom: false,             // Le contenu peut être édité
    defining: true,          // Le bloc garde son type quand on colle du contenu dedans
    isolating: true,         // Empêche certaines opérations de traverser la frontière du bloc

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    addAttributes() {
        return {
            blockType: {
                default: 'definition', // Valeur par défaut
                parseHTML: element => {
                    // Essayer d'abord l'attribut blocktype
                    const blockType = element.getAttribute('blocktype');
                    if (blockType) {
                        return blockType;
                    }
                    // Sinon, essayer d'extraire depuis la classe CSS (ex: "custom-block definition")
                    const className = element.getAttribute('class') || '';
                    const match = className.match(/custom-block\s+(\w+)/);
                    if (match && match[1]) {
                        return match[1];
                    }
                    // Par défaut
                    return 'definition';
                },
                rendered: false, // Ne pas rendre blocktype comme attribut HTML
            },
        }
    },

    parseHTML() {
        // Reconnaît un <div data-custom-block> ou <div blocktype="..."> dans le HTML
        return [
            {
                tag: 'div[data-custom-block]',
                getAttrs: (node) => {
                    if (typeof node === 'string') return false;
                    const element = node as HTMLElement;
                    const blockType = element.getAttribute('blocktype') ||
                                     element.className.match(/custom-block\s+(\w+)/)?.[1] ||
                                     'definition';
                    return { blockType };
                },
            },
            {
                tag: 'div[blocktype]',
                getAttrs: (node) => {
                    if (typeof node === 'string') return false;
                    const element = node as HTMLElement;
                    const blockType = element.getAttribute('blocktype') || 'definition';
                    return { blockType };
                },
            },
        ]
    },

    renderHTML({ node, HTMLAttributes }) {
        const blockType = node.attrs.blockType
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-custom-block': '',
                'blocktype': blockType,
                class: `custom-block ${blockType}`,
            }),
            0, // 0 = contenu (enfants) du nœud
        ]
    },

    addCommands() {
        return {
            /**
             * Insère un nœud customBlock dans le document,
             * avec l'attribut "blockType" (ex: "definition", "remarque", etc.)
             */
            setCustomBlock:
                (blockType: string) =>
                    ({ chain }) => {
                        const labels: Record<string, string> = {
                            definition: 'Définition',
                            propriete: 'Propriété',
                            theoreme: 'Théorème',
                            exemple: 'Exemple',
                            remarque: 'Remarque',
                            attention: 'Attention',
                        }
                        const label = labels[blockType] || blockType

                        return chain()
                            .insertContent({
                                type: this.name,
                                attrs: { blockType },
                                content: [
                                    {
                                        type: 'paragraph',
                                        content: [
                                            {
                                                type: 'text',
                                                marks: [{ type: 'bold' }],
                                                text: label,
                                            },
                                        ],
                                    },
                                    {
                                        type: 'paragraph',
                                    },
                                ],
                            })
                            .focus()
                            .run()
                    },
        } as Partial<RawCommands>
    },

    addKeyboardShortcuts() {
        return {
            // Entrée au tout début du bloc → créer un paragraphe AU-DESSUS
            'ArrowUp': ({ editor }) => {
                const { state } = editor
                const { $from } = state.selection

                // Vérifier si on est dans un customBlock
                const blockNode = $from.node($from.depth - 1)
                if (blockNode?.type.name !== this.name) return false

                // Vérifier si on est au début du premier paragraphe du bloc
                const isFirstChild = $from.index($from.depth - 1) === 0
                const isAtStart = $from.parentOffset === 0

                if (isFirstChild && isAtStart) {
                    // Trouver la position du bloc custom dans le document
                    const blockPos = $from.before($from.depth - 1)

                    // Si le bloc est le premier enfant du document, insérer un paragraphe avant
                    if (blockPos === 0) {
                        editor.chain()
                            .insertContentAt(0, { type: 'paragraph' })
                            .setTextSelection(1)
                            .run()
                        return true
                    }
                }

                return false
            },

            // Backspace en début de bloc → si le premier paragraphe est vide, sortir du bloc
            'Backspace': ({ editor }) => {
                const { state } = editor
                const { $from, empty } = state.selection

                if (!empty) return false

                // Vérifier si on est dans un customBlock
                let depth = $from.depth
                let customBlockDepth = -1
                while (depth > 0) {
                    if ($from.node(depth).type.name === this.name) {
                        customBlockDepth = depth
                        break
                    }
                    depth--
                }
                if (customBlockDepth === -1) return false

                // Vérifier si on est au début du premier paragraphe
                const isFirstChild = $from.index(customBlockDepth) === 0
                const isAtStart = $from.parentOffset === 0

                if (isFirstChild && isAtStart) {
                    const blockPos = $from.before(customBlockDepth)

                    // Si le paragraphe est vide et c'est le seul contenu, supprimer le bloc
                    const blockNode = $from.node(customBlockDepth)
                    if (blockNode.childCount === 1 && blockNode.firstChild?.textContent === '') {
                        editor.chain()
                            .deleteRange({ from: blockPos, to: blockPos + blockNode.nodeSize })
                            .insertContentAt(blockPos, { type: 'paragraph' })
                            .run()
                        return true
                    }

                    // Sinon, sortir le contenu du premier paragraphe avant le bloc
                    if (blockPos > 0) {
                        return false // Laisser le comportement par défaut (naviguer vers le paragraphe précédent)
                    }

                    // Si le bloc est au début du document, ajouter un paragraphe avant
                    editor.chain()
                        .insertContentAt(0, { type: 'paragraph' })
                        .setTextSelection(1)
                        .run()
                    return true
                }

                return false
            },

            // Enter à la fin du bloc, sur un paragraphe vide → sortir du bloc (créer paragraphe après)
            'Enter': ({ editor }) => {
                const { state } = editor
                const { $from, empty } = state.selection

                if (!empty) return false

                // Vérifier si on est dans un customBlock
                let depth = $from.depth
                let customBlockDepth = -1
                while (depth > 0) {
                    if ($from.node(depth).type.name === this.name) {
                        customBlockDepth = depth
                        break
                    }
                    depth--
                }
                if (customBlockDepth === -1) return false

                const blockNode = $from.node(customBlockDepth)
                const isLastChild = $from.index(customBlockDepth) === blockNode.childCount - 1
                const currentParagraph = $from.parent
                const isEmpty = currentParagraph.textContent === ''

                // Si on est dans le dernier paragraphe vide du bloc (et au moins 2 enfants)
                if (isLastChild && isEmpty && blockNode.childCount >= 2) {
                    const blockPos = $from.before(customBlockDepth)
                    const blockEnd = blockPos + blockNode.nodeSize

                    // Supprimer le paragraphe vide et créer un nouveau paragraphe après le bloc
                    const tr = state.tr
                    tr.delete($from.before($from.depth), $from.after($from.depth))

                    // Recalculer la fin du bloc après suppression
                    const newBlockEnd = blockEnd - currentParagraph.nodeSize - 2
                    tr.insert(newBlockEnd, state.schema.nodes.paragraph.create())
                    tr.setSelection(
                        // @ts-ignore
                        state.selection.constructor.near(tr.doc.resolve(newBlockEnd + 1))
                    )

                    editor.view.dispatch(tr)
                    return true
                }

                return false
            },
        }
    },
})
