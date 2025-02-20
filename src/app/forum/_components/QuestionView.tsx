"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { FaCoins, FaPaperclip, FaDownload, FaBookOpen} from "react-icons/fa";
import ProfileAvatar from "@/components/ui/profile";
import TimeAgo from "@/components/ui/TimeAgo";
import { getSubjectColor, getLevelColor } from "@/data/educationData";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import "katex/dist/katex.min.css";

const QuestionDetail = ({ question, revisions, setShowAnswerPopup }: { question: any, revisions: any[], setShowAnswerPopup: (show: boolean) => void }) => {
    const router = useRouter();

    // ✅ Fonction pour extraire proprement l'extension du fichier (évite les query params)
    const getFileExtension = (url: string) => {
        try {
            const cleanUrl = url.split("?")[0]; // Retirer les paramètres après "?"
            return cleanUrl.split(".").pop()?.toLowerCase(); // Extraire et normaliser l'extension
        } catch {
            return null;
        }
    };

    return (
        <div className="w-full max-w-5xl p-6 bg-white shadow-lg rounded-xl border border-gray-200">
            {/* Header - Utilisateur et métadonnées */}
            <div className="flex justify-between items-center border-b pb-3 mb-4">
                <div className="flex items-center gap-4">
                    <ProfileAvatar username={question.user.username} points={question.user.points} size="small" />
                    <span className="mt-1 text-gray-800 font-semibold">{question.user.username}</span>
                    <Badge className={getSubjectColor(question.subject)}>{question.subject}</Badge>
                    <Badge className={getLevelColor(question.classLevel)}>{question.classLevel}</Badge>
                    <TimeAgo date={question.createdAt} />
                </div>

                {/* Points + Badge du statut */}
                <div className="flex flex-wrap items-center gap-2 bg-gray-100 px-2 py-1 rounded-md shadow hidden sm:flex">                    {/* Points */}
                    <span className="flex items-center text-sm ">
                        <FaCoins className="text-yellow-500 mr-1" /> {question.points} pts
                    </span>

                    {/* Badge Validée */}
                    {question.status === "Validée" && (
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="relative w-10 h-10 hidden sm:block">
                                    <Image
                                        src="/badge/Valider.svg"
                                        alt="Validée"
                                        fill
                                        sizes="(max-width: 768px) 40px, (max-width: 1200px) 40px, 40px"
                                        unoptimized
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Cette question a été validée par un membre du staff.</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Badge Résolue */}
                    {question.status === "Résolue" && (
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="relative w-10 h-10 hidden sm:block">
                                    <Image
                                    src="/badge/Best.svg"
                                    alt="Résolue"
                                    className="w-6 h-6 md:w-10 md:h-10"
                                    fill
                                    sizes="(max-width: 768px) 40px, (max-width: 1200px) 40px, 40px"
                                    unoptimized
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Cette question a été résolue avec succès.</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>            </div>



            {/* Titre de la question */}
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{question.title}</h2>

            {/* Détails de la question */}
            <div className="space-y-6">
                {/* Section 1 : Ce que j'ai fait */}
                <div className="bg-blue-100 p-4 rounded-xl border-2 border-blue-300 flex items-start gap-4 shadow-sm">
                    <Image src="/badge/Exercice.svg" alt="Exercice" width={40} height={40} />
                    <div className="flex-1">
                        <h3 className="text-blue-800 font-semibold mb-2">📌 Ce que j&apos;ai fait</h3>
                        <div className="text-gray-700">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {question.description.whatIDid}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Section 2 : Ce dont j'ai besoin */}
                <div className="bg-red-100 p-4 rounded-xl border-2 border-red-300 flex items-start gap-4 shadow-sm">
                    <Image src="/badge/Exercice2.svg" alt="Exercice2" width={40} height={40} />
                    <div className="flex-1">
                        <h3 className="text-red-800 font-semibold mb-2">🔍 Ce dont j&apos;ai besoin</h3>
                        <div className="text-gray-700">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {question.description.whatINeed}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section des fiches de révision */}
            {revisions && revisions.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FaBookOpen className="text-green-700" /> Fiches de révision
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {revisions.map((revision) => (
                            <div key={revision._id} className="bg-green-100 p-4 rounded-xl border-2 border-green-300 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="text-green-800 font-semibold text-lg">{revision.title}</h4>
                                <div className="flex items-center text-sm text-gray-700 mt-2">
                                    <ProfileAvatar username={revision.author.username} points={revision.author.points} size="small" />
                                    <span className="ml-2 font-medium">{revision.author.username}</span>
                                    <span className="ml-auto text-gray-500"><TimeAgo date={revision.createdAt} /></span>
                                </div>
                                <p className="mt-2 text-gray-700 line-clamp-3">{revision.content}</p>
                                <button className="mt-3 text-green-600 font-medium hover:underline" onClick={() => router.push(`/fiches/${revision._id}`)}>Lire plus</button>                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section des pièces jointes */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FaPaperclip /> Pièces jointes ({question.attachments.length || 0})
                </h3>

                {question.attachments && question.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {question.attachments.map((url: string, index: number) => {
                            const fileExtension = getFileExtension(url); // 🔹 Récupérer l'extension propre

                            return (
                                <div key={index} className="bg-gray-100 p-3 rounded-lg shadow-md flex flex-col items-center">
                                    {/* ✅ Vérifier si c'est une image et l'afficher avec Next.js */}
                                    {["jpeg", "jpg", "png", "gif", "webp"].includes(fileExtension || "") ? (
                                        <Image
                                            src={url}
                                            alt={`Pièce jointe ${index + 1}`}
                                            width={300}
                                            height={200}
                                            className="rounded-md object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-md">
                                            📄 Fichier {index + 1}
                                        </div>
                                    )}
                                    {/* Bouton de téléchargement */}
                                    <a href={url} target="_blank" rel="noopener noreferrer" download>
                                        <Button className="mt-2 w-full flex items-center gap-2 bg-black text-white hover:bg-gray-800">
                                            <FaDownload /> Télécharger
                                        </Button>
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-500 mt-2">Aucune pièce jointe disponible.</p>
                )}
            </div>
        </div>
    );
};

export default QuestionDetail;