"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
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
import { FaBook, FaGraduationCap } from "react-icons/fa";
import ProfileAvatar from "@/components/ui/profile";
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

    return (
        <div className="bg-white text-black min-h-screen max-w-7xl mx-auto p-8 space-y-6">
            <h1 className="text-3xl font-bold">Trouvez des fiches</h1>

            {/* Filtres */}
            <div className="space-y-4 bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2">
                    <MdSearch className="text-gray-500" size={20} />
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
                        <SelectValue placeholder="Tous les niveaux" />
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
                        <SelectValue placeholder="Toutes les matières" />
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
                        <SelectValue placeholder="Filtrer par date" />
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
                <p>Chargement des données...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div className="space-y-6">
                    {fiches.map((fiche) => (
                        <div
                            key={fiche.id}
                            className="flex gap-4 p-4 bg-gray-50 border rounded-lg shadow items-center"
                        >
                            <ProfileAvatar username={fiche.authors?.username || "Inconnu"} points={fiche.authors?.points || 0} />
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-gray-800">{fiche.title}</h2>
                                <p className="text-sm text-gray-600 break-words line-clamp-2">{fiche.content}</p>
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
