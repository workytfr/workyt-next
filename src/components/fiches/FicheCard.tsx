"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { PiFireSimpleFill } from "react-icons/pi";
import { MdInfoOutline, MdInsertComment } from "react-icons/md";
import ProfileAvatar from "@/components/ui/profile";
import { levelColors, subjectColors } from "@/data/educationData";

interface Fiche {
    _id: string;
    title: string;
    authors: { username: string; points: number };
    content: string;
    likes: number;
    comments: number;
    status: string;
    level: string;
    subject: string;
    createdAt: string;
}

const FicheCard = ({ fiche, username }: { fiche: Fiche; username: string }) => {
    return (
        <div
            key={fiche._id}
            className="relative flex gap-4 p-4 bg-gray-50 border rounded-lg shadow items-center"
        >
            {/* Icône de statut dans le coin supérieur droit */}
            {fiche.status !== "Non Certifiée" && (
                <div className="absolute top-2 right-2">
                    <Tooltip>
                        <TooltipTrigger>
                            <div className="relative group">
                                <Image
                                    src={`/badge/${fiche.status}.svg`}
                                    alt={`Statut: ${fiche.status}`}
                                    width={30}
                                    height={30}
                                    className="rounded cursor-pointer"
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="flex items-center gap-2">
                                <MdInfoOutline className="text-blue-500" size={16} />
                                <span>
                  Ce badge indique que cette fiche est <strong>{fiche.status}</strong>.
                </span>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </div>
            )}

            {/* Contenu de la carte */}
            <ProfileAvatar username={username || "Inconnu"}/>
            <div className="flex-1">
                {/* Titre cliquable */}
                <Link href={`/fiches/${fiche._id}`}>
                    <h2 className="text-lg font-semibold text-gray-800 hover:underline cursor-pointer">
                        {fiche.title}
                    </h2>
                    <p className="text-sm text-gray-600 break-words line-clamp-2">{fiche.content}</p>
                </Link>
                <div className="mt-2 flex items-center gap-2">
                    <Badge className={levelColors[fiche.level] || "bg-gray-200"}>{fiche.level}</Badge>
                    <Badge className={subjectColors[fiche.subject] || "bg-gray-200"}>{fiche.subject}</Badge>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PiFireSimpleFill className="text-red-500" />
                    {fiche.likes}
                    <MdInsertComment className="text-blue-500" />
                    {fiche.comments}
                </div>
                <p className="text-xs text-gray-500">{new Date(fiche.createdAt).toLocaleDateString("fr-FR")}</p>
            </div>
        </div>
    );
};

export default FicheCard;
