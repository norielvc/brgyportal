import { parseCensusResidentNumberNumeric } from "./censusResidentNumber";

/**
 * Scan tenant residents for the highest numeric census_resident_number.
 */
export async function fetchMaxCensusResidentNumber(supabase, tenantId) {
  let max = -1;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("residents")
      .select("census_resident_number")
      .eq("tenant_id", tenantId)
      .not("census_resident_number", "is", null)
      .neq("census_resident_number", "")
      .order("id", { ascending: true })
      .range(from, from + 999);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      const n = parseCensusResidentNumberNumeric(row.census_resident_number);
      if (n != null && n > max) max = n;
    }

    if (data.length < 1000) break;
    from += 1000;
  }

  return max < 0 ? null : max;
}
