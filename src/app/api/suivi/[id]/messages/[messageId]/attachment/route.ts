import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { currentSuiviUser, loadSuiviFor } from '@/lib/mentorship/access';
import MentorshipMessage from '@/models/MentorshipMessage';
import { fetchAttachment } from '@/lib/mentorship/storage';
import { unauthorized, notFound, serverError } from '@/lib/mentorship/http';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; messageId: string }> };

/**
 * GET /api/suivi/[id]/messages/[messageId]/attachment — une image d'un suivi.
 * Servie seulement aux participants et à la modération ; jamais mise en cache
 * par un intermédiaire (`private, no-store`).
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    const { id, messageId } = await params;

    const access = await loadSuiviFor(id, me);
    if (!access || access.viewer === 'candidate') return notFound();
    if (!mongoose.isValidObjectId(messageId)) return notFound();

    const msg = await MentorshipMessage.findOne({ _id: messageId, mentorship: access.mentorship._id })
      .select('attachment status author')
      .lean<{ attachment?: { key: string; mime: string; name: string }; status: string; author?: mongoose.Types.ObjectId }>();
    if (!msg?.attachment?.key) return notFound();
    // Une pièce jointe d'un message bloqué n'est visible que de son auteur et de la modération
    if (msg.status === 'blocked' && access.viewer !== 'moderator' && String(msg.author) !== me.id) return notFound();

    const file = await fetchAttachment(msg.attachment.key);
    if (!file.Body) return notFound();
    const bytes = await file.Body.transformToByteArray();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': msg.attachment.mime,
        'Content-Disposition': `inline; filename="${encodeURIComponent(msg.attachment.name)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    return serverError('GET pièce jointe suivi', error);
  }
}
