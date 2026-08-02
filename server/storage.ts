// Storage helpers using Cloudinary for independent deployment (Vercel-compatible).
// Replaces the Manus Forge S3 proxy with Cloudinary's free-tier CDN.
// Required env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
import { v2 as cloudinary } from "cloudinary";

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary config missing: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
    );
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

/**
 * Upload a file to Cloudinary.
 * Returns { key, url } where url is a public CDN URL (no proxy needed).
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  configureCloudinary();

  const base64 =
    typeof data === "string"
      ? data
      : Buffer.from(data as Uint8Array).toString("base64");

  const mimeType = contentType || "image/jpeg";
  const dataUri = `data:${mimeType};base64,${base64}`;

  // Use relKey as public_id: strip extension, replace slashes with dashes
  const publicId = relKey
    .replace(/\.[^/.]+$/, "")
    .replace(/\//g, "-");

  const result = await cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    resource_type: "auto",
    overwrite: false,
  });

  return { key: result.public_id, url: result.secure_url };
}

/**
 * Get the public URL for a stored file by its Cloudinary public_id.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  configureCloudinary();
  const url = cloudinary.url(relKey, { secure: true });
  return { key: relKey, url };
}

/**
 * Get a signed URL with 1-hour expiry.
 */
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  configureCloudinary();
  const url = cloudinary.url(relKey, {
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });
  return url;
}

/**
 * Delete a file from Cloudinary by its public_id.
 */
export async function storageDelete(relKey: string): Promise<void> {
  configureCloudinary();
  try {
    await cloudinary.uploader.destroy(relKey, { resource_type: "image" });
  } catch (err) {
    console.warn(`[Storage] Delete failed for key "${relKey}":`, err);
  }
}
