const { supabase } = require('../services/supabaseClient');

async function setupMedicoLegal() {
    console.log('🚀 Setting up Medico Legal columns and workflow...');

    try {
        // 1. Add columns to certificate_requests
        console.log('📋 Adding Medico Legal columns to certificate_requests...');
        const { error: colError } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS date_of_examination DATE;
        ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS usaping_barangay TEXT;
        ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS date_of_hearing DATE;
      `
        });

        if (colError) {
            console.error('❌ Error adding columns:', colError);
        } else {
            console.log('✅ Medico Legal columns added successfully');
        }

        // 2. Update certificate_type constraint
        console.log('📋 Updating certificate_type constraint...');
        const { error: constraintError } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_certificate_type_check;
        ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_certificate_type_check 
        CHECK (certificate_type IN (
          'barangay_clearance',
          'barangay_residency',
          'certificate_of_indigency',
          'natural_death',
          'barangay_guardianship',
          'barangay_cohabitation',
          'medico_legal'
        ));

        ALTER TABLE workflow_configurations DROP CONSTRAINT IF EXISTS chk_config_certificate_type;
        ALTER TABLE workflow_configurations ADD CONSTRAINT chk_config_certificate_type 
        CHECK (certificate_type IN (
          'barangay_clearance',
          'certificate_of_indigency',
          'barangay_residency',
          'natural_death',
          'barangay_guardianship',
          'barangay_cohabitation',
          'medico_legal'
        ));
      `
        });

        if (constraintError) {
            console.error('❌ Error updating constraint:', constraintError);
        } else {
            console.log('✅ constraints updated successfully');
        }

        // 3. Setup default workflow for medico_legal
        console.log('📋 Setting up Medico Legal workflow...');
        const { data: workflowConfig, error: workflowError } = await supabase
            .from('workflow_configurations')
            .upsert({
                certificate_type: 'medico_legal',
                workflow_config: {
                    steps: [
                        {
                            id: 1,
                            name: "Review Request Team",
                            status: "staff_review",
                            assignedUsers: [
                                "1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae",
                                "d165bf34-2a6e-4a33-8f13-a2e9868f28f6"
                            ],
                            requiresApproval: true
                        },
                        {
                            id: 2,
                            name: "Brgy. Secretary Approval",
                            status: "secretary_approval",
                            assignedUsers: [
                                "ca847635-fd64-4e69-9cc7-01998200ddfe"
                            ],
                            requiresApproval: true
                        },
                        {
                            id: 3,
                            name: "Barangay Chairman Approval",
                            status: "captain_approval",
                            assignedUsers: [
                                "9550a8b2-9e32-4f52-a260-52766afb49b1"
                            ],
                            requiresApproval: true
                        },
                        {
                            id: 999,
                            name: "Releasing Team",
                            status: "oic_review",
                            assignedUsers: [
                                "379898b5-06e9-43a7-b51d-213aec975825"
                            ],
                            requiresApproval: true
                        }
                    ]
                },
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'certificate_type' });

        if (workflowError) {
            console.error('❌ Error setting up workflow:', workflowError);
        } else {
            console.log('✅ Medico Legal workflow setup successfully');
        }

        console.log('🎉 Setup completed successfully!');
    } catch (error) {
        console.error('❌ Setup failed:', error);
    }
}

setupMedicoLegal();
