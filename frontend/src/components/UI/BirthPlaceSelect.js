import { useMemo, useState, useEffect } from "react";
import phBirthplaces from "@/data/ph-birthplaces.json";
import { cn } from "@/lib/utils";

/** Normalize for matching catalog entries (does not alter stored DB values). */
export function normalizeBirthPlaceKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function findBirthPlaceInCatalog(value) {
  const key = normalizeBirthPlaceKey(value);
  if (!key) return null;
  return phBirthplaces.find((entry) => normalizeBirthPlaceKey(entry) === key) || null;
}

function parseCatalogEntry(full) {
  const idx = full.lastIndexOf(", ");
  if (idx < 0) {
    return { province: "", city: full, full };
  }
  return {
    province: full.slice(idx + 2),
    city: full.slice(0, idx),
    full,
  };
}

function titleCaseWords(text) {
  return String(text)
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part,
        )
        .join("-"),
    )
    .join(" ");
}

/** DB format: "Calumpit, bulacan" (title-case city, lowercase province). */
export function formatBirthPlaceForStorage(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const catalog = findBirthPlaceInCatalog(trimmed);
  if (catalog) {
    const { city, province } = parseCatalogEntry(catalog);
    return `${titleCaseWords(city)}, ${province.toLowerCase()}`;
  }

  const idx = trimmed.lastIndexOf(", ");
  if (idx >= 0) {
    const city = trimmed.slice(0, idx);
    const province = trimmed.slice(idx + 2);
    return `${titleCaseWords(city)}, ${province.trim().toLowerCase()}`;
  }

  return trimmed;
}

/**
 * Province first, then city/municipality (PSGC). Legacy DB values stay as "saved record".
 */
export default function BirthPlaceSelect({
  value,
  onChange,
  className,
  id,
  disabled,
}) {
  const provinceMap = useMemo(() => {
    const map = new Map();
    for (const label of phBirthplaces) {
      const { province, city, full } = parseCatalogEntry(label);
      if (!province) continue;
      if (!map.has(province)) map.set(province, []);
      map.get(province).push({ city, full });
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.city.localeCompare(b.city));
    }
    return map;
  }, []);

  const provinces = useMemo(
    () => [...provinceMap.keys()].sort((a, b) => a.localeCompare(b)),
    [provinceMap],
  );

  const catalogMatch = findBirthPlaceInCatalog(value);
  const hasLegacyValue = Boolean(value && !catalogMatch);

  const [useLegacy, setUseLegacy] = useState(hasLegacyValue);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    const match = findBirthPlaceInCatalog(value);
    if (match) {
      const parsed = parseCatalogEntry(match);
      setUseLegacy(false);
      setProvince(parsed.province);
      setCity(parsed.city);
      return;
    }
    if (value) {
      setUseLegacy(true);
      setProvince("");
      setCity("");
      return;
    }
    setUseLegacy(false);
    setProvince("");
    setCity("");
  }, [value]);

  const municipalities = province ? provinceMap.get(province) || [] : [];

  const handleProvinceChange = (nextProvince) => {
    setProvince(nextProvince);
    setCity("");
    onChange("");
  };

  const handleCityChange = (nextCity) => {
    setCity(nextCity);
    const entry = municipalities.find((m) => m.city === nextCity);
    if (!nextCity || !province) {
      onChange("");
      return;
    }
    const raw = entry?.full || `${nextCity}, ${province}`;
    onChange(formatBirthPlaceForStorage(raw));
  };

  const storedPreview =
    value && !useLegacy ? formatBirthPlaceForStorage(value) : "";

  const showPicker = !hasLegacyValue || !useLegacy;

  return (
    <div className={cn("space-y-2", className)} id={id}>
      {hasLegacyValue && (
        <div className="rounded-md border border-amber-200 bg-amber-50/80 px-2.5 py-2 space-y-1.5">
          <p className="text-[9px] font-bold text-amber-900 uppercase tracking-wide">
            Saved birth place (from records)
          </p>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name={`birthplace-mode-${id || "default"}`}
              className="mt-0.5"
              checked={useLegacy}
              disabled={disabled}
              onChange={() => {
                setUseLegacy(true);
                onChange(value);
              }}
            />
            <span className="text-xs font-semibold text-gray-900 leading-snug">
              {value}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`birthplace-mode-${id || "default"}`}
              checked={!useLegacy}
              disabled={disabled}
              onChange={() => setUseLegacy(false)}
            />
            <span className="text-[10px] font-medium text-gray-700">
              Choose from standard city / municipality list
            </span>
          </label>
        </div>
      )}

      {showPicker && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="label text-[9px]">Province</label>
            <select
              disabled={disabled}
              className="input uppercase text-xs"
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
            >
              <option value="">— Select province —</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {titleCaseWords(p)}
                </option>
              ))}
            </select>
          </div>

          <div
            className={cn(
              "transition-opacity",
              !province && "opacity-60 pointer-events-none",
            )}
          >
            <label className="label text-[9px]">
              City / municipality
              {!province && (
                <span className="text-gray-400 font-normal normal-case ml-1">
                  (select province first)
                </span>
              )}
            </label>
            <select
              disabled={disabled || !province}
              className="input uppercase text-xs"
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              <option value="">
                {province ? "— Select —" : "— Hidden until province —"}
              </option>
              {municipalities.map(({ city: cityName, full }) => (
                <option key={full} value={cityName}>
                  {titleCaseWords(cityName)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {storedPreview && (
        <p className="text-[9px] text-gray-500">
          Saved in database as:{" "}
          <span className="font-semibold text-gray-800">{storedPreview}</span>
        </p>
      )}
    </div>
  );
}
