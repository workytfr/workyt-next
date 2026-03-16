import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { escapeRegex } from '@/utils/escapeRegex';

// Simple in-memory cache for search results
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30_000; // 30 seconds
const MAX_CACHE_SIZE = 100;

// Rate limiting per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 15; // max requests
const RATE_WINDOW = 60_000; // per minute

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
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

    // Regex on titles only (short fields = fast) for partial/substring matching
    // e.g. "concurrence" matches "concurrentiel"
    const escaped = escapeRegex(query);
    const titleRegex = new RegExp(escaped, 'i');

    const results: any[] = [];

    // Search forum questions — regex on title only (not on description content)
    if (category === 'all' || category === 'forum') {
      const Question = (await import('@/models/Question')).default;
      const forumResults = await Question.find({
        title: titleRegex
      })
        .select('title slug subject classLevel status createdAt')
        .sort({ createdAt: -1 })
        .limit(category === 'all' ? 4 : limit)
        .lean();

      results.push(...forumResults.map((q: any) => ({
        type: 'forum',
        id: q._id.toString(),
        title: q.title,
        subtitle: `${q.subject} - ${q.classLevel}`,
        url: q.slug ? `/forum/${q.slug}` : `/forum/${q._id}`,
        badge: q.status,
        date: q.createdAt
      })));
    }

    // Search fiches — regex on title + subject only (NOT on content, which is huge)
    if (category === 'all' || category === 'fiches') {
      const Revision = (await import('@/models/Revision')).default;
      const fichesResults = await Revision.find({
        $or: [
          { title: titleRegex },
          { subject: titleRegex }
        ]
      })
        .select('title slug subject level status createdAt')
        .sort({ createdAt: -1 })
        .limit(category === 'all' ? 4 : limit)
        .lean();

      results.push(...fichesResults.map((f: any) => ({
        type: 'fiches',
        id: f._id.toString(),
        title: f.title,
        subtitle: `${f.subject} - ${f.level}`,
        url: f.slug ? `/fiches/${f.slug}` : `/fiches/${f._id}`,
        badge: f.status,
        date: f.createdAt
      })));
    }

    // Search courses — regex on title + matiere (short fields only)
    if (category === 'all' || category === 'cours') {
      const Course = (await import('@/models/Course')).default;
      const coursResults = await Course.find({
        $or: [
          { title: titleRegex },
          { matiere: titleRegex }
        ],
        status: 'publie'
      })
        .select('title slug description niveau matiere createdAt')
        .sort({ createdAt: -1 })
        .limit(category === 'all' ? 4 : limit)
        .lean();

      results.push(...coursResults.map((c: any) => ({
        type: 'cours',
        id: c._id.toString(),
        title: c.title,
        subtitle: [c.matiere, c.niveau].filter(Boolean).join(' - ') || c.description?.slice(0, 60),
        url: c.slug ? `/cours/${c.slug}` : `/cours/${c._id}`,
        date: c.createdAt
      })));
    }

    // Search WordPress blog (cached by Next.js for 120s)
    if (category === 'all' || category === 'blog') {
      try {
        const blogResponse = await fetch(
          `https://blog.workyt.fr/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&per_page=${category === 'all' ? 3 : limit}&_fields=id,title,link,date,excerpt`,
          { next: { revalidate: 120 } }
        );

        if (blogResponse.ok) {
          const blogPosts = await blogResponse.json();
          results.push(...blogPosts.map((post: any) => ({
            type: 'blog',
            id: `blog-${post.id}`,
            title: decodeHtmlEntities(post.title?.rendered || ''),
            subtitle: decodeHtmlEntities(stripHtml(post.excerpt?.rendered || '')).slice(0, 80),
            url: post.link,
            external: true,
            date: post.date
          })));
        }
      } catch {
        // Blog search failed silently
      }
    }

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
