const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth-supabase');

// ─── Tenant Seeding Helpers ────────────────────────────────────────────────

const CERTIFICATE_TYPES = [
    'barangay_clearance', 'certificate_of_indigency', 'barangay_residency',
    'natural_death', 'barangay_guardianship', 'barangay_cohabitation',
    'medico_legal', 'business_permit', 'certification_same_person'
];

// Default workflow steps with NO pre-assigned users (new tenant must assign their own staff)
const DEFAULT_WORKFLOW_STEPS = [
    { id: 1,   name: 'Review Request',              description: 'Initial review of submitted requests',       status: 'staff_review',       icon: 'Eye',         autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 2,   name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval',       status: 'secretary_approval', icon: 'Clock',       autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
    { id: 3,   name: 'Barangay Chairman Approval',   description: 'Awaiting Barangay Chairman approval',         status: 'captain_approval',   icon: 'UserCheck',   autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Chairman' },
    { id: 999, name: 'Releasing Team',              description: 'Certificate is ready for release',           status: 'oic_review',         icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true }
];

const OFFICIAL_SLOTS = [
    { name: '', position: 'Punong Barangay',         position_type: 'captain',      description: 'Punong Barangay',               order_index: 1  },
    { name: '', position: 'Secretary',               position_type: 'secretary',    description: 'Barangay Secretary',            order_index: 2  },
    { name: '', position: 'Treasurer',               position_type: 'treasurer',    description: 'Barangay Treasurer',            order_index: 3  },
    { name: '', position: 'SK Chairman',             position_type: 'sk_chairman',  description: 'Sangguniang Kabataan Chairman', order_index: 4  },
    { name: '', position: 'Kagawad 1',               position_type: 'kagawad',      description: 'Brgy. Kagawad',                 order_index: 5  },
    { name: '', position: 'Kagawad 2',               position_type: 'kagawad',      description: 'Brgy. Kagawad',                 order_index: 6  },
    { name: '', position: 'Kagawad 3',               position_type: 'kagawad',      description: 'Brgy. Kagawad',                 order_index: 7  },
    { name: '', position: 'Kagawad 4',               position_type: 'kagawad',      description: 'Brgy. Kagawad',                 order_index: 8  },
    { name: '', position: 'Kagawad 5',               position_type: 'kagawad',      description: 'Brgy. Kagawad',                 order_index: 9  },
    { name: '', position: 'Kagawad 6',               position_type: 'kagawad',      description: 'Brgy. Kagawad',                 order_index: 10 },
    { name: '', position: 'Kagawad 7',               position_type: 'kagawad',      description: 'Brgy. Kagawad',                 order_index: 11 },
    { name: '', position: 'Administrator',           position_type: 'staff',        description: 'Barangay Administrator',        order_index: 12 },
    { name: '', position: 'Assistant Secretary',     position_type: 'staff',        description: 'Assistant Secretary',           order_index: 13 },
    { name: '', position: 'Assistant Administrator', position_type: 'staff',        description: 'Assistant Administrator',       order_index: 14 },
    { name: '', position: 'Barangay Keeper',         position_type: 'staff',        description: 'Record Keeper',                 order_index: 15 },
    { name: '', position: 'Clerk',                   position_type: 'staff',        description: 'Barangay Clerk',                order_index: 16 },
    { name: '', position: 'SK Secretary',            position_type: 'sk_secretary', description: 'SK Secretary',                  order_index: 17 },
    { name: '', position: 'SK Treasurer',            position_type: 'sk_treasurer', description: 'SK Treasurer',                  order_index: 18 },
    { name: '', position: 'SK Kagawad 1',            position_type: 'sk_kagawad',   description: 'SK Kagawad',                    order_index: 19 },
    { name: '', position: 'SK Kagawad 2',            position_type: 'sk_kagawad',   description: 'SK Kagawad',                    order_index: 20 },
    { name: '', position: 'SK Kagawad 3',            position_type: 'sk_kagawad',   description: 'SK Kagawad',                    order_index: 21 },
    { name: '', position: 'SK Kagawad 4',            position_type: 'sk_kagawad',   description: 'SK Kagawad',                    order_index: 22 },
    { name: '', position: 'SK Kagawad 5',            position_type: 'sk_kagawad',   description: 'SK Kagawad',                    order_index: 23 },
    { name: '', position: 'SK Kagawad 6',            position_type: 'sk_kagawad',   description: 'SK Kagawad',                    order_index: 24 },
    { name: '', position: 'SK Kagawad 7',            position_type: 'sk_kagawad',   description: 'SK Kagawad',                    order_index: 25 },
    { name: '', position: 'SK Kagawad 8',            position_type: 'sk_kagawad',   description: 'SK Kagawad',                    order_index: 26 },
];

/**
 * Seeds all required default data for a brand new tenant.
 * Called automatically after tenant creation.
 */
async function seedNewTenant(tenantId, tenantName) {
    const errors = [];

    // 1. Official position slots (empty — admin fills in names/photos)
    const officialSlots = OFFICIAL_SLOTS.map(s => ({ ...s, tenant_id: tenantId, is_active: true }));
    const { error: officialsErr } = await supabase.from('barangay_officials').insert(officialSlots);
    if (officialsErr) errors.push(`officials: ${officialsErr.message}`);

    // 2. Workflow configurations (default 4-step flow, no assigned users)
    const workflowRows = CERTIFICATE_TYPES.map(certType => ({
        certificate_type: certType,
        tenant_id: tenantId,
        workflow_config: { steps: DEFAULT_WORKFLOW_STEPS },
        is_active: true,
        updated_at: new Date().toISOString()
    }));
    const { error: workflowErr } = await supabase
        .from('workflow_configurations')
        .upsert(workflowRows, { onConflict: 'certificate_type,tenant_id' });
    if (workflowErr) errors.push(`workflows: ${workflowErr.message}`);

    // 3. Barangay settings — blank slate with tenant-specific defaults
    const defaultSettings = {
        contactInfo:   { address: '', contactPerson: '', telephone: '', email: '' },
        headerInfo:    { country: 'Republic of the Philippines', province: '', municipality: '', barangayName: `BARANGAY ${tenantName.toUpperCase()}`, officeName: 'Office of the Punong Barangay' },
        logos:         { leftLogo: '', rightLogo: '', logoSize: 115, captainImage: '' },
        heroSection:   { title: 'BARANGAY OFFICIALS', subtitle: 'Meet our dedicated team', image: '' },
        portalBranding: { portalName: `${tenantName.toUpperCase()} PORTAL`, shortName: tenantName, subtitle: '', logoUrl: '/logo.png', primaryColor: '#004700', secondaryColor: '#001a00' },
        siteContact:   { address: '', phone: '', email: '', officeHours: 'Monday - Friday: 8:00 AM - 5:00 PM', hotlines: [] },
        missionGoals:  { barangayMission: '', barangayGoal: '', barangayVision: '', skMission: '', skGoal: '', skVision: '' },
        visibility:    { section: true, chairman: true, secretary: true, treasurer: true, skChairman: true, skSecretary: true, skTreasurer: true, skKagawads: Array(8).fill(true), councilors: Array(7).fill(true), administrator: true, assistantSecretary: true, assistantAdministrator: true, recordKeeper: true, clerk: true }
    };
    const { error: settingsErr } = await supabase
        .from('barangay_settings')
        .upsert({ key: 'certificate_settings', tenant_id: tenantId, value: defaultSettings, updated_at: new Date().toISOString() }, { onConflict: 'key,tenant_id' });
    if (settingsErr) errors.push(`settings: ${settingsErr.message}`);

    return errors;
}

/**
 * @route   GET /api/tenants
 * @desc    Get all tenants (Super Admin Only)
 * @access  Private (Superadmin)
 */
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        // 1. Fetch all tenants
        const { data: tenants, error } = await supabase
            .from('tenants')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching tenants:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch registered barangays'
            });
        }

        // 2. Fetch some basic stats for each tenant (optional enrichment)
        // In a real pro system, we'd use a view or a separate service for usage tracking.
        const enrichedTenants = await Promise.all(tenants.map(async (t) => {
            // Count staff (users) for this tenant
            const { count: staffCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', t.id);

            // Count requests this month (mocking usage logic for dashboard)
            return {
                ...t,
                staff_count: staffCount || 0,
                // These are just mock numbers for the UI display until we build the billing engine
                requests_this_month: t.id === 'ibaoeste' ? 1290 : 45,
                last_active: 'Recently active'
            };
        }));

        res.status(200).json({
            success: true,
            data: enrichedTenants
        });
    } catch (error) {
        console.error('Get tenants error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/tenants
 * @desc    Onboard a new Barangay — creates tenant + seeds defaults + first admin user
 * @access  Private (Superadmin)
 */
router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { id, name, domain, plan_tier, adminFirstName, adminLastName, adminEmail, adminPassword } = req.body;

        if (!id || !name) {
            return res.status(400).json({ success: false, message: 'Tenant ID and Name are required' });
        }
        if (!adminEmail || !adminPassword) {
            return res.status(400).json({ success: false, message: 'Admin email and password are required' });
        }
        if (adminPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Admin password must be at least 6 characters' });
        }

        const tenantId = id.toLowerCase().replace(/\s+/g, '-');

        // Check email not already taken
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', adminEmail).single();
        if (existingUser) {
            return res.status(400).json({ success: false, message: `Email '${adminEmail}' is already in use` });
        }

        // 1. Create tenant row
        const { data: newTenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({ id: tenantId, name, domain, plan_tier: plan_tier || 'Starter', status: 'Active' })
            .select()
            .single();

        if (tenantError) {
            if (tenantError.code === '23505') {
                return res.status(400).json({ success: false, message: `Tenant ID '${tenantId}' is already taken` });
            }
            throw tenantError;
        }

        // 2. Seed all default data (officials slots, workflows, settings)
        const seedErrors = await seedNewTenant(tenantId, name);
        if (seedErrors.length > 0) {
            console.warn(`Tenant '${tenantId}' seeding warnings:`, seedErrors);
        }

        // 3. Create first admin user for this tenant
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
                tenant_id: tenantId,
                email: adminEmail,
                first_name: adminFirstName || 'Admin',
                last_name: adminLastName || name,
                password_hash: hashedPassword,
                role: 'admin',
                status: 'active',
                position: 'Barangay Administrator'
            })
            .select('id, email, first_name, last_name, role')
            .single();

        if (userError) {
            console.error(`Admin user creation failed for tenant '${tenantId}':`, userError.message);
        }

        res.status(201).json({
            success: true,
            message: `${name} has been successfully onboarded`,
            data: {
                tenant: newTenant,
                adminUser: newUser ? { id: newUser.id, email: newUser.email, name: `${newUser.first_name} ${newUser.last_name}` } : null,
                seedWarnings: seedErrors
            }
        });
    } catch (error) {
        console.error('Create tenant error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
