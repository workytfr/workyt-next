import React from "react";
import { Button } from "@/components/ui/button";
import { educationData } from "@/data/educationData";
import { Calculator, FlaskConical, Code, Book, Globe, Microscope, Wrench, Languages, Brain, DollarSign } from "lucide-react";

const subjectIcons: Record<string, React.ReactNode> = {
    "Mathématiques": <Calculator className="h-6 w-6" />,
    "Physique-Chimie": <FlaskConical className="h-6 w-6" />,
    "Informatique": <Code className="h-6 w-6" />,
    "Français": <Book className="h-6 w-6" />,
    "Histoire-Géographie": <Globe className="h-6 w-6" />,
    "Sciences de la Vie et de la Terre (SVT)": <Microscope className="h-6 w-6" />,
    "Technologie": <Wrench className="h-6 w-6" />,
    "Anglais": <Languages className="h-6 w-6" />,
    "Espagnol": <Languages className="h-6 w-6" />,
    "Allemand": <Languages className="h-6 w-6" />,
    "Philosophie": <Brain className="h-6 w-6" />,
    "Économie": <DollarSign className="h-6 w-6" />,
};

interface SubjectFilterProps {
    selectedSubject: string;
    onSelectSubject: (subject: string) => void;
}

const SubjectFilter: React.FC<SubjectFilterProps> = ({ selectedSubject, onSelectSubject }) => {
    // Utilisation de la liste des sujets depuis educationData
    const subjects = educationData.subjects;

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            <Button variant={selectedSubject === "" ? "default" : "outline"} onClick={() => onSelectSubject("")}>
                Tous
            </Button>
            {subjects.map((subject) => (
                <Button
                    key={subject}
                    variant={selectedSubject === subject ? "default" : "outline"}
                    onClick={() => onSelectSubject(subject)}
                >
                    {subjectIcons[subject] || <Book className="h-6 w-6" />} {subject}
                </Button>
            ))}
        </div>
    );
};

export default SubjectFilter;
