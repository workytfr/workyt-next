"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false });

export default function RichTextEditorClientWrapper(props: any) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div ref={containerRef}>
      {containerRef.current
        ? createPortal(<RichTextEditor {...props} />, containerRef.current)
        : null}
    </div>
  );
} 