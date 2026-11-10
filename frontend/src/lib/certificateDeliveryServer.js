import crypto from "crypto";
import { supabase } from "../../lib/supabase";
import { buildProcessNotificationEmail } from "./mailer";
import {
  getEmailProvider,
  sendTransactionalEmail,
  getTenantEmailProfile,
} from "./sendTransactionalEmail";

export const CERTIFICATE_DELIVERY_BUCKET = "certificate-deliveries";
export const DEFAULT_DELIVERY_EXPIRY_DAYS = 30;

let deliveryBucketReady = false;

function formatSupabaseError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  const parts = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .map(String);
  return parts.join(" — ") || "Unknown error";
}

export function mapDeliverySetupError(error) {
  const text = formatSupabaseError(error);
  const code = String(error?.code || "");

  if (
    code === "PGRST205" ||
    /relation.*certificate_deliveries.*does not exist/i.test(text) ||
    /could not find the table.*certificate_deliveries/i.test(text)
  ) {
    const ref =
      process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ||
      "your-linked";
    return `Table certificate_deliveries is missing on Supabase project "${ref}". Run backend/CERTIFICATE_DELIVERIES_MIGRATION.sql in that project's SQL editor, then retry.`;
  }

  if (/bucket not found/i.test(text)) {
    return 'Storage bucket "certificate-deliveries" not found. Create a private bucket with that exact name in Supabase Storage.';
  }

  return text;
}

async function ensureCertificateDeliveryBucket() {
  if (deliveryBucketReady) return;
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  const exists = (buckets || []).some(
    (b) => b.name === CERTIFICATE_DELIVERY_BUCKET,
  );
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(
      CERTIFICATE_DELIVERY_BUCKET,
      { public: false },
    );
    if (createError && !/already exists/i.test(createError.message || "")) {
      throw createError;
    }
  }
  deliveryBucketReady = true;
}

export function generateDeliveryToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function buildPublicDownloadUrl(token, tenantId) {
  const profile = getTenantEmailProfile(tenantId);
  const base = String(profile.portalUrl || "").replace(/\/$/, "");
  return `${base}/download-certificate?t=${encodeURIComponent(token)}`;
}

export async function findActiveDelivery(certificateRequestId, tenantId) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("certificate_deliveries")
    .select("*")
    .eq("certificate_request_id", certificateRequestId)
    .eq("tenant_id", tenantId)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function revokeDeliveriesForRequest(certificateRequestId, tenantId) {
  const { error } = await supabase
    .from("certificate_deliveries")
    .update({ revoked_at: new Date().toISOString() })
    .eq("certificate_request_id", certificateRequestId)
    .eq("tenant_id", tenantId)
    .is("revoked_at", null);
  if (error) throw error;
}

export async function sendCertificateDownloadReadyEmail({
  to,
  name,
  cert,
  tenantId,
  downloadUrl,
  expiresAt,
}) {
  const emailProvider = getEmailProvider();
  if (!emailProvider) {
    return {
      success: false,
      skipped: true,
      code: "EMAIL_NOT_CONFIGURED",
      error:
        "Email is not configured. Set RESEND_API_KEY, BREVO_API_KEY, or SMTP_USER and SMTP_PASS.",
    };
  }

  const { subject, html, text } = buildProcessNotificationEmail({
    recipientName: name,
    eventType: "CERTIFICATE_DOWNLOAD_READY",
    certificateType: cert.certificate_type,
    referenceNumber: cert.reference_number || cert.id,
    applicantName: name,
    tenantId,
    ctaUrlOverride: downloadUrl,
    downloadExpiresAt: expiresAt,
  });

  return sendTransactionalEmail({
    to: to.trim(),
    subject,
    html,
    text,
    tenantId,
  });
}

export async function publishCertificateDelivery({
  tenantId,
  certificateRequestId,
  pdfBuffer,
  fileName,
  publishedBy,
  expiryDays = DEFAULT_DELIVERY_EXPIRY_DAYS,
}) {
  await ensureCertificateDeliveryBucket();
  await revokeDeliveriesForRequest(certificateRequestId, tenantId);

  const downloadToken = generateDeliveryToken();
  const ts = Date.now();
  const storagePath = `${tenantId}/${certificateRequestId}/${ts}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(CERTIFICATE_DELIVERY_BUCKET)
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(expiryDays) || DEFAULT_DELIVERY_EXPIRY_DAYS);

  const { data: row, error: insertError } = await supabase
    .from("certificate_deliveries")
    .insert({
      tenant_id: tenantId,
      certificate_request_id: certificateRequestId,
      download_token: downloadToken,
      storage_path: storagePath,
      file_name: fileName || "certificate.pdf",
      expires_at: expiresAt.toISOString(),
      published_by: publishedBy || null,
    })
    .select("*")
    .single();

  if (insertError) {
    await supabase.storage
      .from(CERTIFICATE_DELIVERY_BUCKET)
      .remove([storagePath])
      .catch(() => {});
    throw insertError;
  }

  return {
    delivery: row,
    downloadUrl: buildPublicDownloadUrl(downloadToken, tenantId),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function resolveDeliveryByToken(rawToken) {
  const token = String(rawToken || "").trim();
  if (token.length < 16) return null;

  const now = new Date().toISOString();
  const { data: delivery, error } = await supabase
    .from("certificate_deliveries")
    .select("*")
    .eq("download_token", token)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) throw error;
  if (!delivery) return null;

  const { data: cert } = await supabase
    .from("certificate_requests")
    .select(
      "reference_number, certificate_type, applicant_name, full_name, status, tenant_id",
    )
    .eq("id", delivery.certificate_request_id)
    .maybeSingle();

  return {
    ...delivery,
    certificate_requests: cert || null,
  };
}

export async function incrementDownloadCount(deliveryId) {
  const { data, error: readError } = await supabase
    .from("certificate_deliveries")
    .select("download_count")
    .eq("id", deliveryId)
    .single();
  if (readError) throw readError;

  const { error: updateError } = await supabase
    .from("certificate_deliveries")
    .update({
      download_count: (data?.download_count || 0) + 1,
      last_downloaded_at: new Date().toISOString(),
    })
    .eq("id", deliveryId);
  if (updateError) throw updateError;
}
