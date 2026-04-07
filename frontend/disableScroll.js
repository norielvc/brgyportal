const fs = require("fs");
const path = require("path");
const dirs = ["src/components/Forms", "src/components/Modals"];

const snippet = `
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);
`;

dirs.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    const files = fs
      .readdirSync(fullPath)
      .filter((f) => f.endsWith("Modal.js"));
    files.forEach((f) => {
      const fp = path.join(fullPath, f);
      let content = fs.readFileSync(fp, "utf-8");
      if (!content.includes("document.body.style.overflow")) {
        content = content.replace(
          /(export default function [a-zA-Z0-9_]+\s*\([^)]*\)\s*\{)/,
          "$1\n" + snippet,
        );
        fs.writeFileSync(fp, content, "utf-8");
        console.log("Updated " + f);
      }
    });
  }
});
