import {
    AlertTriangle,
    Book,
    FileText,
    Info,
    Layers,
    Lightbulb,
    type LucideIcon,
} from "lucide-react";

/**
 * Blocs pédagogiques de l'éditeur. Mêmes types, libellés et icônes que le
 * rendu publié (LessonView + styles/lesson-blocks.css) : ce qu'on voit en
 * écrivant est ce que l'élève verra.
 */
export interface BlockTypeDef {
    type: string;
    label: string;
    hint: string;
    icon: LucideIcon;
}

export const BLOCK_TYPES: BlockTypeDef[] = [
    { type: "definition", label: "Définition", hint: "Le sens exact d'un mot ou d'une notion", icon: Book },
    { type: "propriete", label: "Propriété", hint: "Une règle qui s'applique toujours", icon: FileText },
    { type: "theoreme", label: "Théorème", hint: "Un résultat démontré", icon: Layers },
    { type: "exemple", label: "Exemple", hint: "Un cas concret pour comprendre", icon: Lightbulb },
    { type: "remarque", label: "Remarque", hint: "Une précision utile", icon: Info },
    { type: "attention", label: "Attention", hint: "Un piège ou une erreur fréquente", icon: AlertTriangle },
];

export const BLOCK_TYPE_BY_KEY: Record<string, BlockTypeDef> = Object.fromEntries(
    BLOCK_TYPES.map((b) => [b.type, b])
);
