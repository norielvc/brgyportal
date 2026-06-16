import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";
import bcrypt from "bcryptjs";

const CERTIFICATE_TYPES = [
  'barangay_clearance', 'certificate_of_indigency', 'barangay_residency',
  'natural_death', 'barangay_guardianship', 'barangay_cohabitation',
  'medico_legal', 'business_permit', 'certification_same_person', 'educational_assistance'
];

const DEFAULT_WORKFLOW_STEPS = [
  { id: 1,   name: 'Review Request Team',          status: 'staff_review',       requiresApproval: true,  assignedUsers: [] },
  { id: 2,   name: 'Barangay Secretary Approval',  status: 'secretary_approval', requiresApproval: true,  assignedUsers: [], officialRole: 'Brgy. Secretary' },
  { id: 3,   name: 'Barangay Captain Approval',    status: 'captain_approval',   requiresApproval: true,  assignedUsers: [], officialRole: 'Brgy. Captain' },
  { id: 999, name: 'Releasing Team',               status: 'oic_review',         requiresApproval: true,  assignedUsers: [] },
];

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;
  if (!["superadmin", "super_admin"].includes(user.role)) {
    return res.status(403).json({ success: false, message: "Superadmin access required" });
  }

  // GET — list all tenants enriched with subscription and usage data
  if (req.method === "GET") {
    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, message: error.message });

    const enriched = await Promise.all((tenants || []).map(async (t) => {
      // Parallel fetch for speed
      const [
        { count: staffCount }, 
        { data: sub },
        { count: reqTotalCount }
      ] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", t.id).eq("status", "active"),
        supabase.from("barangay_subscriptions").select("*, plan:subscription_plans(*)").eq("barangay_id", t.id).maybeSingle(),
        supabase.from("certificate_requests").select("id", { count: "exact", head: true }).eq("tenant_id", t.id),
      ]);

      const subStart = sub?.current_period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: reqMonthCount } = await supabase
        .from("certificate_requests")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", t.id)
        .gte("created_at", subStart);

      return { 
        ...t, 
        plan_tier: sub?.plan?.name || t.plan_tier || "Starter",
        plan_id: sub?.plan_id || "starter",
        staff_count: staffCount || 0, 
        requests_this_month: reqMonthCount || 0, 
        requests_total: reqTotalCount || 0 
      };
    }));

    return res.json({ success: true, data: enriched });
  }

  // POST — create new tenant + subscription + seed defaults + create admin user
  if (req.method === "POST") {
    const { name, id: tenantId, domain, plan_tier, adminFirstName, adminLastName, adminEmail, adminPassword } = req.body;

    if (!name || !tenantId || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: "name, id, adminEmail, adminPassword are required" });
    }

    const { data: existing } = await supabase.from("tenants").select("id").eq("id", tenantId).single();
    if (existing) return res.status(400).json({ success: false, message: `Tenant ID '${tenantId}' already exists` });

    // 1. Create tenant record
    const { data: tenant, error: tenantErr } = await supabase.from("tenants").insert([{
      id: tenantId, name, domain: domain || null, plan_tier: plan_tier || "Starter",
      status: "Active", created_at: new Date().toISOString()
    }]).select().single();
    if (tenantErr) return res.status(500).json({ success: false, message: tenantErr.message });

    // 2. Create subscription record (NEW)
    const { error: subErr } = await supabase.from("barangay_subscriptions").insert([{
      barangay_id: tenantId,
      plan_id: (plan_tier || "Starter").toLowerCase(),
      status: "active"
    }]);

    // 3. Create admin user
    const hashedPw = await bcrypt.hash(adminPassword, 12);
    const { data: adminUser, error: userErr } = await supabase.from("users").insert([{
      tenant_id: tenantId, email: adminEmail,
      first_name: adminFirstName || "Admin", last_name: adminLastName || name,
      password_hash: hashedPw, role: "admin", status: "active",
      created_at: new Date().toISOString()
    }]).select().single();
    if (userErr) return res.status(500).json({ success: false, message: userErr.message });

    // 4. Seed workflow configurations
    const workflowRows = CERTIFICATE_TYPES.map(certType => ({
      certificate_type: certType, tenant_id: tenantId,
      workflow_config: { steps: DEFAULT_WORKFLOW_STEPS },
      is_active: true, updated_at: new Date().toISOString()
    }));
    await supabase.from("workflow_configurations").upsert(workflowRows, { onConflict: "certificate_type,tenant_id" });

    return res.status(201).json({
      success: true,
      data: { tenant, adminUser: { name: `${adminFirstName} ${adminLastName}`, email: adminEmail } }
    });
  }

  // PATCH — Update tenant plan (NEW)
  if (req.method === "PATCH") {
    const { tenantId, planId } = req.body;
    console.log(`[SUBSCRIPTION-UPDATE] Request received for ${tenantId} -> ${planId}`);
    
    if (!tenantId || !planId) return res.status(400).json({ success: false, message: "tenantId and planId required" });

    // Update both tables for consistency
    const [tRes, sRes] = await Promise.all([
        supabase.from("tenants").update({ plan_tier: planId.charAt(0).toUpperCase() + planId.slice(1) }).eq("id", tenantId),
        supabase.from("barangay_subscriptions").upsert([{ 
            barangay_id: tenantId, 
            plan_id: planId.toLowerCase(), 
            status: "active",
            updated_at: new Date().toISOString()
        }], { onConflict: "barangay_id" })
    ]);

    if (tRes.error || sRes.error) {
        console.error("[SUBSCRIPTION-UPDATE] Error:", tRes.error || sRes.error);
        return res.status(500).json({ success: false, message: tRes.error?.message || sRes.error?.message });
    }

    console.log(`[SUBSCRIPTION-UPDATE] Successfully updated ${tenantId}`);
    return res.json({ success: true, message: "Plan updated successfully" });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
