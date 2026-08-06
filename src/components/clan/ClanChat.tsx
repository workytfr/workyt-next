"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Send, Trash2 } from 'lucide-react';

/**
 * Le tchat du clan.
 *
 * Éphémère : le fil est effacé à la résolution de minuit, rien n'est archivé.
 * L'interface le dit explicitement — un joueur doit savoir qu'il écrit sur un
 * tableau qu'on efface, et non dans une messagerie.
 *
 * Relève par sondage toutes les dix secondes, avec `since` pour ne demander
 * que le delta. Pas de websocket : la page /clan n'est pas une messagerie, et
 * une poignée de messages par jour ne justifie pas une connexion permanente.
 */

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
  mine: boolean;
}

const INTERVALLE_MS = 10_000;
const MAX_CARACTERES = 300;

/** Heure locale courte — la date n'a aucun sens ici, tout date d'aujourd'hui. */
function heure(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function ClanChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [max, setMax] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  /** Date du dernier message reçu — sert de curseur au sondage */
  const sinceRef = useRef<string | null>(null);
  /** Ne défiler vers le bas que si l'utilisateur y était déjà */
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
        // Le sondage peut chevaucher un envoi optimiste : on dédoublonne
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

  // Défilement automatique, sauf si on est en train de relire plus haut
  useEffect(() => {
    const el = listRef.current;
    if (el && stuckRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stuckRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/clan/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || 'Message non envoyé');
        return;
      }
      setText('');
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

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 font-bold text-gray-800">
        <MessageSquare className="h-5 w-5 text-orange-500" />
        Tchat du clan
      </h2>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
        <Trash2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        Effacé chaque nuit à la résolution — rien n&apos;est conservé.
      </p>

      <div
        ref={listRef}
        onScroll={onScroll}
        className="mb-3 h-72 space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-3"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-400">
            Personne n&apos;a encore parlé aujourd&apos;hui. Annonce ta porte, ton clan suivra.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={m.mine ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  m.mine ? 'bg-orange-500 text-white' : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                {!m.mine && (
                  <p className="mb-0.5 text-[11px] font-bold text-orange-600">{m.username}</p>
                )}
                <p className="whitespace-pre-wrap break-words text-sm leading-snug">{m.text}</p>
                <p
                  className={`mt-0.5 text-right text-[10px] tabular-nums ${
                    m.mine ? 'text-orange-100' : 'text-gray-400'
                  }`}
                >
                  {heure(m.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CARACTERES))}
          maxLength={MAX_CARACTERES}
          disabled={epuise}
          placeholder={epuise ? 'Quota du jour atteint' : 'Coordonne ton clan…'}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={sending || epuise || !text.trim()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-200"
          aria-label="Envoyer"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>

      {remaining !== null && (
        <p className={`mt-2 text-right text-[11px] tabular-nums ${epuise ? 'text-rose-600' : 'text-gray-400'}`}>
          {remaining} / {max} message{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''} aujourd&apos;hui
        </p>
      )}
    </section>
  );
}
