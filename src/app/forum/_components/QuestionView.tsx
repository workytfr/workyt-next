"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
    FaCoins,
    FaPaperclip,
    FaDownload,
    FaBookOpen,
    FaCheckCircle,
    FaExclamationCircle
} from "react-icons/fa";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import TimeAgo from "@/components/ui/TimeAgo";
import { getSubjectColor, getLevelColor } from "@/data/educationData";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import ReportButton from "@/components/ReportButton";
import BookmarkButton from "@/components/BookmarkButton";
import "katex/dist/katex.min.css";

const QuestionDetail = ({ question, revisions, setShowAnswerPopup }: { question: any, revisions: any[], setShowAnswerPopup: (show: boolean) => void }) => {
    const router = useRouter();

    // Fonction pour extraire proprement l'extension du fichier
    const getFileExtension = (url: string) => {
        try {
            const cleanUrl = url.split("?")[0];
            return cleanUrl.split(".").pop()?.toLowerCase();
        } catch {
            return null;
        }
    };

    // Obtenir le statut de la question avec un emoji approprié
    const getStatusInfo = (status: string) => {
        switch(status) {
            case "Validée":
                return { icon: <FaCheckCircle className="text-green-600" />, text: "Validée", color: "text-green-600" };
            case "Résolue":
                return { icon: <FaCheckCircle className="text-green-600" />, text: "Résolue", color: "text-green-600" };
            default:
                return { icon: <FaExclamationCircle className="text-amber-500" />, text: "En attente", color: "text-amber-500" };
        }
    };

    const statusInfo = getStatusInfo(question.status);

    return (
        <div className="w-full max-w-5xl bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* En-tête avec le statut proéminent */}
            <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <ProfileAvatar username={question.user.username} points={question.user.points} size="small" userId={question.user._id} />
                        <div>
                            <Link href={`/compte/${question.user._id}`}>
                                <UsernameDisplay 
                                    username={question.user.username}
                                    userId={question.user._id}
                                    className="font-medium hover:underline cursor-pointer"
                                />
                            </Link>
                            <TimeAgo date={question.createdAt} />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge className={`${getSubjectColor(question.subject)} px-3 py-1`}>{question.subject}</Badge>
                        <Badge className={`${getLevelColor(question.classLevel)} px-3 py-1`}>{question.classLevel}</Badge>

                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                            <FaCoins className="text-amber-500" />
                            <span className="font-medium text-black">{question.points} pts</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${statusInfo.color} bg-gray-100 px-3 py-1.5 rounded-full`}>
                            {statusInfo.icon}
                            <span className="font-medium">{statusInfo.text}</span>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <BookmarkButton questionId={question._id} size="sm" />
                            <ReportButton 
                                contentId={question._id} 
                                contentType="forum_question"
                                variant="button"
                                size="sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Corps de la question */}
            <div className="p-6">
                {/* Titre de la question */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{question.title}</h2>

                {/* Détails de la question */}
                <div className="space-y-6">
                    {/* Section: Ce que j'ai fait */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <Image src="/badge/Exercice.svg" alt="Exercice" width={28} height={28} className="opacity-90" />
                            <h3 className="text-blue-800 font-semibold">Ce que j&apos;ai fait</h3>
                        </div>
                        <div className="text-gray-700 prose prose-blue prose-sm max-w-none overflow-x-auto">
                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                                {question.description.whatIDid}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Section: Ce dont j'ai besoin */}
                    <div className="bg-gradient-to-r from-rose-50 to-rose-100 p-5 rounded-xl border border-rose-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <Image src="/badge/Exercice2.svg" alt="Besoin" width={28} height={28} className="opacity-90" />
                            <h3 className="text-rose-800 font-semibold">Ce dont j&apos;ai besoin</h3>
                        </div>
                        <div className="text-gray-700 prose prose-rose prose-sm max-w-none overflow-x-auto">
                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                                {question.description.whatINeed}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Section des pièces jointes */}
                <div className="mt-8">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                        <FaPaperclip className="text-gray-500" />
                        <span>Pièces jointes</span>
                        <span className="ml-1 text-sm font-normal text-gray-500">({question.attachments.length || 0})</span>
                    </h3>

                    {question.attachments && question.attachments.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {question.attachments.map((url: string, index: number) => {
                                const fileExtension = getFileExtension(url);
                                const isImage = ["jpeg", "jpg", "png", "gif", "webp"].includes(fileExtension || "");
                                const proxyUrl = `/api/file-proxy?questionId=${String(question._id ?? question.id ?? "")}&index=${index}`;

                                return (
                                    <div key={index} className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 transition-all hover:shadow-md">
                                        {isImage ? (
                                            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={proxyUrl}
                                                    alt={`Pièce jointe ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-[4/3] flex items-center justify-center bg-gray-100 p-4">
                                                <div className="text-center">
                                                    <div className="text-4xl text-gray-400 mb-2">📄</div>
                                                    <div className="text-sm text-gray-600 uppercase font-medium">
                                                        {fileExtension || "Fichier"}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <a
                                                href={proxyUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className="bg-white text-gray-800 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-lg"
                                            >
                                                <FaDownload /> Télécharger
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Aucune pièce jointe disponible.</p>
                    )}
                </div>

                {/* Section des fiches de révision */}
                {revisions && revisions.length > 0 && (
                    <div className="mt-8">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                            <FaBookOpen className="text-emerald-600" />
                            <span>Fiches de révision</span>
                            <span className="ml-1 text-sm font-normal text-gray-500">({revisions.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {revisions.map((revision) => (
                                <div
                                    key={revision._id}
                                    className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="p-4">
                                        <h4 className="text-emerald-800 font-medium text-lg mb-3">{revision.title}</h4>
                                        <div className="flex items-center text-sm text-gray-700 mb-3">
                                            <ProfileAvatar username={revision.author.username} points={revision.author.points} userId={revision.author._id} />
                                            <Link href={`/compte/${revision.author._id}`}>
                                                <UsernameDisplay 
                                                    username={revision.author.username}
                                                    userId={revision.author._id}
                                                    className="ml-2 font-medium hover:underline cursor-pointer"
                                                />
                                            </Link>
                                            <span className="ml-auto text-gray-500"><TimeAgo date={revision.createdAt} /></span>
                                        </div>
                                        <p className="text-gray-700 line-clamp-3 text-sm">{revision.content}</p>
                                    </div>
                                    <div className="bg-emerald-100 px-4 py-2 border-t border-emerald-200">
                                        <button
                                            className="text-emerald-700 font-medium text-sm hover:text-emerald-800 transition-colors flex items-center gap-1.5"
                                            onClick={() => router.push(`/fiches/${revision._id}`)}
                                        >
                                            <FaBookOpen className="text-xs" /> Lire la fiche complète
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bouton "Répondre" - visible seulement si la question n'est pas fermée */}
                {question.status === "Non validée" && (
                    <div className="mt-8 flex justify-center">
                        <Button
                            onClick={() => setShowAnswerPopup(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                        >
                            Répondre à cette question
                        </Button>
                    </div>
                )}

                {/* Message si la question est fermée */}
                {(question.status === "Résolue" || question.status === "Validée") && (
                    <div className="mt-8 flex justify-center">
                        <div className={`border rounded-lg p-4 text-center ${
                            question.status === "Résolue" 
                                ? "bg-green-50 border-green-200" 
                                : "bg-blue-50 border-blue-200"
                        }`}>
                            <div className={`flex items-center justify-center gap-2 mb-2 ${
                                question.status === "Résolue" 
                                    ? "text-green-700" 
                                    : "text-blue-700"
                            }`}>
                                <FaCheckCircle className="text-lg" />
                                <span className="font-medium">
                                    {question.status === "Résolue" ? "Question résolue" : "Question validée"}
                                </span>
                            </div>
                            <p className={`text-sm ${
                                question.status === "Résolue" 
                                    ? "text-green-600" 
                                    : "text-blue-600"
                            }`}>
                                {question.status === "Résolue" 
                                    ? "Cette question a été résolue par l'auteur. Vous ne pouvez plus y répondre."
                                    : "Cette question a été validée par le staff. Vous ne pouvez plus y répondre."
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionDetail;