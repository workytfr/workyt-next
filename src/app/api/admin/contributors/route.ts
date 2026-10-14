import { hasRole, roleFilter, getUserRoles } from "@/lib/userRoles";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose, { type Model } from "mongoose";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Exercise from "@/models/Exercise";
import Quiz from "@/models/Quiz";
import Revision from "@/models/Revision";
import Answer from "@/models/Answer";
import MentorshipMessage from "@/models/MentorshipMessage";
import Mentorship from "@/models/Mentorship";
import Report from "@/models/Report";

/**
 * Activité des bénévoles, mesurée sur une période glissante.
 *
 * L'ancien score additionnait tout l'historique (plafonné à 100) : un
 * bénévole parti depuis un an restait « très actif ». Ici, ce qui compte,
 * c'est la régularité récente — le nombre de jours où la personne a
 * contribué sur la période — et tout ce qu'elle fait compte, quel que soit
 * son rôle (forum, suivis, rédaction, relecture, modération).
 */

const ROLES = ["Rédacteur", "Correcteur", "Helpeur", "Modérateur"] as const;
const PERIODS = [7, 30, 90];
const DAY = 86400000;
const SPARK_WEEKS = 12;

type Key =
  | "courses"
  | "lessons"
  | "exercises"
  | "quizzes"
  | "fiches"
  | "coursesVerified"
  | "lessonsValidated"
  | "answers"
  | "answersValidated"
  | "mentorMessages"
  | "reportsHandled";

interface Source {
  key: Key;
  model: Model<any>;
  user: string;
  date: string;
  match?: Record<string, unknown>;
  unwind?: boolean;
  /** Sous-ensemble d'une autre source : affiché, mais pas compté deux fois dans l'activité */
  subset?: boolean;
}

const SOURCES: Source[] = [
  { key: "courses", model: Course, user: "authors", date: "createdAt", unwind: true },
  { key: "lessons", model: Lesson, user: "author", date: "createdAt" },
  { key: "exercises", model: Exercise, user: "author", date: "createdAt" },
  { key: "quizzes", model: Quiz, user: "author", date: "createdAt" },
  { key: "fiches", model: Revision, user: "author", date: "createdAt" },
  { key: "coursesVerified", model: Course, user: "verifiedBy", date: "verifiedAt" },
  { key: "lessonsValidated", model: Lesson, user: "validatedBy", date: "validatedAt" },
  { key: "answers", model: Answer, user: "user", date: "createdAt" },
  {
    key: "answersValidated",
    model: Answer,
    user: "user",
    date: "createdAt",
    match: { status: { $in: ["Validée", "Meilleure Réponse"] } },
    subset: true,
  },
  {
    key: "mentorMessages",
    model: MentorshipMessage,
    user: "author",
    date: "createdAt",
    match: { authorRole: "mentor", status: "visible", kind: { $in: ["text", "block", "checkin_reply", "confused"] } },
  },
  { key: "reportsHandled", model: Report, user: "moderator", date: "resolvedAt", match: { status: { $in: ["resolu", "rejete"] } } },
];

type Counts = Partial<Record<Key, number>>;

interface SourceResult {
  lifetime: { _id: mongoose.Types.ObjectId; n: number; last: Date | null }[];
  daily: { _id: { u: mongoose.Types.ObjectId; d: string }; n: number }[];
}

async function collect(s: Source, ids: mongoose.Types.ObjectId[], since: Date): Promise<SourceResult> {
  const pipeline: mongoose.PipelineStage[] = [{ $match: { ...(s.match || {}), [s.user]: { $in: ids } } }];
  if (s.unwind) pipeline.push({ $unwind: `$${s.user}` }, { $match: { [s.user]: { $in: ids } } });
  pipeline.push({
    $facet: {
      lifetime: [{ $group: { _id: `$${s.user}`, n: { $sum: 1 }, last: { $max: `$${s.date}` } } }],
      daily: [
        { $match: { [s.date]: { $gte: since } } },
        {
          $group: {
            _id: { u: `$${s.user}`, d: { $dateToString: { format: "%Y-%m-%d", date: `$${s.date}`, timezone: "Europe/Paris" } } },
            n: { $sum: 1 },
          },
        },
      ],
    },
  });
  const [res] = await s.model.aggregate<SourceResult>(pipeline);
  return res || { lifetime: [], daily: [] };
}

/** Jour calendaire (Paris) d'une date, au même format que $dateToString */
function dayKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(d);
}

/** Niveau d'activité, ramené à 30 jours pour que les seuils restent les mêmes sur 7 ou 90 jours */
function statusOf(activeDays: number, days: number, everActive: boolean) {
  const per30 = (activeDays / days) * 30;
  if (per30 >= 8) return "tres_actif";
  if (per30 >= 3) return "actif";
  if (activeDays > 0) return "occasionnel";
  return everActive ? "inactif" : "jamais";
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !hasRole(session.user, "Admin")) {
      return NextResponse.json({ error: "Accès non autorisé. Admin uniquement." }, { status: 403 });
    }

    const asked = Number(req.nextUrl.searchParams.get("days"));
    const days = PERIODS.includes(asked) ? asked : 30;

    await dbConnect();

    const users = await User.find(roleFilter(ROLES))
      .select("_id name username role roles createdAt")
      .lean<{ _id: mongoose.Types.ObjectId; name?: string; username: string; role: string; roles?: string[]; createdAt?: Date }[]>();
    const ids = users.map((u) => u._id);

    // Fenêtre de jours : la période, la période précédente (tendance) et 12 semaines (courbe)
    const now = new Date();
    const today = new Date(dayKey(now) + "T00:00:00");
    const windowDays = Math.max(days * 2, SPARK_WEEKS * 7);
    const since = new Date(now.getTime() - windowDays * DAY);

    const [results, activeLoad] = await Promise.all([
      Promise.all(SOURCES.map((s) => collect(s, ids, since))),
      Mentorship.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([
        { $match: { mentor: { $in: ids }, status: { $in: ["active", "paused"] } } },
        { $group: { _id: "$mentor", n: { $sum: 1 } } },
      ]),
    ]);

    const periodStart = dayKey(new Date(today.getTime() - (days - 1) * DAY));
    const prevStart = dayKey(new Date(today.getTime() - (2 * days - 1) * DAY));
    const sparkStart = new Date(today.getTime() - (SPARK_WEEKS * 7 - 1) * DAY);

    type Acc = {
      lifetime: Counts;
      period: Counts;
      previous: Counts;
      days: Set<string>;
      prevDays: Set<string>;
      weekly: number[];
      last: Date | null;
      lastKind: Key | null;
    };
    const acc = new Map<string, Acc>();
    const get = (id: string) => {
      let a = acc.get(id);
      if (!a) {
        a = { lifetime: {}, period: {}, previous: {}, days: new Set(), prevDays: new Set(), weekly: Array(SPARK_WEEKS).fill(0), last: null, lastKind: null };
        acc.set(id, a);
      }
      return a;
    };

    SOURCES.forEach((s, i) => {
      for (const r of results[i].lifetime) {
        if (!r._id) continue;
        const a = get(String(r._id));
        a.lifetime[s.key] = r.n;
        if (!s.subset && r.last && (!a.last || r.last > a.last)) {
          a.last = r.last;
          a.lastKind = s.key;
        }
      }
      for (const r of results[i].daily) {
        if (!r._id.u) continue;
        const a = get(String(r._id.u));
        const d = r._id.d;
        if (d >= periodStart) {
          a.period[s.key] = (a.period[s.key] || 0) + r.n;
          if (!s.subset) a.days.add(d);
        } else if (d >= prevStart) {
          a.previous[s.key] = (a.previous[s.key] || 0) + r.n;
          if (!s.subset) a.prevDays.add(d);
        }
        if (!s.subset) {
          const t = new Date(d + "T00:00:00").getTime();
          const w = Math.floor((t - sparkStart.getTime()) / (7 * DAY));
          if (w >= 0 && w < SPARK_WEEKS) a.weekly[w] += r.n;
        }
      }
    });

    const total = (c: Counts) => SOURCES.filter((s) => !s.subset).reduce((n, s) => n + (c[s.key] || 0), 0);
    const loadMap = new Map(activeLoad.map((r) => [String(r._id), r.n]));

    const contributors = users.map((u) => {
      const id = String(u._id);
      const a = get(id);
      const contributions = total(a.period);
      const previousContributions = total(a.previous);
      return {
        _id: id,
        name: u.name || u.username,
        username: u.username,
        // Rôle bénévole affiché : le principal s'il en est un, sinon le premier secondaire
        role: getUserRoles(u).find((r) => (ROLES as readonly string[]).includes(r)) ?? u.role,
        joinedAt: u.createdAt || null,
        status: statusOf(a.days.size, days, total(a.lifetime) > 0),
        activeDays: a.days.size,
        previousActiveDays: a.prevDays.size,
        contributions,
        previousContributions,
        period: a.period,
        lifetime: a.lifetime,
        lifetimeContributions: total(a.lifetime),
        activeMentorships: loadMap.get(id) || 0,
        weekly: a.weekly,
        lastActivity: a.last,
        lastActivityKind: a.lastKind,
      };
    });

    const countBy = <T extends string>(key: (c: (typeof contributors)[number]) => T) =>
      contributors.reduce<Record<string, number>>((m, c) => ((m[key(c)] = (m[key(c)] || 0) + 1), m), {});

    return NextResponse.json({
      period: { days, from: periodStart, to: dayKey(now) },
      contributors,
      summary: {
        total: contributors.length,
        byRole: countBy((c) => c.role),
        byStatus: countBy((c) => c.status),
        contributions: contributors.reduce((n, c) => n + c.contributions, 0),
        previousContributions: contributors.reduce((n, c) => n + c.previousContributions, 0),
        activeMentorships: contributors.reduce((n, c) => n + c.activeMentorships, 0),
      },
    });
  } catch (error) {
    console.error("Erreur statistiques bénévoles:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des données" }, { status: 500 });
  }
}
