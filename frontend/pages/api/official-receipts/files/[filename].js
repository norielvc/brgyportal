import { loadOfficialReceiptHtml } from "../../../../src/lib/officialReceiptUtils";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { filename } = req.query;
  const safeName = String(filename || "").split("/").pop() || "";
  if (!safeName || !/^OR_.+\.html$/i.test(safeName)) {
    return res.status(400).json({ success: false, message: "Invalid file name" });
  }

  try {
    const html = await loadOfficialReceiptHtml(safeName, supabase);
    if (!html) {
      return res.status(404).json({ success: false, message: "OR file not found" });
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    console.error("[OR files]", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load receipt",
    });
  }
}
