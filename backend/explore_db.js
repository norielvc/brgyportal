const { supabase } = require('./services/supabaseClient');

async function exploreDB() {
    console.log('--- Exploring DB Tables ---');
    
    // Check barangay_settings
    const { data: settings, error: sError } = await supabase.from('barangay_settings').select('id, key');
    if (sError) console.error('Settings Error:', sError);
    else console.log('Settings Rows:', settings);

    const tables = ['certificate_requests', 'users', 'workflow_history', 'barangay_officials', 'workflow_configurations'];
    for (const t of tables) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        console.log(`Table ${t}: ${error ? 'FAIL: ' + error.message : count + ' rows'}`);
    }
}

exploreDB();
