"use client";

import React, { useMemo } from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

/**
 * Rend un texte d'énoncé en interprétant les formules LaTeX : `$…$` en ligne,
 * `$$…$$` en bloc. Le reste du texte est rendu tel quel.
 *
 * Extrait du lecteur de quiz pour être partagé par les énoncés, les options de
 * réponse et l'écran de résultats — auparavant la fonction était redéfinie à
 * chaque rendu du lecteur, ce qui recréait tous les noeuds à chaque seconde du
 * chronomètre.
 */
function LatexText({ text }: { text: string }) {
    const parts = useMemo(() => text.split(/(\$\$.*?\$\$|\$.*?\$)/g), [text]);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
                    return (
                        <div key={index} className="my-2">
                            <BlockMath math={part.slice(2, -2)} />
                        </div>
                    );
                }

                if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
                    return (
                        <span key={index}>
                            <InlineMath math={part.slice(1, -1)} />
                        </span>
                    );
                }

                return <span key={index}>{part}</span>;
            })}
        </>
    );
}

export default React.memo(LatexText);
