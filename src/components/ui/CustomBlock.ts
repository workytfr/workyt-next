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
    content: 'inline*',     // Peut contenir du texte, des inlines
    draggable: false,       // Permettre ou non le drag & drop

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    addAttributes() {
        return {
            blockType: {
                default: 'definition', // Valeur par défaut
            },
        }
    },

    parseHTML() {
        // Reconnaît un <div data-custom-block> dans le HTML
        return [
            {
                tag: 'div[data-custom-block]',
            },
        ]
    },

    renderHTML({ node, HTMLAttributes }) {
        const blockType = node.attrs.blockType
        // Fusion des attributs HTML pour l'élément final
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-custom-block': '',
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
                        return chain()
                            .insertContent({
                                type: this.name, // "customBlock"
                                attrs: { blockType },
                            })
                            .focus()
                            .run()
                    },
        } as Partial<RawCommands>
    },
})
