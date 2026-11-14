import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Tâches planifiées, déclenchées par le cron EXTERNE de l'hébergeur.
 *
 * Le site n'est pas un processus unique et permanent : il est gelé quand il
 * est inactif et peut tourner en plusieurs copies. Un cron interne (node-cron)
 * y sautait des passages ou les doublait. C'est donc l'hébergeur qui appelle
 * ces adresses à l'heure voulue, ce qui réveille le site.
 *
 *   GET ou POST /api/cron/<tâche>
 *   Secret (CRON_SECRET) dans l'en-tête `x-cron-secret`, ou
 *   `Authorization: Bearer <secret>`, ou à défaut `?key=<secret>`.
 *
 * Toutes les tâches supportent d'être relancées (idempotentes) : un appel en
 * trop ne fait rien de plus. Les horaires sont dans CRON_JOBS.md.
 */

type Job = () => Promise<unknown>;

const JOBS: Record<string, Job> = {
  // Mercredi matin, relancé toutes les 15 min : chaque appel envoie un lot de
  // 450 e-mails et reprend où le précédent s'est arrêté, jusqu'à `completed`.
  newsletter: async () => {
    const { sendNewsletterBatch } = await import('@/lib/newsletter/sendBatch');
    return sendNewsletterBatch(450);
  },
  // Clôture des évaluations dont le temps est écoulé
  evaluations: async () => {
    const { checkEvaluationTimeouts } = await import('@/lib/cron/evaluationTimeout');
    return checkEvaluationTimeouts();
  },
  // Lundi 00h05 : formation des clans de la semaine
  'clans-formation': async () => {
    const { formClans } = await import('@/lib/clanService');
    return formClans();
  },
  // Chaque nuit, après minuit : résolution de la VEILLE (jour de Paris), quelle
  // que soit l'heure exacte du passage. Index unique {clan, day} contre le double passage.
  'clans-jour': async () => {
    const { resolveDay } = await import('@/lib/clanResolution');
    return resolveDay(new Date(), 'previous');
  },
  // Dimanche 23h50 : dernière journée (le dimanche lui-même) PUIS bilan. L'ordre
  // est impératif : le passage de nuit résout la veille, il arriverait trop tard.
  'clans-semaine': async () => {
    const { resolveDay } = await import('@/lib/clanResolution');
    const { resolveWeek } = await import('@/lib/clanWeekly');
    const day = await resolveDay();
    const week = await resolveWeek();
    return { day, week };
  },
  // Chaque jour 9h : alertes de file, relais automatique, rappels, points d'étape
  'suivi-jour': async () => {
    const { runMentorshipDaily } = await import('@/lib/cron/mentorship');
    return runMentorshipDaily();
  },
  // Chaque jour 18h : quiz du jour pas fait, ordres de clan (app mobile, sons dédiés)
  'relances-soir': async () => {
    const { runEveningNudges } = await import('@/lib/cron/nudges');
    return runEveningNudges('soir');
  },
  // Chaque jour 20h30 : dernière chance quiz du jour / série en danger
  'relances-derniere-chance': async () => {
    const { runEveningNudges } = await import('@/lib/cron/nudges');
    return runEveningNudges('derniere');
  },
  // Chaque jour 17h : « ça fait longtemps » après 2, 5 et 10 jours d'absence
  'relances-inactifs': async () => {
    const { runInactiveNudges } = await import('@/lib/cron/nudges');
    return runInactiveNudges();
  },
  // Lundi 00h20 : série du binôme pour la semaine écoulée
  'suivi-semaine': async () => {
    const { runMentorshipWeekly } = await import('@/lib/cron/mentorship');
    return runMentorshipWeekly();
  },
};

// Une tâche encore en cours dans cette copie du site n'est pas relancée par-dessus.
// Le verrou expire : une tâche bloquée (base injoignable) ne doit pas empêcher
// toutes les suivantes, comme le 14/11/2026 (« déjà en cours » pendant des heures).
const running = new Map<string, number>();
const LOCK_TTL_MS = 10 * 60_000;
// Réponse rendue avant le délai du proxy (60 s) : sinon chaque appel finit en 504
// et la requête reste ouverte côté serveur. La tâche, elle, continue sa course.
const RESPONSE_TIMEOUT_MS = 50_000;

function secretFrom(req: NextRequest): string {
  const header = req.headers.get('x-cron-secret');
  if (header) return header;
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return req.nextUrl.searchParams.get('key') || '';
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const given = Buffer.from(secretFrom(req));
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
}

async function handle(req: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  if (!process.env.CRON_SECRET) {
    console.error('[Cron] CRON_SECRET absent : tâches planifiées désactivées');
    return NextResponse.json({ success: false, error: 'Cron non configuré' }, { status: 503 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const { job } = await params;
  const run = JOBS[job];
  if (!run) {
    return NextResponse.json({ success: false, error: `Tâche inconnue. Tâches : ${Object.keys(JOBS).join(', ')}` }, { status: 404 });
  }
  const lockedAt = running.get(job);
  if (lockedAt && Date.now() - lockedAt < LOCK_TTL_MS) {
    return NextResponse.json({ success: true, skipped: 'déjà en cours' }, { status: 202 });
  }
  if (lockedAt) console.warn(`[Cron] ${job} : verrou expiré après ${Math.round((Date.now() - lockedAt) / 1000)} s, relance`);

  const started = Date.now();
  running.set(job, started);
  const task = (async () => {
    try {
      await connectDB();
      const result = await run();
      const ms = Date.now() - started;
      console.log(`[Cron] ${job} terminé en ${ms} ms`, result);
      return { ok: true as const, ms, result };
    } catch (error) {
      console.error(`[Cron] ${job} en erreur :`, error);
      return { ok: false as const };
    } finally {
      // Seulement si c'est bien notre verrou (un passage plus récent a pu le reprendre)
      if (running.get(job) === started) running.delete(job);
    }
  })();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const outcome = await Promise.race([
    task,
    new Promise<'timeout'>((resolve) => { timer = setTimeout(() => resolve('timeout'), RESPONSE_TIMEOUT_MS); }),
  ]);
  if (timer) clearTimeout(timer);

  if (outcome === 'timeout') {
    console.warn(`[Cron] ${job} toujours en cours après ${RESPONSE_TIMEOUT_MS / 1000} s`);
    return NextResponse.json({ success: false, job, error: 'Tâche trop longue, toujours en cours' }, { status: 504 });
  }
  if (!outcome.ok) {
    // 500 : le tableau de bord de l'hébergeur signale l'échec
    return NextResponse.json({ success: false, job, error: 'Erreur pendant la tâche' }, { status: 500 });
  }
  return NextResponse.json({ success: true, job, ms: outcome.ms, result: outcome.result });
}

export const GET = handle;
export const POST = handle;
