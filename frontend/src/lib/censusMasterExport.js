export const CENSUS_MASTER_HEADERS = [
  "RESIDENT NUMBER",
  "LAST NAME",
  "FIRST NAME",
  "MIDDLE NAME",
  "EXT",
  "BIRTHDATE",
  "AGE",
  "HOUSE NUMBER / BLOCK LOT",
  "PUROK",
  "SUBDIVISION",
  "BIRTH PLACE",
  "GENDER",
  "CIVIL STATUS",
  "HOUSE HOLD HEAD",
  "HEAD OF THE FAMILY",
  "SENIOR CITIZEN ",
  "PWD",
  "SOLO PARENT",
  "REGISTERED VOTER",
  "KIND OF RESIDENCY (OWN HOUSE, RENTED, REGISTERED VOTER BUT  RESIDING OUTSIDE IBA O' ESTE)",
  "OCCUPATION/ SOURCE OF INCOME/ STUDENT (GRADE)",
  "MONTHLY SALARY (house hold head only)",
  "RELATION TO HOUSEHOLD HEAD",
  "RELIGION",
  "CONTACT NO.",
  "HOUSE HOLD HEAD NAME",
  "FAMILY NUMBER (IN 1 HOUSEHOLD)",
  "VOLUNTEER",
  "",
  "",
  "",
  "EC CARD NUMBER",
  "NOTES",
];

export const RESIDENT_CENSUS_EXPORT_SELECT =
  "id, census_resident_number, first_name, last_name, middle_name, suffix, date_of_birth, age, house_number, purok, subdivision, place_of_birth, gender, civil_status, contact_number, is_household_head, is_head_of_family, is_senior, is_pwd, is_solo_parent, is_registered_voter, residency_type, occupation, monthly_salary, relation_to_household_head, religion, household_head_name, family_number, volunteer, census_notes, ec_card_number, census_extras";

function blank(value) {
  if (value === null || value === undefined) return "";
  return value;
}

function snapshot(resident, key) {
  const cols = resident.census_extras?.columns || {};
  if (cols[key] !== undefined && cols[key] !== null && cols[key] !== "") {
    return cols[key];
  }
  const trimmed = key.trim();
  if (trimmed && cols[trimmed] !== undefined && cols[trimmed] !== null && cols[trimmed] !== "") {
    return cols[trimmed];
  }
  return "";
}

function boolCell(resident, header, field) {
  const saved = snapshot(resident, header);
  if (saved !== "") return saved;
  if (resident[field] === true) return true;
  if (resident[field] === false) return false;
  return "";
}

export function residentToCensusMasterRow(resident) {
  const un = resident.census_extras?.unnamed_columns || {};
  const birth = snapshot(resident, "BIRTHDATE") || resident.date_of_birth || "";
  return [
    blank(resident.census_resident_number || snapshot(resident, "RESIDENT NUMBER")),
    blank(resident.last_name || snapshot(resident, "LAST NAME")),
    blank(resident.first_name || snapshot(resident, "FIRST NAME")),
    blank(resident.middle_name || snapshot(resident, "MIDDLE NAME")),
    blank(resident.suffix || snapshot(resident, "EXT")),
    blank(birth),
    blank(resident.age ?? snapshot(resident, "AGE")),
    blank(resident.house_number || snapshot(resident, "HOUSE NUMBER / BLOCK LOT")),
    blank(
      resident.census_extras?.purok_as_in_sheet ||
        snapshot(resident, "PUROK") ||
        resident.purok,
    ),
    blank(
      resident.census_extras?.subdivision_as_in_sheet ||
        snapshot(resident, "SUBDIVISION") ||
        resident.subdivision,
    ),
    blank(resident.place_of_birth || snapshot(resident, "BIRTH PLACE")),
    blank(resident.gender || snapshot(resident, "GENDER")),
    blank(resident.civil_status || snapshot(resident, "CIVIL STATUS")),
    boolCell(resident, "HOUSE HOLD HEAD", "is_household_head"),
    boolCell(resident, "HEAD OF THE FAMILY", "is_head_of_family"),
    boolCell(resident, "SENIOR CITIZEN ", "is_senior"),
    boolCell(resident, "PWD", "is_pwd"),
    boolCell(resident, "SOLO PARENT", "is_solo_parent"),
    boolCell(resident, "REGISTERED VOTER", "is_registered_voter"),
    blank(
      resident.residency_type ||
        snapshot(
          resident,
          "KIND OF RESIDENCY (OWN HOUSE, RENTED, REGISTERED VOTER BUT  RESIDING OUTSIDE IBA O' ESTE)",
        ),
    ),
    blank(
      resident.occupation ||
        snapshot(resident, "OCCUPATION/ SOURCE OF INCOME/ STUDENT (GRADE)"),
    ),
    blank(
      resident.monthly_salary ||
        snapshot(resident, "MONTHLY SALARY (house hold head only)"),
    ),
    blank(
      resident.relation_to_household_head ||
        snapshot(resident, "RELATION TO HOUSEHOLD HEAD"),
    ),
    blank(resident.religion || snapshot(resident, "RELIGION")),
    blank(resident.contact_number || snapshot(resident, "CONTACT NO.")),
    blank(
      resident.household_head_name || snapshot(resident, "HOUSE HOLD HEAD NAME"),
    ),
    blank(
      resident.family_number || snapshot(resident, "FAMILY NUMBER (IN 1 HOUSEHOLD)"),
    ),
    blank(resident.volunteer || snapshot(resident, "VOLUNTEER")),
    blank(un.col_28_display_name),
    blank(un.col_29_ec),
    blank(un.col_30_ec),
    blank(resident.ec_card_number || snapshot(resident, "EC CARD NUMBER")),
    blank(resident.census_notes || snapshot(resident, "NOTES")),
  ];
}

export function censusResidentSortKey(resident) {
  const raw = String(resident.census_resident_number || "");
  const num = parseInt(raw.replace(/\D/g, ""), 10);
  return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
}

export function censusExportFileName(resident) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const sr = String(resident?.census_resident_number || "")
    .replace(/[^\w-]+/g, "")
    .slice(0, 12);
  const name = [resident?.last_name, resident?.first_name]
    .filter(Boolean)
    .join("-")
    .replace(/[^\w-]+/gi, "")
    .slice(0, 40);
  const tag = sr || name || "resident";
  return `Census-2026-${tag}-${dateStr}.xlsx`;
}
