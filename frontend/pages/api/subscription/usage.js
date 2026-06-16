import { authenticateToken } from "../../../src/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ success: false, message: "Method not allowed" });

  const queryTenantId = req.query.tenantId;
  let user = null;
  
  // If no tenantId in query, we MUST authenticate (Dashboard view)
  if (!queryTenantId) {
    user = await authenticateToken(req, res);
    if (!user) return; // Response already sent by authenticateToken
  }

  const tenantId = queryTenantId || user?.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res.status(403).json({ success: false, message: "Tenant context required" });

  try {
    const supabase = getSupabase();
    
    // 1. Get Active Subscription
    const { data: sub, error: subError } = await supabase
        .from('barangay_subscriptions')
        .select(`
            *,
            plan:subscription_plans(*)
        `)
        .eq('barangay_id', tenantId)
        .eq('status', 'active')
        .maybeSingle();

    let subscription = sub;

    // 2. Fallback to Starter if no record exists
    if (!subscription || !subscription.plan) {
        const { data: starterPlan } = await supabase
            .from('subscription_plans')
            .eq('id', 'starter')
            .single();
        
        subscription = {
            plan_id: 'starter',
            status: 'active',
            current_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            current_period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
            plan: starterPlan
        };
    }

    // 3. Count Monthly Requests
    const { count: requestsCount } = await supabase
        .from('certificate_requests')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', subscription.current_period_start);

    // 4. Count Staff
    const { count: staffCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

    return res.status(200).json({
        success: true,
        data: {
            planName: subscription.plan.name,
            planId: subscription.plan_id,
            requests: {
                used: requestsCount || 0,
                total: subscription.plan.max_requests,
                isUnlimited: subscription.plan.max_requests === -1
            },
            staff: {
                used: staffCount || 0,
                total: subscription.plan.max_staff,
                isUnlimited: subscription.plan.max_staff === -1
            },
            expiryDate: subscription.current_period_end,
            features: subscription.plan.features || []
        }
    });
  } catch (err) {
    console.error('[USAGE-API] Error:', err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
