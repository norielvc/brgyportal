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

  const ncrLabel = "METRO MANILA (NCR)";
  for (const locality of region.localities || []) {
    labels.add(formatLabel(locality.name, ncrLabel));
  }
}

const sorted = [...labels].sort((a, b) => a.localeCompare(b));
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(sorted, null, 0));
console.log(`Wrote ${sorted.length} birth places to ${outPath}`);
