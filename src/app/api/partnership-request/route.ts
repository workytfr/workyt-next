import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import connectDB from '@/lib/mongodb';
import PartnershipRequest from '@/models/PartnershipRequest';
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rateLimit';

const TYPES = ['marque', 'projet', 'presse', 'autre'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const typeLabel: Record<string, string> = {
    marque: 'Marque / entreprise',
    projet: 'Jeune projet / startup',
    presse: 'Demande presse',
    autre: 'Autre',
};

export async function POST(req: NextRequest) {
    try {
        // Anti-spam : 3 demandes / heure / IP
        const rl = rateLimit(`partnership:${getIP(req)}`, 3, 3_600_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        const body = await req.json();
        const {
            type = 'autre',
            companyName = '',
            contactName = '',
            email = '',
            website = '',
            message = '',
            // honeypot anti-bot (champ caché côté front)
            company_website = '',
        } = body || {};

        // Honeypot : un bot remplit le champ piège → on simule un succès
        if (company_website) {
            return NextResponse.json({ message: 'ok' }, { status: 200 });
        }

        // Validation
        if (!companyName.trim() || !contactName.trim() || !email.trim() || !message.trim()) {
            return NextResponse.json(
                { error: 'Merci de remplir tous les champs obligatoires.' },
                { status: 400 }
            );
        }
        if (!EMAIL_RE.test(email)) {
            return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
        }
        const safeType = TYPES.includes(type) ? type : 'autre';
        if (message.trim().length > 2000) {
            return NextResponse.json({ error: 'Message trop long (2000 caractères max).' }, { status: 400 });
        }

        await connectDB();

        const doc = await PartnershipRequest.create({
            type: safeType,
            companyName: companyName.trim(),
            contactName: contactName.trim(),
            email: email.trim().toLowerCase(),
            website: website.trim(),
            message: message.trim(),
        });

        // Notification e-mail à l'équipe (best-effort, ne bloque pas la demande)
        try {
            if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
                });

                await transporter.sendMail({
                    from: '"Workyt — Partenariats" <noreply@workyt.fr>',
                    to: 'admin@workyt.fr',
                    replyTo: doc.email,
                    subject: `Nouvelle demande de partenariat — ${doc.companyName}`,
                    html: `
                        <h2>Nouvelle demande depuis le Kit média</h2>
                        <p><strong>Type :</strong> ${typeLabel[doc.type] || doc.type}</p>
                        <p><strong>Structure :</strong> ${escapeHtml(doc.companyName)}</p>
                        <p><strong>Contact :</strong> ${escapeHtml(doc.contactName)}</p>
                        <p><strong>E-mail :</strong> <a href="mailto:${doc.email}">${doc.email}</a></p>
                        ${doc.website ? `<p><strong>Site / lien :</strong> ${escapeHtml(doc.website)}</p>` : ''}
                        <p><strong>Message :</strong></p>
                        <p style="white-space:pre-wrap">${escapeHtml(doc.message)}</p>
                    `,
                });
            }
        } catch (mailErr) {
            console.error('Partnership request mail error:', mailErr);
        }

        return NextResponse.json(
            { message: 'Votre demande a bien été envoyée. Nous revenons vers vous rapidement.' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Partnership request error:', error);
        return NextResponse.json({ error: 'Une erreur est survenue. Réessayez plus tard.' }, { status: 500 });
    }
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
