"use client";
import React, { useState } from "react";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, CategoryScale } from "chart.js";
import { Line } from "react-chartjs-2";
import nerdamer from "nerdamer";
import "nerdamer/Calculus";
import "nerdamer/Solve";
import "nerdamer/Algebra";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

// Register necessary Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale);

interface GraphData {
    labels: number[];
    datasets: {
        label: string;
        data: (number | null)[];
        borderColor: string;
        borderWidth: number;
        fill: boolean;
    }[];
}

// Function to format expression to LaTeX-compatible format
const formatToLatex = (expression: string): string => {
    return expression
        .replace(/\*/g, " \\cdot ")       // Replace * with \cdot for multiplication
        .replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}"); // Replace sqrt(...) with \sqrt{...}
};

const EquationSolver: React.FC = () => {
    const [input, setInput] = useState<string>("");
    const [xMin, setXMin] = useState<number>(-20);
    const [xMax, setXMax] = useState<number>(20);
    const [step, setStep] = useState<number>(1);
    const [steps, setSteps] = useState<string[]>([]);
    const [solution, setSolution] = useState<string>("");
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [error, setError] = useState<string>("");

    // Set limits for xMin, xMax, and step
    const minLimit = -50;
    const maxLimit = 50;
    const stepLimit = 0.1; // Step can't be smaller than 0.1

    const solveEquation = () => {
        // Check if the values are within the allowed limits
        if (xMin < minLimit || xMax > maxLimit || xMin >= xMax) {
            setError(`Les valeurs de x doivent être entre ${minLimit} et ${maxLimit}, et xMin ne doit pas être supérieur à xMax.`);
            return;
        }

        if (step < stepLimit || step > (xMax - xMin)) {
            setError(`L'incrément (pas) doit être supérieur à ${stepLimit} et inférieur à la différence entre xMax et xMin.`);
            return;
        }

        setError(""); // Clear any previous error message
        try {
            const stepsList: string[] = [];
            stepsList.push(`\\text{Équation initiale : } ${formatToLatex(input)}`);

            const simplified = nerdamer(input).toString();
            stepsList.push(`\\text{Simplification : } ${formatToLatex(simplified)}`);

            const variable = "x";
            const solutionObj = nerdamer(input).solveFor(variable);
            const solutions = solutionObj.toString();

            stepsList.push(`\\text{Solution(s) trouvée(s) : } ${formatToLatex(solutions)}`);
            setSteps(stepsList);
            setSolution(formatToLatex(solutions));
            plotGraph();
        } catch (error) {
            if (error instanceof Error) {
                setSteps([`\\text{Erreur : } ${error.message}`]);
            } else {
                setSteps(["\\text{Erreur inconnue pendant la résolution.}"]);
            }
        }
    };

    const plotGraph = () => {
        const xValues: number[] = [];
        const yValues: (number | null)[] = [];

        for (let x = xMin; x <= xMax; x += step) {
            try {
                const y = parseFloat(
                    nerdamer(input.replace("=", "-(") + `)`, { x: x.toString() }).evaluate().text()
                );
                xValues.push(x);
                yValues.push(y);
            } catch {
                xValues.push(x);
                yValues.push(null);
            }
        }

        setGraphData({
            labels: xValues,
            datasets: [
                {
                    label: `Graphique de ${input}`,
                    data: yValues,
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 2,
                    fill: false,
                },
            ],
        });
    };

    return (
        <div className="flex flex-col items-center p-6 bg-gray-100 space-y-4 min-h-screen">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center"
                style={{
                    background: "linear-gradient(90deg, #FFA500, #FF1493)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                }}
            >
                Résolveur d&apos;Équations
            </h1>
            <p className="text-gray-700 text-center">Saisissez une équation pour voir les étapes et le graphique.</p>

            <div className="w-3/4" style={{ overflowWrap: 'break-word', wordBreak: 'break-word', maxWidth: '800px' }}>
                <input
                    className="w-full p-2 border rounded"
                    placeholder="Entrez une équation (e.g. 2x + 3 = 7)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
            </div>

            <div className="w-3/4 flex space-x-4">
                <div className="w-1/3">
                    <label className="block text-sm font-semibold text-gray-700">Valeur minimale de x</label>
                    <input
                        type="range"
                        min={minLimit}
                        max={maxLimit}
                        step={0.1}
                        className="w-full p-2 border rounded text-gray-700"
                        value={xMin}
                        onChange={(e) => setXMin(Number(e.target.value))}
                    />
                    <p className="text-center text-gray-500">{xMin}</p>
                    <p className="text-xs text-gray-500">Définit la valeur minimale de x pour le graphique.</p>
                </div>

                <div className="w-1/3">
                    <label className="block text-sm font-semibold text-gray-700">Valeur maximale de x</label>
                    <input
                        type="range"
                        min={minLimit}
                        max={maxLimit}
                        step={0.1}
                        className="w-full p-2 border rounded text-gray-700"
                        value={xMax}
                        onChange={(e) => setXMax(Number(e.target.value))}
                    />
                    <p className="text-center text-gray-500">{xMax}</p>
                    <p className="text-xs text-gray-500">Définit la valeur maximale de x pour le graphique.</p>
                </div>

                <div className="w-1/3">
                    <label className="block text-sm font-semibold text-gray-700">Incrément (pas)</label>
                    <input
                        type="range"
                        min={stepLimit}
                        max={xMax - xMin}
                        step={0.1}
                        className="w-full p-2 border rounded text-gray-700"
                        value={step}
                        onChange={(e) => setStep(Number(e.target.value))}
                    />
                    <p className="text-center text-gray-500">{step}</p>
                    <p className="text-xs text-gray-500">Définit l&apos;incrément entre les valeurs de x.</p>
                </div>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}

            <button onClick={solveEquation} className="bg-black text-white px-4 py-2 rounded-full">
                Résoudre
            </button>

            <div className="w-3/4" style={{ overflowWrap: 'break-word', wordBreak: 'break-word', maxWidth: '800px' }}>
                <h2 className="text-2xl text-black font-semibold">Étapes :</h2>
                <ul className="list-decimal list-inside space-y-2 text-gray-800">
                    {steps.map((step, index) => (
                        <li key={index}>
                            <BlockMath math={step}/>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="w-3/4" style={{ overflowWrap: 'break-word', wordBreak: 'break-word', maxWidth: '800px' }}>
                <h2 className="text-2xl text-black font-semibold">Solution :</h2>
                <div className="text-gray-800">
                    <BlockMath  math={solution}/>
                </div>
            </div>

            {graphData && (
                <div className="w-3/4">
                    <h2 className="text-2xl text-black font-semibold">Graphique :</h2>
                    <Line
                        data={graphData}
                        options={{
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: "Graphique de la fonction",
                                },
                            },
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default EquationSolver;
