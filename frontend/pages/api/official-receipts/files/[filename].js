import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { filename } = req.query;
  const safeName = path.basename(String(filename || ""));
  if (!safeName || !/^OR_.+\.html$/i.test(safeName)) {
    return res.status(400).json({ success: false, message: "Invalid file name" });
  }

  const receiptsDir = path.join(
    process.cwd(),
    "..",
    "backend",
    "generated-receipts",
  );
  const filePath = path.join(receiptsDir, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "OR file not found" });
  }

  const html = fs.readFileSync(filePath, "utf8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
}
