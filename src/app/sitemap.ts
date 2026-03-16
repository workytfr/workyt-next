import { MetadataRoute } from 'next'
import dbConnect from '@/lib/mongodb'
import Question from '@/models/Question'
import Revision from '@/models/Revision'
import Course from '@/models/Course'
import { buildIdSlug, slugify } from '@/utils/slugify'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://workyt.fr'

  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/cours`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fiches`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/recompenses`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  try {
    // Connexion à la base de données avec timeout
    await Promise.race([
      dbConnect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de connexion DB')), 5000)
      )
    ])

    // Récupération des questions, fiches et cours en parallèle
    const [questions, fiches, courses] = await Promise.all([
      Question.find({ status: { $in: ['Validée', 'Résolue'] } })
        .select('_id title slug createdAt')
        .sort({ createdAt: -1 })
        .limit(1000),
      Revision.find({})
        .select('_id title slug createdAt')
        .sort({ createdAt: -1 })
        .limit(1000),
      Course.find({ status: 'publie' })
        .select('_id title slug updatedAt')
        .sort({ updatedAt: -1 })
        .limit(500),
    ])

    // URLs des questions du forum avec slug SEO
    const questionPages: MetadataRoute.Sitemap = questions.map((question) => ({
      url: `${baseUrl}/forum/${buildIdSlug(question._id.toString(), question.slug || question.title)}`,
      lastModified: question.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // URLs des fiches de révision avec slug SEO
    const fichePages: MetadataRoute.Sitemap = fiches.map((fiche: any) => ({
      url: `${baseUrl}/fiches/${buildIdSlug(fiche._id.toString(), fiche.slug || fiche.title)}`,
      lastModified: fiche.createdAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    // URLs des cours publiés avec slug SEO
    const coursePages: MetadataRoute.Sitemap = courses.map((course: any) => ({
      url: `${baseUrl}/cours/${buildIdSlug(course._id.toString(), course.slug || course.title)}`,
      lastModified: course.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...questionPages, ...fichePages, ...coursePages]
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error)
    // En cas d'erreur, retourner au moins les pages statiques
    return staticPages
  }
}
