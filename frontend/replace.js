const fs = require("fs");
const filePath =
  "c:/Users/SCREENS/OneDrive/Desktop/Admin dashboard/frontend/pages/index.js";
let content = fs.readFileSync(filePath, "utf8");

const edRegex =
  /( {6}\{\/\* Educational Assistance Program Section - SK Project - Trimmed for single screen \*\/}[\s\S]*?<\/section>\r?\n\r?\n)( {6}\{\/\* Barangay Achievement and Awards Section \*\/})/;
const edMatch = content.match(edRegex);
if (!edMatch) {
  console.log("Could not find Educational Assistance section.");
  process.exit(1);
}

const facRegex =
  /( {6}\{\/\* Facilities Section - Enhanced Modern Design \*\/}[\s\S]*?<\/section>\r?\n\r?\n\r?\n)( {6}\{\/\* Barangay Clearance Modal \*\/})/;
const facMatch = content.match(facRegex);
if (!facMatch) {
  console.log("Could not find Facilities section.");
  process.exit(1);
}

const edSectionStr = edMatch[1];
const facSectionStr = facMatch[1];

// Remove Facilities from the bottom
content = content.replace(facSectionStr, "");
// Replace Educational Assistance with Facilities
content = content.replace(edSectionStr, facSectionStr);

fs.writeFileSync(filePath, content);
console.log("Sections swapped successfully.");
