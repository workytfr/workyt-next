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
  // Chaque jour 00h01 : résolution de la veille (index unique {clan, day} contre le double passage)
  'clans-jour': async () => {
    const { resolveDay } = await import('@/lib/clanResolution');
    return resolveDay();
  },
  // Dimanche 23h50 : dernière journée PUIS bilan. L'ordre est impératif : le
  // passage de 00h01 résout la veille, le dimanche n'aurait jamais le sien.
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
  // Lundi 00h20 : série du binôme pour la semaine écoulée
  'suivi-semaine': async () => {
    const { runMentorshipWeekly } = await import('@/lib/cron/mentorship');
    return runMentorshipWeekly();
  },
};

// Une tâche encore en cours dans cette copie du site n'est pas relancée par-dessus
const running = new Set<string>();

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
  if (running.has(job)) {
    return NextResponse.json({ success: true, skipped: 'déjà en cours' }, { status: 202 });
  }

  running.add(job);
  const started = Date.now();
  try {
    await connectDB();
    const result = await run();
    const ms = Date.now() - started;
    console.log(`[Cron] ${job} terminé en ${ms} ms`, result);
    return NextResponse.json({ success: true, job, ms, result });
  } catch (error) {
    console.error(`[Cron] ${job} en erreur :`, error);
    // 500 : le tableau de bord de l'hébergeur signale l'échec
    return NextResponse.json({ success: false, job, error: 'Erreur pendant la tâche' }, { status: 500 });
  } finally {
    running.delete(job);
  }
}

export const GET = handle;
export const POST = handle;
