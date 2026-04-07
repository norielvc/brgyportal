import { authenticateToken } from "../../../../../src/lib/api-auth";
import { supabase } from "../../../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "PUT")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;
  const { id } = req.query;

  const { data: sig, error: fetchError } = await supabase
    .from("user_signatures")
    .select("*")
    .eq("id", id)
    .eq("user_id", user._id)
    .single();
  if (fetchError || !sig)
    return res
      .status(404)
      .json({ success: false, message: "Signature not found" });

  const { error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user._id,
        default_signature_id: id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (error)
    return res
      .status(500)
      .json({ success: false, message: "Failed to set default signature" });

  return res.json({
    success: true,
    message: "Default signature updated successfully",
  });
}
