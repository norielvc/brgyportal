require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Init Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function debug() {
    console.log('--- DIAGNOSTIC SCRIPT ---');

    // 1. Check Brook dono's User ID
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .ilike('first_name', '%Brook%');

    if (userError) return console.error('User Error:', userError);
    console.log('Brook Users found:', users);

    if (users.length === 0) return console.log('NO USER NAMED BROOK FOUND!');
    const brookId = users[0].id;

    // 2. Check assignments for Brook
    const { data: assignments, error: assignError } = await supabase
        .from('workflow_assignments')
        .select('*')
        .eq('assigned_user_id', brookId);

    if (assignError) return console.error('Assign Error:', assignError);
    console.log(`Found ${assignments.length} assignments for Brook dono (${brookId})`);

    if (assignments.length > 0) {
        console.log('Sample assignments:', assignments.slice(0, 3));
        const bpAssignments = assignments.filter(a => a.request_type === 'business_permit');
        console.log(`Of those, ${bpAssignments.length} are for Business Permits.`);
    }

    // 3. Check raw Business Permit requests
    const { data: bpreqs, error: bpError } = await supabase
        .from('certificate_requests')
        .select('id, reference_number, status, certificate_type')
        .eq('certificate_type', 'business_permit');

    console.log(`Found ${bpreqs?.length || 0} Business Permit requests in DB total.`);
}

debug();
