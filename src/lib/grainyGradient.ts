import { createCanvas } from 'canvas';

/**
 * Fond « grainy gradient » organique et fluide, généré côté serveur (node-canvas),
 * pour la carte d'adhérent. Déterministe à partir d'un seed (n° d'adhérent) :
 * chaque carte a son propre dégradé unique, mais identique au re-téléchargement.
 *
 * Inspiré de fiches/_components/pdfBackground.ts (version client).
 */

function hashString(s: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hsl(h: number, s: number, l: number) {
    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/**
 * @param seed   chaîne unique (ex. numéro d'adhérent)
 * @param baseHue teinte dominante (alignée sur le statut)
 * @param width  largeur en px
 * @param height hauteur en px
 */
export function generateCardGradient(
    seed: string,
    baseHue: number,
    width: number,
    height: number
): string {
    const rand = mulberry32(hashString(seed));

    const hueShift1 = (rand() - 0.5) * 50;
    const hueShift2 = (rand() - 0.5) * 90 + 30;

    const c1 = hsl(baseHue + hueShift1, 78 + rand() * 14, 62 + rand() * 10);
    const c2 = hsl(baseHue + hueShift2, 70 + rand() * 20, 56 + rand() * 12);
    const c3 = hsl((baseHue + 180 + rand() * 40) % 360, 60 + rand() * 18, 70 + rand() * 8);
    const accent = hsl(baseHue, 90, 60);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Base
    ctx.fillStyle = c3;
    ctx.fillRect(0, 0, width, height);

    // Blobs organiques : ellipses pivotées superposées en multiply
    const palette = [c1, c2, accent, c1, c2, c3, accent];
    const blobCount = 7;
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < blobCount; i++) {
        const bx = rand() * width;
        const by = rand() * height;
        const r = width * (0.32 + rand() * 0.4);
        const rot = rand() * Math.PI;
        const sx = 0.7 + rand() * 0.8;
        const sy = 0.7 + rand() * 0.8;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(rot);
        ctx.scale(sx, sy);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, palette[i % palette.length]);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(-width, -height, width * 2, height * 2);
        ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';

    // ── Domain warp : on tord le champ de couleurs en volutes fluides ──────────
    {
        const src = ctx.getImageData(0, 0, width, height);
        const dst = ctx.createImageData(width, height);
        const s = src.data;
        const d = dst.data;
        const amp = width * (0.05 + rand() * 0.05);
        const fx1 = (Math.PI * 2) / (height * (0.25 + rand() * 0.4));
        const fx2 = (Math.PI * 2) / (height * (0.6 + rand() * 0.5));
        const fy1 = (Math.PI * 2) / (width * (0.25 + rand() * 0.4));
        const fy2 = (Math.PI * 2) / (width * (0.6 + rand() * 0.5));
        const p1 = rand() * 6.28;
        const p2 = rand() * 6.28;
        const p3 = rand() * 6.28;
        const p4 = rand() * 6.28;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = Math.sin(y * fx1 + p1) * amp + Math.sin(y * fx2 + p2) * amp * 0.5;
                const dy = Math.cos(x * fy1 + p3) * amp + Math.cos(x * fy2 + p4) * amp * 0.5;
                let sx2 = (x + dx) | 0;
                let sy2 = (y + dy) | 0;
                if (sx2 < 0) sx2 = 0; else if (sx2 >= width) sx2 = width - 1;
                if (sy2 < 0) sy2 = 0; else if (sy2 >= height) sy2 = height - 1;
                const si = (sy2 * width + sx2) * 4;
                const di = (y * width + x) * 4;
                d[di] = s[si];
                d[di + 1] = s[si + 1];
                d[di + 2] = s[si + 2];
                d[di + 3] = 255;
            }
        }
        ctx.putImageData(dst, 0, 0);
    }

    // Reflet organique : large bande lumineuse diagonale (gloss)
    const glossAngle = rand() * 0.4 - 0.2;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(glossAngle);
    const gloss = ctx.createLinearGradient(-width, 0, width, 0);
    gloss.addColorStop(0, 'rgba(255,255,255,0)');
    gloss.addColorStop(0.45, 'rgba(255,255,255,0.05)');
    gloss.addColorStop(0.5, 'rgba(255,255,255,0.28)');
    gloss.addColorStop(0.55, 'rgba(255,255,255,0.05)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(-width, -height, width * 2, height * 2);
    ctx.restore();

    // Second reflet doux en haut (lumière)
    const topLight = ctx.createLinearGradient(0, 0, 0, height);
    topLight.addColorStop(0, 'rgba(255,255,255,0.22)');
    topLight.addColorStop(0.4, 'rgba(255,255,255,0)');
    ctx.fillStyle = topLight;
    ctx.fillRect(0, 0, width, height);

    // Grain
    const grainCount = Math.floor((width * height) / 90);
    for (let i = 0; i < grainCount; i++) {
        const x = rand() * width;
        const y = rand() * height;
        const a = 0.04 + rand() * 0.08;
        const v = rand() > 0.5 ? 0 : 255;
        ctx.fillStyle = `rgba(${v},${v},${v},${a})`;
        ctx.fillRect(x, y, 1, 1);
    }

    // Bruit gaussien léger sur la luminance
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const n = (rand() - 0.5) * 12;
        data[i] = Math.max(0, Math.min(255, data[i] + n));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.9);
}

/** Teinte dominante selon le type d'adhérent. */
export function hueForType(type: string): number {
    switch (type) {
        case 'benevole': return 150;   // vert
        case 'salarie': return 215;    // bleu
        case 'utilisateur':
        default: return 25;            // orange Workyt
    }
}
