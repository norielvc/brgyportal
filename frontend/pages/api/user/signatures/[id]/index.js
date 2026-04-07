import { authenticateToken } from "../../../../../src/lib/api-auth";
import { supabase } from "../../../../../lib/supabase";

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;
  const { id } = req.query;

  if (req.method === "DELETE") {
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
      .from("user_signatures")
      .delete()
      .eq("id", id)
      .eq("user_id", user._id);
    if (error)
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete signature" });

    await supabase
      .from("user_settings")
      .update({ default_signature_id: null })
      .eq("user_id", user._id)
      .eq("default_signature_id", id);
    return res.json({
      success: true,
      message: "Signature deleted successfully",
    });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
