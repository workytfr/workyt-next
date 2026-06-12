import { MetadataRoute } from 'next'
import dbConnect from '@/lib/mongodb'
import Question from '@/models/Question'
import Revision from '@/models/Revision'
import Course from '@/models/Course'
import { buildIdSlug, slugify } from '@/utils/slugify'
import { educationData } from '@/data/educationData'

export const revalidate = 3600

const subjectToSlug = (s: string) => slugify(s)
const levelToSlug = (l: string) => slugify(l)

// Date de dernière mise à jour des pages statiques (à actualiser à chaque déploiement majeur)
const STATIC_LASTMOD = new Date('2026-04-30')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://workyt.fr'
  const now = new Date()

  // Pages statiques publiques
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/cours`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/forum`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/fiches`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/recompenses`, lastModified: STATIC_LASTMOD, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/gems`, lastModified: STATIC_LASTMOD, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/progression`, lastModified: STATIC_LASTMOD, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/award`, lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/partenaires`, lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/a-propos`, lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/kit-media`, lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/mentions-legales`, lastModified: STATIC_LASTMOD, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/politique-confidentialite`, lastModified: STATIC_LASTMOD, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Hub pages par matière — 33 matières × 3 sections = 99 pages SEO long-tail
  const subjectHubs: MetadataRoute.Sitemap = educationData.subjects.flatMap((subject) => {
    const slug = subjectToSlug(subject)
    return [
      { url: `${baseUrl}/cours/matiere/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${baseUrl}/forum/matiere/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
      { url: `${baseUrl}/fiches/matiere/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
    ]
  })

  // Hub pages par niveau — 15 niveaux × 3 sections = 45 pages SEO
  const levelHubs: MetadataRoute.Sitemap = educationData.levels.flatMap((level) => {
    const slug = levelToSlug(level)
    return [
      { url: `${baseUrl}/cours/niveau/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${baseUrl}/forum/niveau/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
      { url: `${baseUrl}/fiches/niveau/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
    ]
  })

  try {
    await Promise.race([
      dbConnect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de connexion DB')), 5000)
      )
    ])

    const [questions, fiches, courses] = await Promise.all([
      // Forum : on garde "Validée" et "Résolue" + on inclut les "Non validée" qui ont au moins une réponse.
      // Pour rester simple et performant, on indexe désormais tout sauf un éventuel statut futur "supprimée".
      Question.find({ status: { $in: ['Validée', 'Résolue', 'Non validée'] } })
        .select('_id title slug createdAt updatedAt')
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(2000),
      // Fiches : tous les statuts publiables (Non Certifiée / Certifiée / Vérifiée). Pas de notion de brouillon.
      Revision.find({})
        .select('_id title slug createdAt updatedAt')
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(2000),
      Course.find({ status: 'publie' })
        .select('_id title slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(1000),
    ])

    const questionPages: MetadataRoute.Sitemap = questions.map((q: any) => ({
      url: `${baseUrl}/forum/${buildIdSlug(q._id.toString(), q.slug || q.title)}`,
      lastModified: q.updatedAt || q.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const fichePages: MetadataRoute.Sitemap = fiches.map((f: any) => ({
      url: `${baseUrl}/fiches/${buildIdSlug(f._id.toString(), f.slug || f.title)}`,
      lastModified: f.updatedAt || f.createdAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    const coursePages: MetadataRoute.Sitemap = courses.map((c: any) => ({
      url: `${baseUrl}/cours/${buildIdSlug(c._id.toString(), c.slug || c.title)}`,
      lastModified: c.updatedAt || c.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...subjectHubs, ...levelHubs, ...questionPages, ...fichePages, ...coursePages]
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error)
    // En cas d'erreur DB, on retourne au moins les pages statiques + hubs (qui ne dépendent pas de la DB)
    return [...staticPages, ...subjectHubs, ...levelHubs]
  }
}
