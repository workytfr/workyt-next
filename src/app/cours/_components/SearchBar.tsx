"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { ChevronDown, Search, GraduationCap, X } from "lucide-react";
import { educationData } from "@/data/educationData";
import "./styles/notion-theme.css";

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedClass: string;
    onSelectClass: (className: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, selectedClass, onSelectClass }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchClass, setSearchClass] = useState("");

    const filteredLevels = educationData.levels.filter((level) =>
        level.toLowerCase().includes(searchClass.toLowerCase())
    );

    return (
        <div className="relative w-full flex flex-col sm:flex-row items-center gap-3">
            {/* Barre de recherche */}
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9ca3af] w-4 h-4" />
                <Input
                    type="text"
                    placeholder="Rechercher un cours..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 pr-10 py-2.5 rounded-full border-[#e3e2e0] bg-white text-sm focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] hover:text-[#6b6b6b] w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#f1f1ef] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Sélecteur de classe */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button className="notion-button notion-button-secondary w-full sm:w-auto whitespace-nowrap rounded-full px-4">
                        <GraduationCap className="w-4 h-4" />
                        {selectedClass || "Toutes les classes"}
                        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                </PopoverTrigger>

                <PopoverContent className="w-64 p-2 bg-white shadow-lg rounded-2xl border border-[#e3e2e0]">
                    <Input
                        type="text"
                        placeholder="Rechercher une classe..."
                        value={searchClass}
                        onChange={(e) => setSearchClass(e.target.value)}
                        className="mb-2 text-sm border-[#e3e2e0] focus:border-[#f97316] rounded-xl"
                    />

                    <div className="max-h-60 overflow-y-auto notion-scrollbar">
                        <button
                            onClick={() => {
                                onSelectClass("");
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                selectedClass === "" 
                                    ? "bg-[#f97316] text-white" 
                                    : "text-[#37352f] hover:bg-[#f1f1ef]"
                            }`}
                        >
                            Toutes les classes
                        </button>

                        {filteredLevels.length > 0 ? (
                            filteredLevels.map((level) => (
                                <button
                                    key={level}
                                    onClick={() => {
                                        onSelectClass(level);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                        selectedClass === level 
                                            ? "bg-[#f97316] text-white" 
                                            : "text-[#37352f] hover:bg-[#f1f1ef]"
                                    }`}
                                >
                                    {level}
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-[#9ca3af] text-center py-3">Aucune classe trouvée</p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default SearchBar;
