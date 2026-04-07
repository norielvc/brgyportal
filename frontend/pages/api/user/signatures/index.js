import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const { data: signatures, error } = await supabase
      .from("user_signatures")
      .select("*")
      .eq("user_id", user._id)
      .order("created_at", { ascending: false });
    if (error)
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch signatures" });

    const { data: settings } = await supabase
      .from("user_settings")
      .select("default_signature_id")
      .eq("user_id", user._id)
      .single();

    const transformed = (signatures || []).map((s) => ({
      id: s.id,
      userId: s.user_id,
      user_id: s.user_id,
      signatureData: s.signature_data,
      signature_data: s.signature_data,
      name: s.name,
      createdAt: s.created_at,
      created_at: s.created_at,
    }));

    return res.json({
      success: true,
      signatures: transformed,
      defaultSignatureId: settings?.default_signature_id || null,
    });
  }

  if (req.method === "POST") {
    const { signatureData, name, isDefault } = req.body;
    if (!signatureData)
      return res
        .status(400)
        .json({ success: false, message: "Signature data is required" });

    const { data: sig, error } = await supabase
      .from("user_signatures")
      .insert({
        user_id: user._id,
        signature_data: signatureData,
        name: name || "Signature",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error)
      return res
        .status(500)
        .json({ success: false, message: "Failed to save signature" });

    if (isDefault) {
      await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user._id,
            default_signature_id: sig.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
    }

    return res.json({
      success: true,
      message: "Signature saved successfully",
      signature: {
        id: sig.id,
        userId: sig.user_id,
        user_id: sig.user_id,
        signatureData: sig.signature_data,
        signature_data: sig.signature_data,
        name: sig.name,
        createdAt: sig.created_at,
        created_at: sig.created_at,
      },
    });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
