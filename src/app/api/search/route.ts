import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { buildIdSlug } from '@/utils/slugify';
import { getIPFromHeaders } from '@/lib/rateLimit';
import { buildTextFilter, rankByTitle, tokenize } from '@/lib/searchQuery';

// Simple in-memory cache for search results
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30_000; // 30 seconds
const MAX_CACHE_SIZE = 100;

// Rate limiting per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
// La palette cherche pendant la frappe : 15 par minute coupait la recherche
// (erreur 429) après quelques mots tapés.
const RATE_LIMIT = 40; // max requests
const RATE_WINDOW = 60_000; // per minute

function getRateLimitKey(req: NextRequest): string {
  // Pas le premier élément de X-Forwarded-For : le client le choisit, il
  // suffisait d'en changer à chaque requête pour contourner la limite.
  return getIPFromHeaders(req.headers);
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    // Ménage : sans lui, la table gardait une entrée par adresse IP pour toujours
    if (rateLimitMap.size > 5000) {
      for (const [key, value] of rateLimitMap) if (now > value.resetAt) rateLimitMap.delete(key);
    }
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function GET(req: NextRequest) {
  try {
    // Rate limit check
    const ip = getRateLimitKey(req);
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim().slice(0, 100); // Max 100 chars
    const category = searchParams.get('category') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20);

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], query: '' });
    }

    // Check cache
    const cacheKey = `${query}:${category}:${limit}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    await dbConnect();

    // Recherche tolérante : accents, pluriels et ordre des mots ignorés,
    // résultats classés par pertinence (voir lib/searchQuery).
    const tokens = tokenize(query);
    if (tokens.length === 0) {
      return NextResponse.json({ results: [], query, total: 0 });
    }

    const per = category === 'all' ? 4 : limit;
    const wants = (c: string) => category === 'all' || category === c;
    // On lit plus de candidats que nécessaire, puis on garde les plus pertinents
    const candidates = Math.min(per * 5, 40);

    /**
     * Tous les mots d'abord ; si rien ne correspond, au moins un mot
     * (« théorème pythagor exercice » trouve quand même Pythagore).
     */
    async function findRanked<T extends { title: string; date?: unknown }>(
      run: (filter: Record<string, unknown>) => Promise<T[]>,
      fields: string[],
    ): Promise<T[]> {
      let rows = await run(buildTextFilter(tokens, fields, 'all'));
      if (rows.length === 0 && tokens.length > 1) {
        rows = await run(buildTextFilter(tokens, fields, 'any'));
      }
      return rankByTitle(rows, query!, tokens).slice(0, per);
    }

    // Les quatre sources en même temps
    const [forum, fiches, cours, blog] = await Promise.all([
      // Questions du forum : sur le titre seulement
      wants('forum')
        ? import('@/models/Question').then(({ default: Question }) =>
            findRanked(
              (filter) =>
                Question.find(filter)
                  .select('title slug subject classLevel status createdAt')
                  .sort({ createdAt: -1 })
                  .limit(candidates)
                  .lean()
                  .then((rows: any[]) => rows.map((q) => ({
                    type: 'forum',
                    id: q._id.toString(),
                    title: q.title,
                    subtitle: `${q.subject} - ${q.classLevel}`,
                    // Adresse canonique (id-slug) : pas de redirection au clic
                    url: `/forum/${buildIdSlug(q._id.toString(), q.slug || q.title)}`,
                    badge: q.status,
                    date: q.createdAt
                  }))),
              ['title'],
            ))
        : [],
      // Fiches : titre et matière (pas le contenu, trop long)
      wants('fiches')
        ? import('@/models/Revision').then(({ default: Revision }) =>
            findRanked(
              (filter) =>
                Revision.find(filter)
                  .select('title slug subject level status createdAt')
                  .sort({ createdAt: -1 })
                  .limit(candidates)
                  .lean()
                  .then((rows: any[]) => rows.map((f) => ({
                    type: 'fiches',
                    id: f._id.toString(),
                    title: f.title,
                    subtitle: `${f.subject} - ${f.level}`,
                    url: `/fiches/${buildIdSlug(f._id.toString(), f.slug || f.title)}`,
                    badge: f.status,
                    date: f.createdAt
                  }))),
              ['title', 'subject'],
            ))
        : [],
      // Cours publiés : titre et matière
      wants('cours')
        ? import('@/models/Course').then(({ default: Course }) =>
            findRanked(
              (filter) =>
                Course.find({ $and: [filter, { status: 'publie' }] })
                  .select('title slug description niveau matiere createdAt')
                  .sort({ createdAt: -1 })
                  .limit(candidates)
                  .lean()
                  .then((rows: any[]) => rows.map((c) => ({
                    type: 'cours',
                    id: c._id.toString(),
                    title: c.title,
                    subtitle: [c.matiere, c.niveau].filter(Boolean).join(' - ') || c.description?.slice(0, 60),
                    url: `/cours/${buildIdSlug(c._id.toString(), c.slug || c.title)}`,
                    date: c.createdAt
                  }))),
              ['title', 'matiere'],
            ))
        : [],
      // Articles du blog : API publique du nouveau blog (l'ancienne API WordPress n'existe plus).
      // 2,5 s au plus : un blog lent ne doit pas ralentir toute la recherche.
      wants('blog')
        ? fetch(
            `https://blog.workyt.fr/api/public/posts/?search=${encodeURIComponent(query)}&limit=${category === 'all' ? 3 : limit}`,
            { next: { revalidate: 120 }, signal: AbortSignal.timeout(2500) }
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => (Array.isArray(j?.data) ? j.data : []).map((post: any) => ({
              type: 'blog',
              id: `blog-${post.id}`,
              title: decodeHtmlEntities(post.title || ''),
              subtitle: decodeHtmlEntities(stripHtml(post.excerpt || '')).slice(0, 80),
              url: post.url,
              external: true,
              date: post.publishedAt
            })))
            .catch(() => [])
        : [],
    ]);
    const results: any[] = [...forum, ...fiches, ...cours, ...blog];

    const responseData = { results, query, total: results.length };

    // Store in cache
    if (searchCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) searchCache.delete(oldestKey);
    }
    searchCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Erreur de recherche' }, { status: 500 });
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&nbsp;/g, ' ');
}
