import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";
import {
  DEFAULT_DELIVERY_EXPIRY_DAYS,
  mapDeliverySetupError,
  publishCertificateDelivery,
  sendCertificateDownloadReadyEmail,
} from "../../../../src/lib/certificateDeliveryServer";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "12mb",
    },
  },
};

function parsePdfBuffer(body) {
  const { pdfBase64, fileName } = body || {};
  if (!pdfBase64 || typeof pdfBase64 !== "string") {
    return { error: "pdfBase64 is required" };
  }

  const match = pdfBase64.match(/^data:application\/pdf;base64,(.+)$/i);
  const raw = match ? match[1] : pdfBase64;
  let buffer;
  try {
    buffer = Buffer.from(raw, "base64");
  } catch {
    return { error: "Invalid PDF base64 payload" };
  }

  if (!buffer.length || buffer.length > 10 * 1024 * 1024) {
    return { error: "PDF must be between 1 byte and 10MB" };
  }

  return { buffer, fileName: fileName || "certificate.pdf" };
}

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId) {
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Certificate ID required" });
  }

  const parsed = parsePdfBuffer(req.body);
  if (parsed.error) {
    return res.status(400).json({ success: false, message: parsed.error });
  }

  const sendEmail = Boolean(req.body?.sendEmail);
  const expiryDays =
    Number(req.body?.expiryDays) || DEFAULT_DELIVERY_EXPIRY_DAYS;

  const { data: cert, error: certError } = await supabase
    .from("certificate_requests")
    .select("*, residents:resident_id (full_name, email)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (certError || !cert) {
    return res.status(404).json({
      success: false,
      message: certError?.message || "Certificate not found",
    });
  }

  const readyStatuses = new Set([
    "ready",
    "ready_for_pickup",
    "ready_for_release",
    "approved",
    "released",
  ]);
  const status = String(cert.status || "").toLowerCase();
  if (!readyStatuses.has(status)) {
    return res.status(400).json({
      success: false,
      message:
        "Certificate must be approved / ready for release before publishing a download link.",
    });
  }

  try {
    const { delivery, downloadUrl, expiresAt } = await publishCertificateDelivery({
      tenantId,
      certificateRequestId: id,
      pdfBuffer: parsed.buffer,
      fileName: parsed.fileName || `${cert.reference_number || id}.pdf`,
      publishedBy: user.id || user.user_id || null,
      expiryDays,
    });

    let emailResult = null;
    if (sendEmail) {
      const to = cert.email || cert.residents?.email;
      const name =
        cert.applicant_name ||
        cert.full_name ||
        cert.residents?.full_name ||
        "Applicant";

      if (!to?.trim()) {
        return res.status(400).json({
          success: false,
          code: "NO_EMAIL",
          message:
            "PDF was published but no requestor email is on file. Add an email or resend after updating the record.",
          deliveryId: delivery.id,
          expiresAt,
          downloadUrl,
        });
      }

      emailResult = await sendCertificateDownloadReadyEmail({
        to,
        name,
        cert,
        tenantId,
        downloadUrl,
        expiresAt,
      });

      if (emailResult.skipped || !emailResult.success) {
        const code = emailResult.skipped
          ? "EMAIL_NOT_CONFIGURED"
          : emailResult.code || "EMAIL_SEND_FAILED";
        const status = emailResult.skipped ? 503 : 502;
        return res.status(status).json({
          success: false,
          code,
          message:
            emailResult.error ||
            "Published PDF but failed to send download email.",
          deliveryId: delivery.id,
          expiresAt,
          downloadUrl,
        });
      }
    }

    return res.json({
      success: true,
      message: sendEmail
        ? `Published certificate PDF and sent download link to ${(cert.email || cert.residents?.email || "").trim()}`
        : "Published certificate PDF for online delivery.",
      deliveryId: delivery.id,
      expiresAt,
      downloadUrl,
      emailSent: Boolean(sendEmail && emailResult?.success),
    });
  } catch (error) {
    console.error("[publish-delivery]", error);
    return res.status(500).json({
      success: false,
      message: mapDeliverySetupError(error),
      code: error?.code || null,
    });
  }
}
