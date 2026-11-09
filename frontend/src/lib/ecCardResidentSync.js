import { joinNameParts, parseEcDisplayName } from "./personName";
import {
  generateFullAddress,
  stripHouseNoLabelFromAddress,
  cleanBarangayName,
  cleanMunicipalityName,
  cleanProvinceName,
} from "./addressHelper";

const UPPER = (v) =>
  v === undefined || v === null || v === ""
    ? v
    : String(v).trim().toUpperCase();

export function normalizeEcCardNumber(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .toUpperCase();
}

/** EC full number vs census short form (e.g. H00778M-F03753 vs H00778M-F03753-10). */
export function ecCardNumberCore(value) {
  const norm = normalizeEcCardNumber(value);
  if (!norm) return "";
  const m = norm.match(/^(H\d+M?-?F\d+)/i);
  return m ? normalizeEcCardNumber(m[1]) : norm;
}

export function ecNumbersReferToSameCard(a, b) {
  const na = normalizeEcCardNumber(a);
  const nb = normalizeEcCardNumber(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ca = ecCardNumberCore(a);
  const cb = ecCardNumberCore(b);
  if (ca && cb && ca === cb) return true;
  if (na.startsWith(nb) || nb.startsWith(na)) return true;
  return false;
}

function genderToCensusExcel(gender) {
  const g = UPPER(gender);
  if (g === "FEMALE" || g === "F") return "F";
  if (g === "MALE" || g === "M") return "M";
  return g || "";
}

function civilStatusToCensusExcel(status) {
  return UPPER(status) || "";
}

/**
 * Keep census_extras (Excel import snapshot) aligned with EC card + census columns.
 */
export function mergeCensusExtrasFromEcCard(existingExtras, card) {
  const base =
    existingExtras && typeof existingExtras === "object"
      ? JSON.parse(JSON.stringify(existingExtras))
      : { columns: {}, unnamed_columns: {} };
  if (!base.columns || typeof base.columns !== "object") base.columns = {};
  if (!base.unnamed_columns || typeof base.unnamed_columns !== "object") {
    base.unnamed_columns = {};
  }

  const parts =
    card.first_name && card.last_name
      ? {
          first_name: card.first_name,
          middle_name: card.middle_name,
          last_name: card.last_name,
          suffix: card.suffix,
        }
      : parseEcDisplayName(card.full_name);

  const fullName = UPPER(
    joinNameParts({
      first_name: parts.first_name || card.first_name,
      middle_name: parts.middle_name || card.middle_name,
      last_name: parts.last_name || card.last_name,
      suffix: parts.suffix || card.suffix,
    }),
  );

  if (parts.last_name) base.columns["LAST NAME"] = UPPER(parts.last_name);
  if (parts.first_name) base.columns["FIRST NAME"] = UPPER(parts.first_name);
  if (parts.middle_name) base.columns["MIDDLE NAME"] = UPPER(parts.middle_name);
  if (parts.suffix) base.columns.EXT = UPPER(parts.suffix);

  if (card.gender) base.columns.GENDER = genderToCensusExcel(card.gender);
  if (card.civil_status) {
    base.columns["CIVIL STATUS"] = civilStatusToCensusExcel(card.civil_status);
  }

  const dob = card.birth_date || card.date_of_birth;
  if (dob) base.columns.BIRTHDATE = String(dob).slice(0, 10);
  if (card.age != null && card.age !== "") {
    base.columns.AGE = String(card.age);
  }

  const purok =
    (card.purok && String(card.purok).trim()) ||
    extractPurokFromAddress(card.address);
  if (purok) {
    base.columns.PUROK = UPPER(purok);
    base.purok_as_in_sheet = UPPER(purok);
  }

  if (card.id_number) {
    base.columns["EC CARD NUMBER"] = String(card.id_number).trim();
  }

  if (base.unnamed_columns._col_28 !== undefined && fullName) {
    base.unnamed_columns._col_28 = fullName;
  }
  Object.keys(base.unnamed_columns).forEach((key) => {
    if (/^GENDER$/i.test(key) && card.gender) {
      base.unnamed_columns[key] = genderToCensusExcel(card.gender);
    }
    if (/^PUROK$/i.test(key) && purok) {
      base.unnamed_columns[key] = UPPER(purok);
    }
  });

  return base;
}

/** Demographic EC card PUTs should mirror into `residents`. */
export function shouldSyncEcCardEditsToResident(action) {
  if (!action || action === "update") return true;
  return !["renew", "revoke", "activate", "toggle_print"].includes(action);
}

export function applyEcCardNameFieldsToUpdates(updates, body) {
  const next = { ...updates };

  const hasStructured =
    body.first_name !== undefined ||
    body.middle_name !== undefined ||
    body.last_name !== undefined ||
    body.suffix !== undefined;

  if (hasStructured) {
    if (body.first_name !== undefined) next.first_name = UPPER(body.first_name);
    if (body.middle_name !== undefined) {
      next.middle_name = body.middle_name
        ? UPPER(body.middle_name)
        : null;
    }
    if (body.last_name !== undefined) next.last_name = UPPER(body.last_name);
    if (body.suffix !== undefined) {
      next.suffix = body.suffix ? UPPER(body.suffix) : null;
    }
    next.full_name = UPPER(
      joinNameParts({
        first_name: next.first_name,
        middle_name: next.middle_name,
        last_name: next.last_name,
        suffix: next.suffix,
      }),
    );
  } else if (body.full_name !== undefined) {
    const normalized = UPPER(body.full_name);
    next.full_name = normalized;
    const parts = parseEcDisplayName(body.full_name);
    next.first_name = parts.first_name ? UPPER(parts.first_name) : null;
    next.middle_name = parts.middle_name ? UPPER(parts.middle_name) : null;
    next.last_name = parts.last_name ? UPPER(parts.last_name) : null;
    next.suffix = parts.suffix ? UPPER(parts.suffix) : null;
  }

  return next;
}

const NAME_EC_KEYS = new Set([
  "full_name",
  "first_name",
  "middle_name",
  "last_name",
  "suffix",
]);

function ecUpdatesAffectNames(ecUpdates) {
  return Object.keys(ecUpdates).some((k) => NAME_EC_KEYS.has(k));
}

/** PUROK 3, PUROK-2A, etc. from a single address line. */
export function extractPurokFromAddress(address) {
  const text = String(address || "").trim();
  if (!text) return null;
  const m = text.match(/\bPUROK[\s.-]*([0-9]+[A-Z]?)\b/i);
  if (!m) return null;
  return `PUROK ${m[1].toUpperCase()}`;
}

/**
 * Full mirror of EC card dossier → master census (used after Edit Details save).
 */
export function buildFullResidentPatchFromEcCard(card, existingCensusExtras = null) {
  if (!card) return null;

  const patch = { updated_at: new Date().toISOString() };

  const structured =
    card.first_name && card.last_name
      ? {
          first_name: card.first_name,
          middle_name: card.middle_name,
          last_name: card.last_name,
          suffix: card.suffix,
        }
      : parseEcDisplayName(card.full_name);

  if (structured.first_name) patch.first_name = UPPER(structured.first_name);
  if (structured.last_name) patch.last_name = UPPER(structured.last_name);
  patch.middle_name = structured.middle_name
    ? UPPER(structured.middle_name)
    : card.middle_name
      ? UPPER(card.middle_name)
      : null;
  patch.suffix = structured.suffix
    ? UPPER(structured.suffix)
    : card.suffix
      ? UPPER(card.suffix)
      : null;

  if (card.gender) patch.gender = UPPER(card.gender);
  if (card.civil_status) patch.civil_status = UPPER(card.civil_status);

  const dob = card.birth_date || card.date_of_birth;
  if (dob) {
    patch.date_of_birth = dob;
    const b = new Date(dob);
    if (!Number.isNaN(b.getTime())) {
      const ageYears = Math.floor(
        (Date.now() - b.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
      );
      if (ageYears >= 0 && ageYears <= 130) patch.age = ageYears;
    }
  } else if (card.age != null && card.age !== "") {
    const n = parseInt(card.age, 10);
    if (!Number.isNaN(n)) patch.age = n;
  }

  const addr = card.address ? String(card.address).trim().toUpperCase() : "";
  if (addr) patch.residential_address = addr;

  const purok =
    (card.purok && String(card.purok).trim()) ||
    extractPurokFromAddress(addr || card.address);
  if (purok) patch.purok = UPPER(purok);

  if (card.barangay) patch.barangay = UPPER(card.barangay);
  if (card.municipality) patch.municipality = UPPER(card.municipality);
  if (card.province) patch.province = UPPER(card.province);
  if (card.contact_number) patch.contact_number = card.contact_number;
  if (card.id_number) {
    patch.ec_card_number = String(card.id_number).trim().toUpperCase();
  }

  patch.census_extras = mergeCensusExtrasFromEcCard(
    existingCensusExtras,
    card,
  );

  if (Object.keys(patch).length <= 1) return null;
  return patch;
}

/**
 * Map EC card fields → resident census columns.
 * @param {object} card — merged row after save
 * @param {object} [ecUpdates] — keys sent on this request (omit for full sync, e.g. new issue)
 */
export function buildResidentPatchFromEcCard(card, ecUpdates = null) {
  if (!card) return null;

  const patch = {
    updated_at: new Date().toISOString(),
  };

  const touch = (ecKey) =>
    ecUpdates == null || Object.prototype.hasOwnProperty.call(ecUpdates, ecKey);

  if (ecUpdates == null || ecUpdatesAffectNames(ecUpdates)) {
    if (card.first_name != null) patch.first_name = card.first_name;
    if (card.middle_name !== undefined) patch.middle_name = card.middle_name;
    if (card.last_name != null) patch.last_name = card.last_name;
    if (card.suffix !== undefined) patch.suffix = card.suffix;
  }

  if (touch("gender") && card.gender != null) {
    patch.gender = UPPER(card.gender);
  }
  if (touch("civil_status") && card.civil_status != null) {
    patch.civil_status = UPPER(card.civil_status);
  }
  if (touch("birth_date") || ecUpdates == null) {
    const dob = card.birth_date || card.date_of_birth;
    if (dob) {
      patch.date_of_birth = dob;
      const b = new Date(dob);
      if (!Number.isNaN(b.getTime())) {
        const ageYears = Math.floor(
          (Date.now() - b.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
        );
        if (ageYears >= 0 && ageYears <= 130) patch.age = ageYears;
      }
    }
  }
  if (touch("address") && card.address) {
    const addr = String(card.address).trim().toUpperCase();
    patch.residential_address = addr;
    const inferred = extractPurokFromAddress(addr);
    if (inferred && (touch("purok") || ecUpdates == null)) {
      patch.purok = UPPER(inferred);
    }
  }
  if (touch("purok") && card.purok) {
    patch.purok = UPPER(card.purok);
  }
  if (touch("id_number") && card.id_number) {
    patch.ec_card_number = String(card.id_number).trim();
  }
  if (touch("contact_number") && card.contact_number) {
    patch.contact_number = card.contact_number;
  }

  if (Object.keys(patch).length <= 1) return null;
  return patch;
}

/**
 * Mirror master census demographics → linked `barangay_ids` row(s).
 */
export function buildEcCardPatchFromResident(resident) {
  if (!resident) return null;

  const patch = { updated_at: new Date().toISOString() };

  const first = resident.first_name;
  const last = resident.last_name;
  const middle = resident.middle_name;
  const suffix = resident.suffix;

  if (first) patch.first_name = UPPER(first);
  if (last) patch.last_name = UPPER(last);
  patch.middle_name = middle ? UPPER(middle) : null;
  patch.suffix = suffix ? UPPER(suffix) : null;

  const full = joinNameParts({
    first_name: patch.first_name || first,
    middle_name: patch.middle_name ?? middle,
    last_name: patch.last_name || last,
    suffix: patch.suffix ?? suffix,
  });
  if (full) patch.full_name = UPPER(full);

  if (resident.gender) patch.gender = UPPER(resident.gender);
  if (resident.civil_status) patch.civil_status = UPPER(resident.civil_status);

  const dob = resident.date_of_birth;
  if (dob) {
    patch.birth_date = String(dob).slice(0, 10);
    const b = new Date(dob);
    if (!Number.isNaN(b.getTime())) {
      const ageYears = Math.floor(
        (Date.now() - b.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
      );
      if (ageYears >= 0 && ageYears <= 130) patch.age = ageYears;
    }
  } else if (resident.age != null && resident.age !== "") {
    const n = parseInt(resident.age, 10);
    if (!Number.isNaN(n)) patch.age = n;
  }

  const addr = resident.residential_address;
  if (addr) patch.address = UPPER(String(addr).trim());

  if (resident.purok) patch.purok = UPPER(resident.purok);
  if (resident.barangay) patch.barangay = UPPER(resident.barangay);
  if (resident.municipality) patch.municipality = UPPER(resident.municipality);
  if (resident.province) patch.province = UPPER(resident.province);

  if (Object.prototype.hasOwnProperty.call(resident, "contact_number")) {
    patch.contact_number = resident.contact_number || null;
  }

  if (resident.ec_card_number) {
    patch.id_number = String(resident.ec_card_number).trim().toUpperCase();
  }

  if (Object.keys(patch).length <= 1) return null;
  return patch;
}

/** All EC cards that should track this census resident. */
export async function findBarangayIdsForResident(supabase, tenantId, resident) {
  if (!supabase || !tenantId || !resident?.id) return [];

  const byId = new Map();

  const { data: byResident, error: byResidentErr } = await supabase
    .from("barangay_ids")
    .select("id, id_number, resident_id")
    .eq("tenant_id", tenantId)
    .eq("resident_id", resident.id);

  if (byResidentErr) throw byResidentErr;
  (byResident || []).forEach((row) => byId.set(row.id, row));

  const ecNo = String(resident.ec_card_number || "").trim();
  if (ecNo) {
    const { data: exact, error: exactErr } = await supabase
      .from("barangay_ids")
      .select("id, id_number, resident_id")
      .eq("tenant_id", tenantId)
      .eq("id_number", ecNo)
      .maybeSingle();

    if (exactErr) throw exactErr;
    if (exact) byId.set(exact.id, exact);

    if (!exact || ecNo) {
      const { data: ecRows, error: ecRowsErr } = await supabase
        .from("barangay_ids")
        .select("id, id_number, resident_id")
        .eq("tenant_id", tenantId)
        .not("id_number", "is", null)
        .limit(8000);

      if (ecRowsErr) throw ecRowsErr;
      (ecRows || []).forEach((row) => {
        if (ecNumbersReferToSameCard(ecNo, row.id_number)) {
          byId.set(row.id, row);
        }
      });
    }
  }

  return Array.from(byId.values());
}

/** Diagnose resident ↔ EC card linkage for staff UI and APIs. */
export async function getResidentEcLinkStatus(supabase, tenantId, resident) {
  if (!resident?.id) {
    return {
      linked: false,
      cardCount: 0,
      cards: [],
      issues: ["invalid_resident"],
    };
  }

  const issues = [];
  const cards = await findBarangayIdsForResident(supabase, tenantId, resident);

  const ecOnResident = String(resident.ec_card_number || "").trim();
  if (!ecOnResident) {
    issues.push("resident_missing_ec_card_number");
  }

  const detailed = cards.map((c) => {
    const row = {
      id: c.id,
      id_number: c.id_number,
      resident_id: c.resident_id,
      resident_id_matches: c.resident_id === resident.id,
      ec_number_matches: ecNumbersReferToSameCard(
        ecOnResident,
        c.id_number,
      ),
    };
    if (!row.resident_id) issues.push(`card_${c.id}_missing_resident_id`);
    else if (!row.resident_id_matches) {
      issues.push(`card_${c.id}_resident_id_mismatch`);
    }
    if (ecOnResident && !row.ec_number_matches) {
      issues.push(`card_${c.id}_ec_number_mismatch`);
    }
    return row;
  });

  if (ecOnResident && cards.length === 0) {
    issues.push("no_ec_card_row_found_for_resident_ec_number");
  }

  return {
    linked: cards.length > 0,
    cardCount: cards.length,
    cards: detailed,
    issues: [...new Set(issues)],
  };
}

/**
 * Push resident census edits to every linked EC card.
 * @returns {{ synced: number, errors: string[], cardIds: string[] }}
 */
export async function syncEcCardsFromResident(supabase, tenantId, resident) {
  const empty = { synced: 0, errors: [], cardIds: [] };
  if (!resident?.id) return empty;

  const patch = buildEcCardPatchFromResident(resident);
  if (!patch) return empty;

  let cards;
  try {
    cards = await findBarangayIdsForResident(supabase, tenantId, resident);
  } catch (e) {
    return { synced: 0, errors: [e.message || String(e)], cardIds: [] };
  }

  if (!cards.length) return empty;

  const errors = [];
  const cardIds = [];
  let synced = 0;

  for (const card of cards) {
    const rowPatch = {
      ...patch,
      resident_id: resident.id,
    };

    const { error } = await supabase
      .from("barangay_ids")
      .update(rowPatch)
      .eq("id", card.id)
      .eq("tenant_id", tenantId);

    if (error) {
      errors.push(`${card.id_number || card.id}: ${error.message}`);
    } else {
      synced += 1;
      cardIds.push(card.id);
    }
  }

  return { synced, errors, cardIds };
}

/** Resolve master census row for an EC card (fixes legacy rows missing resident_id). */
export async function resolveResidentIdForEcCard(supabase, tenantId, card) {
  if (!card || !supabase || !tenantId) return null;

  const direct =
    card.resident_id ||
    (card.resident && typeof card.resident === "object"
      ? card.resident.id
      : null);
  if (direct) return direct;

  const ecNo = String(card.id_number || "").trim();
  const ecNorm = normalizeEcCardNumber(ecNo);
  if (ecNo) {
    const { data: byEc } = await supabase
      .from("residents")
      .select("id, ec_card_number")
      .eq("tenant_id", tenantId)
      .eq("ec_card_number", ecNo)
      .maybeSingle();
    if (byEc?.id) return byEc.id;

    if (ecNorm) {
      const { data: ecRows } = await supabase
        .from("residents")
        .select("id, ec_card_number")
        .eq("tenant_id", tenantId)
        .not("ec_card_number", "is", null)
        .limit(5000);
      const hit = (ecRows || []).find((r) =>
        ecNumbersReferToSameCard(ecNo, r.ec_card_number),
      );
      if (hit?.id) return hit.id;
    }
  }

  const first = String(card.first_name || "").trim();
  const last = String(card.last_name || "").trim();
  if (first && last) {
    const { data: byName } = await supabase
      .from("residents")
      .select("id")
      .eq("tenant_id", tenantId)
      .ilike("first_name", `%${first}%`)
      .ilike("last_name", `%${last}%`)
      .limit(1)
      .maybeSingle();
    if (byName?.id) return byName.id;
  }

  const full = String(card.full_name || "").trim();
  if (full) {
    const parts = parseEcDisplayName(full);
    if (parts.first_name && parts.last_name) {
      const { data: byParsed } = await supabase
        .from("residents")
        .select("id")
        .eq("tenant_id", tenantId)
        .ilike("first_name", parts.first_name)
        .ilike("last_name", parts.last_name)
        .limit(1)
        .maybeSingle();
      if (byParsed?.id) return byParsed.id;
    }
  }

  return null;
}

function censusExtrasSnapshot(resident, key) {
  const cols = resident?.census_extras?.columns || {};
  if (cols[key] !== undefined && cols[key] !== null && String(cols[key]).trim() !== "") {
    return String(cols[key]).trim();
  }
  const un = resident?.census_extras?.unnamed_columns || {};
  for (const [k, v] of Object.entries(un)) {
    if (
      new RegExp(`^${String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i").test(
        k,
      ) &&
      v != null &&
      String(v).trim() !== ""
    ) {
      return String(v).trim();
    }
  }
  return "";
}

/** Gender from census sheet snapshot when present, else residents.gender (F/M → FEMALE/MALE). */
export function genderFromResidentRecord(resident) {
  const fromSheet = censusExtrasSnapshot(resident, "GENDER");
  const raw = fromSheet || resident?.gender || "";
  const u = String(raw).trim().toUpperCase();
  if (u === "F" || u === "FEMALE" || u.startsWith("FEM")) return "FEMALE";
  if (u === "M" || u === "MALE" || u.startsWith("MAL")) return "MALE";
  return u || "MALE";
}

export function civilStatusRawFromResidentRecord(resident) {
  const fromSheet = censusExtrasSnapshot(resident, "CIVIL STATUS");
  const direct = String(resident?.civil_status || "").trim();
  return fromSheet || direct;
}

function normalizeCivilStatusForEcForm(status) {
  const c = String(status || "").trim().toUpperCase();
  if (!c) return "SINGLE";
  if (c.includes("LEGAL") && c.includes("SEPARAT")) return "LEGALLY SEPARATED";
  if (c === "M" || c.startsWith("MARRIED")) return "MARRIED";
  if (c.startsWith("WIDOW")) return "WIDOWED";
  if (c === "S" || c.startsWith("SINGLE")) return "SINGLE";
  if (c.startsWith("SEPARAT")) return "LEGALLY SEPARATED";
  if (c.startsWith("ANNUL")) return "ANNULLED";
  return c;
}

function formatBirthDateForEcForm(resident) {
  const raw =
    resident?.date_of_birth ||
    censusExtrasSnapshot(resident, "BIRTHDATE") ||
    resident?.birth_date ||
    resident?.birthday ||
    "";
  if (!raw) return "";
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (
    !Number.isNaN(d.getTime()) &&
    d.getFullYear() >= 1900 &&
    d.getFullYear() <= 2100
  ) {
    return d.toISOString().split("T")[0];
  }
  return "";
}

/**
 * Populate EC issuance form from full master census resident (includes census_extras).
 */
export function buildEcCardFormFromResident(resident, options = {}) {
  const { defaultNextEcNo = "", generatePreviewNumber } = options;
  if (!resident) return null;

  const firstName = resident.first_name || censusExtrasSnapshot(resident, "FIRST NAME") || "";
  const middleName = resident.middle_name || censusExtrasSnapshot(resident, "MIDDLE NAME") || "";
  const lastName = resident.last_name || censusExtrasSnapshot(resident, "LAST NAME") || "";
  const suffix = resident.suffix || censusExtrasSnapshot(resident, "EXT") || "";

  const fullName =
    String(resident.full_name || "").trim() ||
    joinNameParts({
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      suffix,
    }) ||
    `${lastName}, ${firstName}`.trim();

  const purok =
    resident.census_extras?.purok_as_in_sheet ||
    censusExtrasSnapshot(resident, "PUROK") ||
    resident.purok ||
    "PUROK 1";

  const houseNumber =
    resident.house_number ||
    censusExtrasSnapshot(resident, "HOUSE NUMBER / BLOCK LOT") ||
    "";

  const builtAddress = generateFullAddress({
    house_number: houseNumber,
    purok,
    subdivision: resident.subdivision || censusExtrasSnapshot(resident, "SUBDIVISION"),
    barangay: cleanBarangayName(resident.barangay) || resident.barangay,
    municipality: cleanMunicipalityName(resident.municipality) || resident.municipality,
    province: cleanProvinceName(resident.province) || resident.province,
  });

  const fullAddress = stripHouseNoLabelFromAddress(
    String(resident.residential_address || "").trim() || builtAddress,
  );

  const ecNo =
    String(resident.ec_card_number || "").trim() ||
    (typeof generatePreviewNumber === "function"
      ? generatePreviewNumber(resident)
      : "") ||
    defaultNextEcNo;

  return {
    ec_card_no: ecNo,
    full_name: fullName,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    suffix,
    purok: String(purok).trim().toUpperCase(),
    address: fullAddress,
    gender: genderFromResidentRecord(resident),
    birth_date: formatBirthDateForEcForm(resident),
    civil_status: normalizeCivilStatusForEcForm(
      civilStatusRawFromResidentRecord(resident),
    ),
    contact_number: resident.contact_number || resident.phone_number || "",
    remarks: "Official EC Card issued",
  };
}
