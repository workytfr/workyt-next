import { homeImage } from "@/lib/og/images";

// Image de partage générée (réseaux sociaux, Discord, WhatsApp…)
export const runtime = "nodejs";
export const alt = "Workyt, l'entraide scolaire gratuite";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
    return homeImage();
}
