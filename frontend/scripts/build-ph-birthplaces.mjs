/**
 * Builds src/data/ph-birthplaces.json from @ianlabicani/geoph-lite (PSGC).
 * Run: node scripts/build-ph-birthplaces.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { regions } from "../node_modules/@ianlabicani/geoph-lite/dist/regions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "src", "data", "ph-birthplaces.json");

const NCR_PSGC = "1300000000";
const NCR_PROVINCE_LABEL = "METRO MANILA (NCR)";

/** Region-level cities (HUCs / special areas) not listed under a province in geoph-lite. */
const REGION_LOCALITY_PROVINCE = {
  "City of Baguio": "Benguet",
  "City of Angeles": "Pampanga",
  "City of Olongapo": "Zambales",
  "City of Lucena": "Quezon",
  "City of Puerto Princesa": "Palawan",
  "City of Iloilo": "Iloilo",
  "City of Bacolod": "Negros Occidental",
  "City of Cebu": "Cebu",
  "City of Lapu-Lapu": "Cebu",
  "City of Mandaue": "Cebu",
  "City of Tacloban": "Leyte",
  "City of Isabela": "Basilan",
  "City of Zamboanga": "Zamboanga del Sur",
  "City of Cagayan De Oro": "Misamis Oriental",
  "City of Iligan": "Lanao del Norte",
  "City of Davao": "Davao del Sur",
  "City of General Santos": "South Cotabato",
  "City of Butuan": "Agusan del Norte",
  Kapalawan: "Maguindanao del Sur",
  "Old Kaabakan": "Maguindanao del Sur",
  Kadayangan: "Maguindanao del Sur",
  Nabalawag: "Maguindanao del Sur",
  Pahamuddin: "Maguindanao del Sur",
  Malidegao: "Maguindanao del Sur",
  Ligawasan: "Maguindanao del Sur",
  Tugunan: "Maguindanao del Sur",
};

function cleanLocalityName(name) {
  return String(name)
    .replace(/^City of /i, "")
    .replace(/^Municipality of /i, "")
    .trim();
}

function formatLabel(localityName, provinceName) {
  const city = cleanLocalityName(localityName).toUpperCase();
  const prov = String(provinceName).trim().toUpperCase();
  if (!prov) return city;
  return `${city}, ${prov}`;
}

const labels = new Set();

for (const regionMeta of regions) {
  const filePath = path.join(
    root,
    "node_modules",
    "@ianlabicani",
    "geoph-lite",
    regionMeta.file,
  );
  const region = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const province of region.provinces || []) {
    for (const locality of province.localities || []) {
      labels.add(formatLabel(locality.name, province.name));
    }
  }

  for (const locality of region.localities || []) {
    if (String(region.psgc_code) === NCR_PSGC) {
      labels.add(formatLabel(locality.name, NCR_PROVINCE_LABEL));
      continue;
    }
    const provinceName =
      REGION_LOCALITY_PROVINCE[locality.name] ||
      REGION_LOCALITY_PROVINCE[cleanLocalityName(locality.name)];
    if (provinceName) {
      labels.add(formatLabel(locality.name, provinceName));
    } else {
      console.warn(
        `[build-ph-birthplaces] Unmapped region locality: ${locality.name} (${region.name})`,
      );
    }
  }
}

const sorted = [...labels].sort((a, b) => a.localeCompare(b));
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(sorted, null, 0));
console.log(`Wrote ${sorted.length} birth places to ${outPath}`);
