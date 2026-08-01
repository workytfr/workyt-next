"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Hammer, Loader2, Undo2, Warehouse } from 'lucide-react';

/**
 * La garnison : recrutement et déploiement.
 *
 * Réservé au capitaine pour les achats et le déploiement — mais l'ANNULATION
 * est ouverte à tous les membres pendant 12 h. C'est ce garde-fou qui remplace
 * le plafond de dépense quotidien : liberté tactique totale, rien d'irréversible.
 */

interface SoldierDef {
  key: string; name: string; emoji: string; kind: 'combat' | 'soutien';
  cost: number; atk: number; def: number; description: string; image?: string;
}
interface Unit {
  id: string; type: string; name: string; emoji: string; kind: string;
  atk: number; def: number; wear: number; image?: string | null;
  gate: string | null; stance: string | null; cost: number; cancellable: boolean;
}

const GATES = ['nord', 'est', 'sud'] as const;

/**
 * Vignette d'unité : illustration + anneau d'usure.
 *
 * Les sources font 1024x1024 et pesent ~600 Ko chacune : `next/image` les
 * redimensionne et les convertit en webp a la volee. Sans lui, on servirait
 * 7,6 Mo pour douze vignettes de 44 px.
 */
function UnitAvatar({
  wear, emoji, image, name, size = 44
}: { wear: number; emoji: string; image?: string | null; name: string; size?: number }) {
  const box = size + 8;
  const R = (box - 5) / 2;
  const C = 2 * Math.PI * R;
  const ratio = Math.max(0, Math.min(1, wear / 100));
  const dim = ratio <= 0.25;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: box, height: box }}
    >
      <svg viewBox={`0 0 ${box} ${box}`} className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx={box / 2} cy={box / 2} r={R} fill="none" strokeWidth="2.5" className="stroke-gray-200" />
        <circle
          cx={box / 2} cy={box / 2} r={R} fill="none" strokeWidth="2.5" strokeLinecap="round"
          className={ratio > 0.5 ? 'stroke-emerald-500' : ratio > 0.25 ? 'stroke-amber-500' : 'stroke-red-500'}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - ratio)}
        />
      </svg>
      {image ? (
        <Image
          src={image}
          alt={name}
          width={size}
          height={size}
          className={`object-contain transition-all ${dim ? 'opacity-45 grayscale' : ''}`}
        />
      ) : (
        <span className={`text-base ${dim ? 'opacity-50 grayscale' : ''}`}>{emoji}</span>
      )}
    </span>
  );
}

export default function GarrisonPanel({ onChange }: { onChange?: () => void }) {
  const [catalog, setCatalog] = useState<SoldierDef[]>([]);
  const [garrison, setGarrison] = useState<Unit[]>([]);
  const [resources, setResources] = useState(0);
  const [max, setMax] = useState(0);
  const [isCaptain, setIsCaptain] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/clan/soldiers');
      if (!res.ok) return;
      const { data } = await res.json();
      setCatalog(data.catalog ?? []);
      setGarrison(data.garrison ?? []);
      setResources(data.resources ?? 0);
      setMax(data.garrisonMax ?? 0);
      setIsCaptain(!!data.isCaptain);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (key: string, body: any, url: string, ok: string) => {
    setBusy(key);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(d.error || 'Erreur'); return; }
      toast.success(ok);
      await load();
      onChange?.();
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center rounded-2xl border border-gray-200 bg-white p-8">
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
      </div>
    );
  }

  const idle = garrison.filter((u) => !u.gate);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-gray-800">Garnison</h2>
        <span className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 font-bold text-amber-700">
            <Hammer className="h-4 w-4" /> {resources} ⚒️
          </span>
          <span className="text-gray-500 tabular-nums">
            {garrison.length}/{max} unités
          </span>
        </span>
      </div>

      {!isCaptain && (
        <p className="mb-4 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
          Seul le capitaine recrute et déploie. Tu peux en revanche{' '}
          <strong>contester un achat</strong> important pendant 12 h.
        </p>
      )}

      {/* Garnison en place */}
      {garrison.length > 0 && (
        <div className="mb-5 space-y-2">
          {garrison.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <UnitAvatar wear={u.wear} emoji={u.emoji} image={u.image} name={u.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-800">{u.name}</span>
                <span className="block text-[11px] text-gray-500 tabular-nums">
                  ATQ {u.atk} · DEF {u.def} · {u.wear}%
                </span>
              </span>

              {isCaptain ? (
                <select
                  value={u.gate ? `${u.gate}:${u.stance}` : ''}
                  onChange={(e) => {
                    const [gate, stance] = e.target.value.split(':');
                    act(u.id,
                      { action: 'garrison', assignments: [{ soldierId: u.id, gate: gate || null, stance: stance || null }] },
                      '/api/clan/deploy',
                      gate ? `${u.name} déployé` : `${u.name} rappelé à la caserne`);
                  }}
                  disabled={busy === u.id}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                >
                  <option value="">🏠 Caserne (ne s&apos;use pas)</option>
                  {GATES.map((g) => (
                    <option key={`a-${g}`} value={`${g}:assaut`}>⚔️ Assaut · {g}</option>
                  ))}
                  {GATES.map((g) => (
                    <option key={`d-${g}`} value={`${g}:garnison`}>🛡️ Défense · {g}</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-gray-500">
                  {u.gate ? `${u.stance === 'assaut' ? '⚔️' : '🛡️'} ${u.gate}` : '🏠 caserne'}
                </span>
              )}

              {u.cancellable && (
                <button
                  onClick={() => act(u.id, { action: 'cancel', soldierId: u.id }, '/api/clan/deploy', 'Achat annulé')}
                  disabled={busy === u.id}
                  title="Contester cet achat (12 h)"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {idle.length > 0 && (
            <p className="flex items-center gap-1.5 pt-1 text-[11px] text-gray-400">
              <Warehouse className="h-3.5 w-3.5" />
              {idle.length} unité(s) en réserve — elles ne s&apos;usent pas.
            </p>
          )}
        </div>
      )}

      {/* Catalogue — visible par TOUS : un membre doit pouvoir comprendre à quoi
          servent les unités, même s'il ne peut pas les acheter. */}
      <>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            {isCaptain ? 'Recruter' : 'Le catalogue des unités'}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {catalog.map((d) => {
              const tooPoor = resources < d.cost;
              const full = garrison.length >= max;
              return (
                <button
                  key={d.key}
                  onClick={isCaptain ? () => act(d.key, { type: d.key }, '/api/clan/soldiers', `${d.name} recruté`) : undefined}
                  disabled={!isCaptain || busy === d.key || tooPoor || full}
                  title={
                    !isCaptain ? d.description
                    : full ? 'Garnison pleine'
                    : tooPoor ? 'Trésor insuffisant'
                    : d.description
                  }
                  className={`flex items-start gap-2 rounded-xl border-2 border-gray-200 p-2.5 text-left transition-colors enabled:hover:border-orange-300 enabled:hover:bg-orange-50/40 ${
                    isCaptain ? 'disabled:opacity-40' : 'cursor-default'
                  }`}
                >
                  {d.image ? (
                    <Image
                      src={d.image}
                      alt={d.name}
                      width={40}
                      height={40}
                      className="shrink-0 object-contain"
                    />
                  ) : (
                    <span className="text-lg">{d.emoji}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-gray-800">{d.name}</span>
                      <span className="shrink-0 text-xs font-bold text-amber-700">{d.cost} ⚒️</span>
                    </span>
                    <span className="block text-[11px] leading-snug text-gray-500">
                      {d.kind === 'combat' ? `ATQ ${d.atk} · DEF ${d.def}` : d.description}
                    </span>
                    {d.kind === 'combat' && (
                      <span className="mt-0.5 block text-[11px] leading-snug text-gray-400">
                        {d.description}
                      </span>
                    )}
                  </span>
                  {busy === d.key && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-snug text-gray-400">
            {isCaptain
              ? "Pas plus de la moitié des achats du jour sur un même type. Un achat de plus de 150 ⚒️ reste contestable 12 h par n'importe quel membre."
              : "Une unité engagée perd 25 % de sa force par assaut et disparaît au 4e. Laissée à la caserne, elle ne s'use pas."}
          </p>
        </>
    </section>
  );
}
