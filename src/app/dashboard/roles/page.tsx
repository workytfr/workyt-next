"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
    Shield,
    Plus,
    Pencil,
    Trash2,
    Copy,
    X,
    Loader2,
    Users,
    ChevronDown,
    ChevronUp,
    Lock,
    Check,
} from "lucide-react";
import "../../dashboard/styles/dashboard-theme.css";

interface RoleData {
    _id: string;
    name: string;
    displayName: string;
    description: string;
    color: string;
    permissions: string[];
    isSystem: boolean;
    isDefault: boolean;
    priority: number;
    userCount: number;
}

type PermMap = Record<string, string>;
type PermGroups = Record<string, string[]>;

export default function RolesPage() {
    const { data: session } = useSession();
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [permissions, setPermissions] = useState<PermMap>({});
    const [permGroups, setPermGroups] = useState<PermGroups>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Editing state
    const [editingRole, setEditingRole] = useState<RoleData | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [formName, setFormName] = useState("");
    const [formDisplayName, setFormDisplayName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formColor, setFormColor] = useState("#6b7280");
    const [formPriority, setFormPriority] = useState(0);
    const [formPermissions, setFormPermissions] = useState<Set<string>>(new Set());

    // Expanded permission groups
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const fetchRoles = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/roles", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setRoles(data.roles || []);
                setPermissions(data.permissions || {});
                setPermGroups(data.permissionGroups || {});
            }
        } catch {
            setError("Erreur de chargement.");
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken]);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    const resetForm = () => {
        setFormName("");
        setFormDisplayName("");
        setFormDescription("");
        setFormColor("#6b7280");
        setFormPriority(0);
        setFormPermissions(new Set());
        setEditingRole(null);
        setIsCreating(false);
        setError(null);
    };

    const openCreate = () => {
        resetForm();
        setIsCreating(true);
        setExpandedGroups(new Set(Object.keys(permGroups)));
    };

    const openEdit = (role: RoleData) => {
        setEditingRole(role);
        setIsCreating(false);
        setFormName(role.name);
        setFormDisplayName(role.displayName);
        setFormDescription(role.description);
        setFormColor(role.color);
        setFormPriority(role.priority);
        setFormPermissions(new Set(role.permissions));
        setExpandedGroups(new Set(Object.keys(permGroups)));
        setError(null);
    };

    const togglePerm = (perm: string) => {
        setFormPermissions((prev) => {
            const next = new Set(prev);
            if (next.has(perm)) next.delete(perm);
            else next.add(perm);
            return next;
        });
    };

    const toggleGroup = (groupName: string) => {
        const groupPerms = permGroups[groupName] || [];
        const allSelected = groupPerms.every((p) => formPermissions.has(p));
        setFormPermissions((prev) => {
            const next = new Set(prev);
            groupPerms.forEach((p) => {
                if (allSelected) next.delete(p);
                else next.add(p);
            });
            return next;
        });
    };

    const handleSave = async () => {
        if (!session?.accessToken) return;
        setSaving(true);
        setError(null);
        setSuccess(null);

        const body = {
            name: formName,
            displayName: formDisplayName,
            description: formDescription,
            color: formColor,
            priority: formPriority,
            permissions: Array.from(formPermissions),
        };

        try {
            const url = editingRole
                ? `/api/admin/roles/${editingRole._id}`
                : "/api/admin/roles";
            const res = await fetch(url, {
                method: editingRole ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Erreur."); setSaving(false); return; }

            setSuccess(editingRole ? "Rôle mis à jour." : "Rôle créé !");
            resetForm();
            fetchRoles();
        } catch {
            setError("Erreur réseau.");
        } finally {
            setSaving(false);
        }
    };

    const handleClone = async (roleId: string) => {
        if (!session?.accessToken) return;
        try {
            const res = await fetch(`/api/admin/roles/${roleId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (res.ok) {
                setSuccess("Rôle cloné !");
                fetchRoles();
            }
        } catch {}
    };

    const handleDelete = async (roleId: string, roleName: string) => {
        if (!session?.accessToken) return;
        if (!confirm(`Supprimer le rôle "${roleName}" ?`)) return;
        try {
            const res = await fetch(`/api/admin/roles/${roleId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            setSuccess("Rôle supprimé.");
            fetchRoles();
        } catch {}
    };

    const showForm = isCreating || editingRole;
    const isSystemEdit = editingRole?.isSystem && editingRole.name === "Admin";

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#37352f] flex items-center gap-2">
                        <Shield className="w-7 h-7 text-[#f97316]" />
                        Gestion des rôles
                    </h1>
                    <p className="text-sm text-[#6b6b6b] mt-1">
                        Créez, modifiez et gérez les permissions de chaque rôle
                    </p>
                </div>
                {!showForm && (
                    <button onClick={openCreate} className="dash-button dash-button-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nouveau rôle
                    </button>
                )}
            </div>

            {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center justify-between">
                    <p className="text-sm text-emerald-700">{success}</p>
                    <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Formulaire */}
            {showForm && (
                <div className="dash-card mb-6">
                    <div className="dash-card-header flex items-center justify-between">
                        <span className="font-semibold text-[#37352f]">
                            {editingRole ? `Modifier : ${editingRole.displayName}` : "Nouveau rôle"}
                        </span>
                        <button onClick={resetForm} className="text-[#6b6b6b] hover:text-[#37352f]">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="dash-card-body space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Infos de base */}
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <label className="dash-label mb-1 block text-xs">Nom (identifiant)</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="dash-input w-full"
                                    placeholder="Ex: Tuteur"
                                    disabled={editingRole?.isSystem}
                                />
                            </div>
                            <div>
                                <label className="dash-label mb-1 block text-xs">Nom d&apos;affichage</label>
                                <input
                                    type="text"
                                    value={formDisplayName}
                                    onChange={(e) => setFormDisplayName(e.target.value)}
                                    className="dash-input w-full"
                                    placeholder="Ex: Tuteur"
                                />
                            </div>
                            <div>
                                <label className="dash-label mb-1 block text-xs">Couleur</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={formColor}
                                        onChange={(e) => setFormColor(e.target.value)}
                                        className="w-9 h-9 rounded-lg border border-[#e3e2e0] cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formColor}
                                        onChange={(e) => setFormColor(e.target.value)}
                                        className="dash-input flex-1"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="dash-label mb-1 block text-xs">Priorité</label>
                                <input
                                    type="number"
                                    value={formPriority}
                                    onChange={(e) => setFormPriority(parseInt(e.target.value) || 0)}
                                    className="dash-input w-full"
                                    min={0}
                                    max={99}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="dash-label mb-1 block text-xs">Description</label>
                            <input
                                type="text"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                className="dash-input w-full"
                                placeholder="Décrivez ce rôle..."
                            />
                        </div>

                        {/* Permissions */}
                        <div>
                            <label className="dash-label mb-2 block text-xs">
                                Permissions ({formPermissions.size}/{Object.keys(permissions).length})
                            </label>

                            {isSystemEdit && (
                                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                    <Lock className="w-4 h-4 text-amber-500" />
                                    <p className="text-xs text-amber-700">Le rôle Admin a toujours toutes les permissions.</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                {Object.entries(permGroups).map(([groupName, groupPerms]) => {
                                    const isExpanded = expandedGroups.has(groupName);
                                    const selectedCount = groupPerms.filter((p) => formPermissions.has(p)).length;
                                    const allSelected = selectedCount === groupPerms.length;

                                    return (
                                        <div key={groupName} className="border border-[#e3e2e0] rounded-lg overflow-hidden">
                                            <div
                                                className="flex items-center gap-3 px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => setExpandedGroups((prev) => {
                                                    const next = new Set(prev);
                                                    if (next.has(groupName)) next.delete(groupName);
                                                    else next.add(groupName);
                                                    return next;
                                                })}
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                <span className="text-sm font-medium text-[#37352f] flex-1">{groupName}</span>
                                                <span className="text-xs text-[#6b6b6b]">{selectedCount}/{groupPerms.length}</span>
                                                {!isSystemEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleGroup(groupName); }}
                                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                            allSelected
                                                                ? "bg-[#f97316] border-[#f97316]"
                                                                : selectedCount > 0
                                                                    ? "bg-orange-100 border-[#f97316]"
                                                                    : "border-gray-300 hover:border-[#f97316]"
                                                        }`}
                                                    >
                                                        {allSelected && <Check className="w-3 h-3 text-white" />}
                                                    </button>
                                                )}
                                            </div>
                                            {isExpanded && (
                                                <div className="px-3 py-2 grid grid-cols-2 gap-1.5">
                                                    {groupPerms.map((perm) => (
                                                        <label
                                                            key={perm}
                                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                                                                formPermissions.has(perm) ? "bg-orange-50" : "hover:bg-gray-50"
                                                            } ${isSystemEdit ? "opacity-60 pointer-events-none" : ""}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={formPermissions.has(perm)}
                                                                onChange={() => togglePerm(perm)}
                                                                className="accent-[#f97316]"
                                                                disabled={isSystemEdit}
                                                            />
                                                            <span className="text-xs text-[#37352f]">{permissions[perm]}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button onClick={resetForm} className="dash-button dash-button-secondary">
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formName || !formDisplayName}
                                className="dash-button dash-button-primary flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
                                ) : (
                                    editingRole ? "Mettre à jour" : "Créer le rôle"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Liste des rôles */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
                </div>
            ) : (
                <div className="space-y-2">
                    {roles.map((role) => (
                        <div key={role._id} className="dash-card hover:shadow-sm transition-shadow">
                            <div className="dash-card-body flex items-center gap-4 py-3">
                                {/* Badge couleur */}
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: role.color + '20' }}
                                >
                                    <Shield className="w-5 h-5" style={{ color: role.color }} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-[#37352f]">{role.displayName}</p>
                                        {role.isSystem && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">
                                                Système
                                            </span>
                                        )}
                                        {role.isDefault && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded font-medium">
                                                Par défaut
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-xs text-[#6b6b6b]">{role.description || "Aucune description"}</span>
                                        <span className="text-xs text-[#6b6b6b] flex items-center gap-1">
                                            <Users className="w-3 h-3" /> {role.userCount}
                                        </span>
                                        <span className="text-xs text-[#6b6b6b]">
                                            {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => handleClone(role._id)}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Cloner"
                                    >
                                        <Copy className="w-4 h-4 text-[#6b6b6b]" />
                                    </button>
                                    <button
                                        onClick={() => openEdit(role)}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Modifier"
                                    >
                                        <Pencil className="w-4 h-4 text-[#6b6b6b]" />
                                    </button>
                                    {!role.isSystem && (
                                        <button
                                            onClick={() => handleDelete(role._id, role.displayName)}
                                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
