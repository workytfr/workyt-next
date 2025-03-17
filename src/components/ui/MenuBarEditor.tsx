import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    Italic,
    List,
    ListOrdered,
    Strikethrough,
    Image as ImageIcon,
    Code,
    Table as TableIcon,
    AlertCircle,
    BookOpen,
    Lightbulb,
    Star,
    Triangle,
    Info,
} from "lucide-react";
import { Toggle } from "./Toggle";
import { Editor } from "@tiptap/react";
import { UploadButton } from "@/utils/uploadthing";

export default function MenuBarEditor({ editor }: { editor: Editor | null }) {
    if (!editor) return null;

    // Boutons de mise en forme de base (titres, gras, alignements, etc.)
    const baseOptions = [
        {
            icon: <Heading1 className="size-4" />,
            onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
            preesed: editor.isActive("heading", { level: 1 }),
        },
        {
            icon: <Heading2 className="size-4" />,
            onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            preesed: editor.isActive("heading", { level: 2 }),
        },
        {
            icon: <Heading3 className="size-4" />,
            onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
            preesed: editor.isActive("heading", { level: 3 }),
        },
        {
            icon: <Bold className="size-4" />,
            onClick: () => editor.chain().focus().toggleBold().run(),
            preesed: editor.isActive("bold"),
        },
        {
            icon: <Italic className="size-4" />,
            onClick: () => editor.chain().focus().toggleItalic().run(),
            preesed: editor.isActive("italic"),
        },
        {
            icon: <Strikethrough className="size-4" />,
            onClick: () => editor.chain().focus().toggleStrike().run(),
            preesed: editor.isActive("strike"),
        },
        {
            icon: <AlignLeft className="size-4" />,
            onClick: () => editor.chain().focus().setTextAlign("left").run(),
            preesed: editor.isActive({ textAlign: "left" }),
        },
        {
            icon: <AlignCenter className="size-4" />,
            onClick: () => editor.chain().focus().setTextAlign("center").run(),
            preesed: editor.isActive({ textAlign: "center" }),
        },
        {
            icon: <AlignRight className="size-4" />,
            onClick: () => editor.chain().focus().setTextAlign("right").run(),
            preesed: editor.isActive({ textAlign: "right" }),
        },
        {
            icon: <List className="size-4" />,
            onClick: () => editor.chain().focus().toggleBulletList().run(),
            preesed: editor.isActive("bulletList"),
        },
        {
            icon: <ListOrdered className="size-4" />,
            onClick: () => editor.chain().focus().toggleOrderedList().run(),
            preesed: editor.isActive("orderedList"),
        },
        {
            icon: <Highlighter className="size-4" />,
            onClick: () => editor.chain().focus().toggleHighlight().run(),
            preesed: editor.isActive("highlight"),
        },
        {
            icon: <Code className="size-4" />,
            onClick: () => editor.chain().focus().toggleCodeBlock().run(),
            preesed: editor.isActive("codeBlock"),
        },
        {
            icon: <TableIcon className="size-4" />,
            onClick: () =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
            preesed: false,
        },
    ];

    // Boutons de couleur pastel
    const pastelColors = [
        { color: "#77dd77" }, // Vert
        { color: "#aec6cf" }, // Bleu
        { color: "#ff6961" }, // Rouge
        { color: "#ffb347" }, // Orange
    ];
    const colorOptions = pastelColors.map(({ color }) => ({
        icon: <span style={{ color, fontWeight: "bold" }}>A</span>,
        onClick: () => editor.chain().focus().setColor(color).run(),
        preesed: editor.isActive("textStyle", { color }),
    }));

    // Boutons pour insérer des blocs personnalisés via la commande setCustomBlock
    const customBlocks = [
        {
            label: "Definition",
            icon: <BookOpen className="size-4" />,
            blockType: "definition",
        },
        {
            label: "Propriété",
            icon: <Star className="size-4" />,
            blockType: "propriete",
        },
        {
            label: "Exemple",
            icon: <Lightbulb className="size-4" />,
            blockType: "exemple",
        },
        {
            label: "Théorème",
            icon: <Triangle className="size-4" />,
            blockType: "theoreme",
        },
        {
            label: "Remarque",
            icon: <Info className="size-4" />,
            blockType: "remarque",
        },
        {
            label: "Attention",
            icon: <AlertCircle className="size-4" />,
            blockType: "attention",
        },
    ];
    const customBlockButtons = customBlocks.map((block) => ({
        icon: block.icon,
        onClick: () => editor.chain().focus().setCustomBlock(block.blockType).run(),
        preesed: false,
    }));

    return (
        <div className="border rounded-md p-1 mb-1 bg-slate-50 flex flex-wrap items-center gap-2">
            {/* Boutons de mise en forme de base */}
            {baseOptions.map((option, index) => (
                <Toggle key={index} pressed={option.preesed} onPressedChange={option.onClick}>
                    {option.icon}
                </Toggle>
            ))}

            {/* Boutons de couleurs */}
            {colorOptions.map((option, index) => (
                <Toggle key={`color-${index}`} pressed={option.preesed} onPressedChange={option.onClick}>
                    {option.icon}
                </Toggle>
            ))}

            {/* Boutons de blocs custom */}
            {customBlockButtons.map((option, index) => (
                <Toggle key={`custom-${index}`} pressed={option.preesed} onPressedChange={option.onClick}>
                    {option.icon}
                </Toggle>
            ))}

            {/* Bouton UploadThing pour l'insertion d'image */}
            <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                        const imageUrl = res[0].url;
                        editor.chain().focus().setImage({ src: imageUrl, alt: "Image uploadée via UploadThing" }).run();
                    }
                }}
                onUploadError={(error: Error) => {
                    console.error("Erreur lors de l'upload:", error.message);
                }}
            />
        </div>
    );
}
