'use client';

/**
 * Chargeur de personnalisations avec REGROUPEMENT automatique.
 *
 * Le problème : AvatarDisplay, UsernameDisplay et CustomUsername sont montés
 * une fois par auteur dans une liste de forum. Chacun appelait
 * /api/users/<id>/customization → 15 requêtes HTTP, 45 requêtes Mongo, ~90 ms
 * chacune, à chaque rendu de page.
 *
 * Ici, tous les appels émis dans la même fenêtre de 20 ms sont fusionnés en un
 * seul POST /api/users/customizations. Les composants n'ont rien à coordonner :
 * ils demandent leur utilisateur, le module s'occupe du regroupement.
 *
 * Les personnalisations changent très rarement → cache long (5 min).
 */

export interface CustomizationPayload {
  customization: {
    usernameColor?: { type: string; value: string; isActive: boolean };
    profileImage?: { filename: string; isActive: boolean };
    profileBorder?: { filename: string; isActive: boolean };
  };
  selectedBadgeIcon: string | null;
}

const TTL_MS = 5 * 60 * 1000;
const BATCH_WINDOW_MS = 20;

const cache = new Map<string, { at: number; data: CustomizationPayload | null }>();
const pending = new Map<string, Array<(v: CustomizationPayload | null) => void>>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  flushTimer = null;
  const ids = [...pending.keys()];
  if (ids.length === 0) return;

  // On détache les callbacks AVANT l'await : un appel arrivé pendant la
  // requête doit ouvrir un nouveau lot, pas se perdre dans celui-ci.
  const waiters = new Map(pending);
  pending.clear();

  const settle = (id: string, value: CustomizationPayload | null) => {
    cache.set(id, { at: Date.now(), data: value });
    for (const resolve of waiters.get(id) ?? []) resolve(value);
  };

  try {
    // Le garde-fou serveur est à 100 ids : on découpe au besoin
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const res = await fetch('/api/users/customizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: chunk })
      });
      const json = res.ok ? await res.json() : null;
      for (const id of chunk) settle(id, json?.data?.[id] ?? null);
    }
  } catch {
    for (const id of ids) settle(id, null);
  }
}

/**
 * Personnalisation d'un utilisateur. Les appels concurrents sont regroupés.
 */
export function fetchCustomization(userId: string): Promise<CustomizationPayload | null> {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.data);

  return new Promise((resolve) => {
    const list = pending.get(userId);
    if (list) {
      list.push(resolve); // déjà demandé dans ce lot : on s'y greffe
    } else {
      pending.set(userId, [resolve]);
    }
    if (!flushTimer) flushTimer = setTimeout(flush, BATCH_WINDOW_MS);
  });
}

/** À appeler après une modification de son propre profil. */
export function invalidateCustomization(userId: string) {
  cache.delete(userId);
}
