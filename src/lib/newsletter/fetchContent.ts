import Course from '@/models/Course';
import Revision from '@/models/Revision';

export interface GlobalContent {
    newCourses: Array<{ title: string; slug: string; matiere: string; niveau: string }>;
    newFiches: Array<{ title: string; slug: string; subject: string; level: string }>;
    blogPosts: Array<{ title: string; link: string; pubDate: string; thumbnail: string }>;
}

/**
 * Recupere tout le nouveau contenu des 7 derniers jours
 */
export async function fetchGlobalContent(weekStart: Date): Promise<GlobalContent> {
    const [newCourses, newFiches, blogPosts] = await Promise.all([
        fetchNewCourses(weekStart),
        fetchNewFiches(weekStart),
        fetchBlogPosts(weekStart),
    ]);

    return { newCourses, newFiches, blogPosts };
}

async function fetchNewCourses(since: Date) {
    const courses = await Course.find({
        status: 'publie',
        createdAt: { $gte: since },
    })
        .select('title slug matiere niveau')
        .sort({ createdAt: -1 })
        .lean();

    return courses.map(c => ({
        title: c.title,
        slug: c.slug,
        matiere: c.matiere,
        niveau: c.niveau,
    }));
}

async function fetchNewFiches(since: Date) {
    const fiches = await Revision.find({
        createdAt: { $gte: since },
    })
        .select('title slug subject level')
        .sort({ createdAt: -1 })
        .lean();

    return fiches.map(f => ({
        title: f.title,
        slug: f.slug,
        subject: f.subject,
        level: f.level,
    }));
}

async function fetchBlogPosts(since: Date): Promise<Array<{ title: string; link: string; pubDate: string; thumbnail: string }>> {
    try {
        const afterDate = since.toISOString();
        const res = await fetch(
            `https://blog.workyt.fr/wp-json/wp/v2/posts?after=${afterDate}&per_page=10&_fields=id,title,link,date,_embedded&_embed=wp:featuredmedia`,
            { signal: AbortSignal.timeout(10000) }
        );

        if (!res.ok) {
            console.warn(`Blog API returned ${res.status}, skipping blog posts`);
            return [];
        }

        const posts = await res.json();
        return posts.map((p: any) => {
            const media = p._embedded?.['wp:featuredmedia']?.[0];
            const thumbnail = media?.media_details?.sizes?.thumbnail?.source_url
                || media?.media_details?.sizes?.medium?.source_url
                || media?.source_url
                || '';
            return {
                title: p.title?.rendered || p.title || '',
                link: p.link || '',
                pubDate: p.date || '',
                thumbnail,
            };
        });
    } catch (error) {
        console.warn('Impossible de recuperer les articles du blog:', error);
        return [];
    }
}

/**
 * Verifie s'il y a du contenu global a envoyer
 */
export function hasGlobalContent(content: GlobalContent): boolean {
    return content.newCourses.length > 0
        || content.newFiches.length > 0
        || content.blogPosts.length > 0;
}
