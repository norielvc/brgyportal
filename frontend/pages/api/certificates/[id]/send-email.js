import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";
import { buildProcessNotificationEmail } from "../../../../src/lib/mailer";
import { sendTransactionalEmail } from "../../../../src/lib/sendTransactionalEmail";

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

  const gmailReady = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!gmailReady) {
    return res.status(503).json({
      success: false,
      code: "EMAIL_NOT_CONFIGURED",
      message:
        "Email is not configured. Set SMTP_USER and SMTP_PASS (Gmail app password) in your environment.",
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
  const portalPath =
    tenantId && tenantId !== "demo" ? `/${tenantId}` : "/ibaoeste";

  const { subject, html, text } = buildProcessNotificationEmail({
    recipientName: name,
    eventType: "READY_FOR_PICKUP",
    certificateType: cert.certificate_type,
    referenceNumber: ref,
    applicantName: name,
    requestId: id,
    portalPath,
  });

  try {
    const sent = await sendTransactionalEmail({
      to: to.trim(),
      subject,
      html,
      text,
    });

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
    });

    return res.json({
      success: true,
      message: `Certificate ready email sent to ${to.trim()}`,
      channel: sent.channel,
      to: to.trim(),
      from: sent.from,
      messageId: sent.messageId,
      hint:
        "If it does not appear in Inbox within a few minutes, check Spam/Promotions and search for “Certificate Ready” or the sender address.",
    });
  } catch (error) {
    console.error("Send email error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send email",
    });
  }
}
