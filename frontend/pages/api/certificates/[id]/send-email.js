import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";
import { buildProcessNotificationEmail } from "../../../../src/lib/mailer";
import {
  getEmailProvider,
  sendTransactionalEmail,
} from "../../../../src/lib/sendTransactionalEmail";
import {
  buildPublicDownloadUrl,
  findActiveDelivery,
  sendCertificateDownloadReadyEmail,
} from "../../../../src/lib/certificateDeliveryServer";

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

  const emailProvider = getEmailProvider();
  if (!emailProvider) {
    return res.status(503).json({
      success: false,
      code: "EMAIL_NOT_CONFIGURED",
      message:
        "Email is not configured. Set RESEND_API_KEY, BREVO_API_KEY, or SMTP_USER and SMTP_PASS in your environment.",
    });
  }

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

  const to = cert.email || cert.residents?.email;
  const name =
    cert.applicant_name ||
    cert.full_name ||
    cert.residents?.full_name ||
    "Applicant";

  if (!to?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Requestor email not found" });
  }

  const ref = cert.reference_number || id;
  const pickupMethod = String(cert.pickup_method || "pickup").toLowerCase();

  try {
    let sent;

    if (pickupMethod === "online") {
      const delivery = await findActiveDelivery(id, tenantId);
      if (!delivery) {
        return res.status(409).json({
          success: false,
          code: "DELIVERY_NOT_PUBLISHED",
          message:
            "No published PDF yet. Open certificate preview, then use Publish & send download link.",
        });
      }

      const downloadUrl = buildPublicDownloadUrl(delivery.download_token, tenantId);
      sent = await sendCertificateDownloadReadyEmail({
        to,
        name,
        cert,
        tenantId,
        downloadUrl,
        expiresAt: delivery.expires_at,
      });
    } else {
      const { subject, html, text } = buildProcessNotificationEmail({
        recipientName: name,
        eventType: "READY_FOR_PICKUP",
        certificateType: cert.certificate_type,
        referenceNumber: ref,
        applicantName: name,
        tenantId,
      });

      sent = await sendTransactionalEmail({
        to: to.trim(),
        subject,
        html,
        text,
        tenantId,
      });
    }

    if (sent.skipped || !sent.success) {
      const code = sent.skipped
        ? "EMAIL_NOT_CONFIGURED"
        : sent.code || "EMAIL_SEND_FAILED";
      const status = sent.skipped ? 503 : code === "SMTP_QUOTA" ? 429 : 502;
      return res.status(status).json({
        success: false,
        code,
        message: sent.error || "Failed to send email",
      });
    }

    console.info("[send-email]", {
      certificateId: id,
      to: to.trim(),
      channel: sent.channel,
      messageId: sent.messageId,
      from: sent.from,
      tenantId,
    });

    return res.json({
      success: true,
      message:
        pickupMethod === "online"
          ? `Download link email sent to ${to.trim()}`
          : `Certificate ready email sent to ${to.trim()}`,
      channel: sent.channel,
      to: to.trim(),
      from: sent.from,
      messageId: sent.messageId,
      hint:
        pickupMethod === "online"
          ? 'If it does not appear in Inbox within a few minutes, check Spam/Promotions and search for "Certificate Download" or the sender address.'
          : 'If it does not appear in Inbox within a few minutes, check Spam/Promotions and search for "Certificate Ready" or the sender address.',
    });
  } catch (error) {
    console.error("Send email error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send email",
    });
  }
}
