const { supabase } = require('./backend/services/supabaseClient');

async function exploreDB() {
    console.log('--- Exploring DB Tables ---');
    
    // Check barangay_settings
    const { data: settings, error: sError } = await supabase.from('barangay_settings').select('*');
    if (sError) console.error('Settings Error:', sError);
    else console.log('Settings Rows:', settings.length);

    // Check if there is a 'barangay' table (for multi-tenant)
    const { data: rpcTables, error: rpcError } = await supabase.rpc('get_tables'); // Hope this exists
    if (rpcError) {
        // Fallback: list common tables
        const tables = ['certificate_requests', 'users', 'workflow_history', 'barangay_officials'];
        for (const t of tables) {
            const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
            console.log(`Table ${t}: ${error ? 'FAIL' : count + ' rows'}`);
        }
    } else {
        console.log('Tables:', rpcTables);
    }
}

exploreDB();
