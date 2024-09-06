"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Article {
    title: string;
    link: string;
    pubDate: string;
    author: string;
    category: string;
    img: string;
}

export function FeedCard() {
    const [articles, setArticles] = useState<Article[]>([]);
    const feedUrl = "https://blog.workyt.fr/feed/";
    const corsUrl = "https://proxy.cors.sh/";

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await fetch(corsUrl + feedUrl, {
                    mode: "cors",
                    headers: {
                        "x-cors-api-key": "temp_fcda5fa196375b68d40ef5b181d97d33",
                    },
                });

                const data = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data, "text/xml");
                const items = xmlDoc.getElementsByTagName("item");

                const fetchedArticles: Article[] = [];
                for (let i = 0; i < 3; i++) {
                    const item = items[i];
                    const title = item.getElementsByTagName("title")[0].textContent || "";
                    const link = item.getElementsByTagName("link")[0].textContent || "";
                    const pubDate = item.getElementsByTagName("pubDate")[0].textContent || "";
                    const author = item.getElementsByTagName("dc:creator")[0].textContent || "";
                    const category = item.getElementsByTagName("category")[0].textContent || "";
                    const imgContent = item.getElementsByTagName("content:encoded")[0].textContent || "";
                    const imgMatch = imgContent.match(/src="([^"]*)"/);
                    const img = imgMatch ? imgMatch[1] : "";

                    fetchedArticles.push({ title, link, pubDate, author, category, img });
                }

                setArticles(fetchedArticles);
            } catch (error) {
                console.error("Failed to fetch articles:", error);
            }
        };

        fetchArticles();
    }, []);

    return (
        <div className="container mx-auto py-8 bg-white dark:bg-white">
            {/* Header Section */}
            <div className="text-center mb-6">
                {/* Color gradient text orange to pink */}
                <h1 className="text-3xl font-bold mb-4" style={{ background: "linear-gradient(90deg, #FFA500, #FF1493)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Voici nos 3 derniers articles sortis tout chaud du pôle rédaction</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Écrits et sources vérifiées par des correcteurs, et par deux rédacteurs en chef, la qualité de nos articles est une priorité. Nous voulons donner la plume à nos jeunes pour qu&apos;ils puissent apprendre et partager leurs connaissances avec le monde des Workeurs .
                </p>
            </div>

            {/* Articles Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center">
                {articles.map((article, index) => (
                    <div key={index} className="max-w-xs w-full group/card mx-auto">
                        <div
                            className={cn(
                                "cursor-pointer overflow-hidden relative card h-96 rounded-md shadow-xl max-w-sm mx-auto flex flex-col justify-between p-4",
                                "bg-cover",
                                { "bg-black": index % 2 === 0 }
                            )}
                            style={{ backgroundImage: `url(${article.img})` }}
                        >
                            <div className="absolute w-full h-full top-0 left-0 transition duration-300 group-hover/card:bg-black opacity-60"></div>
                            <div className="flex flex-row items-center space-x-4 z-10">
                                <Image
                                    height={100}
                                    width={100}
                                    alt="Author Avatar"
                                    src="/ProfilMen.svg"
                                    className="h-10 w-10 rounded-full border-2 object-cover"
                                />
                                <div className="flex flex-col">
                                    <p className="font-normal text-base text-gray-50 relative z-10">
                                        {article.author}
                                    </p>
                                    <p className="text-sm text-gray-400">{new Date(article.pubDate).toLocaleDateString("fr-FR", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}</p>
                                </div>
                            </div>
                            <div className="text content">
                                <h1 className="font-bold text-xl md:text-2xl text-gray-50 relative z-10">
                                    {article.title}
                                </h1>
                                <p className="font-normal text-sm text-gray-50 relative z-10 my-4">
                                    {article.category}
                                </p>
                            </div>
                            <a
                                href={article.link}
                                className="placebid price text-white hover:underline z-20"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Lire l&apos;article
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
