"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search, GraduationCap } from "lucide-react";
import { educationData } from "@/data/educationData";

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedClass: string;
    onSelectClass: (className: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, selectedClass, onSelectClass }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchClass, setSearchClass] = useState("");

    // Liste filtrée des classes en fonction de la recherche
    const filteredLevels = educationData.levels.filter((level) =>
        level.toLowerCase().includes(searchClass.toLowerCase())
    );

    return (
        <div className="relative w-full flex flex-col md:flex-row items-center gap-4">
            {/* Barre de recherche principale */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                    type="text"
                    placeholder="Rechercher un cours..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-40 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
                />
            </div>

            {/* Sélecteur de classe moderne */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="flex items-center justify-between gap-2 bg-white border border-gray-300 shadow-sm px-4 py-3 rounded-lg hover:bg-gray-100 transition-all"
                    >
                        <GraduationCap className="w-5 h-5 text-blue-500" />
                        {selectedClass ? selectedClass : "Toutes les classes"}
                        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-full max-w-xs p-3 bg-white shadow-xl rounded-lg border">
                    {/* Champ de recherche des classes */}
                    <Input
                        type="text"
                        placeholder="Rechercher une classe..."
                        value={searchClass}
                        onChange={(e) => setSearchClass(e.target.value)}
                        className="mb-2 border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    />

                    {/* Liste des classes */}
                    <div className="max-h-60 overflow-auto">
                        {/* Option "Toutes les classes" */}
                        <div
                            onClick={() => {
                                onSelectClass("");
                                setIsOpen(false);
                            }}
                            className={`p-3 cursor-pointer rounded-lg text-gray-700 hover:bg-blue-100 ${
                                selectedClass === "" ? "bg-blue-500 text-white font-semibold" : ""
                            }`}
                        >
                            Toutes les classes
                        </div>

                        {/* Classes filtrées */}
                        {filteredLevels.length > 0 ? (
                            filteredLevels.map((level) => (
                                <div
                                    key={level}
                                    onClick={() => {
                                        onSelectClass(level);
                                        setIsOpen(false);
                                    }}
                                    className={`p-3 cursor-pointer rounded-lg text-gray-700 hover:bg-blue-100 ${
                                        selectedClass === level ? "bg-blue-500 text-white font-semibold" : ""
                                    }`}
                                >
                                    {level}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-2">Aucune classe trouvée</p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default SearchBar;
