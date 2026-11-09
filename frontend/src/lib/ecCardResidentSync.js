import { joinNameParts, parseEcDisplayName } from "./personName";

const UPPER = (v) =>
  v === undefined || v === null || v === ""
    ? v
    : String(v).trim().toUpperCase();

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
  if (touch("birth_date")) {
    const dob = card.birth_date || card.date_of_birth;
    if (dob) patch.date_of_birth = dob;
  }
  if (touch("address") && card.address) {
    patch.residential_address = card.address;
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
