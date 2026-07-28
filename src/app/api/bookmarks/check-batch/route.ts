import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bookmark from '@/models/Bookmark';
import authMiddleware from '@/middlewares/authMiddleware';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

type ContentType = 'fiche' | 'forum' | 'cours' | 'exercise';

/**
 * POST /api/bookmarks/check-batch — état « en favori » de PLUSIEURS contenus.
 * Body : { items: Array<{ refId: string; contentType: ContentType }> }
 *
 * Remplace l'appel unitaire /api/bookmarks/check, qui produisait une requête
 * HTTP par carte de liste. Ici : 1 requête HTTP, 1 requête Mongo, quel que
 * soit le nombre de contenus affichés.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await authMiddleware(req);
    if (!user || !user._id) {
      return NextResponse.json({ success: true, data: {} });
    }

    const body = await req.json().catch(() => ({}));
    const rawItems: any[] = Array.isArray(body?.items) ? body.items : [];

    const valid: Array<{ refId: string; contentType: ContentType }> = rawItems
      .filter(
        (i) =>
          i &&
          typeof i.refId === 'string' &&
          mongoose.Types.ObjectId.isValid(i.refId) &&
          ['fiche', 'forum', 'cours', 'exercise'].includes(i.contentType)
      )
      .slice(0, 100);

    if (valid.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    // Une seule requête : $or sur les couples (refId, contentType)
    const bookmarks = await Bookmark.find({
      user: user._id,
      $or: valid.map((i) => ({
        refId: new mongoose.Types.ObjectId(i.refId),
        contentType: i.contentType
      }))
    })
      .select('refId contentType collectionName')
      .lean();

    const data: Record<string, { bookmarked: boolean; collection?: string }> = {};
    for (const b of bookmarks as any[]) {
      data[`${b.contentType}:${b.refId.toString()}`] = {
        bookmarked: true,
        collection: b.collectionName ?? undefined
      };
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erreur POST /api/bookmarks/check-batch:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
