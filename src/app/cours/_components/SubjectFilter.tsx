"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Input } from "@/components/ui/input";
import { ChevronDown, BookOpen, X, Calculator, FlaskConical, Code, Book, Globe, Microscope, Wrench, Languages, Brain, DollarSign, Search, Check } from "lucide-react";
import { educationData } from "@/data/educationData";
import "@/app/cours/_components/styles/notion-theme.css";

const subjectIcons: Record<string, React.ReactNode> = {
    "Mathématiques": <Calculator className="h-4 w-4" />,
    "Physique-Chimie": <FlaskConical className="h-4 w-4" />,
    "Informatique": <Code className="h-4 w-4" />,
    "Français": <Book className="h-4 w-4" />,
    "Histoire-Géographie": <Globe className="h-4 w-4" />,
    "Sciences de la Vie et de la Terre (SVT)": <Microscope className="h-4 w-4" />,
    "Technologie": <Wrench className="h-4 w-4" />,
    "Anglais": <Languages className="h-4 w-4" />,
    "Espagnol": <Languages className="h-4 w-4" />,
    "Allemand": <Languages className="h-4 w-4" />,
    "Philosophie": <Brain className="h-4 w-4" />,
    "Économie": <DollarSign className="h-4 w-4" />,
};

interface SubjectFilterProps {
    selectedSubject: string;
    onSelectSubject: (subject: string) => void;
}

const SubjectFilter: React.FC<SubjectFilterProps> = ({ selectedSubject, onSelectSubject }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchSubject, setSearchSubject] = useState("");
    
    const subjects = educationData.subjects;
    
    const filteredSubjects = subjects.filter((subject) =>
        subject.toLowerCase().includes(searchSubject.toLowerCase())
    );

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button className="notion-button notion-button-secondary w-full sm:w-auto whitespace-nowrap rounded-full px-4">
                    {selectedSubject ? (
                        <>
                            {subjectIcons[selectedSubject] || <BookOpen className="w-4 h-4" />}
                            <span className="truncate max-w-[120px]">{selectedSubject}</span>
                        </>
                    ) : (
                        <>
                            <BookOpen className="w-4 h-4" />
                            <span>Toutes les matières</span>
                        </>
                    )}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-72 p-3 bg-white shadow-lg rounded-2xl border border-[#e3e2e0]">
                {/* Barre de recherche */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] w-4 h-4" />
                    <Input
                        type="text"
                        placeholder="Rechercher une matière..."
                        value={searchSubject}
                        onChange={(e) => setSearchSubject(e.target.value)}
                        className="pl-9 pr-8 py-2 text-sm border-[#e3e2e0] rounded-xl focus:border-[#f97316]"
                    />
                    {searchSubject && (
                        <button
                            onClick={() => setSearchSubject("")}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#9ca3af] hover:text-[#6b6b6b] w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#f1f1ef] transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Liste des matières */}
                <div className="max-h-64 overflow-y-auto notion-scrollbar space-y-1">
                    {/* Option "Toutes les matières" */}
                    <button
                        onClick={() => {
                            onSelectSubject("");
                            setIsOpen(false);
                            setSearchSubject("");
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                            selectedSubject === "" 
                                ? "bg-[#f97316] text-white" 
                                : "text-[#37352f] hover:bg-[#f1f1ef]"
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedSubject === "" ? "bg-white/20" : "bg-[#f7f6f3]"
                        }`}>
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Toutes les matières</span>
                    </button>

                    <div className="h-px bg-[#e3e2e0] my-2" />

                    {filteredSubjects.length > 0 ? (
                        filteredSubjects.map((subject) => (
                            <button
                                key={subject}
                                onClick={() => {
                                    onSelectSubject(subject);
                                    setIsOpen(false);
                                    setSearchSubject("");
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                    selectedSubject === subject 
                                        ? "bg-[#f97316] text-white" 
                                        : "text-[#37352f] hover:bg-[#f1f1ef]"
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    selectedSubject === subject ? "bg-white/20" : "bg-[#f7f6f3]"
                                }`}>
                                    {subjectIcons[subject] || <Book className="w-4 h-4" />}
                                </div>
                                <span className="font-medium truncate">{subject}</span>
                                {selectedSubject === subject && (
                                    <Check className="w-4 h-4 ml-auto flex-shrink-0" />
                                )}
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-[#9ca3af] text-center py-4">
                            Aucune matière trouvée
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default SubjectFilter;
