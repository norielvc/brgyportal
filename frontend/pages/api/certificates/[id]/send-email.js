import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

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

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom =
    process.env.RESEND_FROM || "BrgyDesk <noreply@brgydesk.app>";
  if (!resendApiKey) {
    return res.status(500).json({
      success: false,
      message: "Email service not configured. Set RESEND_API_KEY in env.",
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

  if (!to) {
    return res
      .status(400)
      .json({ success: false, message: "Requestor email not found" });
  }

  const typeLabel =
    cert.certificate_type?.replace(/_/g, " ").toUpperCase() ||
    "CERTIFICATE";
  const ref = cert.reference_number || id;

  const html = `
    <p>Hi ${name},</p>
    <p>Your <strong>${typeLabel}</strong> (Reference: <strong>${ref}</strong>) is now ready.</p>
    <p>If you selected online delivery, you may download and print your certificate from the portal using your reference number. Otherwise, you can claim it at the barangay office.</p>
    <p>Regards,<br/>BrgyDesk</p>
  `;

  const text = `Hi ${name},\n\nYour ${typeLabel} (Reference: ${ref}) is now ready.\n\nIf you selected online delivery, you may download and print your certificate from the portal using your reference number. Otherwise, you can claim it at the barangay office.\n\nRegards,\nBrgyDesk`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to,
        subject: `Your ${typeLabel} is ready`,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: errorData.message || "Resend API error",
      });
    }

    return res.json({
      success: true,
      message: `Certificate sent to ${to}`,
    });
  } catch (error) {
    console.error("Send email error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send email",
    });
  }
}
