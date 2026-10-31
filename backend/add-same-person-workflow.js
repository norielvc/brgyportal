const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addWorkflowConfig() {
    console.log('Adding workflow configuration for "certification_same_person"...');

    const config = {
        steps: [
            {
                "id": 111,
                "name": "Review Request Team",
                "status": "staff_review",
                "assignedUsers": [
                    "1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae",
                    "d165bf34-2a6e-4a33-8f13-a2e9868f28f6"
                ],
                "requiresApproval": true
            },
            {
                "id": 2,
                "name": "Brgy. Secretary Approval",
                "status": "secretary_approval",
                "assignedUsers": [
                    "ca847635-fd64-4e69-9cc7-01998200ddfe"
                ],
                "requiresApproval": true
            },
            {
                "id": 3,
                "name": "Barangay Chairman Approval",
                "status": "captain_approval",
                "assignedUsers": [
                    "9550a8b2-9e32-4f52-a260-52766afb49b1"
                ],
                "requiresApproval": true
            },
            {
                "id": 999,
                "name": "Releasing Team",
                "status": "oic_review",
                "assignedUsers": [
                    "379898b5-06e9-43a7-b51d-213aec975825"
                ],
                "requiresApproval": true
            }
        ]
    };

    const { data, error } = await supabase
        .from('workflow_configurations')
        .insert([{
            certificate_type: 'certification_same_person',
            workflow_config: config,
            is_active: true
        }]);

    if (error) {
        console.error('Error adding workflow config:', error);
    } else {
        console.log('Successfully added workflow configuration.');
    }
}

addWorkflowConfig();
