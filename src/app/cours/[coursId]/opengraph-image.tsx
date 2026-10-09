import { courseImage } from "@/lib/og/images";

// Image de partage générée (réseaux sociaux, Discord, WhatsApp…)
export const runtime = "nodejs";
export const alt = "Cours sur Workyt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ coursId: string }> }) {
    const { coursId } = await params;
    return courseImage(decodeURIComponent(coursId));
}
