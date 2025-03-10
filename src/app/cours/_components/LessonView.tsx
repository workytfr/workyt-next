"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import remarkDirective from "remark-directive";
import { remarkContainerDirectives } from "@/plugins/remarkContainerDirectives";
import {
    FaBook,
    FaExclamationTriangle,
    FaLightbulb,
    FaClipboardCheck,
    FaFlask,
    FaInfoCircle,
    FaChevronRight,
} from "react-icons/fa";

interface LessonViewProps {
    title: string;
    content: string;
}

export default function LessonView({ title, content }: LessonViewProps) {
    return (
        <div className="p-6 bg-white shadow-lg rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 text-white px-5 py-3 rounded-xl w-fit shadow-md">
                <FaBook className="text-2xl" />
                <h1 className="text-2xl font-extrabold tracking-wide">{title}</h1>
            </div>

            <ReactMarkdown
                className="prose max-w-none mt-5"
                // On active : remarkDirective + notre plugin custom
                remarkPlugins={[remarkDirective, remarkContainerDirectives, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="text-4xl font-bold text-orange-700 border-b-4 border-orange-500 pb-3 mt-8">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <div className="flex items-center gap-3 mt-6 bg-orange-100 p-3 rounded-lg shadow-sm">
                            <FaChevronRight className="text-orange-600 text-lg" />
                            <h2 className="text-2xl font-semibold text-orange-700">{children}</h2>
                        </div>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-xl font-semibold text-orange-500 mt-4 border-l-4 border-orange-400 pl-3">
                            {children}
                        </h3>
                    ),
                    p: ({ children }) => <p className="text-gray-700 leading-relaxed mt-2">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mt-2 text-gray-700">{children}</ul>,
                    li: ({ children }) => <li className="ml-5">{children}</li>,
                    strong: ({ children }) => <strong className="text-gray-900 font-bold">{children}</strong>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-400 pl-4 italic text-gray-600 bg-gray-100 p-3 rounded-lg shadow-inner">
                            {children}
                        </blockquote>
                    ),
                    div: ({ node, children, className }) => {
                        if (!className) return <div>{children}</div>;

                        const blockStyle =
                            "my-4 p-4 rounded-xl shadow-md border-l-4 flex items-start gap-3 transition-all duration-200 hover:scale-105 animate-fade-in";
                        let icon = null;
                        let bgColor = "";

                        if (className.includes("definition")) {
                            bgColor = "bg-blue-50 border-blue-500 text-blue-900";
                            icon = <FaClipboardCheck className="text-blue-500 text-2xl" />;
                        } else if (className.includes("propriete")) {
                            bgColor = "bg-green-50 border-green-500 text-green-900";
                            icon = <FaFlask className="text-green-500 text-2xl" />;
                        } else if (className.includes("exemple")) {
                            bgColor = "bg-yellow-50 border-yellow-500 text-yellow-900";
                            icon = <FaLightbulb className="text-yellow-500 text-2xl" />;
                        } else if (className.includes("theoreme")) {
                            bgColor = "bg-purple-50 border-purple-500 text-purple-900";
                            icon = <FaBook className="text-purple-500 text-2xl" />;
                        } else if (className.includes("remarque")) {
                            bgColor = "bg-gray-50 border-gray-500 text-gray-900";
                            icon = <FaInfoCircle className="text-gray-500 text-2xl" />;
                        } else if (className.includes("warning")) {
                            bgColor = "bg-red-50 border-red-500 text-red-900 font-bold";
                            icon = <FaExclamationTriangle className="text-red-500 text-2xl" />;
                        }

                        return (
                            <div className={`${blockStyle} ${bgColor}`}>
                                {icon}
                                <div className="flex-1">{children}</div>
                            </div>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
