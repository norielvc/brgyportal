import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase, isSupabaseServerConfigured } from "../../../lib/supabase";
import {
  escapeHtml,
  sendTransactionalEmail,
} from "../../../src/lib/sendTransactionalEmail";

async function sendAssistanceEmail({
  to,
  residentName,
  subject,
  bodyText,
  originalInquiry,
}) {
  const inquiryBlock = (originalInquiry || "").trim();
  const replyBlock = (bodyText || "").trim();

  const plainText = [
    `Hello ${residentName || "Resident"},`,
    "",
    "The barangay has replied to your assistance inquiry.",
    "",
    inquiryBlock ? "Your message:" : null,
    inquiryBlock || null,
    inquiryBlock ? "" : null,
    "Barangay reply:",
    replyBlock,
    "",
    "This is an official message from your barangay help desk. Please do not reply to this automated email; contact the barangay office if you need follow-up.",
    "",
    "Regards,",
    "Barangay Help Desk",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${escapeHtml(residentName || "Resident")},</p>
      <p>The barangay has replied to your assistance inquiry:</p>
      ${
        inquiryBlock
          ? `<p style="font-size:12px;font-weight:600;color:#64748b;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.04em">Your message</p>
      <div style="background:#fff;border:1px solid #e2e8f0;border-left:4px solid #94a3b8;padding:12px 16px;margin:0 0 16px;border-radius:4px;white-space:pre-wrap;font-size:14px;color:#334155">${escapeHtml(inquiryBlock)}</div>`
          : ""
      }
      <p style="font-size:12px;font-weight:600;color:#64748b;margin:0 0 6px;text-transform:uppercase;letter-spacing:.04em">Barangay reply</p>
      <div style="background:#f1f5f9;border-left:4px solid #065f46;padding:12px 16px;margin:0 0 16px;border-radius:4px;white-space:pre-wrap;font-size:14px">${escapeHtml(replyBlock)}</div>
      <p style="color:#64748b;font-size:13px">This is an official message from your barangay help desk. Please do not reply to this automated email; contact the barangay office if you need follow-up.</p>
      <p>Regards,<br/>Barangay Help Desk</p>
    </div>
  `;

  const sent = await sendTransactionalEmail({
    to,
    subject,
    html,
    text: plainText,
  });
  if (sent.skipped) {
    return { channel: null, skipped: true };
  }
  if (!sent.success) {
    throw new Error(sent.error || "Failed to send email via SMTP");
  }
  return { channel: "email" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId) {
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });
  }

  if (!isSupabaseServerConfigured()) {
    return res.status(500).json({
      success: false,
      message: "Supabase is not configured",
    });
  }

  const { inquiryId, message: responseText, markResolved } = req.body || {};
  const text = (responseText || "").trim();
  if (!inquiryId || !text) {
    return res.status(400).json({
      success: false,
      message: "inquiryId and message are required",
    });
  }

  try {
    const { data: inquiry, error: fetchErr } = await supabase
      .from("assistance_inquiries")
      .select("*")
      .eq("id", inquiryId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchErr || !inquiry) {
      return res.status(404).json({
        success: false,
        message: "Assistance inquiry not found",
      });
    }

    const residentName = `${inquiry.first_name || ""} ${inquiry.last_name || ""}`.trim();
    const nextStatus = markResolved ? "resolved" : "in_progress";

    const updatePayload = {
      staff_response: text,
      responded_at: new Date().toISOString(),
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    let { data: updated, error: updateErr } = await supabase
      .from("assistance_inquiries")
      .update(updatePayload)
      .eq("id", inquiryId)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (updateErr && /staff_response|responded_at/i.test(updateErr.message || "")) {
      const { staff_response, responded_at, ...legacy } = updatePayload;
      ({ data: updated, error: updateErr } = await supabase
        .from("assistance_inquiries")
        .update({ status: nextStatus, updated_at: updatePayload.updated_at })
        .eq("id", inquiryId)
        .eq("tenant_id", tenantId)
        .select()
        .single());
    }

    if (updateErr) throw updateErr;

    let emailResult = { channel: null, skipped: true };
    if (inquiry.email) {
      try {
        emailResult = await sendAssistanceEmail({
          to: inquiry.email.trim(),
          residentName,
          subject: "Reply from Barangay Help Desk / Sagot ng Barangay",
          bodyText: text,
          originalInquiry: inquiry.message,
        });
      } catch (emailErr) {
        console.error("Assistance reply email failed:", emailErr);
        return res.status(502).json({
          success: false,
          message:
            emailErr.message ||
            "Response saved but email could not be sent. Check email configuration.",
          inquiry: updated,
        });
      }
    }

    return res.json({
      success: true,
      message: inquiry.email
        ? emailResult.skipped
          ? "Response saved. Email is not configured on the server — contact the resident by phone/SMS."
          : `Response saved and emailed to ${inquiry.email}`
        : "Response saved. No email on file — contact the resident by phone/SMS.",
      inquiry: updated,
      notified: Boolean(inquiry.email && !emailResult.skipped),
    });
  } catch (error) {
    console.error("Assistance respond error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send response",
    });
  }
}
