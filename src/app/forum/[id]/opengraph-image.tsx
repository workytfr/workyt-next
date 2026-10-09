import { questionImage } from "@/lib/og/images";

// Image de partage générée (réseaux sociaux, Discord, WhatsApp…)
export const runtime = "nodejs";
export const alt = "Question du forum Workyt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return questionImage(decodeURIComponent(id));
}
