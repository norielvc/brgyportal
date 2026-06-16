/**
 * GET  /api/events — list events for the authenticated user's tenant
 * POST /api/events — create a new event
 *
 * Tenant isolation: tenantId always comes from JWT (user.tenant_id).
 */
import { authenticateToken } from "../../../src/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    const userRes = await authenticateToken(req, res);
    if (!userRes) return;

    const tenantId = userRes.tenant_id;
    if (!tenantId) {
      return res.status(403).json({ success: false, message: "No tenant context in token" });
    }

    const supabase = getSupabase();

    if (req.method === "GET") {
      console.log(`Fetching events for tenant: ${tenantId}`);
      
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("order_index", { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ success: false, message: error.message });
      }
      
      console.log(`Found ${data?.length || 0} events`);
      return res.status(200).json({ success: true, data: data || [] });
    }

    if (req.method === "POST") {
      const { title, date, description, body, image } = req.body;

      console.log(`Creating event for tenant: ${tenantId}`);

      const { data: maxOrder, error: maxError } = await supabase
        .from("events")
        .select("order_index")
        .eq("tenant_id", tenantId)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results

      if (maxError) {
        console.error('Error getting max order:', maxError);
      }

      const { data, error } = await supabase
        .from("events")
        .insert({
          title,
          date: date || null,
          description: description || "",
          body: body || "",
          image: image || "",
          order_index: (maxOrder?.order_index ?? -1) + 1,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        return res.status(500).json({ success: false, message: error.message });
      }
      
      return res.status(201).json({ success: true, data });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
}
