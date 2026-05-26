/**
 * Comprehensive Cloudflare R2 service (S3-compatible).
 * All media upload, read, delete, and multipart operations live here.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';

const r2 = new S3Client({
  region:   'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET,
  },
});

const BUCKET = process.env.R2_BUCKET;

// ─── URL helpers ──────────────────────────────────────────────

export function cdnUrl(key) {
  return `${process.env.R2_PUBLIC_BASE}/${key}`;
}

// ─── Single-part presigned upload ────────────────────────────

/**
 * Presign a direct PUT upload from the browser.
 * Browser uploads file bytes straight to R2 — never touches Express.
 */
export async function presignUpload(key, contentType, expiresIn = 3600) {
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

/** Alias kept for backward compat (studio logo upload uses this name). */
export const presignPut = presignUpload;

// ─── Signed read URL (private originals) ─────────────────────

export async function getSignedReadUrl(key, ttl = 900) {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: ttl },
  );
}

// ─── Head / existence check ───────────────────────────────────

/** Returns { sizeBytes, contentType, lastModified } or null if key does not exist. */
export async function headObject(key) {
  try {
    const r = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return {
      sizeBytes:    Number(r.ContentLength ?? 0),
      contentType:  r.ContentType,
      lastModified: r.LastModified,
    };
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

// ─── Download to buffer (used by the media worker) ───────────

export async function getObjectBuffer(key) {
  const result = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of result.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// ─── Programmatic upload (worker uploads processed variants) ──

export async function putObject(key, buffer, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket:         BUCKET,
    Key:            key,
    Body:           buffer,
    ContentType:    contentType,
    ContentLength:  buffer.length,
  }));
  return cdnUrl(key);
}

// ─── Streaming upload (FTP → R2 without buffering full file) ──

/**
 * Stream a Readable directly to R2 using managed multipart.
 * Used by the FTP server where file size is not known upfront.
 * Returns the public CDN URL.
 */
export async function streamUpload(key, readableStream, contentType) {
  const upload = new Upload({
    client: r2,
    params: {
      Bucket:      BUCKET,
      Key:         key,
      Body:        readableStream,
      ContentType: contentType,
    },
    queueSize:  4,
    partSize:   5 * 1024 * 1024, // 5 MB minimum part size
    leavePartsOnError: false,
  });
  await upload.done();
  return cdnUrl(key);
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteObject(key) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Batch-delete up to 1 000 keys in a single API call. */
export async function deleteObjects(keys) {
  if (!keys.length) return;
  const chunks = [];
  for (let i = 0; i < keys.length; i += 1000) chunks.push(keys.slice(i, i + 1000));
  await Promise.all(chunks.map(chunk =>
    r2.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: chunk.map(Key => ({ Key })), Quiet: true },
    })),
  ));
}

// ─── Multipart upload (files > 100 MB — 4K video) ────────────

/**
 * Start a multipart upload session.
 * Returns the uploadId that the client must include in every subsequent call.
 */
export async function createMultipartUpload(key, contentType) {
  const r = await r2.send(new CreateMultipartUploadCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
  }));
  return r.UploadId;
}

/**
 * Presign a single part PUT URL.
 * The browser PUTs its chunk to this URL and saves the returned ETag header.
 * partNumber must be 1-based (1 … 10 000).
 */
export async function presignMultipartPart(key, uploadId, partNumber, expiresIn = 3600) {
  return getSignedUrl(
    r2,
    new UploadPartCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId, PartNumber: partNumber }),
    { expiresIn },
  );
}

/**
 * Tell R2 that all parts have been uploaded.
 * parts: [{ PartNumber: number, ETag: string }]  — ETags come from the PUT response headers.
 */
export async function completeMultipart(key, uploadId, parts) {
  await r2.send(new CompleteMultipartUploadCommand({
    Bucket:            BUCKET,
    Key:               key,
    UploadId:          uploadId,
    MultipartUpload:   { Parts: parts },
  }));
}

export async function abortMultipart(key, uploadId) {
  await r2.send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId }));
}
