/**
 * Radio lofi : on n'héberge aucune musique, on intègre le lecteur officiel
 * YouTube d'un direct publié par son ayant droit (intégration autorisée,
 * CJUE BestWater 2014). Domaine youtube-nocookie et chargement uniquement au
 * clic de l'élève, après l'avoir prévenu du dépôt de traceurs par Google.
 */

export interface RadioStation {
    /** Identifiant de la chaîne : son direct en cours est résolu par /api/pomodoro/radio */
    id: string;
    label: string;
    channel: string;
}

export const RADIO_STATIONS: RadioStation[] = [
    { id: "UCSJ4gkVC6NrvII8umztf0Ow", label: "Le direct lofi du moment", channel: "Lofi Girl" },
    { id: "UCOxqgCwgOqC2lMqC5PYz_Dg", label: "Le direct chillhop du moment", channel: "Chillhop Music" },
];

export function radioEmbedUrl(videoId: string): string {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
}
