import {
  CERTIFICATE_DELIVERY_BUCKET,
  incrementDownloadCount,
  resolveDeliveryByToken,
} from "../../../../src/lib/certificateDeliveryServer";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const token = req.query?.t || req.query?.token;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Download token is required",
    });
  }

  try {
    const delivery = await resolveDeliveryByToken(token);
    if (!delivery) {
      return res.status(410).json({
        success: false,
        message: "This download link is invalid or has expired.",
      });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(CERTIFICATE_DELIVERY_BUCKET)
      .download(delivery.storage_path);

    if (downloadError || !fileData) {
      console.error("[certificate-delivery download]", downloadError);
      return res.status(500).json({
        success: false,
        message: "Stored certificate file could not be retrieved.",
      });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName =
      delivery.file_name ||
      `${delivery.certificate_requests?.reference_number || "certificate"}.pdf`;

    await incrementDownloadCount(delivery.id).catch((err) => {
      console.warn("[certificate-delivery download] count update failed", err);
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${String(fileName).replace(/"/g, "")}"`,
    );
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("[certificate-delivery download]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Download failed",
    });
  }
}
