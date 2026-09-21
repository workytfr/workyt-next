import { NextResponse } from 'next/server';
import type { Result } from './service';

/** Traduit un Result du service en réponse HTTP */
export function respond<T>(result: Result<T>, okStatus = 200) {
  if (result.ok) return NextResponse.json({ success: true, data: result.data ?? null }, { status: okStatus });
  return NextResponse.json({ success: false, error: result.error }, { status: result.status });
}

export const unauthorized = () =>
  NextResponse.json({ success: false, error: 'Connecte-toi pour accéder au suivi.' }, { status: 401 });

/** 404 et non 403 : on ne confirme jamais l'existence d'un suivi privé */
export const notFound = () =>
  NextResponse.json({ success: false, error: 'Suivi introuvable.' }, { status: 404 });

export const forbidden = (error = 'Accès réservé.') =>
  NextResponse.json({ success: false, error }, { status: 403 });

export const serverError = (label: string, error: unknown) => {
  console.error(`Erreur ${label}:`, error);
  return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 });
};
