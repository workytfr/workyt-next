"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import MDEditor from "@uiw/react-md-editor";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { ILesson } from "@/models/Lesson";
import MarkdownBlockButtons from "./MarkdownBlockButtons";
import { AlertCircle, BookOpen, Lightbulb, Star, Triangle, Info, ShieldAlert } from "lucide-react";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";


interface ICourse {
    _id: string;
    title: string;
    sections: { _id: string; title: string }[];
}

interface LessonFormProps {
    onSuccess: (lesson: ILesson) => void;
}

export default function LessonForm({ onSuccess }: LessonFormProps) {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [courseId, setCourseId] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);

    useEffect(() => {
        document.body.classList.remove("dark"); // Supprime le mode sombre
        document.body.style.backgroundColor = "white"; // Force le fond en blanc
        document.body.style.color = "black"; // Force le texte en noir
    }, []);

    useEffect(() => {
        async function fetchCourses() {
            if (!session?.accessToken) return;
            setLoadingCourses(true);
            try {
                const res = await fetch(`/api/courses?page=1&limit=10&search=${encodeURIComponent(searchQuery)}`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                setCourses(data.courses || []);
            } catch (error) {
                console.error("Erreur lors du chargement des cours :", error);
            } finally {
                setLoadingCourses(false);
            }
        }
        fetchCourses();
    }, [searchQuery, session?.accessToken]);

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles([...files, ...Array.from(e.target.files)]);
        }
    };

    const handleImageUpload = async (file: File) => {
        // Vérifiez que la session et l'accessToken existent
        if (!session || !session.accessToken) {
            console.error("Utilisateur non authentifié");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });
            if (!res.ok) {
                throw new Error('Erreur lors de l’upload');
            }
            const data = await res.json();
            const imageUrl = data.url; // ex: /uploads/cours/lessons/nom-fichier.jpg

            // Insérer la syntaxe markdown de l'image dans le contenu
            setContent(prev => prev + `\n\n![Texte alternatif](${imageUrl})\n\n`);
        } catch (error) {
            console.error('Upload image error:', error);
        }
    };

    function customDirective() {
        return (tree: any) => {
            visit(tree, (node: any) => {
                if (node.type === "containerDirective") {
                    const data = node.data || (node.data = {});
                    const tagName = node.name;

                    // Mapping des classes Tailwind
                    const classMap: Record<string, string> = {
                        definition: "bg-blue-100 border-l-4 border-blue-500 p-4 rounded-md my-2 shadow-md transition-all duration-200 hover:scale-105 animate-fade-in",
                        propriete: "bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-md my-2 shadow-md transition-all duration-200 hover:scale-105 animate-fade-in",
                        exemple: "bg-green-100 border-l-4 border-green-500 p-4 rounded-md my-2 shadow-md transition-all duration-200 hover:scale-105 animate-fade-in",
                        theoreme: "bg-purple-100 border-l-4 border-purple-500 p-4 rounded-md my-2 shadow-md transition-all duration-200 hover:scale-105 animate-fade-in",
                        remarque: "bg-cyan-100 border-l-4 border-cyan-500 p-4 rounded-md my-2 shadow-md transition-all duration-200 hover:scale-105 animate-fade-in",
                        attention: "bg-red-100 border-l-4 border-red-500 p-4 rounded-md my-2 shadow-md transition-all duration-200 hover:scale-105 animate-fade-in",
                    };

                    if (classMap[tagName]) {
                        data.hName = "div";
                        data.hProperties = { className: classMap[tagName] };
                    }
                }
            });
        };
    }

    const handleInsertBlock = (type: string) => {
        const blockTemplates: Record<string, string> = {
            Definition: `\n\n:::definition\n**Définition :**\n\nVotre définition ici...\n:::\n\n`,
            Propriété: `\n\n:::propriete\n**Propriété :**\n\nVotre propriété ici...\n:::\n\n`,
            Exemple: `\n\n:::exemple\n**Exemple :**\n\nVotre exemple ici...\n:::\n\n`,
            Théorème: `\n\n:::theoreme\n**Théorème :**\n\nVotre théorème ici...\n:::\n\n`,
            Remarque: `\n\n:::remarque\n**Remarque :**\n\nVotre remarque ici...\n:::\n\n`,
            Attention: `\n\n:::attention\n**⚠ Attention :**\n\nMise en garde importante...\n:::\n\n`,
        };
        setContent((prevContent) => prevContent + (blockTemplates[type] || ""));
    };

    // Mapping des composants pour rehype
    const rehypeComponents = {
        div: ({ node, children }: any) => {
            const className = node.properties?.className || "";

            if (className.includes("bg-blue-100")) {
                return <BlockWithIcon icon={<BookOpen className="text-blue-500 w-5 h-5 mr-2" />} title="Définition" className={className}>{children}</BlockWithIcon>;
            }
            if (className.includes("bg-yellow-100")) {
                return <BlockWithIcon icon={<Star className="text-yellow-500 w-5 h-5 mr-2" />} title="Propriété" className={className}>{children}</BlockWithIcon>;
            }
            if (className.includes("bg-green-100")) {
                return <BlockWithIcon icon={<Lightbulb className="text-green-500 w-5 h-5 mr-2" />} title="Exemple" className={className}>{children}</BlockWithIcon>;
            }
            if (className.includes("bg-purple-100")) {
                return <BlockWithIcon icon={<Triangle className="text-purple-500 w-5 h-5 mr-2" />} title="Théorème" className={className}>{children}</BlockWithIcon>;
            }
            if (className.includes("bg-cyan-100")) {
                return <BlockWithIcon icon={<Info className="text-cyan-500 w-5 h-5 mr-2" />} title="Remarque" className={className}>{children}</BlockWithIcon>;
            }
            if (className.includes("bg-red-100")) {
                return <BlockWithIcon icon={<AlertCircle className="text-red-500 w-5 h-5 mr-2" />} title="⚠ Attention" className={className}>{children}</BlockWithIcon>;
            }

            return <div className={className}>{children}</div>;
        },
    };


    const BlockWithIcon = ({ icon, title, children, className }: { icon: JSX.Element; title: string; children: any; className: string }) => (
        <div className={className}>
            <div className="flex items-start">
                {icon}
                <div>
                    <strong>{title} :</strong> {children}
                </div>
            </div>
        </div>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !session.user || !session.accessToken) {
            console.error("Erreur d'authentification : Veuillez vous connecter.");
            return;
        }

        if (!courseId || !sectionId || !title.trim() || !content.trim()) {
            console.error("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("courseId", courseId);
        formData.append("sectionId", sectionId);
        formData.append("title", title);
        formData.append("content", content);
        formData.append("authorId", session.user.id);
        files.forEach((file) => formData.append("media", file));

        try {
            const res = await fetch("/api/lessons", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formData,
            });

            if (!res.ok) throw new Error(await res.text());

            const lesson: ILesson = await res.json();
            onSuccess(lesson);
        } catch (error) {
            console.error("Erreur lors de la création de la leçon", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-h-[80vh] overflow-y-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    placeholder="Rechercher un cours..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <Select onValueChange={setCourseId} disabled={loadingCourses}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choisissez un cours" />
                    </SelectTrigger>
                    <SelectContent>
                        {loadingCourses ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> :
                            courses.map((course) => (
                                <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                            ))
                        }
                    </SelectContent>
                </Select>

                <Select onValueChange={setSectionId} disabled={!courseId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une section" />
                    </SelectTrigger>
                    <SelectContent>
                        {courses.find((course) => course._id === courseId)?.sections.map((section) => (
                            <SelectItem key={section._id} value={section._id}>{section.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input placeholder="Titre de la leçon" value={title} onChange={(e) => setTitle(e.target.value)} />

                <div className="flex space-x-2">
                    {["Definition", "Propriété", "Exemple", "Théorème", "Remarque", "Attention"].map((type) => (
                        <Button key={type} onClick={() => handleInsertBlock(type)} type="button">
                            {type}
                        </Button>
                    ))}
                </div>

                <Button type="button" onClick={() => document.getElementById("image-upload")?.click()}>
                    Ajouter une image
                </Button>
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0]);
                        }
                    }}
                />

                <MDEditor
                    value={content}
                    onChange={(value) => setContent(value || "")}
                    previewOptions={{
                        remarkPlugins: [remarkMath, remarkDirective, customDirective],
                        rehypePlugins: [rehypeKatex],
                        components: rehypeComponents
                    }}
                    height={250}
                />

                <Input type="file" multiple onChange={handleFilesChange} />

                <Button type="submit" disabled={loading || !sectionId}>{loading ? "Création en cours..." : "Créer la leçon"}</Button>
            </form>
        </div>
    );
}
