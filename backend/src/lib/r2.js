/**
 * Cloudflare R2 helper — wraps the S3-compatible API.
 * Module B6 will expand this into a full upload/delete/presign service.
 * For now: presigned PUT for direct client uploads + public CDN URL builder.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region:   'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET,
  },
});

/**
 * Generate a presigned PUT URL so the client uploads directly to R2.
 * @param {string} key          - object key, e.g. "studios/abc/logo-123.jpg"
 * @param {string} contentType  - MIME type
 * @param {number} expiresIn    - seconds until the URL expires (default 15 min)
 */
export async function presignPut(key, contentType, expiresIn = 900) {
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

/** Delete an object from R2 (used when media or logos are removed). */
export async function deleteObject(key) {
  await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
}

/** Build the public CDN URL from an R2 object key. */
export function cdnUrl(key) {
  return `${process.env.R2_PUBLIC_BASE}/${key}`;
}
