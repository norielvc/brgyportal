import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";
import sharp from "sharp";

/**
 * POST /api/upload/image
 * Accepts a base64 image, optionally compresses it, uploads to Supabase Storage
 * under {tenant_id}/{folder}/, returns public URL.
 *
 * Default: max 1200px, WebP quality 80.
 * Hero/news (`folder: "events"`) and officials group photo (`officials-hero`): no downscale — WebP quality 92 only.
 *
 * Body: { base64: "data:image/jpeg;base64,...", folder: "facilities" }
 * Optional: { oldUrl: "https://..." } — if provided, old file is deleted first
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const userRes = await authenticateToken(req, res);
  if (!userRes) return;

  const tenantId = userRes.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "No tenant context" });
  }

  const { base64, folder = "general", oldUrl } = req.body;

  if (!base64 || !base64.startsWith("data:")) {
    return res.status(400).json({ success: false, message: "Invalid base64 image" });
  }

  try {
    // Parse base64
    const matches = base64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, message: "Malformed base64 string" });
    }

    const base64Data = matches[2];
    const inputBuffer = Buffer.from(base64Data, "base64");

    const preserveFullResolution =
      folder === "events" || folder === "officials-hero";
    let pipeline = sharp(inputBuffer).rotate();

    if (!preserveFullResolution) {
      pipeline = pipeline.resize(1200, 1200, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    const compressedBuffer = await pipeline
      .webp({ quality: preserveFullResolution ? 92 : 80 })
      .toBuffer();

    const fileName = `${tenantId}/${folder}/${Date.now()}.webp`;

    // Delete old file from storage if a replacement URL was provided
    if (oldUrl && oldUrl.includes("portal-images")) {
      const oldPath = extractStoragePath(oldUrl);
      if (oldPath && oldPath.startsWith(`${tenantId}/`)) {
        await supabase.storage.from("portal-images").remove([oldPath]);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from("portal-images")
      .upload(fileName, compressedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("portal-images")
      .getPublicUrl(fileName);

    return res.status(200).json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    console.error("Image upload error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Extract the storage path from a Supabase public URL.
 * e.g. https://xxx.supabase.co/storage/v1/object/public/portal-images/ibaoeste/facilities/123.webp
 *   → ibaoeste/facilities/123.webp
 */
function extractStoragePath(url) {
  try {
    const marker = "/portal-images/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  } catch {
    return null;
  }
}
