import { toast } from "react-hot-toast";

function formatExpiry(expiresAt) {
  if (!expiresAt) return "";
  try {
    return new Date(expiresAt).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(expiresAt);
  }
}

export function notifyPublishDeliveryFailure(data, status = 0) {
  const code = String(data?.code || "");
  const message =
    data?.message ||
    (status ? `Could not publish or send link (HTTP ${status}).` : "Could not publish or send link.");

  toast.error(message, { duration: 10000 });

  let hint = "";
  if (code === "NO_EMAIL") {
    hint =
      "The PDF was saved, but there is no requestor email on this request. Add an email on the record, then use Publish & send link again.";
  } else if (code === "EMAIL_NOT_CONFIGURED") {
    hint =
      "Server email is not configured. Set RESEND_API_KEY, BREVO_API_KEY, or SMTP_USER / SMTP_PASS.";
  } else if (code === "SMTP_QUOTA") {
    hint = "The mail provider daily limit was reached. Wait for the limit to reset or switch providers.";
  } else if (code === "EMAIL_SEND_FAILED") {
    hint =
      data?.errorDetail ||
      "The mail provider rejected the message. Check Resend/SMTP logs and the recipient address.";
  } else if (data?.deliveryId) {
    hint =
      "The PDF is stored. After fixing the issue above, publish again to email a fresh link (previous links may still work until expiry).";
  } else if (code === "DELIVERY_NOT_PUBLISHED") {
    hint = "Run CERTIFICATE_DELIVERIES_MIGRATION.sql on the linked Supabase project first.";
  }

  if (hint) {
    toast(hint, { icon: "ℹ️", duration: 11000 });
  }
}

export function notifyPublishDeliverySuccess(data) {
  const email = String(data?.recipientEmail || "").trim();
  const message =
    data?.message ||
    (email
      ? `Certificate published. Download link emailed to ${email}.`
      : "Certificate published and download link sent.");

  toast.success(message, { duration: 9000 });

  if (data?.released) {
    toast("This request is now marked as released in Pickup Management.", {
      icon: "✅",
      duration: 8000,
    });
  }

  const expiry = formatExpiry(data?.expiresAt);
  if (expiry) {
    toast(`Secure link expires ${expiry}. Ask the resident to check Inbox and Spam/Promotions.`, {
      icon: "📬",
      duration: 10000,
    });
  }
}
