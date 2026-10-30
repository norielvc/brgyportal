import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { tenantOgFileCandidates } from "../../../src/lib/portalShare";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

async function resolveSourceFile(tenantId) {
  const candidates = [
    ...tenantOgFileCandidates(tenantId),
    "/images/community.jpg",
    "/logo.png",
  ];
  const seen = new Set();
  for (const rel of candidates) {
    const normalized = rel.startsWith("/") ? rel.slice(1) : rel;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    const absolute = path.join(process.cwd(), "public", normalized);
    try {
      await fs.access(absolute);
      return absolute;
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * GET /api/portal/share-image?tenant=ibaoeste
 * 1200×630 JPEG for social / chat link previews.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const tenantId = String(
    req.query.tenant || req.headers["x-tenant-id"] || "ibaoeste",
  ).toLowerCase();

  try {
    const sourcePath = await resolveSourceFile(tenantId);
    if (!sourcePath) {
      return res.status(404).json({ success: false, message: "Share image not found" });
    }

    const jpeg = await sharp(sourcePath)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "center" })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Length", String(jpeg.length));
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, stale-while-revalidate=604800",
    );
    return res.status(200).send(jpeg);
  } catch (err) {
    console.error("[share-image]", tenantId, err.message);
    return res.status(500).json({ success: false, message: "Failed to build share image" });
  }
}
