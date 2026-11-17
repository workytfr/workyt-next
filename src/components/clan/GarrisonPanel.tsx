"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Castle, ChevronDown, Hammer, HelpCircle, Loader2, MapPin, Shield, Sparkles, Sword, Undo2, Warehouse
} from 'lucide-react';
import { unitGuide } from '@/lib/clanSoldierCatalog';

/**
 * La garnison : recrutement et déploiement.
 *
 * Réservé au capitaine pour les achats et le déploiement — mais l'ANNULATION
 * est ouverte à tous les membres pendant 12 h. C'est ce garde-fou qui remplace
 * le plafond de dépense quotidien : liberté tactique totale, rien d'irréversible.
 *
 * Chaque fiche dit ce que l'unité FAIT (unitGuide), pas seulement ses
 * chiffres : « ATQ 25 · DEF 5 » ne disait rien à qui découvre le jeu, et le
 * bloc Soutien — sans attaque ni défense — restait une énigme.
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
const CARD = 'rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white';
/** La plus forte stat du catalogue (Bélier, 60) : l'échelle des barres. */
const STAT_MAX = 60;

/** Courbe « ease-out » marquée, commune aux animations du panneau. */
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

const PANEL_CSS = `
@keyframes wk-gar-in { from { opacity: 0; transform: translateY(6px); } }
.wk-gar-in { animation: wk-gar-in .36s ${EASE_OUT} both; }
.wk-press { transition: transform .14s ease-out; }
.wk-press:active:not(:disabled) { transform: scale(.97); }
@keyframes wk-stat { from { transform: scaleX(0); } }
.wk-stat { transform-origin: left center; animation: wk-stat .6s ${EASE_OUT} both; }
@media (prefers-reduced-motion: reduce) {
  .wk-gar-in, .wk-stat { animation: none; }
  .wk-press:active:not(:disabled) { transform: none; }
}
`;

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
  const ring = ratio > 0.5 ? '#7ed957' : ratio > 0.25 ? '#ffb547' : '#e5484d';

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: box, height: box }}>
      <svg viewBox={`0 0 ${box} ${box}`} className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx={box / 2} cy={box / 2} r={R} fill="var(--wk-paper)" strokeWidth="2.5" stroke="rgba(26,21,18,0.1)" />
        <circle
          cx={box / 2} cy={box / 2} r={R} fill="none" strokeWidth="2.5" strokeLinecap="round"
          stroke={ring}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - ratio)}
          style={{ transition: `stroke-dashoffset .6s ${EASE_OUT}` }}
        />
      </svg>
      {image ? (
        <Image
          src={image}
          alt={name}
          width={size}
          height={size}
          className={`relative object-contain ${dim ? 'opacity-45 grayscale' : ''}`}
        />
      ) : (
        <span className={`relative text-base ${dim ? 'opacity-50 grayscale' : ''}`}>{emoji}</span>
      )}
    </span>
  );
}

/** Barre de statistique : la longueur se lit avant le chiffre. */
function StatBar({ label, value, color, icon: Icon, delay }: {
  label: string; value: number; color: string; icon: React.ComponentType<{ className?: string }>; delay: number;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="flex w-[52px] shrink-0 items-center gap-1 font-semibold text-[rgba(26,21,18,0.6)]">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(26,21,18,0.07)]">
        {value > 0 && (
          <span
            className="wk-stat block h-full rounded-full"
            style={{ width: `${Math.min(100, (value / STAT_MAX) * 100)}%`, backgroundColor: color, animationDelay: `${delay}ms` }}
          />
        )}
      </span>
      <span className="w-6 shrink-0 text-right font-bold tabular-nums">{value}</span>
    </div>
  );
}

/** Où se trouve une unité, en mots. */
function placementLabel(u: Unit) {
  if (!u.gate) return { text: 'À la caserne', tone: 'bg-[var(--wk-paper-2)] text-[rgba(26,21,18,0.65)]', Icon: Warehouse };
  if (u.stance === 'assaut') return { text: `Assaut · ${u.gate}`, tone: 'bg-[#fdecec] text-[#c2272d]', Icon: Sword };
  return { text: `Défense · ${u.gate}`, tone: 'bg-[#eaf6fb] text-[#2f86b3]', Icon: Shield };
}

export default function GarrisonPanel({ onChange }: { onChange?: () => void }) {
  const [catalog, setCatalog] = useState<SoldierDef[]>([]);
  const [garrison, setGarrison] = useState<Unit[]>([]);
  const [resources, setResources] = useState(0);
  const [max, setMax] = useState(0);
  const [isCaptain, setIsCaptain] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'combat' | 'soutien'>('combat');
  const [open, setOpen] = useState<string | null>(null);

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
      <section className={`${CARD} p-5 sm:p-6`}>
        <div className="h-6 w-40 animate-pulse rounded-full bg-[var(--wk-paper-2)]" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--wk-paper)]" />)}
        </div>
      </section>
    );
  }

  const idle = garrison.filter((u) => !u.gate).length;
  const full = garrison.length >= max;
  const shownCatalog = catalog.filter((d) => d.kind === tab);
  const fillPct = max > 0 ? Math.min(100, (garrison.length / max) * 100) : 0;

  return (
    <section className={`${CARD} p-5 sm:p-6`} aria-label="La garnison">
      <style>{PANEL_CSS}</style>

      {/* ── En-tête : trésor et place ── */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-serif-display flex items-center gap-2.5 text-2xl leading-none">
          <Castle className="h-5 w-5 text-[var(--wk-accent)]" /> La garnison
        </h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="wk-chip !px-3 !py-1.5 text-sm" title="Trésor du clan : il se remplit en gagnant des journées et en abattant des portes">
            <Hammer className="h-3.5 w-3.5 text-[#9a5d00]" />
            <b className="tabular-nums">{resources}</b> ⚒️
          </span>
          <span className="wk-chip !px-3 !py-1.5 text-sm" title="Places de garnison : 2 par membre du clan">
            <span className="tabular-nums">{garrison.length}/{max}</span> unités
            <span className="ml-1 h-1.5 w-10 overflow-hidden rounded-full bg-[rgba(26,21,18,0.08)]">
              <span
                className="block h-full rounded-full transition-[width] duration-500"
                style={{ width: `${fillPct}%`, backgroundColor: full ? '#e5484d' : 'var(--wk-accent)' }}
              />
            </span>
          </span>
        </div>
      </div>

      <p className="mt-2 max-w-[70ch] text-sm text-[rgba(26,21,18,0.62)]">
        Des unités achetées avec le trésor du clan. Elles se battent <strong>en plus</strong> des joueurs :
        postées à l&apos;<strong>assaut</strong>, elles frappent une porte ennemie ; en <strong>défense</strong>, elles
        tiennent la tienne. Chaque combat les use de 25 % ; à la caserne, elles ne s&apos;usent pas.
      </p>

      {!isCaptain && (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-[var(--wk-paper)] px-3.5 py-2.5 text-xs text-[rgba(26,21,18,0.62)]">
          <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--wk-accent)]" />
          <span>
            Seul le capitaine recrute et déploie. Tu peux en revanche <strong>contester un achat</strong> de plus de
            150 ⚒️ pendant 12 h (bouton <Undo2 className="inline h-3 w-3" />).
          </span>
        </p>
      )}

      {/* ── Les unités en place ── */}
      {garrison.length > 0 && (
        <div className="mt-5">
          <p className="font-mono-ui mb-2 text-[11px] uppercase tracking-[0.14em] text-[rgba(26,21,18,0.5)]">
            Nos troupes
          </p>
          <ul className="grid gap-2 md:grid-cols-2">
            {garrison.map((u, i) => {
              const where = placementLabel(u);
              const isSupport = u.kind === 'soutien';
              return (
                <li
                  key={u.id}
                  className="wk-gar-in flex items-center gap-3 rounded-2xl bg-[var(--wk-paper)] px-3 py-2.5"
                  style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                >
                  <UnitAvatar wear={u.wear} emoji={u.emoji} image={u.image} name={u.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{u.name}</span>
                    <span className="block text-[11px] tabular-nums text-[rgba(26,21,18,0.55)]">
                      {isSupport ? 'Soutien' : `ATQ ${u.atk} · DEF ${u.def}`} · état {u.wear} %
                    </span>
                  </span>

                  {isCaptain ? (
                    <label className="relative">
                      <span className="sr-only">Poste de {u.name}</span>
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
                        className={`cursor-pointer appearance-none rounded-full py-1.5 pl-3 pr-7 text-xs font-semibold outline-none ring-[var(--wk-accent)] focus-visible:ring-2 ${where.tone}`}
                      >
                        <option value="">À la caserne</option>
                        <optgroup label="Assaut (porte ennemie)">
                          {GATES.map((g) => <option key={`a-${g}`} value={`${g}:assaut`}>Assaut · {g}</option>)}
                        </optgroup>
                        <optgroup label="Défense (notre porte)">
                          {GATES.map((g) => <option key={`d-${g}`} value={`${g}:garnison`}>Défense · {g}</option>)}
                        </optgroup>
                      </select>
                      {busy === u.id
                        ? <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin" />
                        : <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-60" />}
                    </label>
                  ) : (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${where.tone}`}>
                      <where.Icon className="h-3 w-3" /> {where.text}
                    </span>
                  )}

                  {u.cancellable && (
                    <button
                      onClick={() => act(u.id, { action: 'cancel', soldierId: u.id }, '/api/clan/deploy', 'Achat annulé')}
                      disabled={busy === u.id}
                      title="Contester cet achat (12 h)"
                      aria-label={`Contester l'achat de ${u.name}`}
                      className="wk-press rounded-full p-1.5 text-[rgba(26,21,18,0.4)] transition-colors hover:bg-[#fdecec] hover:text-[#c2272d]"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {idle > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[rgba(26,21,18,0.5)]">
              <Warehouse className="h-3.5 w-3.5" />
              {idle} unité{idle > 1 ? 's' : ''} à la caserne — elles ne s&apos;usent pas, mais seules les unités de
              soutien y travaillent.
            </p>
          )}
        </div>
      )}

      {/* ── Le catalogue — visible par TOUS : un membre doit comprendre à quoi
          servent les unités, même s'il ne peut pas les acheter ── */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.14em] text-[rgba(26,21,18,0.5)]">
            {isCaptain ? 'Recruter' : 'Les unités'}
          </p>
          <div role="tablist" aria-label="Type d'unités" className="ml-auto inline-flex rounded-full bg-[var(--wk-paper-2)] p-1">
            {([
              ['combat', 'Combat', Sword],
              ['soutien', 'Soutien', Sparkles]
            ] as const).map(([k, label, Icon]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => { setTab(k); setOpen(null); }}
                className={`wk-press inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  tab === k ? 'bg-[var(--wk-ink)] text-[var(--wk-paper)]' : 'text-[rgba(26,21,18,0.6)] hover:text-[var(--wk-ink)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Ce que veut dire l'onglet : la question « c'est quoi, Soutien ? » */}
        <div key={tab} className="wk-gar-in mt-3 rounded-2xl border-2 border-dashed border-[rgba(26,21,18,0.12)] px-4 py-3 text-sm text-[rgba(26,21,18,0.7)]">
          {tab === 'combat' ? (
            <p>
              <strong className="text-[var(--wk-ink)]">Les unités de combat se battent.</strong> Leur <b>ATQ</b> s&apos;ajoute
              à la force d&apos;assaut quand elles sont postées en « Assaut » ; leur <b>DEF</b> s&apos;ajoute à la défense
              d&apos;une porte quand elles sont en « Défense ». Une seule des deux compte, selon le poste.
            </p>
          ) : (
            <p>
              <strong className="text-[var(--wk-ink)]">Les unités de soutien ne se battent pas</strong> — elles n&apos;ont ni
              attaque ni défense. Elles rendent un <b>service chaque nuit, à minuit</b> : espionner, soigner un joueur,
              réparer une unité ou une porte, motiver les troupes. La plupart travaillent depuis la caserne ; seuls le
              Forgeron et le Porte-étendard doivent être postés sur une porte.
            </p>
          )}
        </div>

        <div className="mt-3 grid items-start gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {shownCatalog.map((d, i) => {
            const guide = unitGuide(d.key);
            const tooPoor = resources < d.cost;
            const missing = d.cost - resources;
            const expanded = open === d.key;
            const canBuy = isCaptain && !tooPoor && !full && busy === null;
            const owned = garrison.filter((u) => u.type === d.key).length;

            return (
              <article
                key={d.key}
                className="wk-gar-in flex flex-col rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white p-3.5 transition-[border-color,box-shadow] duration-200 hover:border-[rgba(26,21,18,0.22)] hover:shadow-[0_3px_0_rgba(26,21,18,0.08)]"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--wk-paper)]">
                    {d.image ? (
                      <Image src={d.image} alt="" width={52} height={52} className="object-contain" />
                    ) : (
                      <span className="text-2xl">{d.emoji}</span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif-display text-lg leading-tight">{d.name}</h3>
                      <span className="shrink-0 rounded-full bg-[#fff4e0] px-2 py-0.5 text-xs font-bold tabular-nums text-[#9a5d00]">
                        {d.cost} ⚒️
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-[rgba(26,21,18,0.65)]">{guide.headline}</p>
                    {owned > 0 && (
                      <p className="mt-1 text-[11px] font-semibold text-[var(--wk-accent)]">{owned} dans la garnison</p>
                    )}
                  </div>
                </div>

                {d.kind === 'combat' && (
                  <div className="mt-3 space-y-1">
                    <StatBar label="ATQ" value={d.atk} color="#e5484d" icon={Sword} delay={i * 45 + 120} />
                    <StatBar label="DEF" value={d.def} color="#6ec1e4" icon={Shield} delay={i * 45 + 180} />
                  </div>
                )}

                {/* Le détail, replié : on le déplie quand on hésite */}
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : d.key)}
                  aria-expanded={expanded}
                  className="mt-3 inline-flex items-center gap-1 self-start text-xs font-semibold text-[rgba(26,21,18,0.6)] hover:text-[var(--wk-ink)]"
                >
                  Ce qu&apos;il fait
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300"
                  style={{ gridTemplateRows: expanded ? '1fr' : '0fr', transitionTimingFunction: EASE_OUT }}
                >
                  <div className="overflow-hidden">
                    <ul className="mt-2 space-y-1.5 text-xs leading-snug text-[rgba(26,21,18,0.72)]">
                      {guide.lines.map((l) => (
                        <li key={l} className="flex gap-1.5">
                          <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[var(--wk-accent)]" />
                          {l}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 flex gap-1.5 rounded-xl bg-[var(--wk-paper)] px-2.5 py-2 text-[11px] leading-snug text-[rgba(26,21,18,0.7)]">
                      <MapPin className="mt-px h-3.5 w-3.5 shrink-0 text-[var(--wk-accent)]" />
                      <span><strong>Où le placer :</strong> {guide.where}</span>
                    </p>
                  </div>
                </div>

                {isCaptain && (
                  <button
                    type="button"
                    onClick={() => act(d.key, { type: d.key }, '/api/clan/soldiers', `${d.name} recruté`)}
                    disabled={!canBuy}
                    className={`wk-press mt-3 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                      canBuy
                        ? 'bg-[var(--wk-ink)] text-[var(--wk-paper)] hover:bg-black'
                        : 'cursor-not-allowed bg-[var(--wk-paper-2)] text-[rgba(26,21,18,0.45)]'
                    }`}
                  >
                    {busy === d.key && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {full ? 'Garnison pleine' : tooPoor ? `Il manque ${missing} ⚒️` : `Recruter · ${d.cost} ⚒️`}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] leading-snug text-[rgba(26,21,18,0.5)]">
          {isCaptain
            ? "Pas plus de la moitié des achats du jour sur un même type (deux exemplaires toujours permis). Un achat de plus de 150 ⚒️ reste contestable 12 h par n'importe quel membre. Une unité détruite rend 25 % de son prix."
            : "Une unité engagée perd 25 % de sa force par combat et disparaît au 4e. Laissée à la caserne, elle ne s'use pas. Une unité détruite rend 25 % de son prix."}
        </p>
      </div>
    </section>
  );
}
