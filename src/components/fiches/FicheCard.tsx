"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { PiFireSimpleFill } from "react-icons/pi";
import { MdInfoOutline, MdInsertComment } from "react-icons/md";
import ProfileAvatar from "@/components/ui/profile";
import SubjectIcon from "@/components/fiches/SubjectIcon";
import { levelColors, subjectColors, subjectGradients } from "@/data/educationData";

interface Fiche {
    _id: string;
    title: string;
    authors: { username: string; points: number; role?: string; _id?: string };
    content: string;
    likes: number;
    comments: number;
    status: string;
    level: string;
    subject: string;
    createdAt: string;
}

const FicheCard = ({ fiche, username }: { fiche: Fiche; username: string }) => {
    const gradient = subjectGradients[fiche.subject] || "from-gray-500 to-gray-400";

    return (
        <div className="group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
            {/* En-tête coloré par matière */}
            <div className={`relative bg-gradient-to-r ${gradient} p-4 pb-6`}>
                {/* Icône matière */}
                <SubjectIcon subject={fiche.subject} size={24} className="text-white/90" />

                {/* Badge de statut */}
                {fiche.status !== "Non Certifiée" && (
                    <div className="absolute top-3 right-3">
                        <Tooltip>
                            <TooltipTrigger>
                                <Image
                                    src={`/badge/${fiche.status}.svg`}
                                    alt={`Statut: ${fiche.status}`}
                                    width={28}
                                    height={28}
                                    className="drop-shadow-md cursor-pointer"
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex items-center gap-2">
                                    <MdInfoOutline className="text-blue-500" size={16} />
                                    <span>Fiche <strong>{fiche.status}</strong></span>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                )}

                {/* Badges niveau & matière */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-0.5 rounded-full">
                        {fiche.level}
                    </Badge>
                    <Badge className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-0.5 rounded-full">
                        {fiche.subject}
                    </Badge>
                </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 p-4 flex flex-col">
                <Link href={`/fiches/${fiche._id}`} className="flex-1">
                    <h2 className="text-base font-semibold text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                        {fiche.title}
                    </h2>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                        {fiche.content}
                    </p>
                </Link>

                {/* Footer : auteur + stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                        <ProfileAvatar
                            username={username || "Inconnu"}
                            role={fiche.authors?.role}
                            userId={fiche.authors?._id}
                            size="small"
                        />
                        <span className="text-xs text-gray-600 truncate">
                            {username || "Inconnu"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                        <div className="flex items-center gap-1">
                            <PiFireSimpleFill className="text-orange-400" size={14} />
                            <span>{fiche.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MdInsertComment className="text-blue-400" size={14} />
                            <span>{fiche.comments}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FicheCard;
