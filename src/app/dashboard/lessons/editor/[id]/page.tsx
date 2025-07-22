"use client";
import { useParams } from "next/navigation";
import RichTextEditor from "@/components/ui/RichTextEditorClientWrapper";
import { useState } from "react";

export default function LessonEditorPage() {
  const { id } = useParams();
  const [content, setContent] = useState(""); // Charger le contenu existant si besoin

  return (
    <div className="p-8">
      <h1>Édition de la leçon {id}</h1>
      <RichTextEditor content={content} onChange={setContent} />
      {/* Ajoute ici un bouton pour sauvegarder, etc. */}
    </div>
  );
} 