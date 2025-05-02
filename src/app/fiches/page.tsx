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
import { MdSearch, MdInsertComment, MdFilterList, MdInfoOutline } from "react-icons/md";
import { FiPlusCircle } from "react-icons/fi";
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
    const [showFilters, setShowFilters] = useState(false);
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

    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    const headerStyle = {
        backgroundImage: `linear-gradient(to right, #FF8C42, #FF5E78), url(/noise.webp)`,
        backgroundSize: "cover, 2%",
        backgroundBlendMode: "overlay",
    };

    const SkeletonCard = () => (
        <div className="flex gap-4 p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 items-center animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6 mb-3"></div>
                <div className="flex gap-2 mt-3">
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                </div>
            </div>
            <div className="w-16 h-10 bg-gray-200 rounded-lg"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header avec gradient */}
            <div
                className="pt-12 pb-8 px-6 rounded-b-3xl shadow-md mb-8"
                style={headerStyle}
            >
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold text-white mb-6">Trouvez des fiches</h1>

                    {/* Barre de recherche principale */}
                    <div className="relative flex items-center max-w-3xl mx-auto bg-white rounded-full shadow-lg overflow-hidden">
                        <input
                            type="text"
                            placeholder="Rechercher par mot-clé..."
                            className="w-full py-4 px-6 outline-none text-lg"
                            value={filters.query}
                            onChange={(e) => handleFilterChange("query", e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <div className="flex items-center pr-3">
                            <Button
                                variant="ghost"
                                className="rounded-full p-2 hover:bg-gray-100"
                                onClick={toggleFilters}
                            >
                                <MdFilterList size={24} className="text-gray-500" />
                            </Button>
                            <Button
                                className="rounded-full px-6 py-2 bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90 transition-opacity"
                                onClick={handleSearch}
                            >
                                <MdSearch size={20} className="mr-2" /> Rechercher
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-12">
                {/* Options avancées de filtre */}
                {showFilters && (
                    <div className="bg-white p-6 rounded-xl shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            value={filters.subject}
                            onValueChange={(value) => handleFilterChange("subject", value === "Toutes les matières" ? "" : value)}
                        >
                            <SelectTrigger className="h-12 rounded-lg text-black">
                                <SelectValue placeholder="Toutes les matières" className="text-black"/>
                            </SelectTrigger>
                            <SelectContent className="text-black">
                                <SelectItem value="Toutes les matières" className="text-black">Toutes les matières</SelectItem>
                                {educationData.subjects.map((subject) => (
                                    <SelectItem key={subject} value={subject} className="text-black">
                                        {subject}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.startDate && filters.endDate ? "Autre" : "Tout"}
                            onValueChange={handleDateRangeChange}
                        >
                            <SelectTrigger className="h-12 rounded-lg text-black">
                                <SelectValue placeholder="Filtrer par date" className="text-black"/>
                            </SelectTrigger>
                            <SelectContent className="text-black">
                                {dateRangeOptions.map((option) => (
                                    <SelectItem key={option.label} value={option.label} className="text-black">
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {/* Boutons d'action */}
                <div className="flex justify-between items-center mb-8">
                    <div className="text-gray-600 font-medium">
                        {!loading && fiches.length > 0 && (
                            <span>Résultats : {fiches.length} fiche{fiches.length > 1 ? 's' : ''}</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <InfoDrawer />
                        <Link href="/fiches/creer">
                            <Button className="flex items-center gap-2 py-2 px-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:opacity-90 transition-all shadow-sm">
                                <FiPlusCircle size={18} />
                                <span>Déposer une fiche</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Liste des fiches */}
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                            <SkeletonCard key={index} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                        <p>{error}</p>
                    </div>
                ) : fiches.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-3">
                            <MdSearch size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-700 mb-2">Aucune fiche trouvée</h3>
                        <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {fiches.map((fiche) => (
                            <div
                                key={fiche.id}
                                className="relative flex gap-4 p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 items-center"
                            >
                                {/* Icône de statut */}
                                {fiche.status !== "Non Certifiée" && (
                                    <div className="absolute top-3 right-3">
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div className="relative">
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
                                                    <MdInfoOutline
                                                        size={24}
                                                        className="!text-black stroke-current"
                                                    />                                                    <span>
                                                        Cette fiche est <strong>{fiche.status}</strong>
                                                    </span>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                )}

                                {/* Avatar et contenu */}
                                <ProfileAvatar
                                    username={fiche.authors?.username || "Inconnu"}
                                    points={fiche.authors?.points || 0}
                                />
                                <div className="flex-1">
                                    <Link href={`/fiches/${fiche.id}`}>
                                        <h2 className="text-xl font-semibold text-gray-800 hover:text-orange-500 transition-colors mb-1">
                                            {fiche.title}
                                        </h2>
                                        <p className="text-gray-600 break-words line-clamp-2 mb-3">{fiche.content}</p>
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <Badge className={`${levelColors[fiche.level] || "bg-gray-200"} px-3 py-1 rounded-full text-xs font-medium`}>
                                            {fiche.level}
                                        </Badge>
                                        <Badge className={`${subjectColors[fiche.subject] || "bg-gray-200"} px-3 py-1 rounded-full text-xs font-medium`}>
                                            {fiche.subject}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-3 text-gray-600 mb-2">
                                        <div className="flex items-center">
                                            <PiFireSimpleFill className="text-orange-500 mr-1" size={18}/>
                                            <span>{fiche.likes}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <MdInsertComment className="text-blue-500 mr-1" size={18}/>
                                            <span>{fiche.comments}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">{new Date(fiche.createdAt).toLocaleDateString("fr-FR")}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {fiches.length > 0 && pagination.totalPages > 1 && (
                    <div className="mt-8">
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
                                            className={index + 1 === pagination.page
                                                ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white"
                                                : ""}
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
                )}
            </div>
        </div>
    );
}