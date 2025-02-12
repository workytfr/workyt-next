"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { FaCoins, FaPaperclip, FaExclamationCircle, FaQuestionCircle, FaDownload } from "react-icons/fa";
import ProfileAvatar from "@/components/ui/profile";
import TimeAgo from "@/components/ui/TimeAgo";
import { getSubjectColor, getLevelColor } from "@/data/educationData";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { generateSignedUrl } from "@/lib/b2Utils";
import "katex/dist/katex.min.css";

const QuestionDetail = ({ question, revisions, setShowAnswerPopup }: { question: any, revisions: any[], setShowAnswerPopup: (show: boolean) => void }) => {
    const router = useRouter();
    const [signedAttachments, setSignedAttachments] = useState<string[] | null>(null);
    const [loadingAttachments, setLoadingAttachments] = useState(true);
    const [attachmentError, setAttachmentError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSignedUrls = async () => {
            if (!question.attachments || question.attachments.length === 0) {
                setLoadingAttachments(false);
                return;
            }

            try {
                const signedUrls = await Promise.all(
                    question.attachments.map(async (fileKey: string) => {
                        try {
                            return await generateSignedUrl(process.env.S3_BUCKET_NAME!, fileKey);
                        } catch (error) {
                            console.error("Erreur de signature de l'URL :", error);
                            return null;
                        }
                    })
                );

                const validUrls = signedUrls.filter((url) => url !== null);
                setSignedAttachments(validUrls);
            } catch (error) {
                console.error("Erreur lors de la récupération des URLs signées :", error);
                setAttachmentError("Impossible de charger les pièces jointes.");
            } finally {
                setLoadingAttachments(false);
            }
        };

        fetchSignedUrls();
    }, [question.attachments]);

    return (
        <div className="w-full max-w-5xl p-6 bg-white shadow-md rounded-lg">
            {/* Header - Utilisateur et métadonnées */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <ProfileAvatar username={question.user.username} points={question.user.points} size="small" />
                    <Badge className={getSubjectColor(question.subject)}>{question.subject}</Badge>
                    <Badge className={getLevelColor(question.classLevel)}>{question.classLevel}</Badge>
                    <TimeAgo date={question.createdAt} />
                </div>
                <span className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-md">
                    <FaCoins className="text-yellow-500 mr-1" /> {question.points} pts
                </span>
            </div>

            {/* Titre de la question */}
            <h2 className="text-2xl font-bold mt-4">{question.title}</h2>

            {/* Détails de la question */}
            <div className="space-y-4 mt-4">
                <div className="bg-orange-100 p-3 rounded-md flex items-start gap-2">
                    <FaQuestionCircle className="text-orange-600 mt-1" />
                    <div className="whitespace-pre-line">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {question.description.whatIDid}
                        </ReactMarkdown>
                    </div>
                </div>
                <div className="bg-red-200 p-3 rounded-md flex items-start gap-2">
                    <FaExclamationCircle className="text-red-600 mt-1" />
                    <div className="whitespace-pre-line">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {question.description.whatINeed}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>

            {/* Section des pièces jointes */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FaPaperclip /> Pièces jointes ({question.attachments.length || 0})
                </h3>

                {loadingAttachments ? (
                    <p className="text-gray-500 mt-2">Chargement des pièces jointes...</p>
                ) : attachmentError ? (
                    <p className="text-red-500 mt-2">{attachmentError}</p>
                ) : signedAttachments && signedAttachments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {signedAttachments.map((url: string, index: number) => (
                            <div key={index} className="bg-gray-100 p-3 rounded-lg shadow-md flex flex-col items-center">
                                {/* Affichage image si c'est une image */}
                                {url.match(/\.(jpeg|jpg|png|gif)$/) ? (
                                    <img
                                        src={url}
                                        alt={`Attachment ${index + 1}`}
                                        className="w-full h-40 object-cover rounded-md"
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
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mt-2">Aucune pièce jointe disponible.</p>
                )}
            </div>
        </div>
    );
};

export default QuestionDetail;