import mongoose from 'mongoose';
import User from '@/models/User';

/**
 * Compte de remplacement « Utilisateur supprimé ».
 *
 * Quand un membre supprime son compte, ses contributions publiques (questions,
 * réponses, fiches, commentaires…) restent en ligne pour ne pas casser les
 * discussions des autres, mais elles sont rattachées à ce compte unique et
 * partagé. Toutes les pages qui « peuplent » l'auteur continuent donc de
 * recevoir un vrai utilisateur, sans rien révéler de la personne.
 *
 * Aucune connexion n'est possible : mot de passe vide (refusé par les deux
 * routes de connexion), pas de Discord, et une adresse en `.invalid`
 * (domaine réservé, RFC 2606) qui ne peut appartenir à personne.
 */
export const DELETED_USER_USERNAME = 'utilisateur_supprime';
export const DELETED_USER_NAME = 'Utilisateur supprimé';
const DELETED_USER_EMAIL = 'utilisateur-supprime@workyt.invalid';

let cachedId: mongoose.Types.ObjectId | null = null;

/** Identifiant du compte de remplacement, créé à la première suppression. */
export async function getDeletedUserId(): Promise<mongoose.Types.ObjectId> {
    if (cachedId) return cachedId;

    const find = () =>
        User.findOne({ email: DELETED_USER_EMAIL }).select('_id').lean<{ _id: mongoose.Types.ObjectId }>();

    let found = await find();
    if (!found) {
        try {
            // Upsert sur l'e-mail : deux suppressions simultanées ne créent qu'un compte
            await User.updateOne(
                { email: DELETED_USER_EMAIL },
                {
                    $setOnInsert: {
                        email: DELETED_USER_EMAIL,
                        name: DELETED_USER_NAME,
                        username: DELETED_USER_USERNAME,
                        password: '',
                        role: 'Apprenti',
                        roles: [],
                        points: 0,
                        badges: [],
                        selectedBadge: null,
                        isAdmin: false,
                        verified: false,
                        bio: '',
                        newsletterOptIn: false,
                        newsletterPreferences: { hebdo: false, classique: false },
                    },
                },
                { upsert: true }
            );
        } catch (err: unknown) {
            // E11000 : l'autre requête l'a créé entre-temps, on le relit
            if ((err as { code?: number })?.code !== 11000) throw err;
        }
        found = await find();
    }
    if (!found) throw new Error('Compte « Utilisateur supprimé » introuvable');

    cachedId = found._id;
    return cachedId;
}

/** Vrai si ce document utilisateur est le compte de remplacement. */
export function isDeletedUserPlaceholder(user: { username?: string | null } | null | undefined): boolean {
    return user?.username === DELETED_USER_USERNAME;
}
