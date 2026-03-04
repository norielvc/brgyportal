const { supabase } = require('./services/supabaseClient');

async function checkAssignments() {
    console.log('--- DB ASSIGNMENT CHECK ---');

    // 1. Get Brook Dono's user ID
    const { data: users } = await supabase.from('users').select('id, first_name, email').ilike('first_name', '%Brook%');
    if (!users || users.length === 0) return console.log('Brook not found');
    const brookId = users[0].id;
    console.log(`Checking assignments for Brook Dono (${brookId})`);

    // 2. Get BP requests
    const { data: bpreqs } = await supabase.from('certificate_requests').select('id, reference_number, status').eq('certificate_type', 'business_permit');
    console.log(`Raw BP requests in DB: ${bpreqs ? bpreqs.length : 0}`);

    if (bpreqs) {
        for (const req of bpreqs) {
            const { data: assignments } = await supabase.from('workflow_assignments').select('*').eq('request_id', req.id);
            console.log(`Request ${req.reference_number} (Status: ${req.status}):`);
            if (!assignments || assignments.length === 0) {
                console.log('  -> NO ASSIGNMENTS FOUND AT ALL');
            } else {
                assignments.forEach(a => {
                    const isBrook = a.assigned_user_id === brookId;
                    console.log(`  -> Step: ${a.step_name} (ID: ${a.step_id}), UserID: ${a.assigned_user_id} (${isBrook ? 'IS BROOK' : 'NOT BROOK'}), Status: ${a.status}`);
                });
            }
        }
    }

    // 3. Get Workflow Config
    const { data: config } = await supabase.from('workflow_configurations').select('*').eq('certificate_type', 'business_permit').single();
    if (config) {
        console.log('BP Workflow Config Steps:');
        config.workflow_config?.steps?.forEach(s => {
            console.log(`  - ${s.name} (ID: ${s.id}, Status: ${s.status}), Users: ${JSON.stringify(s.assignedUsers)}`);
        });
    } else {
        console.log('No BP workflow config found!');
    }
}

checkAssignments();
