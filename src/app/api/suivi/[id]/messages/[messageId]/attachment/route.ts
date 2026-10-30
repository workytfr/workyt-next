import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { currentSuiviUser, loadSuiviFor } from '@/lib/mentorship/access';
import MentorshipMessage from '@/models/MentorshipMessage';
import { fetchAttachment } from '@/lib/mentorship/storage';
import { unauthorized, notFound, serverError } from '@/lib/mentorship/http';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; messageId: string }> };

/**
 * GET /api/suivi/[id]/messages/[messageId]/attachment — une image ou un PDF d'un suivi.
 * Servie seulement aux participants et à la modération ; jamais mise en cache
 * par un intermédiaire (`private, no-store`). `?download=1` force le
 * téléchargement au lieu de l'ouverture dans le navigateur.
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    const { id, messageId } = await params;

    const access = await loadSuiviFor(id, me);
    if (!access || access.viewer === 'candidate') return notFound();
    if (!mongoose.isValidObjectId(messageId)) return notFound();

    const msg = await MentorshipMessage.findOne({ _id: messageId, mentorship: access.mentorship._id })
      .select('attachment status author')
      .lean<{ attachment?: { key: string; mime: string; name: string; size?: number }; status: string; author?: mongoose.Types.ObjectId }>();
    if (!msg?.attachment?.key) return notFound();
    // Une pièce jointe d'un message bloqué n'est visible que de son auteur et de la modération
    if (msg.status === 'blocked' && access.viewer !== 'moderator' && String(msg.author) !== me.id) return notFound();

    const file = await fetchAttachment(msg.attachment.key);
    if (!file.Body) return notFound();
    const disposition = req.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline';
    const headers: Record<string, string> = {
      'Content-Type': msg.attachment.mime,
      'Content-Disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(msg.attachment.name)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    };
    if (file.ContentLength) headers['Content-Length'] = String(file.ContentLength);

    // Un PDF peut peser 20 Mo : on le transmet au fil de l'eau plutôt que de le charger en mémoire
    return new NextResponse(file.Body.transformToWebStream(), { status: 200, headers });
  } catch (error) {
    return serverError('GET pièce jointe suivi', error);
  }
}
