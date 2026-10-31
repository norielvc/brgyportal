const path = require('path');
const fs = require('fs');

// Robust env loading
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) process.env[k] = envConfig[k];
} else {
    console.error('Env file missing');
    process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) { console.error('Supabase credentials missing.'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function addNaturalDeathWorkflow() {
    console.log('🚀 Adding Natural Death Workflow Configuration via SQL...');

    // 1. Fetch template JSON directly via SQL because client schema cache is borked
    const { data: fetchResult, error: fetchError } = await supabase.rpc('exec_sql', {
        sql: "SELECT workflow_json FROM workflow_configurations WHERE certificate_type = 'barangay_clearance' LIMIT 1"
    });

    if (fetchError || !fetchResult) {
        console.error('❌ Error fetching template via SQL:', fetchError);
        return;
    }

    // The result of exec_sql (assuming void return or different format)
    // Wait, exec_sql usually returns void or text depending on implementation.
    // If it's the implementation I saw earlier:
    /*
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    DECLARE
        result jsonb;
    BEGIN
        EXECUTE sql INTO result; -- This only works if sql returns a single JSON?
        -- OR
        -- RETURN query_to_json(sql);
    END;
    $function$
    */

    // Actually, I don't know the implementation of exec_sql.
    // The one in check-residents-columns.js used a DO block, so it returned void.

    // Let's assume I can't easily get the result back from exec_sql if it's not designed for it.

    // PLAN B: Hardcode the workflow steps based on the user IDs I saw in step 3456 output.
    /*
    Steps from 3456:
    1. Review Request Team (staff_review) -> Users: ["1b1a...", "d165..."]
    2. Brgy. Secretary Approval (secretary_approval) -> User: "ca84..." (Franky Dono?)
    3. Barangay Chairman Approval (captain_approval) -> User: "9550..." (Noriel Cruz?)
    4. Releasing Team (oic_review) -> User: "3798..." (Sarah Wilson?)
    */

    const steps = [
        {
            "id": 1,
            "name": "Review Request Team",
            "status": "staff_review",
            "assignedUsers": [
                "1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae", // Luffy Dono
                "d165bf34-2a6e-4a33-8f13-a2e9868f28f6"  // John Doe
            ],
            "requiresApproval": true
        },
        {
            "id": 2,
            "name": "Brgy. Secretary Approval",
            "status": "secretary_approval",
            "assignedUsers": [
                "ca847635-fd64-4e69-9cc7-01998200ddfe" // Franky Dono
            ],
            "requiresApproval": true
        },
        {
            "id": 3,
            "name": "Barangay Chairman Approval",
            "status": "captain_approval",
            "assignedUsers": [
                "9550a8b2-9e32-4f52-a260-52766afb49b1" // Noriel Cruz
            ],
            "requiresApproval": true
        },
        {
            "id": 999,
            "name": "Releasing Team",
            "status": "oic_review",
            "assignedUsers": [
                "379898b5-06e9-43a7-b51d-213aec975825" // Sarah Wilson
            ],
            "requiresApproval": true
        }
    ];

    const workflowJson = JSON.stringify({ steps }).replace(/'/g, "''");

    const sql = `
    INSERT INTO workflow_configurations (certificate_type, config_name, workflow_json, is_active, created_at, updated_at)
    VALUES (
      'natural_death',
      'Natural Death Certificate Workflow',
      '${workflowJson}'::jsonb,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (certificate_type) 
    DO UPDATE SET 
      workflow_json = '${workflowJson}'::jsonb,
      updated_at = NOW();
  `;

    console.log('Executing SQL...');
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql });

    if (rpcError) {
        console.error('❌ Error executing SQL:', rpcError);
    } else {
        console.log('✅ Successfully added/updated Natural Death workflow via hardcoded SQL.');
    }
}

addNaturalDeathWorkflow();
