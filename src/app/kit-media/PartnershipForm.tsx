"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const TYPES = [
    { value: "marque", label: "Marque / entreprise" },
    { value: "projet", label: "Jeune projet / startup" },
    { value: "presse", label: "Demande presse" },
    { value: "autre", label: "Autre" },
];

type Status = "idle" | "loading" | "success" | "error";

const inputClass =
    "w-full px-4 py-2.5 bg-white border border-[#e3e2e0] rounded-xl text-sm text-[#37352f] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-colors";

export default function PartnershipForm() {
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [form, setForm] = useState({
        type: "marque",
        companyName: "",
        contactName: "",
        email: "",
        website: "",
        message: "",
        company_website: "", // honeypot
    });

    const update = (field: string, value: string) =>
        setForm((f) => ({ ...f, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMsg("");
        try {
            const res = await fetch("/api/partnership-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || "Une erreur est survenue.");
            }
            setStatus("success");
        } catch (err: any) {
            setErrorMsg(err.message || "Une erreur est survenue.");
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="bg-white border border-[#e3e2e0] rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-[#37352f] mb-2">Demande envoyée 🎉</h3>
                <p className="text-sm text-[#6b6b6b] max-w-md mx-auto">
                    Merci ! Nous avons bien reçu votre message et reviendrons vers vous
                    rapidement, avec un interlocuteur dédié.
                </p>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#e3e2e0] rounded-2xl p-6 md:p-7 space-y-4"
        >
            {/* Honeypot anti-bot (invisible) */}
            <input
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                value={form.company_website}
                onChange={(e) => update("company_website", e.target.value)}
                className="hidden"
                aria-hidden="true"
            />

            <div>
                <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                    Vous êtes…
                </label>
                <div className="flex flex-wrap gap-2">
                    {TYPES.map((tp) => (
                        <button
                            key={tp.value}
                            type="button"
                            onClick={() => update("type", tp.value)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                form.type === tp.value
                                    ? "bg-orange-500 text-white border-orange-500"
                                    : "bg-white text-[#6b6b6b] border-[#e3e2e0] hover:border-orange-200"
                            }`}
                        >
                            {tp.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                        Structure / marque <span className="text-orange-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        maxLength={150}
                        placeholder="Nom de votre structure"
                        value={form.companyName}
                        onChange={(e) => update("companyName", e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                        Votre nom <span className="text-orange-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        maxLength={120}
                        placeholder="Prénom Nom"
                        value={form.contactName}
                        onChange={(e) => update("contactName", e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                        E-mail <span className="text-orange-500">*</span>
                    </label>
                    <input
                        type="email"
                        required
                        maxLength={180}
                        placeholder="vous@exemple.com"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                        Site / lien <span className="text-[#9ca3af] font-normal">(optionnel)</span>
                    </label>
                    <input
                        type="text"
                        maxLength={300}
                        placeholder="https://…"
                        value={form.website}
                        onChange={(e) => update("website", e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                    Votre message <span className="text-orange-500">*</span>
                </label>
                <textarea
                    required
                    rows={4}
                    maxLength={2000}
                    placeholder="Présentez votre produit/service et ce que vous recherchez (test, partenariat, codes promo…)."
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    className={`${inputClass} resize-y`}
                />
            </div>

            {status === "error" && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white rounded-full text-sm font-medium transition-colors"
                >
                    {status === "loading" ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Envoi…
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" /> Envoyer ma demande
                        </>
                    )}
                </button>
                <p className="text-xs text-[#9ca3af]">
                    Ou écrivez-nous à{" "}
                    <a href="mailto:admin@workyt.fr" className="text-[#f97316] hover:underline">
                        admin@workyt.fr
                    </a>
                </p>
            </div>
        </form>
    );
}
