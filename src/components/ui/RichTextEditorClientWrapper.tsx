"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { createPortal } from "react-dom";
import MascotLoader from "./MascotLoader";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
  // Fallback pendant le téléchargement du chunk de l'éditeur (évite l'écran blanc)
  loading: () => <MascotLoader message="Préparation de l'éditeur…" />,
});

export default function RichTextEditorClientWrapper(props: any) {
  // Callback ref via state : déclenche un re-render dès que le conteneur est attaché,
  // ce qui permet au portail de se monter (corrige le rendu vide au premier affichage).
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setContainer}
      className={props.fullHeight ? "h-full flex flex-col min-h-0" : undefined}
    >
      {container ? (
        createPortal(<RichTextEditor {...props} />, container)
      ) : (
        <MascotLoader message="Préparation de l'éditeur…" />
      )}
    </div>
  );
}
