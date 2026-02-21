import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email });
        if (!user) {
            // Retourner le même message que si l'utilisateur existait pour éviter l'énumération
            return NextResponse.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' }, { status: 200 });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 heure de validité

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpiry = tokenExpiry;
        await user.save();

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL}/compte/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: '"Julie de Workyt" <noreply@workyt.fr>',
            to: email,
            subject: 'Réinitialisation de mot de passe',
            html: `
                <p>Bonjour,</p>
                <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour continuer :</p>
                <a href="${resetUrl}" target="_blank">Réinitialiser mon mot de passe</a>
                <p>Si vous n'avez pas demandé cette action, ignorez cet email.</p>
                <p>Ce lien expirera dans 1 heure.</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' } , { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
