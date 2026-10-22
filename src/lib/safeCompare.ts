import crypto from "crypto";

/** Compare deux secrets en temps constant (pas de fuite par la durée de comparaison). */
export function safeCompare(given: string | null | undefined, expected: string | null | undefined): boolean {
    if (!given || !expected) return false;
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}
