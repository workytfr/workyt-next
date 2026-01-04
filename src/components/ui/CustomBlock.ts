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
    content: 'paragraph*', // Permettre des paragraphes pour mieux gérer le HTML complexe
    draggable: false,       // Permettre ou non le drag & drop
    inline: false,          // C'est un bloc, pas inline
    atom: false,            // Le contenu peut être édité

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
                // Le contenu HTML à l'intérieur sera automatiquement parsé par TipTap
                // TipTap reconnaîtra les éléments inline comme <strong>, <br>, etc.
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
        // Fusion des attributs HTML pour l'élément final
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-custom-block': '',
                'blocktype': blockType, // Ajouter blocktype pour compatibilité
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
