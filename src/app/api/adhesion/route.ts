import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/mongodb';
import Membership from '@/models/Membership';
import User from '@/models/User';
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rateLimit';
import {
    isValidMembershipType,
    membershipTypeLabel,
    formatMemberNumber,
    type MembershipType,
} from '@/lib/membership';
import { generateMembershipCardPDF } from '@/lib/membershipCard';

export const runtime = 'nodejs';

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Génère un numéro d'adhérent unique pour l'année en cours.
async function generateMemberNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `WK-${year}-`;
    const count = await Membership.countDocuments({ memberNumber: { $regex: `^${prefix}` } });
    let seq = count + 1;
    // Sécurité anti-collision (séquence déjà prise)
    for (let i = 0; i < 50; i++) {
        const candidate = formatMemberNumber(year, seq);
        const exists = await Membership.exists({ memberNumber: candidate });
        if (!exists) return candidate;
        seq++;
    }
    return formatMemberNumber(year, Date.now() % 100000);
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Vous devez être connecté pour adhérer.' }, { status: 401 });
        }

        const rl = rateLimit(`adhesion:${getIP(req)}`, 5, 3_600_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        const body = await req.json();
        const {
            firstName = '',
            lastName = '',
            address = '',
            type = '',
            motivation = '',
            consent = false,
            company_website = '', // honeypot
        } = body || {};

        if (company_website) {
            return NextResponse.json({ message: 'ok' }, { status: 200 });
        }

        if (!firstName.trim() || !lastName.trim() || !address.trim()) {
            return NextResponse.json({ error: 'Merci de remplir nom, prénom et adresse postale.' }, { status: 400 });
        }
        if (!isValidMembershipType(type)) {
            return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
        }
        if (!consent) {
            return NextResponse.json({ error: 'Le consentement est requis.' }, { status: 400 });
        }
        if (motivation.length > 3000) {
            return NextResponse.json({ error: 'Texte trop long (3000 caractères max).' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findById(session.user.id).select('name email username');
        if (!user) {
            return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
        }

        // Une adhésion par compte : on met à jour si elle existe déjà
        let membership = await Membership.findOne({ userId: user._id });
        const isRenewal = !!membership;
        if (membership) {
            membership.type = type as MembershipType;
            membership.status = 'actif';
            membership.consecutiveAbsences = 0;
            await membership.save();
        } else {
            const memberNumber = await generateMemberNumber();
            membership = await Membership.create({
                userId: user._id,
                memberNumber,
                type: type as MembershipType,
                status: 'actif',
                joinedAt: new Date(),
            });
        }

        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        // Génération de la carte d'adhérent
        const cardBuffer = await generateMembershipCardPDF({
            fullName,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            memberNumber: membership.memberNumber,
            type: type as MembershipType,
            joinedAt: membership.joinedAt,
        });

        // E-mail au bureau avec le dossier complet + carte en pièce jointe (best-effort)
        try {
            if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
                });

                await transporter.sendMail({
                    from: '"Workyt — Adhésions" <noreply@workyt.fr>',
                    to: 'bureau@workyt.fr',
                    replyTo: user.email,
                    subject: `${isRenewal ? 'Renouvellement' : 'Nouvelle'} adhésion — ${fullName} (${membership.memberNumber})`,
                    html: `
                        <div style="font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif; color:#1a1512; max-width:560px; margin:0 auto; border:1px solid #eee; border-radius:14px; overflow:hidden">
                          <style>@import url('https://fonts.googleapis.com/css2?family=Funnel+Display:wght@600;700&family=Montserrat:wght@400;600&display=swap');</style>
                          <div style="background:linear-gradient(135deg,#ff6a1a,#ff9248); padding:18px 22px">
                            <div style="font-family:'Funnel Display','Montserrat',Arial,sans-serif; font-weight:700; font-size:18px; color:#fff">
                              ${isRenewal ? "Renouvellement d'adhésion" : 'Nouvelle adhésion'}
                            </div>
                            <div style="color:#fff; opacity:.9; font-size:13px">Association Workyt</div>
                          </div>
                          <div style="padding:20px 22px; font-size:14px; line-height:1.6">
                            <p style="margin:0 0 4px"><strong>N° d'adhérent :</strong> ${membership.memberNumber}</p>
                            <p style="margin:0 0 12px"><strong>Statut :</strong> ${membershipTypeLabel(type)}</p>
                            <hr style="border:none; border-top:1px solid #eee; margin:12px 0" />
                            <p style="margin:0 0 4px"><strong>Prénom :</strong> ${escapeHtml(firstName.trim())}</p>
                            <p style="margin:0 0 4px"><strong>Nom :</strong> ${escapeHtml(lastName.trim())}</p>
                            <p style="margin:0 0 4px"><strong>Adresse postale :</strong><br/>${escapeHtml(address.trim()).replace(/\n/g, '<br/>')}</p>
                            <p style="margin:0 0 4px"><strong>Compte Workyt :</strong> ${escapeHtml(user.username)} — <a href="mailto:${user.email}" style="color:#ff6a1a">${user.email}</a></p>
                            ${motivation.trim() ? `<p style="margin:12px 0 4px"><strong>Motivation :</strong></p><p style="white-space:pre-wrap; margin:0">${escapeHtml(motivation.trim())}</p>` : ''}
                            <hr style="border:none; border-top:1px solid #eee; margin:12px 0" />
                            <p style="color:#6b6b6b; font-size:12px; margin:0">Carte d'adhérent en pièce jointe. Ces informations (adresse, motivation) ne sont pas stockées sur le site.</p>
                          </div>
                        </div>
                    `,
                    attachments: [
                        {
                            filename: `carte-adherent-${membership.memberNumber}.pdf`,
                            content: cardBuffer,
                            contentType: 'application/pdf',
                        },
                    ],
                });
            }
        } catch (mailErr) {
            console.error('Adhésion mail error:', mailErr);
        }

        return NextResponse.json({
            success: true,
            memberNumber: membership.memberNumber,
            renewal: isRenewal,
            cardBase64: cardBuffer.toString('base64'),
        });
    } catch (error) {
        console.error('Adhésion POST error:', error);
        return NextResponse.json({ error: 'Une erreur est survenue. Réessayez plus tard.' }, { status: 500 });
    }
}

// GET /api/adhesion — statut d'adhésion de l'utilisateur connecté
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        await dbConnect();
        const membership = await Membership.findOne({ userId: session.user.id })
            .select('memberNumber type status joinedAt consecutiveAbsences')
            .lean();
        return NextResponse.json({ membership });
    } catch (error) {
        console.error('Adhésion GET error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
