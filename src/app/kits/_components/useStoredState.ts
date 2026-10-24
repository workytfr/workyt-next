"use client";

import { useEffect, useState } from "react";

/** État mémorisé dans le localStorage (les notes saisies restent après un rechargement). */
export function useStoredState<T>(key: string, initial: T) {
    const [value, setValue] = useState<T>(initial);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(key);
            // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage lisible seulement après le montage
            if (raw) setValue(JSON.parse(raw) as T);
        } catch {
            /* valeur illisible : on garde la valeur initiale */
        }
        setLoaded(true);
    }, [key]);

    useEffect(() => {
        if (loaded) localStorage.setItem(key, JSON.stringify(value));
    }, [key, value, loaded]);

    return [value, setValue] as const;
}
