"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BookOpen, Calendar, ArrowRight, Sparkles, ImageIcon } from "lucide-react";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";

interface Article {
    title: string;
    link: string;
    pubDate: string;
    author: string;
    authorId?: string;
    category: string;
    img: string;
}

export function FeedCard() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const feedUrl = process.env.NEXT_PUBLIC_FEED_URL ?? "";
    const corsUrl = process.env.NEXT_PUBLIC_CORS_URL ?? "";
    const apiKey = process.env.NEXT_PUBLIC_CORS_API_KEY ?? "";

    useEffect(() => {
        const fetchArticles = async () => {
            if (!feedUrl || !corsUrl || !apiKey) {
                setError("Les variables d'environnement ne sont pas correctement définies.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${corsUrl}${feedUrl}`, {
                    mode: "cors",
                    headers: {
                        "x-cors-api-key": apiKey,
                    },
                });

                const data = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data, "text/xml");
                const items = xmlDoc.getElementsByTagName("item");

                const fetchedArticles: Article[] = [];
                for (let i = 0; i < 3; i++) {
                    const item = items[i];
                    if (!item) continue;
                    
                    const title = item.getElementsByTagName("title")[0]?.textContent || "";
                    const link = item.getElementsByTagName("link")[0]?.textContent || "";
                    const pubDate = item.getElementsByTagName("pubDate")[0]?.textContent || "";
                    const author = item.getElementsByTagName("dc:creator")[0]?.textContent || "Équipe Workyt";
                    const category = item.getElementsByTagName("category")[0]?.textContent || "Article";
                    
                    // Extraction améliorée de l'image
                    let img = "/blog-placeholder.jpg";
                    
                    // Essayer d'abord l'enclosure
                    const enclosure = item.getElementsByTagName("enclosure")[0];
                    if (enclosure) {
                        const enclosureUrl = enclosure.getAttribute("url");
                        if (enclosureUrl) img = enclosureUrl;
                    }
                    
                    // Sinon essayer content:encoded
                    if (img === "/blog-placeholder.jpg") {
                        const imgContent = item.getElementsByTagName("content:encoded")[0]?.textContent || "";
                        // Regex améliorée pour capturer src avec guillemets simples ou doubles
                        const imgMatch = imgContent.match(/src=["']([^"']+)["']/i);
                        if (imgMatch && imgMatch[1]) {
                            img = imgMatch[1];
                        }
                    }
                    
                    // Essayer media:content
                    if (img === "/blog-placeholder.jpg") {
                        const mediaContent = item.getElementsByTagName("media:content")[0];
                        if (mediaContent) {
                            const mediaUrl = mediaContent.getAttribute("url");
                            if (mediaUrl) img = mediaUrl;
                        }
                    }

                    fetchedArticles.push({ title, link, pubDate, author, category, img });
                }

                // Essayer de récupérer les IDs des auteurs pour les avatars
                const articlesWithAvatars = await enrichAuthorsWithIds(fetchedArticles);
                setArticles(articlesWithAvatars);
            } catch (error) {
                console.error("Failed to fetch articles:", error);
                setError("Une erreur est survenue lors de la récupération des articles.");
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [feedUrl, corsUrl, apiKey]);

    // Fonction pour enrichir les articles avec les IDs des auteurs
    const enrichAuthorsWithIds = async (articles: Article[]): Promise<Article[]> => {
        try {
            const response = await fetch('/api/users?limit=1000');
            if (!response.ok) return articles;
            
            const data = await response.json();
            if (!data.users) return articles;

            return articles.map(article => {
                const authorName = article.author.toLowerCase().trim();
                const matchingUser = data.users.find((user: any) => {
                    const userName = (user.name || user.username || "").toLowerCase().trim();
                    return userName.includes(authorName) || authorName.includes(userName);
                });

                return {
                    ...article,
                    authorId: matchingUser?._id || undefined
                };
            });
        } catch (error) {
            console.error("Error enriching authors:", error);
            return articles;
        }
    };

    if (loading) {
        return (
            <section className="relative py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8 bg-white">
                <p className="text-red-500 text-center">{error}</p>
            </div>
        );
    }

    return (
        <section className="relative py-20 overflow-hidden bg-white">
            {/* Motif de fond subtil */}
            <div className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-12">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                        <BookOpen className="w-4 h-4" />
                        <span>Blog Workyt</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Nos derniers articles
                        </span>
                    </h2>

                    <p className="text-gray-600 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed">
                        Écrits et sources vérifiés par des correcteurs, et par deux rédacteurs en chef, 
                        la qualité de nos articles est une priorité. Nous voulons donner la plume à nos jeunes 
                        pour qu&apos;ils puissent apprendre et partager leurs connaissances avec le monde des Workeurs.
                    </p>

                    {/* Séparateur décoratif */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
                        <div className="h-1 w-3 rounded-full bg-purple-400" />
                        <div className="h-1 w-3 rounded-full bg-pink-400" />
                    </div>
                </div>

                {/* Articles Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {articles.map((article, index) => (
                        <ArticleCard key={index} article={article} />
                    ))}
                </div>

                {/* View all button */}
                <div className="text-center mt-12">
                    <a
                        href="/blog"
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                        Voir tous les articles
                        <ArrowRight className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </section>
    );
}

// Composant séparé pour la carte d'article avec gestion d'erreur d'image
function ArticleCard({ article }: { article: Article }) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Déterminer l'URL de l'image à afficher
    const imageUrl = imageError || !article.img ? "/blog-placeholder.jpg" : article.img;

    return (
        <article className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100">
            {/* Image Container */}
            <div className="relative h-56 overflow-hidden bg-gray-100">
                {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-pulse w-full h-full bg-gray-200"></div>
                    </div>
                )}
                
                <Image
                    src={imageUrl}
                    alt={article.title}
                    fill
                    className={`object-cover transition-all duration-700 group-hover:scale-110 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onError={() => {
                        setImageError(true);
                        setImageLoaded(true);
                    }}
                    onLoad={() => setImageLoaded(true)}
                    unoptimized={imageUrl.startsWith('http')}
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-xs font-semibold text-gray-800 shadow-lg">
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                        {article.category}
                    </span>
                </div>
                
                {/* Fallback si erreur d'image */}
                {imageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                        <div className="text-center">
                            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <span className="text-sm text-gray-500">Workyt Blog</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Meta info avec avatar */}
                <div className="flex items-center gap-3 mb-4">
                    {/* Avatar de l'auteur */}
                    <AvatarDisplay
                        name={article.author}
                        userId={article.authorId}
                        size="md"
                    />
                    
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-gray-900">
                            {article.author}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(article.pubDate).toLocaleDateString("fr-FR", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })}</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg text-gray-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                    {article.title}
                </h3>

                {/* CTA */}
                <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-300 group/link"
                >
                    Lire l&apos;article
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                </a>
            </div>

            {/* Hover decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </article>
    );
}
