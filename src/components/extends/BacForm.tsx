"use client";
import React, { useState } from 'react';
import * as Label from '@radix-ui/react-label';

// Définition des types pour les matières
type Subject = {
    name: string;
    grade: number | '';
    coef: number;
};

export default function FormBac2024() {
    const [coreSubjects, setCoreSubjects] = useState<Subject[]>([
        { name: 'Philosophie', grade: '', coef: 8 },
        { name: 'Histoire-Géographie', grade: '', coef: 3 },
        { name: 'Langue Vivante A (LVA)', grade: '', coef: 3 },
        { name: 'Langue Vivante B (LVB)', grade: '', coef: 3 },
        { name: 'Éducation Physique et Sportive (EPS)', grade: '', coef: 2 },
        { name: 'Enseignement Scientifique', grade: '', coef: 5 },
        { name: 'Grand Oral', grade: '', coef: 10 },
    ]);

    const [specialties, setSpecialties] = useState<Subject[]>([
        { name: 'Mathématiques', grade: '', coef: 16 },
        { name: 'Physique-Chimie', grade: '', coef: 16 },
        { name: 'Sciences de la Vie et de la Terre (SVT)', grade: '', coef: 16 },
        { name: 'Sciences Économiques et Sociales (SES)', grade: '', coef: 16 },
        { name: 'Histoire-Géographie, Géopolitique et Sciences Politiques (HGGSP)', grade: '', coef: 16 },
        { name: 'Humanités, Littérature et Philosophie (HLP)', grade: '', coef: 16 },
        { name: 'Littérature, Langues et Cultures de l’Antiquité (LLCA)', grade: '', coef: 16 },
    ]);

    const [optionalSubjects, setOptionalSubjects] = useState<Subject[]>([
        { name: 'Mathématiques Complémentaires', grade: '', coef: 2 },
        { name: 'Mathématiques Expertes', grade: '', coef: 2 },
        { name: 'Langue Vivante C (LVC)', grade: '', coef: 2 },
        { name: 'Latin', grade: '', coef: 2 },
        { name: 'Grec Ancien', grade: '', coef: 2 },
    ]);

    const [average, setAverage] = useState<string | null>(null);
    const [mention, setMention] = useState<string>('');

    const handleInputChange = (index: number, value: string, type: 'core' | 'specialty' | 'optional') => {
        const parsedValue = parseFloat(value);
        const updatedSubjects = type === 'core'
            ? [...coreSubjects]
            : type === 'specialty'
                ? [...specialties]
                : [...optionalSubjects];
        updatedSubjects[index].grade = isNaN(parsedValue) ? '' : parsedValue;
        type === 'core' ? setCoreSubjects(updatedSubjects) : type === 'specialty' ? setSpecialties(updatedSubjects) : setOptionalSubjects(updatedSubjects);
    };

    const calculateAverageAndMention = () => {
        const allSubjects = [
            ...coreSubjects,
            ...specialties.filter((s) => s.grade !== ''),
            ...optionalSubjects.filter((o) => o.grade !== ''),
        ];
        const totalCoef = allSubjects.reduce((sum, subj) => sum + subj.coef, 0);
        const totalScore = allSubjects.reduce((sum, subj) => sum + (subj.grade || 0) * subj.coef, 0);
        const avg = totalCoef ? totalScore / totalCoef : 0;
        setAverage(avg.toFixed(2));

        let mentionObtained = '';
        if (avg >= 16) mentionObtained = 'Très Bien';
        else if (avg >= 14) mentionObtained = 'Bien';
        else if (avg >= 12) mentionObtained = 'Assez Bien';
        else if (avg >= 10) mentionObtained = 'Passable';
        else mentionObtained = 'Insuffisant';

        setMention(mentionObtained);
    };

    const filledSpecialtiesCount = specialties.filter((s) => s.grade !== '').length;

    const getSmiley = (grade: number | '') => {
        if (grade === '') return '';
        if (grade >= 18) return '😊';
        if (grade >= 14) return '🙂';
        if (grade >= 10) return '😐';
        return '🙁';
    };

    return (
        <div className="p-4 max-w-screen-lg mx-auto bg-transparent rounded-md">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center"
                style={{
                    background: "linear-gradient(90deg, #FFA500, #FF1493)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                }}
            >
                Calcul de la Mention et de la Moyenne Générale
            </h1>
            <p className="text-center mb-6 text-lg text-gray-600">
                Ce formulaire vous permet de calculer votre moyenne générale et la mention obtenue pour le Bac 2024.
                Saisissez vos notes et découvrez votre performance globale !
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <h2 className="text-lg font-semibold mb-4 text-center">Matières du Tronc Commun</h2>
                    {coreSubjects.map((subject, index) => (
                        <div key={index} className="mb-4 flex items-center">
                            <Label.Root htmlFor={`core-${index}`} className="flex-1 text-sm font-medium mr-2">
                                {subject.name} (Coef: {subject.coef})
                            </Label.Root>
                            <input
                                type="number"
                                id={`core-${index}`}
                                value={subject.grade === '' ? '' : subject.grade}
                                onChange={(e) => handleInputChange(index, e.target.value, 'core')}
                                className="border rounded p-2 w-20 mr-2"
                                min="0"
                                max="20"
                            />
                            <span>{getSmiley(subject.grade)}</span>
                        </div>
                    ))}
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-4 text-center">Spécialités (2 matières au choix)</h2>
                    {specialties.map((subject, index) => (
                        <div key={index} className="mb-4 flex items-center">
                            <Label.Root htmlFor={`specialty-${index}`} className="flex-1 text-sm font-medium mr-2">
                                {subject.name} (Coef: {subject.coef})
                            </Label.Root>
                            <input
                                type="number"
                                id={`specialty-${index}`}
                                value={subject.grade === '' ? '' : subject.grade}
                                onChange={(e) => handleInputChange(index, e.target.value, 'specialty')}
                                className={`border rounded p-2 w-20 mr-2 ${filledSpecialtiesCount >= 2 && subject.grade === '' ? 'bg-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                                min="0"
                                max="20"
                                disabled={filledSpecialtiesCount >= 2 && subject.grade === ''}
                            />
                            <span>{getSmiley(subject.grade)}</span>
                        </div>
                    ))}
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-4 text-center">Options Facultatives</h2>
                    {optionalSubjects.map((subject, index) => (
                        <div key={index} className="mb-4 flex items-center">
                            <Label.Root htmlFor={`optional-${index}`} className="flex-1 text-sm font-medium mr-2">
                                {subject.name} (Coef: {subject.coef})
                            </Label.Root>
                            <input
                                type="number"
                                id={`optional-${index}`}
                                value={subject.grade === '' ? '' : subject.grade}
                                onChange={(e) => handleInputChange(index, e.target.value, 'optional')}
                                className="border rounded p-2 w-20 mr-2"
                                min="0"
                                max="20"
                            />
                            <span>{getSmiley(subject.grade)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center mt-8">
                <button
                    onClick={calculateAverageAndMention}
                    className="bg-black text-white px-4 py-2 rounded-full"
                >
                    Calculer la Moyenne et la Mention
                </button>
            </div>

            {average && (
                <div className="mt-6 p-4 bg-gray-100 rounded text-center">
                    <p>Moyenne Générale : <strong>{average}</strong></p>
                    <p>Mention : <strong>{mention}</strong></p>
                </div>
            )}
        </div>
    );
}
