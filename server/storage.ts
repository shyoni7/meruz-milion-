// Storage helpers using Vercel Blob so the whole stack lives in Vercel.
// Requires a Blob store connected to the project (injects BLOB_READ_WRITE_TOKEN).
import { del, put } from "@vercel/blob";

function assertBlobConfigured() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Vercel Blob is not configured: connect a Blob store to the project (Storage → Create Database → Blob)",
    );
  }
}

/**
 * Upload a file to Vercel Blob.
 * Returns { key, url } where url is a public CDN URL and key is the blob URL
 * (usable with storageDelete).
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  assertBlobConfigured();

  const body = typeof data === "string" ? Buffer.from(data, "base64") : Buffer.from(data);

  const blob = await put(relKey, body, {
    access: "public",
    contentType: contentType || "image/jpeg",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return { key: blob.url, url: blob.url };
}

/**
 * Get the public URL for a stored file. Blob keys are already public URLs.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  return { key: relKey, url: relKey };
}

/**
 * Blob URLs are public and unguessable; return the URL as-is.
 */
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  return relKey;
}

/**
 * Delete a file from Vercel Blob by its URL (or pathname).
 */
export async function storageDelete(relKey: string): Promise<void> {
  assertBlobConfigured();
  try {
    await del(relKey);
  } catch (err) {
    console.warn(`[Storage] Delete failed for key "${relKey}":`, err);
  }
}
