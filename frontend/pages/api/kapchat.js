import { supabase, isSupabaseServerConfigured } from "../../lib/supabase";
import { filterKapchatMessagesForResident } from "../../src/lib/kapchatThread";
import { isKapchatOpenForResidents } from "../../src/lib/kapchatSchedule";

export default async function handler(req, res) {
  const tenantId = req.headers["x-tenant-id"];
  if (!tenantId) {
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });
  }

  if (!isSupabaseServerConfigured()) {
    return res.status(500).json({
      success: false,
      message: "Supabase URL and key are not configured",
    });
  }

  try {
    if (req.method === "POST") {
      const { name, sender_name, contact, message, is_admin, status, resident_id } =
        req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Required field: message",
        });
      }

      const isAdminMsg = Boolean(is_admin);

      if (!isAdminMsg && !isKapchatOpenForResidents()) {
        return res.status(403).json({
          success: false,
          code: "KAPCHAT_CLOSED",
          message:
            "KapChat is closed. Resident hours: Mon–Fri 8:00 AM–5:00 PM, Sat 8:00 AM–12:00 NN (Philippine Time).",
        });
      }

      let sName = sender_name
        ? sender_name.trim()
        : name
          ? name.trim()
          : isAdminMsg
            ? "Barangay Chairman"
            : "Resident";
      let sContact = contact ? contact.trim() : null;
      const initialStatus = status || (isAdminMsg ? "replied" : "unread");
      let verifiedResidentId = null;

      if (!isAdminMsg) {
        const residentId = resident_id != null ? String(resident_id).trim() : "";
        if (!residentId) {
          return res.status(403).json({
            success: false,
            message:
              "KapChat is available to registered barangay residents only. Select your record from the census directory.",
          });
        }

        const { data: resident, error: residentErr } = await supabase
          .from("residents")
          .select("id, full_name, contact_number, tenant_id, is_deceased")
          .eq("tenant_id", tenantId)
          .eq("id", residentId)
          .maybeSingle();

        if (residentErr) throw residentErr;
        if (!resident || resident.is_deceased) {
          return res.status(403).json({
            success: false,
            message: "Invalid or inactive resident record for KapChat.",
          });
        }

        sName = (resident.full_name || sName).trim();
        verifiedResidentId = String(resident.id);
        if (!sContact && resident.contact_number) {
          sContact = String(resident.contact_number).trim();
        }
      }

      const insertRow = {
        tenant_id: tenantId,
        sender_name: sName,
        contact: sContact,
        message: message.trim(),
        is_admin: isAdminMsg,
        status: initialStatus,
      };
      const adminResidentId =
        isAdminMsg && resident_id != null
          ? String(resident_id).trim()
          : "";
      if (verifiedResidentId) {
        insertRow.resident_id = verifiedResidentId;
      } else if (adminResidentId) {
        insertRow.resident_id = adminResidentId;
      }

      let { data, error } = await supabase
        .from("kapchat_messages")
        .insert([insertRow])
        .select()
        .single();

      if (error && verifiedResidentId && /resident_id/i.test(error.message || "")) {
        const { resident_id: _drop, ...withoutResident } = insertRow;
        ({ data, error } = await supabase
          .from("kapchat_messages")
          .insert([withoutResident])
          .select()
          .single());
      }

      if (error) throw error;

      // If this is an admin reply and we have contact, mark earlier unread citizen messages from this contact as 'replied'
      if (isAdminMsg && sContact) {
        await supabase
          .from("kapchat_messages")
          .update({ status: "replied" })
          .eq("tenant_id", tenantId)
          .eq("contact", sContact)
          .eq("is_admin", false);
      }

      // If this is a resident message, notify configured KapChat email receivers (or Barangay Captain if empty)
      if (!isAdminMsg) {
        try {
          const { isEmailNotificationsEnabled } = await import(
            "../../src/lib/requestNotificationHelper"
          );
          const {
            getKapchatSettings,
            fetchKapchatNotificationRecipients,
          } = await import("../../src/lib/kapchatAccess");
          const { sendKapchatNotification } = await import("../../src/lib/mailer");

          const kapchatSettings = await getKapchatSettings(supabase, tenantId);
          const recipients = await fetchKapchatNotificationRecipients(
            supabase,
            tenantId,
            kapchatSettings,
          );
          const emailEnabled = await isEmailNotificationsEnabled(supabase);
          const seenEmails = new Set();

          // 1. Staff notifications: ONLY users explicitly checked in "New message email receivers"
          for (const rec of recipients) {
            if (emailEnabled && rec.email) {
              const emailKey = String(rec.email).trim().toLowerCase();
              if (!seenEmails.has(emailKey)) {
                seenEmails.add(emailKey);
                const recipientName =
                  `${rec.first_name || ""} ${rec.last_name || ""}`.trim() ||
                  "Barangay Staff";
                const sent = await sendKapchatNotification({
                  recipientEmail: rec.email,
                  recipientName,
                  senderName: sName,
                  contactNumber: sContact || "",
                  message: message.trim(),
                  tenantId,
                  isResidentConfirmation: false,
                });
                if (sent.success) {
                  console.log(`📧 KapChat email sent to staff ${rec.email}`);
                } else {
                  console.warn(`⚠️ KapChat email failed (${rec.email}):`, sent.error);
                }
              }
            }

            if (rec.id) {
              await supabase.from("notifications").insert([
                {
                  tenant_id: tenantId,
                  user_id: rec.id,
                  title: "New KapChat Message",
                  message: `New KapChat message from ${sName}: "${message.trim().slice(0, 80)}"`,
                  type: "info",
                  category: "kapchat",
                  link: "/help-desk?tab=kapchat",
                  read: false,
                  created_at: new Date().toISOString(),
                },
              ]);
            }
          }

          // 2. Resident confirmation email (if resident has an email)
          const { isValidEmail } = await import("../../src/lib/sendTransactionalEmail");
          let residentEmail = null;
          if (isValidEmail(sContact)) {
            residentEmail = sContact.trim();
          } else if (isValidEmail(req.body?.email)) {
            residentEmail = req.body.email.trim();
          } else if (resident_id) {
            const { data: resData } = await supabase
              .from("residents")
              .select("email")
              .eq("id", resident_id)
              .maybeSingle();
            if (isValidEmail(resData?.email)) {
              residentEmail = resData.email.trim();
            }
          }

          if (emailEnabled && residentEmail && !seenEmails.has(residentEmail.toLowerCase())) {
            seenEmails.add(residentEmail.toLowerCase());
            await sendKapchatNotification({
              recipientEmail: residentEmail,
              recipientName: sName,
              senderName: sName,
              contactNumber: sContact || "",
              message: message.trim(),
              tenantId,
              isResidentConfirmation: true,
            });
            console.log(`📧 KapChat confirmation sent to resident ${residentEmail}`);
          }
        } catch (notifyErr) {
          console.error("❌ KapChat notification error:", notifyErr.message);
        }
      }

      return res.status(201).json({
        success: true,
        message: "Chat message submitted successfully",
        chat: data,
      });
    }

    if (req.method === "GET") {
      const { status, contact, order, resident_id, since, limit: limitParam } =
        req.query;

      const isAsc = order === "asc" || Boolean(contact);
      const columns =
        "id, contact, sender_name, message, status, is_admin, resident_id, created_at, tenant_id";
      let query = supabase
        .from("kapchat_messages")
        .select(columns, { count: "exact" })
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: isAsc });

      if (contact) {
        query = query.eq("contact", contact.trim());
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (since) {
        const sinceDate = new Date(String(since));
        if (!Number.isNaN(sinceDate.getTime())) {
          query = query.gt("created_at", sinceDate.toISOString());
        }
      } else if (!contact) {
        const cap = Math.min(
          Math.max(parseInt(String(limitParam || "500"), 10) || 500, 50),
          2000,
        );
        query = query.limit(cap);
      }

      let { data, error, count } = await query;

      const residentFilter =
        resident_id != null ? String(resident_id).trim() : "";
      if (data && residentFilter && contact) {
        const residentName = (req.query.resident_name || "").toString();
        data = filterKapchatMessagesForResident(
          data,
          residentFilter,
          residentName,
        );
        count = data.length;
      }

      if (error) throw error;

      return res.json({
        success: true,
        messages: data || [],
        totalItems: count || 0,
      });
    }

    if (req.method === "PUT") {
      const { id, contact } = req.query;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "status is required",
        });
      }

      if (contact) {
        // Bulk update for all messages in a contact thread
        const { data, error } = await supabase
          .from("kapchat_messages")
          .update({ status })
          .eq("contact", contact.trim())
          .eq("tenant_id", tenantId)
          .select();

        if (error) throw error;

        return res.json({
          success: true,
          message: `Thread status updated to ${status}`,
          updated: data,
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "id or contact is required",
        });
      }

      const { data, error } = await supabase
        .from("kapchat_messages")
        .update({ status })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: "Chat status updated",
        chat: data,
      });
    }

    if (req.method === "DELETE") {
      const { id, contact } = req.query;
      if (!id && !contact) {
        return res.status(400).json({ success: false, message: "id or contact is required" });
      }

      let query = supabase.from("kapchat_messages").delete().eq("tenant_id", tenantId);

      if (contact) {
        query = query.eq("contact", contact.trim());
      } else {
        query = query.eq("id", id);
      }

      const { error } = await query;

      if (error) throw error;
      return res.json({ success: true, message: "Chat message(s) deleted successfully" });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Error handling KapChat message:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to handle KapChat message",
    });
  }
}
