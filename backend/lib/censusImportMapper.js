const crypto = require("crypto");
const {
  generateFullAddress,
  getSubdivisionInfo,
  normalizePurok,
  normalizeSubdivisionRaw,
} = require("./censusAddress");

const DEFAULT_ADDRESS = {
  barangay: "IBA O' ESTE",
  municipality: "CALUMPIT",
  province: "Province of Bulacan",
};

const HEADER_ALIASES = {
  "SENIOR CITIZEN ": "SENIOR CITIZEN",
};

function trimStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function upperName(v) {
  return trimStr(v).toUpperCase();
}

function parseBool(v) {
  if (v === null || v === undefined || v === "") return false;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (["true", "yes", "y", "1", "x"].includes(s)) return true;
  if (["false", "no", "n", "0"].includes(s)) return false;
  return Boolean(v);
}

/**
 * Excel / ISO date → YYYY-MM-DD (Philippines calendar day; avoids UTC −1 day)
 */
function parseBirthdate(val) {
  if (val === null || val === undefined || val === "") return null;

  if (val instanceof Date && !isNaN(val.getTime())) {
    const local = new Date(val.getTime() + 8 * 60 * 60 * 1000);
    return local.toISOString().slice(0, 10);
  }

  if (typeof val === "number" && !isNaN(val)) {
    const utcDays = Math.floor(val - 25569);
    const ms = utcDays * 86400 * 1000;
    const d = new Date(ms);
    const local = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    return local.toISOString().slice(0, 10);
  }

  const s = trimStr(val);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const local = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    return local.toISOString().slice(0, 10);
  }
  return null;
}

function parseAge(val, dob) {
  if (val !== null && val !== undefined && val !== "") {
    const n = parseInt(String(val), 10);
    if (!isNaN(n)) return n;
  }
  if (dob) {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }
  return null;
}

function residentUuid(tenantId, censusNumber) {
  const hash = crypto
    .createHash("sha256")
    .update(`${tenantId}:census2026:${censusNumber}`)
    .digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    "a" + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

function pickEcNumber(rowByHeader, colExtras) {
  const fromHeader = trimStr(rowByHeader["EC CARD NUMBER"]);
  const c30 = trimStr(colExtras.col_30_ec);
  const c29 = trimStr(colExtras.col_29_ec);
  const c31 = trimStr(colExtras.col_31_ec);
  const candidates = [c30, c29, fromHeader, c31].filter(Boolean);
  for (const c of candidates) {
    if (/^H\d+M?-F\d+$/i.test(c)) return c.toUpperCase();
  }
  return candidates[0] ? candidates[0].toUpperCase() : null;
}

function buildRowRecord(headers, row, tenantId, ecFileByResidentNumber, importMeta) {
  const rowByHeader = {};
  headers.forEach((h, i) => {
    let key = trimStr(h) || `_col_${i}`;
    if (HEADER_ALIASES[key]) key = HEADER_ALIASES[key];
    rowByHeader[key] = row[i];
  });

  const col28 = row[28];
  const col29 = row[29];
  const col30 = row[30];
  const col31 = row[31];

  const censusNumber =
    trimStr(rowByHeader["RESIDENT NUMBER"]) ||
    trimStr(rowByHeader["SR NUMBER"]);
  if (!censusNumber) return null;

  const lastName = upperName(rowByHeader["LAST NAME"]);
  const firstName = upperName(rowByHeader["FIRST NAME"]);
  if (!lastName && !firstName) return null;

  const middleName = upperName(rowByHeader["MIDDLE NAME"]);
  const suffix = upperName(rowByHeader["EXT"]);
  const dob = parseBirthdate(rowByHeader["BIRTHDATE"]);
  const age = parseAge(rowByHeader["AGE"], dob);

  const houseNumber = upperName(rowByHeader["HOUSE NUMBER / BLOCK LOT"]);
  const purokRaw = normalizePurok(rowByHeader["PUROK"]);
  const subdivisionRaw = normalizeSubdivisionRaw(rowByHeader["SUBDIVISION"]);
  const subInfo = getSubdivisionInfo(subdivisionRaw || purokRaw);

  const storedPurok = subInfo ? subInfo.parentPurok : purokRaw || null;
  const subdivision = subInfo
    ? subInfo.subdivision
    : subdivisionRaw
      ? subdivisionRaw.toUpperCase()
      : null;

  const residential_address = generateFullAddress({
    house_number: houseNumber,
    purok: storedPurok,
    subdivision,
    ...DEFAULT_ADDRESS,
  });

  let ecCard = pickEcNumber(rowByHeader, {
    col_29_ec: col29,
    col_30_ec: col30,
    col_31_ec: col31,
  });
  if (!ecCard && ecFileByResidentNumber && ecFileByResidentNumber.has(censusNumber)) {
    ecCard = ecFileByResidentNumber.get(censusNumber);
  }

  const id = residentUuid(tenantId, censusNumber);

  const censusExtras = {
    import_source: importMeta.sourceFile,
    imported_at: importMeta.importedAt,
    sheet: importMeta.sheet,
    columns: { ...rowByHeader },
    unnamed_columns: {
      col_28_display_name: col28,
      col_29_ec: col29,
      col_30_ec: col30,
      col_31_ec: col31,
    },
    purok_as_in_sheet: rowByHeader["PUROK"],
    subdivision_as_in_sheet: rowByHeader["SUBDIVISION"],
  };

  const resident = {
    id,
    tenant_id: tenantId,
    census_resident_number: censusNumber,
    last_name: lastName,
    first_name: firstName,
    middle_name: middleName || null,
    suffix: suffix || null,
    date_of_birth: dob,
    age,
    place_of_birth: trimStr(rowByHeader["BIRTH PLACE"]) || null,
    gender: upperName(rowByHeader["GENDER"]) || null,
    civil_status: upperName(rowByHeader["CIVIL STATUS"]) || null,
    house_number: houseNumber || null,
    purok: storedPurok,
    subdivision,
    barangay: DEFAULT_ADDRESS.barangay,
    municipality: DEFAULT_ADDRESS.municipality,
    province: DEFAULT_ADDRESS.province,
    residential_address,
    contact_number: trimStr(rowByHeader["CONTACT NO."]) || null,
    is_household_head: parseBool(rowByHeader["HOUSE HOLD HEAD"]),
    is_head_of_family: parseBool(rowByHeader["HEAD OF THE FAMILY"]),
    is_senior: parseBool(rowByHeader["SENIOR CITIZEN"]),
    is_pwd: parseBool(rowByHeader["PWD"]),
    is_solo_parent: parseBool(rowByHeader["SOLO PARENT"]),
    is_registered_voter: parseBool(rowByHeader["REGISTERED VOTER"]),
    residency_type:
      trimStr(
        rowByHeader[
          "KIND OF RESIDENCY (OWN HOUSE, RENTED, REGISTERED VOTER BUT  RESIDING OUTSIDE IBA O' ESTE)"
        ],
      ) || null,
    occupation:
      trimStr(
        rowByHeader["OCCUPATION/ SOURCE OF INCOME/ STUDENT (GRADE)"],
      ) || null,
    monthly_salary:
      trimStr(rowByHeader["MONTHLY SALARY (house hold head only)"]) || null,
    relation_to_household_head:
      trimStr(rowByHeader["RELATION TO HOUSEHOLD HEAD"]) || null,
    religion: trimStr(rowByHeader["RELIGION"]) || null,
    household_head_name: upperName(rowByHeader["HOUSE HOLD HEAD NAME"]) || null,
    family_number:
      trimStr(rowByHeader["FAMILY NUMBER (IN 1 HOUSEHOLD)"]) ||
      trimStr(rowByHeader["FAMILY NUMBER(IN 1 HOUSE HOLD)"]) ||
      null,
    volunteer: trimStr(rowByHeader["VOLUNTEER"]) || null,
    census_notes: trimStr(rowByHeader["NOTES"]) || null,
    ec_card_number: ecCard,
    census_extras: censusExtras,
    pending_case: false,
    is_deceased: false,
    household_head_id: null,
  };

  return { resident, ecCard };
}

function householdGroupKey(r) {
  const head = (r.household_head_name || "").trim();
  const fam = (r.family_number || "").trim();
  const house = (r.house_number || "").trim();
  const purok = (r.purok || "").trim();
  return [head, fam, house, purok].join("|").toUpperCase();
}

function buildBarangayIdRow(resident, ecCard) {
  const fullName = [
    resident.first_name,
    resident.middle_name,
    resident.last_name,
    resident.suffix,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  return {
    tenant_id: resident.tenant_id,
    resident_id: resident.id,
    id_number: ecCard,
    full_name: fullName,
    first_name: resident.first_name,
    last_name: resident.last_name,
    middle_name: resident.middle_name,
    suffix: resident.suffix,
    birth_date: resident.date_of_birth,
    age: resident.age,
    gender: resident.gender,
    civil_status: resident.civil_status,
    address: resident.residential_address || fullName,
    purok: resident.purok,
    barangay: resident.barangay,
    municipality: resident.municipality,
    province: resident.province,
    contact_number: resident.contact_number,
    status: "active",
  };
}

function resolveEcForStoredResident(resident) {
  const un = resident?.census_extras?.unnamed_columns || {};
  return pickEcNumber(
    { "EC CARD NUMBER": resident?.ec_card_number },
    {
      col_29_ec: un.col_29_ec,
      col_30_ec: un.col_30_ec,
      col_31_ec: un.col_31_ec,
    },
  );
}

module.exports = {
  buildRowRecord,
  householdGroupKey,
  buildBarangayIdRow,
  parseBirthdate,
  resolveEcForStoredResident,
};
