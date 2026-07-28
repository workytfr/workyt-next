'use client';

/**
 * Vérification « en favori » avec REGROUPEMENT automatique.
 *
 * Même problème que les avatars : BookmarkButton est monté une fois par carte
 * de liste et appelait /api/bookmarks/check individuellement (~80 ms × 10+).
 * Tous les appels émis dans la même fenêtre de 20 ms partent en un seul POST.
 */

export type BookmarkContentType = 'fiche' | 'forum' | 'cours' | 'exercise';

export interface BookmarkState {
  bookmarked: boolean;
  collection?: string;
}

const BATCH_WINDOW_MS = 20;
const NOT_BOOKMARKED: BookmarkState = { bookmarked: false };

const cache = new Map<string, BookmarkState>();
const pending = new Map<string, Array<(v: BookmarkState) => void>>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let authToken: string | null = null;

const keyOf = (contentType: BookmarkContentType, refId: string) => `${contentType}:${refId}`;

async function flush() {
  flushTimer = null;
  const keys = [...pending.keys()];
  if (keys.length === 0) return;

  const waiters = new Map(pending);
  pending.clear();

  const settle = (key: string, value: BookmarkState) => {
    cache.set(key, value);
    for (const resolve of waiters.get(key) ?? []) resolve(value);
  };

  try {
    const items = keys.map((k) => {
      const [contentType, refId] = k.split(':');
      return { contentType, refId };
    });

    const res = await fetch('/api/bookmarks/check-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({ items })
    });
    const json = res.ok ? await res.json() : null;

    // La réponse ne contient QUE les favoris : l'absence vaut « pas en favori »
    for (const key of keys) settle(key, json?.data?.[key] ?? NOT_BOOKMARKED);
  } catch {
    for (const key of keys) settle(key, NOT_BOOKMARKED);
  }
}

/**
 * @param token jeton de session — la route batch est authentifiée par Bearer
 */
export function fetchBookmarkState(
  contentType: BookmarkContentType,
  refId: string,
  token: string
): Promise<BookmarkState> {
  authToken = token;
  const key = keyOf(contentType, refId);

  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);

  return new Promise((resolve) => {
    const list = pending.get(key);
    if (list) list.push(resolve);
    else pending.set(key, [resolve]);
    if (!flushTimer) flushTimer = setTimeout(flush, BATCH_WINDOW_MS);
  });
}

/** À appeler après un ajout/retrait de favori pour ne pas servir un état périmé. */
export function invalidateBookmark(contentType: BookmarkContentType, refId: string) {
  cache.delete(keyOf(contentType, refId));
}
