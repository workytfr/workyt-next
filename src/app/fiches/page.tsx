"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/Pagination";
import { PiFireSimpleFill } from "react-icons/pi";
import { MdSearch, MdInsertComment } from "react-icons/md";
import { MdInfoOutline } from "react-icons/md";
import ProfileAvatar from "@/components/ui/profile";
import InfoDrawer from "@/app/fiches/_components/InfoDrawer";
import { educationData, subjectColors, levelColors } from "@/data/educationData";

interface Fiche {
    id: string;
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

export default function SearchPage() {
    const [fiches, setFiches] = useState<Fiche[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({
        query: "",
        level: "",
        subject: "",
        startDate: "",
        endDate: "",
    });

    const dateRangeOptions = [
        { label: "Tout", startDate: "", endDate: "" },
        { label: "Aujourd'hui", startDate: new Date().toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] },
        { label: "Hier", startDate: new Date(Date.now() - 86400000).toISOString().split("T")[0], endDate: new Date(Date.now() - 86400000).toISOString().split("T")[0] },
        { label: "Cette semaine", startDate: new Date(Date.now() - new Date().getDay() * 86400000).toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] },
        { label: "Ce mois", startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] },
        { label: "Cette année", startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] },
    ];

    const fetchFilteredData = async () => {
        setLoading(true);
        setError(null);

        try {
            const queryString = new URLSearchParams({
                query: filters.query || "",
                level: filters.level || "",
                subject: filters.subject || "",
                startDate: filters.startDate || "",
                endDate: filters.endDate || "",
                page: pagination.page.toString(),
            }).toString();

            const response = await fetch(`/api/fiches/search?${queryString}`);
            const data = await response.json();

            if (!data.success) {
                setError("Erreur lors de la récupération des fiches.");
                return;
            }

            setFiches(data.data);
            setPagination((prev) => ({
                ...prev,
                totalPages: data.pagination.totalPages,
            }));
        } catch (err) {
            setError("Erreur lors de la récupération des données.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFilteredData();
    }, [pagination.page]);

    const handleDateRangeChange = (value: string) => {
        const selectedOption = dateRangeOptions.find((option) => option.label === value);
        if (selectedOption) {
            setFilters((prev) => ({
                ...prev,
                startDate: selectedOption.startDate,
                endDate: selectedOption.endDate,
            }));
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        fetchFilteredData();
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, page }));
        }
    };

    const SkeletonCard = () => (
        <div className="flex gap-4 p-4 bg-gray-50 border rounded-lg shadow items-center animate-pulse">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                <div className="flex gap-2 mt-2">
                    <div className="h-6 w-16 bg-gray-300 rounded"></div>
                    <div className="h-6 w-16 bg-gray-300 rounded"></div>
                </div>
            </div>
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
        </div>
    );


    return (
        <div className="bg-white text-black min-h-screen max-w-7xl mx-auto p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Trouvez des fiches</h1>
                <div className="flex gap-4">
                    {/* Bouton pour déposer une fiche */}
                        <Link href="/fiches/creer">
                            <Button variant="outline" className="text-sm">
                                Déposer une fiche
                            </Button>
                        </Link>

                    {/* Bouton d'information */}
                    <InfoDrawer/>
                </div>
            </div>

            {/* Filtres */}
            <div className="space-y-4 bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2">
                    <MdSearch className="text-gray-500" size={20}/>
                    <input
                        type="text"
                        placeholder="Rechercher par mot-clé"
                        className="w-full bg-transparent outline-none"
                        value={filters.query}
                        onChange={(e) => handleFilterChange("query", e.target.value)}
                    />
                </div>

                <Select
                    value={filters.level}
                    onValueChange={(value) => handleFilterChange("level", value === "Tous les niveaux" ? "" : value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tous les niveaux"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Tous les niveaux">Tous les niveaux</SelectItem>
                        {educationData.levels.map((level) => (
                            <SelectItem key={level} value={level}>
                                {level}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.subject}
                    onValueChange={(value) => handleFilterChange("subject", value === "Toutes les matières" ? "" : value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Toutes les matières"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Toutes les matières">Toutes les matières</SelectItem>
                        {educationData.subjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                                {subject}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.startDate && filters.endDate ? "Autre" : "Tout"}
                    onValueChange={handleDateRangeChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Filtrer par date"/>
                    </SelectTrigger>
                    <SelectContent>
                        {dateRangeOptions.map((option) => (
                            <SelectItem key={option.label} value={option.label}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    className="w-full text-white font-semibold py-2 px-4 rounded transition duration-200"
                    onClick={handleSearch}
                >
                    Rechercher
                </Button>
            </div>

            {/* Liste des fiches */}
            {loading ? (
                <div className="space-y-6">
                    {[...Array(3)].map((_, index) => (
                        <SkeletonCard key={index} />
                    ))}
                </div>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div className="space-y-6">
                    {fiches.map((fiche) => (
                        <div
                            key={fiche.id}
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
                                                <MdInfoOutline className="text-blue-500" size={16}/>
                                                <span>
                  Ce badge indique que cette fiche est <strong>{fiche.status}</strong>.
                </span>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            )}

                            {/* Contenu de la carte */}
                            <ProfileAvatar username={fiche.authors?.username || "Inconnu"}
                                           points={fiche.authors?.points || 0}/>
                            <div className="flex-1">
                                {/* Titre cliquable */}
                                <Link href={`/fiches/${fiche.id}`}>
                                    <h2 className="text-lg font-semibold text-gray-800 hover:underline cursor-pointer">
                                        {fiche.title}
                                    </h2>
                                    <p className="text-sm text-gray-600 break-words line-clamp-2">{fiche.content}</p>
                                </Link>
                                <div className="mt-2 flex items-center gap-2">
                                    <Badge className={levelColors[fiche.level] || "bg-gray-200"}>{fiche.level}</Badge>
                                    <Badge
                                        className={subjectColors[fiche.subject] || "bg-gray-200"}>{fiche.subject}</Badge>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <PiFireSimpleFill className="text-red-500"/>
                                    {fiche.likes}
                                    <MdInsertComment className="text-blue-500"/>
                                    {fiche.comments}
                                </div>
                                <p className="text-xs text-gray-500">{new Date(fiche.createdAt).toLocaleDateString("fr-FR")}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href={pagination.page > 1 ? "#" : undefined}
                            onClick={pagination.page > 1 ? () => handlePageChange(pagination.page - 1) : undefined}
                            className={pagination.page === 1 ? "opacity-50 pointer-events-none" : ""}
                        />
                    </PaginationItem>
                    {[...Array(pagination.totalPages)].map((_, index) => (
                        <PaginationItem key={index}>
                            <PaginationLink
                                href="#"
                                isActive={index + 1 === pagination.page}
                                onClick={() => handlePageChange(index + 1)}
                            >
                                {index + 1}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                            href={pagination.page < pagination.totalPages ? "#" : undefined}
                            onClick={pagination.page < pagination.totalPages ? () => handlePageChange(pagination.page + 1) : undefined}
                            className={pagination.page === pagination.totalPages ? "opacity-50 pointer-events-none" : ""}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}
