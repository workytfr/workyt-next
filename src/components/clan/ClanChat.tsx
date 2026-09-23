"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Send, Trash2, X } from 'lucide-react';
import {
  CHAT_TEMPLATES,
  CATEGORY_LABEL,
  GATE_VALUES,
  ROLE_VALUES,
  ROLE_LABEL_CHAT,
  renderChatMessage,
  type ChatTemplateDef,
  type SlotKind
} from '@/lib/clanChatTemplates';
import { SOLDIER_CATALOG } from '@/lib/clanSoldierCatalog';

/**
 * Le tchat du clan.
 *
 * Deux partis pris, tous deux dictés par le public de Workyt :
 *
 *   — Éphémère : le fil est effacé à la résolution de minuit, rien n'est
 *     archivé. L'interface le dit explicitement : un joueur doit savoir qu'il
 *     écrit sur un tableau qu'on efface.
 *
 *   — Sans saisie libre : on ne rédige pas, on COMPOSE. Une phrase du
 *     catalogue, puis ses emplacements remplis par des boutons. Il n'existe
 *     aucun champ de texte dans ce composant, et ce n'est pas un oubli — c'est
 *     ce qui permet de se passer de modération sur un fil que personne ne
 *     relira jamais.
 *
 * Relève par sondage toutes les dix secondes, avec `since` pour ne demander
 * que le delta. Pas de websocket : quelques messages par jour ne justifient
 * pas une connexion permanente.
 */

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  targetUserId: string | null;
  createdAt: string;
  mine: boolean;
}

export interface ChatMember {
  userId: string;
  username: string;
}

const INTERVALLE_MS = 10_000;

/** Heure locale courte — la date n'a aucun sens ici, tout date d'aujourd'hui. */
function heure(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Les phrases, groupées par rubrique, dans l'ordre du catalogue. */
const PAR_CATEGORIE = CHAT_TEMPLATES.reduce<Record<string, ChatTemplateDef[]>>((acc, t) => {
  (acc[t.category] ??= []).push(t);
  return acc;
}, {});

export default function ClanChat({
  members = [],
  myUserId
}: {
  /** Membres du clan — la seule source possible pour l'emplacement « membre » */
  members?: ChatMember[];
  myUserId?: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [max, setMax] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  /** Phrase en cours de composition, null = on choisit encore */
  const [draft, setDraft] = useState<ChatTemplateDef | null>(null);
  const [slots, setSlots] = useState<Record<string, string>>({});

  const listRef = useRef<HTMLDivElement>(null);
  const sinceRef = useRef<string | null>(null);
  const stuckRef = useRef(true);

  const load = useCallback(async (delta: boolean) => {
    const url = delta && sinceRef.current
      ? `/api/clan/chat?since=${encodeURIComponent(sinceRef.current)}`
      : '/api/clan/chat';
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const data = json?.data;
      if (!data) return;

      setRemaining(data.remaining);
      setMax(data.max);

      const fresh: ChatMessage[] = data.messages ?? [];
      if (fresh.length) sinceRef.current = fresh[fresh.length - 1].createdAt;

      setMessages((prev) => {
        if (!delta) return fresh;
        if (!fresh.length) return prev;
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...fresh.filter((m) => !seen.has(m.id))];
      });
    } catch {
      /* réseau capricieux : la relève suivante rattrapera */
    }
  }, []);

  useEffect(() => {
    load(false).finally(() => setLoading(false));
    const t = setInterval(() => load(true), INTERVALLE_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const el = listRef.current;
    if (el && stuckRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stuckRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  /** Les autres membres : se citer soi-même n'a aucun sens */
  const autres = useMemo(
    () => members.filter((m) => m.userId !== myUserId),
    [members, myUserId]
  );

  /** Aperçu de la phrase telle qu'elle partira */
  const apercu = draft
    ? renderChatMessage(draft.key, {
        memberName: autres.find((m) => m.userId === slots.member)?.username ?? null,
        gate: slots.gate ?? null,
        soldierName: SOLDIER_CATALOG.find((s) => s.key === slots.soldier)?.name ?? null,
        role: slots.role ?? null
      })
    : '';

  const complet = draft ? draft.slots.every((k) => !!slots[k]) : false;

  /**
   * Déjà dit aujourd'hui ?
   *
   * Le serveur refuse de toute façon le doublon (voir clanChat.sendMessage) ;
   * ici on l'annonce AVANT l'envoi plutôt que de laisser le joueur découvrir
   * la règle par une erreur. La comparaison porte sur la phrase rendue, ce qui
   * revient exactement au même : le rendu est déterministe, deux phrases
   * identiques ont forcément les mêmes emplacements.
   */
  const dejaDit = complet && messages.some((m) => m.mine && m.text === apercu);

  const annuler = () => {
    setDraft(null);
    setSlots({});
  };

  const send = async () => {
    if (!draft || !complet || dejaDit || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/clan/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: draft.key,
          memberId: slots.member ?? null,
          gate: slots.gate ?? null,
          soldier: slots.soldier ?? null,
          role: slots.role ?? null
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || 'Message non envoyé');
        return;
      }
      annuler();
      stuckRef.current = true;
      await load(true);
      if (typeof json.remaining === 'number') setRemaining(json.remaining);
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setSending(false);
    }
  };

  const epuise = remaining === 0;

  /** Valeurs proposées pour un emplacement — toujours une liste fermée. */
  const optionsPour = (kind: SlotKind): { value: string; label: string }[] => {
    switch (kind) {
      case 'member':
        return autres.map((m) => ({ value: m.userId, label: m.username }));
      case 'gate':
        return GATE_VALUES.map((g) => ({ value: g, label: g }));
      case 'soldier':
        return SOLDIER_CATALOG.map((s) => ({ value: s.key, label: `${s.emoji} ${s.name}` }));
      case 'role':
        return ROLE_VALUES.map((r) => ({ value: r, label: ROLE_LABEL_CHAT[r] }));
      default:
        return [];
    }
  };

  const SLOT_TITRE: Record<SlotKind, string> = {
    member: 'Quel membre ?',
    gate: 'Quelle porte ?',
    soldier: 'Quelle unité ?',
    role: 'Quel rôle ?'
  };

  return (
    <section className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5">
      <h2 className="mb-1 flex items-center gap-2 font-bold text-[var(--wk-ink)]">
        <MessageSquare className="h-5 w-5 text-orange-500" />
        Tchat du clan
      </h2>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-[rgba(26,21,18,0.55)]">
        <Trash2 className="h-3.5 w-3.5 shrink-0 text-[rgba(26,21,18,0.45)]" />
        Messages à composer, effacés chaque nuit — rien n&apos;est conservé.
      </p>

      <div
        ref={listRef}
        onScroll={onScroll}
        className="mb-3 h-72 space-y-2 overflow-y-auto rounded-xl bg-[var(--wk-paper)] p-3"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="flex h-full items-center justify-center px-4 text-center text-sm text-[rgba(26,21,18,0.45)]">
            Personne n&apos;a encore parlé aujourd&apos;hui. Annonce ta porte, ton clan suivra.
          </p>
        ) : (
          messages.map((m) => {
            const pourMoi = !!myUserId && m.targetUserId === myUserId;
            return (
              <div key={m.id} className={m.mine ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    m.mine
                      ? 'bg-[var(--wk-accent)] text-white'
                      : pourMoi
                        ? 'bg-white text-[var(--wk-ink)] shadow-sm ring-2 ring-orange-300'
                        : 'bg-white text-[var(--wk-ink)] shadow-sm'
                  }`}
                >
                  {!m.mine && (
                    <p className="mb-0.5 text-[11px] font-bold text-[#c24a0a]">{m.username}</p>
                  )}
                  <p className="break-words text-sm leading-snug">{m.text}</p>
                  <p
                    className={`mt-0.5 text-right text-[10px] tabular-nums ${
                      m.mine ? 'text-orange-100' : 'text-[rgba(26,21,18,0.45)]'
                    }`}
                  >
                    {heure(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Le compositeur ── */}
      {epuise ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-3 text-center text-sm text-[rgba(26,21,18,0.45)]">
          Quota du jour atteint. Le compteur repart à minuit.
        </p>
      ) : !draft ? (
        <div className="space-y-3">
          {Object.entries(PAR_CATEGORIE).map(([cat, list]) => (
            <div key={cat}>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[rgba(26,21,18,0.45)]">
                {CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL]}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {list.map((t) => {
                  // Une phrase qui vise un membre n'a pas de sens dans un clan
                  // où je suis seul : on la retire plutôt que de l'offrir vide.
                  const impossible = t.slots.includes('member') && autres.length === 0;
                  return (
                    <button
                      key={t.key}
                      onClick={() => { setDraft(t); setSlots({}); }}
                      disabled={impossible}
                      className="rounded-full border border-[rgba(26,21,18,0.1)] px-3 py-1.5 text-xs font-medium text-[var(--wk-ink)] transition-colors hover:border-orange-300 hover:bg-[rgba(255,106,26,0.08)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border-2 border-orange-200 bg-[rgba(255,106,26,0.08)]/40 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--wk-ink)]">{apercu}</p>
            <button
              onClick={annuler}
              className="shrink-0 rounded-lg p-1 text-[rgba(26,21,18,0.45)] transition-colors hover:bg-white hover:text-[var(--wk-ink)]"
              aria-label="Annuler"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {draft.slots.map((kind) => (
            <div key={kind}>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[rgba(26,21,18,0.55)]">
                {SLOT_TITRE[kind]}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {optionsPour(kind).map((o) => {
                  const actif = slots[kind] === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => setSlots((s) => ({ ...s, [kind]: o.value }))}
                      className={`rounded-full border-2 px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                        actif
                          ? 'border-orange-500 bg-[var(--wk-accent)] text-white'
                          : 'border-[rgba(26,21,18,0.1)] bg-white text-[rgba(26,21,18,0.62)] hover:border-orange-300'
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {dejaDit && (
            <p className="text-[11px] font-medium text-amber-700">
              Tu as déjà envoyé ce message aujourd&apos;hui. Change une valeur, ou
              choisis une autre phrase.
            </p>
          )}

          <button
            onClick={send}
            disabled={!complet || dejaDit || sending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--wk-accent)] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-200"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Envoyer
          </button>
        </div>
      )}

      {remaining !== null && !epuise && (
        <p className="mt-2 text-right text-[11px] tabular-nums text-[rgba(26,21,18,0.45)]">
          {remaining} / {max} message{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''} aujourd&apos;hui
        </p>
      )}
    </section>
  );
}
