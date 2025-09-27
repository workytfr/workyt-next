import { MetadataRoute } from 'next'
import dbConnect from '@/lib/mongodb'
import Question from '@/models/Question'

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
    {
      url: `${baseUrl}/kits`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
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
    
    // Récupération de toutes les questions du forum
    const questions = await Question.find({ status: { $in: ['Validée', 'Résolue'] } })
      .select('_id createdAt')
      .sort({ createdAt: -1 })
      .limit(1000) // Limiter à 1000 questions pour éviter un sitemap trop lourd
    
    // Génération des URLs des questions
    const questionPages: MetadataRoute.Sitemap = questions.map((question) => ({
      url: `${baseUrl}/forum/${question._id}`,
      lastModified: question.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...questionPages]
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error)
    // En cas d'erreur, retourner au moins les pages statiques
    return staticPages
  }
} 