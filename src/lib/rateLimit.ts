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
 * IP du client, lue dans des en-têtes que le client ne peut pas falsifier.
 *
 * Le PREMIER élément de X-Forwarded-For est fourni par le client : il suffisait
 * d'en changer à chaque requête pour contourner toutes les limites. Le DERNIER
 * est ajouté par le proxy le plus proche, c'est lui qu'on retient.
 * Derrière un proxy qui pose son propre en-tête (Cloudflare : cf-connecting-ip),
 * le désigner via TRUSTED_IP_HEADER.
 */
export function getIPFromHeaders(headers: Headers | Record<string, unknown> | undefined): string {
  if (!headers) return 'unknown';
  const get = (name: string): string | undefined => {
    if (typeof (headers as Headers).get === 'function') return (headers as Headers).get(name) ?? undefined;
    const v = (headers as Record<string, unknown>)[name];
    return Array.isArray(v) ? v.join(',') : typeof v === 'string' ? v : undefined;
  };

  const trusted = process.env.TRUSTED_IP_HEADER?.toLowerCase();
  if (trusted) {
    const v = get(trusted)?.split(',').pop()?.trim();
    if (v) return v;
  }
  return (
    get('x-forwarded-for')?.split(',').pop()?.trim() ||
    get('x-real-ip')?.trim() ||
    'unknown'
  );
}

export function getIP(req: NextRequest): string {
  return getIPFromHeaders(req.headers);
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
