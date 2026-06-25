"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent } from "@/components/ui/Card";
import {
    ShieldCheck, Loader2, Download, CheckCircle2, AlertCircle, Lock, Mail, IdCard,
} from "lucide-react";
import { MEMBERSHIP_TYPES, MEMBERSHIP_TYPE_IDS, membershipTypeLabel } from "@/lib/membership";

interface MembershipInfo {
    memberNumber: string;
    type: string;
    status: string;
    joinedAt: string;
    consecutiveAbsences: number;
}

function downloadBase64Pdf(base64: string, filename: string) {
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function AdhesionPage() {
    const { data: session, status } = useSession();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [discord, setDiscord] = useState("");
    const [address, setAddress] = useState("");
    const [type, setType] = useState("utilisateur");
    const [motivation, setMotivation] = useState("");
    const [consent, setConsent] = useState(false);
    const [company_website, setCompanyWebsite] = useState(""); // honeypot

    const [existing, setExisting] = useState<MembershipInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState<{ memberNumber: string; renewal: boolean } | null>(null);

    useEffect(() => {
        if (status !== "authenticated") {
            if (status === "unauthenticated") setLoading(false);
            return;
        }
        fetch("/api/adhesion")
            .then((r) => r.json())
            .then((d) => setExisting(d.membership || null))
            .finally(() => setLoading(false));
    }, [status]);

    const handleSubmit = async () => {
        if (!firstName.trim() || !lastName.trim() || !dateOfBirth || !address.trim()) {
            setError("Merci de remplir prénom, nom, date de naissance et adresse postale.");
            return;
        }
        if (!consent) {
            setError("Vous devez accepter le traitement de vos données pour adhérer.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/adhesion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, dateOfBirth, discord, address, type, motivation, consent, company_website }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Une erreur est survenue.");
                return;
            }
            if (data.cardBase64) {
                downloadBase64Pdf(data.cardBase64, `carte-adherent-${data.memberNumber}.pdf`);
            }
            setDone({ memberNumber: data.memberNumber, renewal: data.renewal });
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setSubmitting(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
                    <IdCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Connectez-vous</h2>
                    <p className="text-gray-500 mb-4">L&apos;adhésion est réservée aux membres Workyt connectés.</p>
                    <Link href="/connexion">
                        <Button className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full px-6">
                            Se connecter
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div
                className="pt-14 pb-10 px-6 rounded-b-[2rem] shadow-lg mb-8"
                style={{ backgroundImage: "linear-gradient(135deg, #ff6a1a 0%, #ff9248 100%)" }}
            >
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <IdCard className="w-8 h-8 text-white" />
                        <h1 className="text-3xl font-bold text-white">Adhérer à l&apos;association</h1>
                    </div>
                    <p className="text-white/90">
                        Devenez adhérent·e de Workyt pour participer aux Assemblées Générales et à la vie de l&apos;association.
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 pb-12 space-y-5">
                {/* Adhésion existante */}
                {existing && !done && (
                    <Card className="border border-emerald-200 bg-emerald-50/50 rounded-2xl">
                        <CardContent className="p-5 flex items-center gap-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800">
                                    Vous êtes déjà adhérent·e ({membershipTypeLabel(existing.type)})
                                </p>
                                <p className="text-sm text-gray-500">
                                    N° {existing.memberNumber} · statut {existing.status === "actif" ? "actif ✅" : "suspendu ⚠️"}
                                </p>
                            </div>
                            <a href="/api/adhesion/carte">
                                <Button variant="outline" className="rounded-xl gap-2">
                                    <Download className="w-4 h-4" /> Ma carte
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                )}

                {/* Succès */}
                {done && (
                    <Card className="border border-emerald-200 bg-emerald-50/50 rounded-2xl">
                        <CardContent className="p-6 text-center">
                            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                            <h2 className="text-xl font-semibold text-gray-800 mb-1">
                                {done.renewal ? "Adhésion mise à jour !" : "Bienvenue parmi les adhérents !"}
                            </h2>
                            <p className="text-gray-500 mb-4">
                                Votre n° d&apos;adhérent : <strong>{done.memberNumber}</strong>. Votre carte a été téléchargée.
                            </p>
                            <a href="/api/adhesion/carte">
                                <Button className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl gap-2">
                                    <Download className="w-4 h-4" /> Retélécharger ma carte
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                )}

                {!done && (!existing || existing.status === "suspendu") && (
                    <>
                        {/* Notice RGPD */}
                        <Card className="border border-gray-200 rounded-2xl">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    <h2 className="font-semibold text-gray-800">Vos données &amp; votre vie privée</h2>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">
                                    Nous appliquons la <strong>minimisation des données</strong> : seul le strict nécessaire
                                    au fonctionnement de l&apos;association est conservé sur le site.
                                </p>

                                <div className="grid sm:grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                                        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 mb-1.5">
                                            <Lock className="w-4 h-4" /> Conservé sur le site
                                        </p>
                                        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                            <li>Lien vers votre compte (prénom &amp; e-mail déjà présents)</li>
                                            <li>Numéro d&apos;adhérent, statut, date d&apos;adhésion</li>
                                            <li>Présence aux Assemblées Générales</li>
                                        </ul>
                                    </div>
                                    <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-3">
                                        <p className="flex items-center gap-1.5 text-sm font-medium text-orange-700 mb-1.5">
                                            <Mail className="w-4 h-4" /> Envoyé au bureau, jamais stocké ici
                                        </p>
                                        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                            <li>Votre date de naissance</li>
                                            <li>Votre adresse postale</li>
                                            <li>Votre pseudo Discord (si fourni)</li>
                                            <li>Votre message de motivation</li>
                                        </ul>
                                        <p className="text-[11px] text-gray-400 mt-1.5">
                                            Transmis uniquement à <strong>bureau@workyt.fr</strong> pour le registre des membres.
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400 mt-3">
                                    Finalité : gestion des adhésions et participation aux AG. Après <strong>3 absences
                                    consécutives</strong> aux AG, le statut d&apos;adhérent est suspendu. Vous pouvez exercer
                                    vos droits (accès, rectification, suppression) en écrivant à bureau@workyt.fr.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Formulaire */}
                        <Card className="border border-gray-200 rounded-2xl">
                            <CardContent className="p-6 space-y-4">
                                {error && (
                                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        {error}
                                    </div>
                                )}

                                {/* Honeypot anti-bot */}
                                <input
                                    type="text"
                                    value={company_website}
                                    onChange={(e) => setCompanyWebsite(e.target.value)}
                                    className="hidden"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    aria-hidden="true"
                                />

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="firstName">Prénom</Label>
                                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Camille" />
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName">Nom</Label>
                                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dupont" />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="dob">Date de naissance</Label>
                                        <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="discord">Pseudo Discord <span className="text-gray-400 font-normal">(optionnel)</span></Label>
                                        <Input id="discord" value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="ex. camille#0001" />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="address">Adresse postale</Label>
                                    <Textarea
                                        id="address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        rows={2}
                                        placeholder="N°, rue, code postal, ville"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">Envoyée au bureau, non stockée sur le site.</p>
                                </div>

                                <div>
                                    <Label>Votre statut dans l&apos;association</Label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {MEMBERSHIP_TYPE_IDS.map((id) => {
                                            const info = MEMBERSHIP_TYPES[id];
                                            const on = type === id;
                                            return (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => setType(id)}
                                                    className="px-3 py-1.5 rounded-xl border text-sm font-medium transition-all"
                                                    style={
                                                        on
                                                            ? { backgroundColor: info.soft, color: info.color, borderColor: info.color }
                                                            : { backgroundColor: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }
                                                    }
                                                >
                                                    {info.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="motivation">Pourquoi adhérez-vous ? (optionnel)</Label>
                                    <Textarea
                                        id="motivation"
                                        value={motivation}
                                        onChange={(e) => setMotivation(e.target.value)}
                                        rows={3}
                                        placeholder="Quelques mots sur votre motivation…"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">Envoyée au bureau, non stockée sur le site.</p>
                                </div>

                                <label className="flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={consent}
                                        onChange={(e) => setConsent(e.target.checked)}
                                        className="w-4 h-4 mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                                    />
                                    <span className="text-xs text-gray-600">
                                        J&apos;accepte que mes informations soient traitées pour gérer mon adhésion : les données
                                        opérationnelles (n° d&apos;adhérent, statut, présence aux AG) sont conservées sur le site, et
                                        mon adresse postale et ma motivation sont transmises au bureau de l&apos;association sans être
                                        stockées ici.
                                    </span>
                                </label>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl py-3 gap-2 text-base"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <IdCard className="w-5 h-5" />}
                                    {existing ? "Mettre à jour mon adhésion" : "Adhérer et recevoir ma carte"}
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
