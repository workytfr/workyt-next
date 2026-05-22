// Génère un fond "grainy gradient" déterministe pour la page de garde PDF.
// Le résultat est identique pour un même couple (matière, niveau).

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

function pickHue(subject: string): number {
    const map: Record<string, number> = {
        "mathématiques": 215,
        "maths": 215,
        "physique-chimie": 280,
        "physique": 280,
        "chimie": 290,
        "français": 145,
        "francais": 145,
        "lettres": 145,
        "histoire-géographie": 30,
        "histoire": 30,
        "géographie": 25,
        "svt": 165,
        "sciences": 175,
        "anglais": 245,
        "espagnol": 10,
        "allemand": 50,
        "philosophie": 320,
        "ses": 195,
        "informatique": 200,
        "nsi": 200,
        "technologie": 205,
        "arts": 335,
        "musique": 305,
        "eps": 110,
    };
    const key = subject.toLowerCase().trim();
    if (map[key] != null) return map[key];
    for (const k of Object.keys(map)) {
        if (key.includes(k) || k.includes(key)) return map[k];
    }
    return 22; // fallback : orange Workyt
}

export function generateGradientBackground(
    subject: string,
    level: string,
    width: number,
    height: number,
): string {
    const seed = hashString(`${subject}::${level}`);
    const rand = mulberry32(seed);

    const baseHue = pickHue(subject);
    const hueShift1 = (rand() - 0.5) * 40;
    const hueShift2 = (rand() - 0.5) * 80 + 30;

    const c1 = hsl(baseHue + hueShift1, 70 + rand() * 15, 78 + rand() * 8);
    const c2 = hsl(baseHue + hueShift2, 65 + rand() * 20, 70 + rand() * 10);
    const c3 = hsl((baseHue + 180 + rand() * 30) % 360, 55 + rand() * 15, 88 + rand() * 5);
    const accent = hsl(baseHue, 80, 60);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.fillStyle = c3;
    ctx.fillRect(0, 0, width, height);

    // 4 dégradés radiaux placés aléatoirement et superposés en blend
    const blobs: Array<{ x: number; y: number; r: number; color: string }> = [
        { x: rand() * width, y: rand() * height * 0.6, r: width * (0.5 + rand() * 0.3), color: c1 },
        { x: rand() * width, y: height * (0.4 + rand() * 0.5), r: width * (0.45 + rand() * 0.25), color: c2 },
        { x: rand() * width, y: rand() * height, r: width * (0.35 + rand() * 0.2), color: accent },
        { x: width * (0.2 + rand() * 0.6), y: height * (0.2 + rand() * 0.6), r: width * (0.3 + rand() * 0.2), color: c1 },
    ];

    ctx.globalCompositeOperation = "multiply";
    for (const b of blobs) {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, b.color);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }
    ctx.globalCompositeOperation = "source-over";

    // Voile blanc pour adoucir et garder de la lisibilité
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(0, 0, width, height);

    // Couche de grain
    const grainSize = 1;
    const grainCount = Math.floor((width * height) / 120);
    for (let i = 0; i < grainCount; i++) {
        const x = rand() * width;
        const y = rand() * height;
        const a = 0.04 + rand() * 0.08;
        const v = rand() > 0.5 ? 0 : 255;
        ctx.fillStyle = `rgba(${v},${v},${v},${a})`;
        ctx.fillRect(x, y, grainSize, grainSize);
    }

    // Léger bruit gaussien sur la luminance
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const n = (rand() - 0.5) * 14;
        data[i] = Math.max(0, Math.min(255, data[i] + n));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.85);
}
