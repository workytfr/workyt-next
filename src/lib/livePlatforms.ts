export type PlatformType = "youtube" | "google_meet" | "discord" | "instagram" | "twitch";

export interface IPlatform {
    type: PlatformType;
    url: string;
}

export const PLATFORM_CONFIG: Record<
    PlatformType,
    {
        label: string;
        chipColor: string;
        buttonColor: string;
        placeholder: string;
        actionLabel: string;
        actionLabelLive: string;
    }
> = {
    youtube: {
        label: "YouTube",
        chipColor: "bg-red-100 text-red-700 border border-red-200",
        buttonColor: "bg-red-600 hover:bg-red-700 text-white",
        placeholder: "https://youtube.com/watch?v=... ou ID vidéo (11 car.)",
        actionLabel: "Voir sur YouTube",
        actionLabelLive: "Regarder le live YouTube",
    },
    google_meet: {
        label: "Google Meet",
        chipColor: "bg-blue-100 text-blue-700 border border-blue-200",
        buttonColor: "bg-blue-600 hover:bg-blue-700 text-white",
        placeholder: "https://meet.google.com/xxx-xxxx-xxx",
        actionLabel: "Rejoindre Google Meet",
        actionLabelLive: "Rejoindre Google Meet",
    },
    discord: {
        label: "Discord",
        chipColor: "bg-indigo-100 text-indigo-700 border border-indigo-200",
        buttonColor: "bg-indigo-600 hover:bg-indigo-700 text-white",
        placeholder: "https://discord.gg/...",
        actionLabel: "Rejoindre Discord",
        actionLabelLive: "Rejoindre Discord",
    },
    instagram: {
        label: "Instagram",
        chipColor: "bg-pink-100 text-pink-700 border border-pink-200",
        buttonColor: "bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white",
        placeholder: "https://www.instagram.com/workyt/",
        actionLabel: "Voir sur Instagram",
        actionLabelLive: "Rejoindre le live Instagram",
    },
    twitch: {
        label: "Twitch",
        chipColor: "bg-purple-100 text-purple-700 border border-purple-200",
        buttonColor: "bg-purple-600 hover:bg-purple-700 text-white",
        placeholder: "https://www.twitch.tv/...",
        actionLabel: "Voir sur Twitch",
        actionLabelLive: "Regarder le live Twitch",
    },
};

export function extractYoutubeId(input: string): string | null {
    const urlMatch = input.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (urlMatch) return urlMatch[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
    return null;
}
