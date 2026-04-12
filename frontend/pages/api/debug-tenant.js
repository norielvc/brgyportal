import { authenticateToken } from "../../src/lib/api-auth";
import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const user = await authenticateToken(req, res);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const tenantId = user.tenant_id;

    // Get all requests for this tenant
    const { data: requests, error, count } = await supabase
      .from("certificate_requests")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId)
      .limit(5);

    // Get tenant info
    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    return res.status(200).json({
      success: true,
      debug: {
        user: {
          id: user.id,
          email: user.email,
          tenant_id: user.tenant_id,
          role: user.role,
        },
        tenant: tenant,
        query: {
          table: "certificate_requests",
          filter: `tenant_id = '${tenantId}'`,
          count: count,
        },
        sampleRequests: requests,
        error: error?.message,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
