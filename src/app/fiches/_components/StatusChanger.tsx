"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface StatusChangerProps {
    ficheId: string;
    currentStatus: "Non Certifiée" | "Certifiée" | "Vérifiée"; // Les statuts possibles
    onStatusChange: (newStatus: "Non Certifiée" | "Certifiée" | "Vérifiée") => void; // Callback après mise à jour
}

const StatusChanger: React.FC<StatusChangerProps> = ({ ficheId, currentStatus, onStatusChange }) => {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const statuses = ["Non Certifiée", "Certifiée", "Vérifiée"] as const;

    const handleStatusChange = async (newStatus: typeof statuses[number]) => {
        if (loading || currentStatus === newStatus) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/fiches/${ficheId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${(session as any)?.accessToken || ""}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de la mise à jour du statut.");
            }

            const data = await response.json();
            onStatusChange(data.data.status); // Met à jour le statut localement
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm text-gray-600">Statut actuel :</p>
                <p className="text-lg font-semibold">{currentStatus}</p>
            </div>
            <div className="flex gap-4">
                {statuses.map((status) => (
                    <Button
                        key={status}
                        variant={currentStatus === status ? "default" : "outline"}
                        onClick={() => handleStatusChange(status)}
                        disabled={loading || currentStatus === status}
                    >
                        {status}
                    </Button>
                ))}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );
};

export default StatusChanger;
