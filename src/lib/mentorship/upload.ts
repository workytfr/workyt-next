import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  ListPartsCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES } from './config';
import { readAttachment } from './storage';

/**
 * Envoi des pièces jointes des suivis en plusieurs morceaux.
 *
 * Au-delà d'environ 15 Mo, l'hébergement coupe la requête avant Next.js
 * (Cloudflare renvoie une page 502) : un PDF de 20 Mo ne peut pas partir
 * d'un bloc. Le navigateur l'envoie donc en morceaux de 6 Mo, assemblés sur
 * R2 par un envoi multipart, puis joint seulement la clé à son message ; le
 * serveur revérifie alors taille et contenu avant de l'attacher.
 *
 * Même bucket privé et mêmes variables `SUIVI_S3_*` que storage.ts.
 */

/** 6 Mo : au-dessus du minimum de R2 (5 Mo par morceau), bien sous la limite de l'hébergement */
export const UPLOAD_PART_BYTES = 6 * 1024 * 1024;

const s3 = new S3Client({
  region: process.env.SUIVI_S3_REGION || 'auto',
  endpoint: process.env.SUIVI_S3_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.SUIVI_S3_ACCESS_KEY || '',
    secretAccessKey: process.env.SUIVI_S3_SECRET_KEY || ''
  },
  forcePathStyle: true
});

function bucket(): string {
  const name = process.env.SUIVI_S3_BUCKET;
  if (!process.env.SUIVI_S3_ENDPOINT || !name) {
    throw new Error('Stockage des suivis non configuré (variables SUIVI_S3_*)');
  }
  return name;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf'
};

/** Dépôt en cours : `mentorship/<suivi>/up-<uuid>.<ext>` */
export function isPendingKey(mentorshipId: string, key: string): boolean {
  return new RegExp(`^mentorship/${mentorshipId}/up-[0-9a-f-]{36}\\.(jpg|png|webp|gif|pdf)$`).test(key);
}

type Fail = { ok: false; status: number; error: string };
const fail = (status: number, error: string): Fail => ({ ok: false, status, error });

export async function startUpload(
  mentorshipId: string,
  type: string,
  size: number
): Promise<{ ok: true; key: string; uploadId: string; partSize: number } | Fail> {
  if (!ALLOWED_ATTACHMENT_TYPES.includes(type)) {
    return fail(400, 'Seuls les images (JPEG, PNG, WebP, GIF) et les PDF peuvent être joints.');
  }
  if (!Number.isFinite(size) || size <= 0) return fail(400, 'Fichier vide.');
  if (size > MAX_ATTACHMENT_BYTES) return fail(400, 'Fichier trop lourd (20 Mo maximum).');

  const key = `mentorship/${mentorshipId}/up-${uuidv4()}.${EXT[type]}`;
  const res = await s3.send(new CreateMultipartUploadCommand({ Bucket: bucket(), Key: key, ContentType: type }));
  if (!res.UploadId) throw new Error('UploadId manquant');
  return { ok: true, key, uploadId: res.UploadId, partSize: UPLOAD_PART_BYTES };
}

export async function uploadPart(
  key: string,
  uploadId: string,
  partNumber: number,
  body: Buffer
): Promise<{ ok: true } | Fail> {
  const maxParts = Math.ceil(MAX_ATTACHMENT_BYTES / UPLOAD_PART_BYTES);
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > maxParts) return fail(400, 'Morceau invalide.');
  if (body.length === 0 || body.length > UPLOAD_PART_BYTES) return fail(400, 'Morceau invalide.');
  await s3.send(
    new UploadPartCommand({ Bucket: bucket(), Key: key, UploadId: uploadId, PartNumber: partNumber, Body: body })
  );
  return { ok: true };
}

/** Assemble les morceaux reçus (la liste vient de R2, pas du navigateur) */
export async function completeUpload(key: string, uploadId: string): Promise<{ ok: true } | Fail> {
  const listed = await s3.send(new ListPartsCommand({ Bucket: bucket(), Key: key, UploadId: uploadId }));
  const parts = (listed.Parts ?? [])
    .filter((p) => p.PartNumber && p.ETag)
    .sort((a, b) => a.PartNumber! - b.PartNumber!)
    .map((p) => ({ PartNumber: p.PartNumber!, ETag: p.ETag! }));
  if (parts.length === 0) return fail(400, 'Le fichier n’a pas été reçu. Réessaie.');
  await s3.send(
    new CompleteMultipartUploadCommand({ Bucket: bucket(), Key: key, UploadId: uploadId, MultipartUpload: { Parts: parts } })
  );
  return { ok: true };
}

/** Abandon (erreur côté navigateur) : ne lève jamais, R2 purge de toute façon les envois inachevés */
export async function abortUpload(key: string, uploadId: string): Promise<void> {
  await s3.send(new AbortMultipartUploadCommand({ Bucket: bucket(), Key: key, UploadId: uploadId })).catch(() => {});
}

export type ClaimResult =
  | { ok: true; key: string; mime: string; name: string; size: number }
  | Fail;

/**
 * Vérifie un fichier déposé avant de l'attacher à un message : clé du bon
 * suivi, taille réelle, signature binaire. Un fichier refusé est supprimé.
 */
export async function claimAttachment(mentorshipId: string, key: string, name: string): Promise<ClaimResult> {
  if (!isPendingKey(mentorshipId, key)) return fail(400, 'Pièce jointe invalide.');

  let size = 0;
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    size = head.ContentLength ?? 0;
  } catch {
    return fail(400, 'Le fichier n’a pas été reçu. Réessaie.');
  }

  const reject = async (error: string): Promise<ClaimResult> => {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key })).catch(() => {});
    return fail(400, error);
  };
  if (size <= 0) return reject('Fichier vide.');
  if (size > MAX_ATTACHMENT_BYTES) return reject('Fichier trop lourd (20 Mo maximum).');

  // Les premiers octets suffisent pour reconnaître le format
  const start = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: key, Range: 'bytes=0-15' }));
  const head = start.Body ? Buffer.from(await start.Body.transformToByteArray()) : Buffer.alloc(0);
  const check = await readAttachment(new File([head], name || ''));
  if (!check.ok) return reject(check.error);

  return { ok: true, key, mime: check.mime, name: check.name, size };
}
