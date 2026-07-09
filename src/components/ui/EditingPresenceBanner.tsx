"use client";

import { useSession } from "next-auth/react";
import { AlertTriangle } from "lucide-react";
import { useThreadRealtime } from "@/hooks/useThreadRealtime";

/**
 * Phase 2 (collaboration) — bandeau de présence d'édition.
 *
 * Quand plusieurs personnes ouvrent le même éditeur (cours / leçon / quiz),
 * il avertit : « X modifie aussi ce contenu ». Combiné au verrou optimiste
 * (Phase 1), ça évite les collisions ET la perte de données.
 *
 * La room est de la forme `edit:course:<id>`, `edit:lesson:<id>`, `edit:quiz:<id>`.
 * Le simple montage/démontage du composant gère l'entrée/sortie de la room.
 */
export default function EditingPresenceBanner({
    room,
    label = "ce contenu",
}: {
    room: string | undefined;
    label?: string;
}) {
    const { data: session } = useSession();
    const myId = (session?.user as unknown as { id?: string })?.id;
    const { presentMembers } = useThreadRealtime(room, () => {});

    const others = presentMembers.filter((m) => m.userId !== myId);
    if (others.length === 0) return null;

    const names = others
        .slice(0, 3)
        .map((m) => m.username || "un membre")
        .join(", ");

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
                {others.length === 1
                    ? `${names} modifie aussi ${label} en ce moment — attention aux conflits.`
                    : `${names}${others.length > 3 ? "…" : ""} modifient aussi ${label} en ce moment — attention aux conflits.`}
            </span>
        </div>
    );
}
