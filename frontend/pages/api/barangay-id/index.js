import { authenticateToken } from "../../../src/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  const userRes = await authenticateToken(req, res);
  if (!userRes) return;

  const tenantId = userRes.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "No tenant context in token" });
  }

  const supabase = getSupabase();

  // ── GET: List Barangay IDs with filters and stats ──────────────────────────
  if (req.method === "GET") {
    try {
      const { search = "", status = "", limit = 50, page = 1 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      // Fetch all IDs for tenant
      let query = supabase
        .from("barangay_ids")
        .select("*, resident:residents(*)", { count: "exact" })
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (search && search.trim()) {
        const term = search.trim();
        query = query.or(`full_name.ilike.%${term}%,id_number.ilike.%${term}%,purok.ilike.%${term}%`);
      }

      const { data, count, error } = await query.range(offset, offset + parseInt(limit, 10) - 1);

      if (error) {
        // If table doesn't exist yet in Supabase, return graceful empty list with hint
        if (error.code === "42P01") {
          return res.status(200).json({
            success: true,
            data: [],
            total: 0,
            stats: { total: 0, active: 0, expired: 0, revoked: 0 },
            tableNeedsCreation: true,
          });
        }
        throw error;
      }

      // Calculate stats
      const { data: allStats } = await supabase
        .from("barangay_ids")
        .select("status, expiry_date")
        .eq("tenant_id", tenantId);

      const now = new Date();
      let activeCount = 0;
      let expiredCount = 0;
      let revokedCount = 0;
      let expiringSoonCount = 0;

      if (allStats) {
        allStats.forEach((item) => {
          if (item.status === "revoked") {
            revokedCount++;
          } else if (item.status === "expired" || (item.expiry_date && new Date(item.expiry_date) < now)) {
            expiredCount++;
          } else {
            activeCount++;
            if (item.expiry_date) {
              const exp = new Date(item.expiry_date);
              const daysLeft = (exp - now) / (1000 * 60 * 60 * 24);
              if (daysLeft >= 0 && daysLeft <= 30) expiringSoonCount++;
            }
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: data || [],
        total: count || 0,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil((count || 0) / parseInt(limit, 10)),
        stats: {
          total: allStats ? allStats.length : 0,
          active: activeCount,
          expired: expiredCount,
          revoked: revokedCount,
          expiringSoon: expiringSoonCount,
        },
      });
    } catch (error) {
      console.error("GET /api/barangay-id error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── POST: Issue New Barangay ID (Registered Resident only) ───────────────
  if (req.method === "POST") {
    try {
      const {
        resident_id,
        blood_type,
        emergency_contact_name,
        emergency_contact_relation,
        emergency_contact_number,
        emergency_contact_address,
        precinct_no,
        tin_no,
        sss_no,
        philhealth_no,
        contact_number,
        photo_url,
        cardholder_signature_url,
        captain_signature_url,
        validity_years = 1,
        issue_date,
        remarks,
      } = req.body;

      if (!resident_id) {
        return res.status(400).json({
          success: false,
          message: "Resident ID is required. Barangay IDs can only be issued to registered residents in the Master Census.",
        });
      }

      // 1. Strict Verification: Resident must exist in Master Census for this tenant
      const { data: resident, error: residentError } = await supabase
        .from("residents")
        .select("*")
        .eq("id", resident_id)
        .eq("tenant_id", tenantId)
        .single();

      if (residentError || !resident) {
        return res.status(404).json({
          success: false,
          message: "Selected resident not found in Master Census records. Please ensure resident is registered first.",
        });
      }

      // 2. Generate Unique Barangay ID Number (e.g. BID-IBA-2026-0001)
      const currentYear = new Date().getFullYear();
      const tenantPrefix = (tenantId || "BRGY").substring(0, 4).toUpperCase();
      
      const { count: existingCount } = await supabase
        .from("barangay_ids")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      const sequence = String((existingCount || 0) + 1).padStart(4, "0");
      const idNumber = `BID-${tenantPrefix}-${currentYear}-${sequence}`;

      // 3. Compute Dates
      const startIssueDate = issue_date ? new Date(issue_date) : new Date();
      const expDate = new Date(startIssueDate);
      expDate.setFullYear(expDate.getFullYear() + parseInt(validity_years || 1, 10));

      const fullName = [resident.first_name, resident.middle_name, resident.last_name, resident.suffix]
        .filter(Boolean)
        .join(" ");

      const fullAddress = [resident.house_number, resident.purok, resident.barangay, resident.municipality, resident.province]
        .filter(Boolean)
        .join(", ");

      const qrPayload = JSON.stringify({
        id_number: idNumber,
        resident_id: resident.id,
        name: fullName,
        tenant_id: tenantId,
        valid_until: expDate.toISOString().split("T")[0],
      });

      // 4. Insert into database
      const insertData = {
        tenant_id: tenantId,
        resident_id: resident.id,
        id_number: idNumber,
        full_name: fullName,
        first_name: resident.first_name,
        last_name: resident.last_name,
        middle_name: resident.middle_name || null,
        suffix: resident.suffix || null,
        gender: resident.gender || null,
        civil_status: resident.civil_status || null,
        birth_date: resident.birth_date || null,
        age: resident.age || null,
        blood_type: blood_type || resident.blood_type || "N/A",
        address: fullAddress || "Barangay Jurisdiction",
        purok: resident.purok || null,
        barangay: resident.barangay || null,
        municipality: resident.municipality || null,
        province: resident.province || null,
        precinct_no: precinct_no || resident.precinct_no || null,
        tin_no: tin_no || null,
        sss_no: sss_no || null,
        philhealth_no: philhealth_no || null,
        contact_number: contact_number || resident.contact_number || resident.phone_number || null,
        emergency_contact_name: emergency_contact_name || resident.emergency_contact_name || null,
        emergency_contact_relation: emergency_contact_relation || resident.emergency_contact_relationship || null,
        emergency_contact_number: emergency_contact_number || resident.emergency_contact_phone || null,
        emergency_contact_address: emergency_contact_address || null,
        photo_url: photo_url || resident.photo_url || null,
        cardholder_signature_url: cardholder_signature_url || null,
        captain_signature_url: captain_signature_url || null,
        qr_code_data: qrPayload,
        status: "active",
        issue_date: startIssueDate.toISOString().split("T")[0],
        expiry_date: expDate.toISOString().split("T")[0],
        issued_by: userRes.id || null,
        issued_by_name: `${userRes.first_name || ""} ${userRes.last_name || ""}`.trim() || userRes.email,
        remarks: remarks || "Officially verified resident ID",
      };

      const { data: newID, error: insertError } = await supabase
        .from("barangay_ids")
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      return res.status(201).json({
        success: true,
        message: `Barangay ID ${idNumber} successfully issued for ${fullName}!`,
        data: newID,
      });
    } catch (error) {
      console.error("POST /api/barangay-id error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
