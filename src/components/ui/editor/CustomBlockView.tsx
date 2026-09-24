'use client';

import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { BLOCK_TYPE_BY_KEY } from './blockTypes';
import '@/app/cours/_components/styles/lesson-blocks.css';

/**
 * Affichage d'un bloc pédagogique PENDANT la rédaction : même carte, même
 * tuile d'icône et même libellé que sur la leçon publiée. L'en-tête n'est pas
 * éditable (il n'existe pas dans le HTML enregistré, LessonView le recrée).
 */
export default function CustomBlockView({ node }: ReactNodeViewProps) {
    const type: string = node.attrs.blockType;
    const def = BLOCK_TYPE_BY_KEY[type] ?? BLOCK_TYPE_BY_KEY.remarque;
    const Icon = def.icon;

    return (
        <NodeViewWrapper className={`wk-block wk-block--${def.type} wk-block--editing`}>
            <div className="wk-block__head" contentEditable={false}>
                <span className="wk-block__icon">
                    <Icon />
                </span>
                <span className="wk-block__heading">
                    <span className="wk-block__label">{def.label}</span>
                </span>
            </div>
            <NodeViewContent className="wk-block__body" />
        </NodeViewWrapper>
    );
}
