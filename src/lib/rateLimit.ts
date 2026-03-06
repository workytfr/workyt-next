import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const cache = new Map<string, RateLimitEntry>();

// Nettoyage automatique toutes les 5 minutes
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  for (const [key, entry] of cache.entries()) {
    if (now > entry.resetTime) cache.delete(key);
  }
}

/**
 * Rate limiter en mémoire.
 * @param key - Identifiant unique (userId, IP, etc.)
 * @param max - Nombre max de requêtes dans la fenêtre
 * @param windowMs - Durée de la fenêtre en ms
 * @returns { success, remaining, retryAfterMs }
 */
export function rateLimit(key: string, max: number, windowMs: number) {
  cleanup();
  const now = Date.now();

  const entry = cache.get(key);

  if (!entry || now > entry.resetTime) {
    cache.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: max - 1, retryAfterMs: 0 };
  }

  if (entry.count >= max) {
    return {
      success: false,
      remaining: 0,
      retryAfterMs: entry.resetTime - now,
    };
  }

  entry.count++;
  return { success: true, remaining: max - entry.count, retryAfterMs: 0 };
}

/**
 * Extrait l'IP depuis la requête Next.js
 */
export function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Retourne une réponse 429 formatée
 */
export function rateLimitResponse(retryAfterMs: number) {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({
      error: `Trop de requêtes. Réessayez dans ${retryAfterSec}s.`,
      retryAfter: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    }
  );
}
