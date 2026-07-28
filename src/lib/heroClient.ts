'use client';

/**
 * Client partagé pour GET /api/hero.
 *
 * La page /recompenses monte BattleModal ET AdventureBoard, qui appelaient
 * chacun /api/hero au montage : 2 requêtes simultanées, ~6 requêtes Mongo
 * chacune, pour exactement la même donnée. On mutualise ici :
 * - une seule requête en vol à la fois (les appelants partagent la promesse)
 * - petit cache TTL pour les remontages (AdventureBoard remonte à chaque claim)
 *
 * Toute action qui modifie le héros (quiz, soin, claim) doit appeler
 * invalidateHero() pour forcer une relecture.
 */

export interface HeroPayload {
  hero: any;
  monster: any;
  mushrooms: number;
}

const TTL_MS = 10_000;

let inflight: Promise<HeroPayload | null> | null = null;
let cached: { at: number; data: HeroPayload } | null = null;

export function invalidateHero() {
  cached = null;
}

export async function fetchHero(force = false): Promise<HeroPayload | null> {
  if (force) cached = null;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('/api/hero');
      if (!res.ok) return null;
      const data = (await res.json()) as HeroPayload;
      cached = { at: Date.now(), data };
      return data;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
