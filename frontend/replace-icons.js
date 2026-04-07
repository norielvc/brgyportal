const fs = require("fs");
const file =
  "c:/Users/SCREENS/OneDrive/Desktop/Admin dashboard/frontend/pages/index.js";
let content = fs.readFileSync(file, "utf8");

if (!content.includes("Trophy")) {
  content = content.replace(
    /\} from 'lucide-react';/,
    ", Trophy } from 'lucide-react';",
  );
}

content = content.replace(
  /<Star className="w-6 h-6 text-white" fill="currentColor" \/>/g,
  '<Trophy className="w-6 h-6 text-white" />',
);
content = content.replace(
  /<Leaf className="w-6 h-6 text-white" \/>/g,
  '<Trophy className="w-6 h-6 text-white" />',
);
content = content.replace(
  /<Laptop className="w-6 h-6 text-white" \/>/g,
  '<Trophy className="w-6 h-6 text-white" />',
);
content = content.replace(
  /<Shield className="w-6 h-6 text-white" \/>/g,
  '<Trophy className="w-6 h-6 text-white" />',
);
content = content.replace(
  /<Heart className="w-6 h-6 text-white" \/>/g,
  '<Trophy className="w-6 h-6 text-white" />',
);
content = content.replace(
  /<GraduationCap className="w-6 h-6 text-white" \/>/g,
  '<Trophy className="w-6 h-6 text-white" />',
);

fs.writeFileSync(file, content);
console.log("Icons replaced with Trophy successfully!");
