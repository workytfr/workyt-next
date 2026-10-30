"use client";

import React, { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

type UploadedImage = { url: string; name: string; size: number };

/**
 * Bouton d'envoi d'image du back-office (stockage public, via /api/media/image).
 * Il a remplacé le bouton UploadThing en gardant les mêmes props : les écrans
 * qui l'utilisent lisent toujours `res[0].url`.
 */
export function UploadButton({
    onClientUploadComplete,
    onUploadError,
    onUploadBegin,
    label = "Choisir une image",
}: {
    /** Conservé pour la compatibilité avec l'ancien bouton UploadThing ; ignoré */
    endpoint?: string;
    onClientUploadComplete?: (res: UploadedImage[]) => void;
    onUploadError?: (error: Error) => void;
    onUploadBegin?: (fileName: string) => void;
    label?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upload = async (file: File) => {
        setUploading(true);
        setError(null);
        onUploadBegin?.(file.name);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch("/api/media/image", { method: "POST", body: form });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.url) throw new Error(data.error || "L'image n'a pas pu être envoyée");
            onClientUploadComplete?.([{ url: data.url, name: data.name ?? file.name, size: data.size ?? file.size }]);
        } catch (err) {
            const e = err instanceof Error ? err : new Error("L'image n'a pas pu être envoyée");
            setError(e.message);
            onUploadError?.(e);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="inline-flex flex-col items-start gap-1">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {uploading ? "Envoi…" : label}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void upload(f);
                }}
            />
            <span className="text-xs text-gray-500">JPEG, PNG, WebP ou GIF · 8 Mo max.</span>
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    );
}

export default UploadButton;
