const { supabase } = require('./backend/services/supabaseClient');

async function checkWorkflowConfigurationsTable() {
  try {
    console.log('=== CHECKING WORKFLOW_CONFIGURATIONS TABLE ===');
    
    // Try to query the table to see if it exists
    const { data, error } = await supabase
      .from('workflow_configurations')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.log('❌ workflow_configurations table does not exist');
        console.log('Creating workflow_configurations table...');
        
        // Create the table
        const { error: createError } = await supabase.rpc('create_workflow_configurations_table');
        
        if (createError) {
          console.log('Failed to create table via RPC, trying direct SQL...');
          
          // Try creating with direct SQL
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS workflow_configurations (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              certificate_type VARCHAR(100) NOT NULL UNIQUE,
              workflow_config JSONB NOT NULL,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create index for faster lookups
            CREATE INDEX IF NOT EXISTS idx_workflow_configurations_certificate_type 
            ON workflow_configurations(certificate_type);
            
            -- Create index for active workflows
            CREATE INDEX IF NOT EXISTS idx_workflow_configurations_active 
            ON workflow_configurations(is_active);
          `;
          
          console.log('Creating table with SQL...');
          console.log('Note: You may need to run this SQL manually in Supabase SQL Editor:');
          console.log(createTableSQL);
          
          return;
        } else {
          console.log('✅ workflow_configurations table created successfully');
        }
      } else {
        console.error('Error querying workflow_configurations table:', error);
        return;
      }
    } else {
      console.log('✅ workflow_configurations table exists');
      console.log(`Found ${data?.length || 0} existing configurations`);
    }
    
    // Check current configurations
    const { data: configs, error: configError } = await supabase
      .from('workflow_configurations')
      .select('*');
    
    if (configError) {
      console.error('Error fetching configurations:', configError);
    } else {
      console.log('\nCurrent workflow configurations:');
      if (configs && configs.length > 0) {
        configs.forEach(config => {
          console.log(`- ${config.certificate_type}: ${config.is_active ? 'Active' : 'Inactive'}`);
        });
      } else {
        console.log('No configurations found');
      }
    }
    
  } catch (error) {
    console.error('Error checking workflow_configurations table:', error);
  }
}

checkWorkflowConfigurationsTable();