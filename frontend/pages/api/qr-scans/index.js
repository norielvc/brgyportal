import { supabase } from "../../../lib/supabase";
import { authenticateToken } from "../../../src/lib/api-auth";

// Helper to parse complex QR scan data
const parseQRData = (data) => {
  if (!data || typeof data !== "string") return null;
  if (data.startsWith("http")) return null;

  // Pattern: ID (HXXXXX-FXXXXX)
  const idMatch = data.match(/^H\d{5}-F\d{5}/i) || data.match(/^H[a-z0-9]+-(?:F)?[a-z0-9]+/i);
  const household_id = idMatch ? idMatch[0].toUpperCase() : null;

  let remaining = data.replace(household_id || "", "").trim();

  // Pattern: Remarks (Starts with GOODS RECD)
  const remarksStart = remaining.indexOf("GOODS RECD");
  let remarks = null;
  if (remarksStart !== -1) {
    remarks = remaining.substring(remarksStart).trim();
    remaining = remaining.substring(0, remarksStart).trim();
  }

  // Pattern: Address
  const addressMarkers = [
    "SITIO",
    "BLOCK",
    "LOT",
    "PUROK",
    "PHASE",
    "ST.",
    "AVE.",
    "ZONE",
  ];
  let addressStart = -1;
  const upperRemaining = remaining.toUpperCase();

  for (const marker of addressMarkers) {
    const termPos = upperRemaining.indexOf(marker);
    if (termPos !== -1 && (addressStart === -1 || termPos < addressStart)) {
      addressStart = termPos;
    }
  }

  let name = null;
  let address = null;

  if (addressStart !== -1) {
    name = remaining.substring(0, addressStart).trim();
    address = remaining.substring(addressStart).trim();
  } else {
    name = remaining || null;
  }

  return {
    household_id,
    name: name ? name.replace(/\s+/g, " ") : null,
    address: address ? address.replace(/\s+/g, " ") : null,
    remarks,
  };
};

/**
 * Strict Lookup: Find active/valid Barangay ID record linked to resident
 */
async function findValidBarangayID(supabaseClient, tenantId, rawQR) {
  if (!rawQR || typeof rawQR !== "string") return null;
  const trimmed = rawQR.trim();

  const candidates = new Set();
  candidates.add(trimmed);

  // Extract ID pattern (e.g. H00001-F00001, H00001, etc.)
  const idMatch = trimmed.match(/H\d{5}-F\d{5}/i) || trimmed.match(/H[a-z0-9]+-(?:F)?[a-z0-9]+/i);
  if (idMatch) candidates.add(idMatch[0].toUpperCase());

  // If JSON format
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.id_number) candidates.add(String(parsed.id_number).trim());
      if (parsed.id) candidates.add(String(parsed.id).trim());
      if (parsed.reference_number) candidates.add(String(parsed.reference_number).trim());
      if (parsed.household_id) candidates.add(String(parsed.household_id).trim());
    } catch (_) {}
  }

  // If URL format
  if (trimmed.startsWith("http")) {
    try {
      const url = new URL(trimmed);
      const token = url.searchParams.get("token") || url.searchParams.get("ref") || url.searchParams.get("id");
      if (token) candidates.add(token.trim());
    } catch (_) {}
  }

  const candidateList = Array.from(candidates).filter(Boolean);

  // 1. Direct Search in `barangay_ids` table by id_number or qr_code_data
  for (const cand of candidateList) {
    try {
      const { data, error } = await supabaseClient
        .from("barangay_ids")
        .select("*, resident:residents(*)")
        .eq("tenant_id", tenantId)
        .or(`id_number.ilike.${cand},qr_code_data.ilike.${cand}`);

      if (!error && data && data.length > 0) {
        return data[0];
      }

      // Check UUID format (id or resident_id)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cand);
      if (isUUID) {
        const { data: uuidData } = await supabaseClient
          .from("barangay_ids")
          .select("*, resident:residents(*)")
          .eq("tenant_id", tenantId)
          .or(`id.eq.${cand},resident_id.eq.${cand}`);

        if (uuidData && uuidData.length > 0) {
          return uuidData[0];
        }
      }
    } catch (e) {
      console.warn("Lookup barangay_ids candidate error:", e);
    }
  }

  // 2. Fallback: Search `residents` table by household_id or id, then see if they have an issued barangay_id
  for (const cand of candidateList) {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cand);
      let resQuery = supabaseClient
        .from("residents")
        .select("id, household_id, first_name, last_name")
        .eq("tenant_id", tenantId);

      if (isUUID) {
        resQuery = resQuery.or(`id.eq.${cand},household_id.ilike.${cand}`);
      } else {
        resQuery = resQuery.ilike("household_id", cand);
      }

      const { data: residents } = await resQuery;
      if (residents && residents.length > 0) {
        for (const r of residents) {
          const { data: idData } = await supabaseClient
            .from("barangay_ids")
            .select("*, resident:residents(*)")
            .eq("tenant_id", tenantId)
            .eq("resident_id", r.id);

          if (idData && idData.length > 0) {
            return idData[0];
          }
        }
      }
    } catch (e) {
      console.warn("Lookup residents candidate fallback error:", e);
    }
  }

  return null;
}

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return; // Auth handled response

  const tenantId = req.headers["x-tenant-id"] || user.tenant_id;
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  if (req.method === "GET") {
    try {
      const { page = 1, limit = 20, date, qr_data, event_id } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("qr_scans")
        .select(
          `
          *,
          users:scanned_by(id, email, first_name, last_name)
        `,
          { count: "exact" },
        )
        .eq("tenant_id", tenantId)
        .order("scan_timestamp", { ascending: false });

      if (event_id) {
        query = query.eq("event_id", event_id);
      }

      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query = query
          .gte("scan_timestamp", startDate.toISOString())
          .lt("scan_timestamp", endDate.toISOString());
      }

      if (qr_data) {
        query = query.or(
          `qr_data.ilike.%${qr_data}%,parsed_household_id.ilike.%${qr_data}%,parsed_name.ilike.%${qr_data}%,parsed_address.ilike.%${qr_data}%,parsed_remarks.ilike.%${qr_data}%`,
        );
      }

      query = query.range(offset, offset + parseInt(limit) - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      res.status(200).json({
        success: true,
        data: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil((count || 0) / parseInt(limit)),
        },
      });
    } catch (err) {
      console.error("Fetch scans error:", err);
      res.status(500).json({ success: false, error: "Failed to fetch scan logs" });
    }
  } else if (req.method === "POST") {
    try {
      const { qr_data, scan_timestamp, scanner_type, device_info, event_id, allow_duplicates } =
        req.body;
      const parsedData = parseQRData(qr_data);

      if (!qr_data || !scan_timestamp) {
        return res
          .status(400)
          .json({ success: false, error: "QR data and scan timestamp are required" });
      }

      // ── 1. STRICT BARANGAY ID VALIDATION ────────────────────────────
      // Only residents with an active, issued Barangay ID are valid for scanning.
      const validID = await findValidBarangayID(supabase, tenantId, qr_data);

      if (!validID) {
        return res.status(422).json({
          success: false,
          isInvalid: true,
          error: "Invalid QR Code: Resident does not have an issued Barangay ID.",
          message: "No active Barangay ID found for this code. Only residents with an officially issued Barangay ID can be scanned.",
        });
      }

      if (validID.status === "revoked") {
        return res.status(422).json({
          success: false,
          isInvalid: true,
          error: "Revoked Barangay ID",
          message: `The Barangay ID (${validID.id_number}) for ${validID.full_name} has been revoked and cannot be used.`,
        });
      }

      if (validID.status === "expired" || (validID.expiry_date && new Date(validID.expiry_date) < new Date())) {
        return res.status(422).json({
          success: false,
          isInvalid: true,
          error: "Expired Barangay ID",
          message: `The Barangay ID (${validID.id_number}) for ${validID.full_name} has expired. Please renew the ID card.`,
        });
      }

      // ── 2. DUPLICATE CHECK (SCOPED TO ACTIVE EVENT & TENANT) ─────────
      let duplicateQuery = supabase
        .from("qr_scans")
        .select(`
          *,
          users:scanned_by(first_name, last_name)
        `)
        .eq("tenant_id", tenantId);

      if (event_id) {
        duplicateQuery = duplicateQuery.eq("event_id", event_id);
      }

      // Match either the exact QR payload or the resident's official ID Number
      duplicateQuery = duplicateQuery.or(`qr_data.eq.${qr_data},parsed_household_id.eq.${validID.id_number}`);

      const { data: existingScan } = await duplicateQuery.maybeSingle();

      const residentPayload = {
        id: validID.id,
        id_number: validID.id_number,
        full_name: validID.full_name,
        first_name: validID.first_name,
        last_name: validID.last_name,
        address: validID.address,
        purok: validID.purok,
        barangay: validID.barangay,
        photo_url: validID.photo_url || validID.resident?.photo_url || null,
        status: validID.status,
        birth_date: validID.birth_date,
        age: validID.age,
        contact_number: validID.contact_number,
        emergency_contact_name: validID.emergency_contact_name,
        emergency_contact_number: validID.emergency_contact_number,
      };

      if (existingScan && !allow_duplicates) {
        const scannerName = existingScan.users 
          ? `${existingScan.users.first_name || ""} ${existingScan.users.last_name || ""}`.trim()
          : "Authorized Staff";

        return res.status(409).json({
          success: false,
          isDuplicate: true,
          message: `Resident ${validID.full_name} (${validID.id_number}) has already been scanned for this event.`,
          existingScan: {
            ...existingScan,
            scanned_by_name: scannerName
          },
          resident: residentPayload,
        });
      }

      // ── 3. INSERT VERIFIED SCAN RECORD ──────────────────────────────
      const officialAddress = validID.address || [validID.purok, validID.barangay].filter(Boolean).join(", ");
      const officialRemarks = parsedData?.remarks || `Verified ID: ${validID.id_number} (${validID.status.toUpperCase()})`;

      const { data: newScan, error: insertError } = await supabase
        .from("qr_scans")
        .insert([
          {
            qr_data,
            scan_timestamp: new Date(scan_timestamp).toISOString(),
            scanner_type: scanner_type || "mobile",
            device_info: device_info || {},
            scanned_by: user.id || user._id,
            event_id: event_id || null,
            tenant_id: tenantId,
            parsed_household_id: validID.id_number,
            parsed_name: validID.full_name,
            parsed_address: officialAddress,
            parsed_remarks: officialRemarks,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      res.status(201).json({
        success: true,
        data: newScan,
        resident: residentPayload,
        message: `Verified: ${validID.full_name} (${validID.id_number})`,
      });
    } catch (err) {
      console.error("Post scan error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to record scan" });
    }
  } else if (req.method === "DELETE") {
    try {
      const { event_id } = req.query;
      let deleteQuery = supabase
        .from("qr_scans")
        .delete()
        .eq("tenant_id", tenantId)
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all matching

      if (event_id) deleteQuery = deleteQuery.eq("event_id", event_id);

      const { error } = await deleteQuery;
      if (error) throw error;

      res.status(200).json({ success: true, message: "Scan history cleared successfully" });
    } catch (err) {
      console.error("Delete error:", err);
      res.status(500).json({ success: false, error: "Failed to clear scan history" });
    }
  } else {
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
}
