import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const results = {};

    // Check tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name")
      .limit(5);

    results.tenants = {
      count: tenants?.length || 0,
      data: tenants || [],
      error: tenantsError?.message,
    };

    // Check certificate requests
    const { data: requests, error: requestsError, count: requestsCount } = await supabase
      .from("certificate_requests")
      .select("*", { count: "exact" })
      .limit(10);

    results.certificateRequests = {
      count: requestsCount || 0,
      sample: requests || [],
      error: requestsError?.message,
    };

    // Check by tenant if tenants exist
    if (tenants && tenants.length > 0) {
      const tenantData = {};
      for (const tenant of tenants) {
        const { count } = await supabase
          .from("certificate_requests")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id);
        
        tenantData[tenant.name] = count || 0;
      }
      results.byTenant = tenantData;
    }

    // Check residents
    const { count: residentsCount } = await supabase
      .from("residents")
      .select("*", { count: "exact", head: true });

    results.residents = residentsCount || 0;

    // Check users
    const { count: usersCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    results.users = usersCount || 0;

    // Check workflow assignments
    const { count: assignmentsCount } = await supabase
      .from("workflow_assignments")
      .select("*", { count: "exact", head: true });

    results.workflowAssignments = assignmentsCount || 0;

    return res.status(200).json({
      success: true,
      data: results,
      summary: {
        hasCertificateRequests: (requestsCount || 0) > 0,
        hasResidents: (residentsCount || 0) > 0,
        hasUsers: (usersCount || 0) > 0,
        hasTenants: (tenants?.length || 0) > 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
