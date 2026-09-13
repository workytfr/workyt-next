"use client";

import React from "react";
import ChoiceInput from "./ChoiceInput";
import CodeInput from "./CodeInput";
import FillBlanksInput from "./FillBlanksInput";
import GraphInput from "./GraphInput";
import MatchingInput from "./MatchingInput";
import OrderingInput from "./OrderingInput";
import PinInput from "./PinInput";
import ShortAnswerInput from "./ShortAnswerInput";
import SliderInput from "./SliderInput";
import TrueFalseInput from "./TrueFalseInput";
import ZoneInput from "./ZoneInput";
import type { QuestionInputProps, QuizQuestion } from "../types";

/**
 * Aiguillage type de question → composant de saisie.
 *
 * Ajouter un type revient à écrire son composant, l'inscrire ici, puis ajouter
 * le `case` correspondant dans la correction serveur
 * (`src/app/api/quizzes/[id]/route.ts`) et la valeur dans l'enum du modèle.
 */
const INPUTS: Partial<
    Record<QuizQuestion["questionType"], React.ComponentType<QuestionInputProps>>
> = {
    QCM: ChoiceInput,
    "Vrai/Faux": TrueFalseInput,
    "Réponse courte": ShortAnswerInput,
    "Texte à trous": FillBlanksInput,
    Classement: OrderingInput,
    "Glisser-déposer": MatchingInput,
    Slider: SliderInput,
    Code: CodeInput,
    "Point sur image": PinInput,
    "Zone sur image": ZoneInput,
    Graphique: GraphInput,
};

export default function QuestionInput({ question, value, onChange }: QuestionInputProps) {
    const Input = INPUTS[question.questionType];

    if (!Input) {
        return (
            <div className="p-4 rounded-xl border-2 border-dashed border-[#e3e2e0] text-sm text-[#6b6b6b]">
                Ce type de question ({question.questionType}) n&apos;est pas encore pris en
                charge par le lecteur.
            </div>
        );
    }

    return <Input question={question} value={value} onChange={onChange} />;
}
