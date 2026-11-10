import { resolveDeliveryByToken } from "../../../../src/lib/certificateDeliveryServer";

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
      valid: false,
      message: "Download token is required",
    });
  }

  try {
    const delivery = await resolveDeliveryByToken(token);
    if (!delivery) {
      return res.json({
        success: true,
        valid: false,
        message: "This download link is invalid or has expired.",
      });
    }

    const cert = delivery.certificate_requests || {};
    const applicant =
      cert.applicant_name ||
      cert.full_name ||
      delivery.file_name ||
      "Certificate";

    return res.json({
      success: true,
      valid: true,
      data: {
        reference_number: cert.reference_number || null,
        certificate_type: cert.certificate_type || null,
        applicant_name: applicant,
        expires_at: delivery.expires_at,
        file_name: delivery.file_name || "certificate.pdf",
        download_count: delivery.download_count || 0,
      },
    });
  } catch (error) {
    console.error("[certificate-delivery verify]", error);
    return res.status(500).json({
      success: false,
      valid: false,
      message: "Could not verify download link.",
    });
  }
}
