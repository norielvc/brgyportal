const { supabase } = require('./backend/services/supabaseClient');
const fs = require('fs');
const path = require('path');

async function setupPostApprovalTables() {
  try {
    console.log('=== SETTING UP POST-APPROVAL WORKFLOW TABLES ===');

    // Read and execute certificate pickups table script
    console.log('\n1. Creating certificate pickups table...');
    const pickupsTableSQL = fs.readFileSync(
      path.join(__dirname, 'backend/scripts/create-certificate-pickups-table.sql'), 
      'utf8'
    );
    
    const { error: pickupsError } = await supabase.rpc('exec_sql', { sql: pickupsTableSQL });
    if (pickupsError) {
      console.error('Error creating certificate pickups table:', pickupsError);
    } else {
      console.log('✅ Certificate pickups table created successfully');
    }

    // Verify tables were created
    console.log('\n2. Verifying table creation...');
    
    // Check certificate pickups table
    const { data: pickupsData, error: pickupsCheckError } = await supabase
      .from('certificate_pickups')
      .select('*')
      .limit(1);
    
    if (pickupsCheckError) {
      console.log('❌ Certificate pickups table verification failed:', pickupsCheckError.message);
    } else {
      console.log('✅ Certificate pickups table verified');
    }

    // Add certificate_file_path column to certificate_requests if it doesn't exist
    console.log('\n3. Adding certificate file path column...');
    const alterTableSQL = `
      ALTER TABLE certificate_requests 
      ADD COLUMN IF NOT EXISTS certificate_file_path TEXT,
      ADD COLUMN IF NOT EXISTS certificate_generated_at TIMESTAMP WITH TIME ZONE;
    `;
    
    const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterTableSQL });
    if (alterError) {
      console.log('Note: Could not add columns (may already exist):', alterError.message);
    } else {
      console.log('✅ Certificate file path columns added');
    }

    console.log('\n🎉 POST-APPROVAL WORKFLOW SETUP COMPLETE!');
    console.log('\nNew features available:');
    console.log('- 📄 Automatic certificate generation when captain approves');
    console.log('- 🔗 QR code generation for pickup verification');
    console.log('- 📋 Pickup tracking and confirmation system');
    console.log('- 📊 Pickup history logging');

  } catch (error) {
    console.error('Error setting up post-approval tables:', error);
  }
}

// Run if called directly
if (require.main === module) {
  setupPostApprovalTables();
}

module.exports = setupPostApprovalTables;