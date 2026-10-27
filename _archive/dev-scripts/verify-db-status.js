const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('--- Database Status Check ---');

    const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} recent requests:`);
    data.forEach(req => {
        console.log(`[ref: ${req.reference_number}] Status: ${req.status} | Name: ${req.full_name || req.applicant_name}`);
    });
}

verify();
