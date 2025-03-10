"use client";

import { Button } from "@/components/ui/button";

interface MarkdownBlockButtonsProps {
    onInsert: (text: string) => void;
}

export default function MarkdownBlockButtons({ onInsert }: MarkdownBlockButtonsProps) {
    const blockTemplates: Record<string, string> = {
        "Définition": "::: définition\n**Définition** : Votre texte ici...\n:::",
        "Exemple": "::: exemple\n**Exemple** : Votre texte ici...\n:::",
        "À retenir": "::: a-retenir\n📌 **À retenir** : Votre texte ici...\n:::",
        "Remarque": "::: remarque\n⚠️ **Remarque** : Votre texte ici...\n:::",
        "Propriété": "::: propriété\n📖 **Propriété** : Votre texte ici...\n:::",
        "Théorème": "::: theoreme\n🧠 **Théorème** : Votre texte ici...\n:::",
    };

    return (
        <div className="flex flex-wrap gap-2 mb-2">
            {Object.keys(blockTemplates).map((block) => (
                <Button key={block} type="button" size="sm" onClick={() => onInsert(blockTemplates[block])}>
                    {block}
                </Button>
            ))}
        </div>
    );
}
