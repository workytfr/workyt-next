import { profileImage } from "@/lib/og/images";

// Image de partage générée (réseaux sociaux, Discord, WhatsApp…)
export const runtime = "nodejs";
export const alt = "Profil Workyt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Image générée une fois puis gardée en cache 6 h (l'avatar et la bordure peuvent changer) : sans ça, chaque passage
// d'un robot (Discord, WhatsApp, X…) refaisait le rendu complet (base, images,
// PDF pour les fiches), soit un pic de mémoire et de CPU à chaque partage.
export const revalidate = 21600;
export function generateStaticParams() {
    return [];
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return profileImage(decodeURIComponent(id));
}
