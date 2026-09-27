import nodemailer from 'nodemailer';

/**
 * E-mails du suivi personnalisé.
 *
 * ⚠️ Canal privé entre un adulte et un élève souvent mineur : un e-mail ne
 * contient JAMAIS le contenu des messages. Il invite seulement à revenir sur
 * le site, où tout est conservé et modérable.
 */

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function sendStudentReminderEmail(opts: {
  to: string;
  studentName: string;
  mentorName: string;
  subject: string;
  mentorshipId: string;
}): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('[Suivi] SMTP non configuré : relance par e-mail impossible');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });

  const url = `${process.env.NEXTAUTH_URL}/suivi/${opts.mentorshipId}`;
  const student = escapeHtml(opts.studentName);
  const mentor = escapeHtml(opts.mentorName);
  const subject = escapeHtml(opts.subject);

  await transporter.sendMail({
    from: '"Workyt" <noreply@workyt.fr>',
    to: opts.to,
    subject: `Ton bénévole t'attend dans ton suivi de ${opts.subject}`,
    text:
      `Bonjour ${opts.studentName},\n\n` +
      `${opts.mentorName}, ton bénévole Workyt, aimerait avoir de tes nouvelles pour ton suivi en ${opts.subject}.\n` +
      `Connecte-toi pour lui répondre : ${url}\n\n` +
      `Tu ne veux plus recevoir ces e-mails ? Dans ton suivi, ouvre le menu « ⋯ » puis « Ne plus recevoir de rappels par e-mail ».`,
    html: `
      <div style="font-family:Montserrat,Arial,sans-serif;color:#1a1512;max-width:520px;margin:0 auto;padding:24px">
        <p style="font-size:16px">Bonjour ${student},</p>
        <p style="font-size:16px;line-height:1.5">
          <strong>${mentor}</strong>, ton bénévole Workyt, aimerait avoir de tes nouvelles pour ton suivi en <strong>${subject}</strong>.
        </p>
        <p style="margin:28px 0">
          <a href="${url}" style="background:#ff6a1a;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;display:inline-block">
            Répondre à mon bénévole
          </a>
        </p>
        <p style="font-size:13px;color:rgba(26,21,18,0.6);line-height:1.5">
          Tu ne veux plus recevoir ces e-mails ? Dans ton suivi, ouvre le menu « ⋯ » puis
          « Ne plus recevoir de rappels par e-mail ».
        </p>
      </div>
    `
  });
  return true;
}
