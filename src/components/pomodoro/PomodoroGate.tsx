"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { hasSavedTimer } from "./pomodoroStore";

/**
 * Charge le moteur du Pomodoro seulement quand il sert : sur /kits/pomodoro,
 * ou si un minuteur sauvegardé dans ce navigateur tourne ou est en pause (le
 * widget flottant et la radio le suivent alors sur tout le site). Les autres
 * visiteurs ne téléchargent ni le minuteur, ni les sons, ni la radio.
 *
 * Une fois monté, le moteur reste en place jusqu'au rechargement de la page,
 * comme quand il était un provider global.
 */
const PomodoroEngine = dynamic(() => import("./PomodoroEngine"), { ssr: false });

const POMODORO_PATH = "/kits/pomodoro";

export default function PomodoroGate({ showWidget }: { showWidget: boolean }) {
    const pathname = usePathname();
    const [needed, setNeeded] = useState(false);

    useEffect(() => {
        if (needed) return;
        // localStorage n'existe qu'après le montage : lecture dans l'effet
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (pathname?.startsWith(POMODORO_PATH) || hasSavedTimer()) setNeeded(true);
    }, [pathname, needed]);

    return needed ? <PomodoroEngine showWidget={showWidget} /> : null;
}
