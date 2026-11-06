function parseRequestDetails(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }
  return raw && typeof raw === "object" ? raw : {};
}

function firstNonEmpty(...values) {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
}

/**
 * Fill missing certificate_request demographic columns from details JSON,
 * linked resident, or portal snapshot fields (does not overwrite non-empty request values).
 */
export function mergeResidentDemographicsOntoCertificate(cert) {
  if (!cert) return cert;

  const details = parseRequestDetails(cert.details);
  const r = cert.residents;

  const sex = firstNonEmpty(
    cert.sex,
    details.sex,
    details.gender,
    r?.gender,
    r?.sex,
  );
  const civil_status = firstNonEmpty(
    cert.civil_status,
    details.civil_status,
    details.civilStatus,
    r?.civil_status,
  );
  const place_of_birth = firstNonEmpty(
    cert.place_of_birth,
    details.place_of_birth,
    details.placeOfBirth,
    r?.place_of_birth,
  );
  const date_of_birth = firstNonEmpty(
    cert.date_of_birth,
    details.date_of_birth,
    details.dateOfBirth,
    r?.date_of_birth,
  );

  let age = cert.age;
  if (age === null || age === undefined || age === "") {
    age = details.age ?? r?.age ?? age;
  }

  return {
    ...cert,
    ...(sex ? { sex: sex.toUpperCase() } : {}),
    ...(civil_status ? { civil_status: civil_status.toUpperCase() } : {}),
    ...(place_of_birth ? { place_of_birth } : {}),
    ...(date_of_birth ? { date_of_birth } : {}),
    ...(age !== null && age !== undefined && age !== ""
      ? { age }
      : {}),
  };
}
