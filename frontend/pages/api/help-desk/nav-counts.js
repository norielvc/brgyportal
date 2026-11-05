import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";
import {
  getEsumbongSettings,
  userHasEsumbongAccess,
} from "../../../src/lib/esumbongAccess";
import {
  getKapchatSettings,
  userHasKapchatAccess,
} from "../../../src/lib/kapchatAccess";

const ESUMBONG_OPEN = ["pending", "under_review"];
const ASSISTANCE_OPEN = ["pending", "in_progress"];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId) {
    return res.status(200).json({
      success: true,
      data: {
        esumbong: 0,
        assistance: 0,
        kapchat: 0,
        total: 0,
      },
    });
  }

  try {
    const [esumbongRes, assistanceRes, kapchatRes, esumbongSettings, kapchatSettings] =
      await Promise.all([
      supabase
        .from("blotter_reports")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ESUMBONG_OPEN),
      supabase
        .from("assistance_inquiries")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ASSISTANCE_OPEN),
      supabase
        .from("kapchat_messages")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_admin", false)
        .eq("status", "unread"),
      getEsumbongSettings(supabase, tenantId),
      getKapchatSettings(supabase, tenantId),
    ]);

    const includeEsumbong = userHasEsumbongAccess(user, esumbongSettings);
    const includeKapchat = userHasKapchatAccess(user, kapchatSettings);

    const esumbong =
      includeEsumbong && !esumbongRes.error ? esumbongRes.count ?? 0 : 0;
    const assistance = assistanceRes.error ? 0 : assistanceRes.count ?? 0;
    const kapchat =
      includeKapchat && !kapchatRes.error ? kapchatRes.count ?? 0 : 0;

    const total = esumbong + assistance + kapchat;

    return res.status(200).json({
      success: true,
      data: { esumbong, assistance, kapchat, total },
    });
  } catch (error) {
    console.error("Help desk nav counts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch help desk counts",
    });
  }
}
