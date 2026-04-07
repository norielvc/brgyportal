const fs = require("fs");
const file =
  "c:/Users/SCREENS/OneDrive/Desktop/Admin dashboard/frontend/pages/index.js";
let content = fs.readFileSync(file, "utf8");

const startStr = "{/* Barangay Achievement and Awards Section */}";
const endStr = "{/* Barangay Clearance Modal */}";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  let section = content.substring(startIndex, endIndex);

  // Update section background
  section = section.replace(
    /from-\[#1e1b4b\] via-\[#312e81\] to-\[#1e1b4b\]/g,
    "from-[#0a1f12] via-[#113821] to-[#0a1f12]",
  );
  section = section.replace(/bg-indigo-400/g, "bg-[#be9f56]/30"); // Glow elegant gold/green

  // Header
  section = section.replace(/bg-indigo-900\/40/g, "bg-[#113821]/40");
  section = section.replace(/border-indigo-500\/30/g, "border-[#d4af37]/30");
  section = section.replace(/text-indigo-100/g, "text-[#ebd78c]");
  section = section.replace(/text-indigo-200/g, "text-green-100/80");

  // Cards
  section = section.replace(/bg-indigo-950\/30/g, "bg-[#0a1f12]/60");
  section = section.replace(/border-indigo-400\/20/g, "border-[#d4af37]/20");
  section = section.replace(
    /hover:bg-indigo-900\/50/g,
    "hover:bg-[#113821]/60",
  );

  // Update all hover borders to gold glow
  section = section.replace(
    /hover:border-[a-z]+-400\/40/g,
    "hover:border-[#d4af37]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]",
  );

  // Images background
  section = section.replace(/bg-indigo-900\/30/g, "bg-[#0f2e1b]/30");
  section = section.replace(/from-indigo-950/g, "from-[#081a0f]");
  section = section.replace(/bg-indigo-900\/20/g, "bg-[#113821]/20");

  // Replace all floating badges background with gold
  section = section.replace(
    /bg-yellow-500 text-indigo-900/g,
    "bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12]",
  );
  section = section.replace(
    /bg-[a-z]+-500 text-white/g,
    "bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12]",
  );

  // Icon containers
  section = section.replace(
    /bg-gradient-to-br from-[a-z]+-600 to-[a-z]+-400/g,
    "bg-gradient-to-br from-[#d4af37] to-[#ebd78c]",
  );
  section = section.replace(
    /shadow-\[0_0_15px_rgba\([0-9,]+,0\.3\)\]/g,
    "shadow-[0_0_15px_rgba(212,175,55,0.4)]",
  );
  section = section.replace(/border-indigo-950/g, "border-[#0a1f12]");

  // Texts inside cards
  section = section.replace(/text-yellow-400/g, "text-[#d4af37]");
  section = section.replace(/text-emerald-400/g, "text-[#d4af37]");
  section = section.replace(/text-blue-400/g, "text-[#d4af37]");
  section = section.replace(/text-red-400/g, "text-[#d4af37]");
  section = section.replace(/text-pink-400/g, "text-[#d4af37]");
  section = section.replace(/text-purple-400/g, "text-[#d4af37]");

  section = section.replace(
    /group-hover:text-yellow-400/g,
    "group-hover:text-[#ebd78c]",
  );
  section = section.replace(
    /group-hover:text-emerald-400/g,
    "group-hover:text-[#ebd78c]",
  );
  section = section.replace(
    /group-hover:text-blue-400/g,
    "group-hover:text-[#ebd78c]",
  );
  section = section.replace(
    /group-hover:text-red-400/g,
    "group-hover:text-[#ebd78c]",
  );
  section = section.replace(
    /group-hover:text-pink-400/g,
    "group-hover:text-[#ebd78c]",
  );
  section = section.replace(
    /group-hover:text-purple-400/g,
    "group-hover:text-[#ebd78c]",
  );

  // Statistics Row
  section = section.replace(/bg-indigo-900\/20/g, "bg-[#113821]/30");
  section = section.replace(/border-indigo-500\/20/g, "border-[#d4af37]/20");

  // Modal background and borders
  section = section.replace(/bg-indigo-950/g, "bg-[#0a1f12]");
  section = section.replace(/bg-indigo-950\/80/g, "bg-[#0a1f12]/80");
  section = section.replace(/bg-indigo-950\/90/g, "bg-[#113821]/95");
  section = section.replace(/border-indigo-500\/30/g, "border-[#d4af37]/30");

  // Make sure we didn't corrupt the actual selectedAchievement.colorClass
  section = section.replace(
    /\$\{selectedAchievement\.colorClass\}/g,
    "bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a1f12]",
  );
  section = section.replace(/text-\$\{selectedAchievement\.textColor\}/g, ""); // Handled manually below

  // We can just apply the standard gold color for modal text
  section = section.replace(
    /className={`text- text-sm md:text-base font-bold tracking-widest uppercase mb-2`}/g,
    "className={`text-[#d4af37] text-sm md:text-base font-bold tracking-widest uppercase mb-2`}",
  );

  content =
    content.substring(0, startIndex) + section + content.substring(endIndex);
  fs.writeFileSync(file, content);
  console.log("Template elegantly transformed to Golden Green.");
} else {
  console.log("Could not find section.");
}
