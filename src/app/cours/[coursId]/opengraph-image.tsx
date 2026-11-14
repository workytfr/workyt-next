import { courseImage } from "@/lib/og/images";

// Image de partage générée (réseaux sociaux, Discord, WhatsApp…)
export const runtime = "nodejs";
export const alt = "Cours sur Workyt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Image générée une fois puis gardée en cache 24 h : sans ça, chaque passage
// d'un robot (Discord, WhatsApp, X…) refaisait le rendu complet (base, images,
// PDF pour les fiches), soit un pic de mémoire et de CPU à chaque partage.
export const revalidate = 86400;
export function generateStaticParams() {
    return [];
}

export default async function Image({ params }: { params: Promise<{ coursId: string }> }) {
    const { coursId } = await params;
    return courseImage(decodeURIComponent(coursId));
}
