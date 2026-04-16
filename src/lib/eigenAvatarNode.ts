import { createCanvas } from "canvas";
import {
    setCreateCanvasHandle,
    canvasToBuffer,
    Interference,
    Plasma,
    Smile,
    Pixels,
} from "eigen-avatar-generator";
import { COLOR_SETS, PIXELS_GRADIENT, getEigenThemeIndex } from "./eigenAvatarShared";

let nodeCanvasReady = false;

function ensureNodeCanvas(): void {
    if (!nodeCanvasReady) {
        setCreateCanvasHandle((w: number, h: number) => createCanvas(w, h));
        nodeCanvasReady = true;
    }
}

/**
 * Génère un PNG (Buffer) identique au rendu web pour le même id / taille.
 */
export function generateEigenAvatarPngBuffer(id: string, size: number): Buffer {
    ensureNodeCanvas();
    const themeIndex = getEigenThemeIndex(id);
    const common = { id, size };
    const colorSetProps = { foreground: COLOR_SETS };
    const pixelsProps = { foreground: PIXELS_GRADIENT, interpolate: true };

    let canvas;
    switch (themeIndex) {
        case 0:
            canvas = Interference.generateAvatar({ ...common, ...colorSetProps });
            break;
        case 1:
            canvas = Plasma.generateAvatar({ ...common, ...colorSetProps });
            break;
        case 2:
            canvas = Smile.generateAvatar({ ...common, ...colorSetProps });
            break;
        default:
            canvas = Pixels.generateAvatar({ ...common, ...pixelsProps });
            break;
    }

    return canvasToBuffer(canvas, "image/png");
}
