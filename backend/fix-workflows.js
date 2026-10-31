const { supabase } = require('./services/supabaseClient');

async function fixWorkflows() {
  console.log('--- Fixing Workflow Configurations ---');
  const { data: configs, error } = await supabase
    .from('workflow_configurations')
    .select('id, certificate_type, workflow_config');

  if (error) {
    console.error('Error fetching configs:', error);
    return;
  }

  for (const config of configs) {
    let updated = false;
    const wf = config.workflow_config;
    
    if (wf && wf.steps) {
      wf.steps = wf.steps.map(step => {
        // If step already has officialRole, don't touch it unless it's null/None
        if (step.officialRole && step.officialRole !== 'None') return step;

        const name = (step.name || '').toLowerCase();
        const status = (step.status || '').toLowerCase();

        if (name.includes('secretary') || status.includes('secretary')) {
          step.officialRole = 'Brgy. Secretary';
          updated = true;
          console.log(`[${config.certificate_type}] Added Brgy. Secretary to step: ${step.name}`);
        } else if (name.includes('captain') || name.includes('chairman') || status.includes('captain') || status.includes('chairman')) {
          step.officialRole = 'Brgy. Chairman';
          updated = true;
          console.log(`[${config.certificate_type}] Added Brgy. Chairman to step: ${step.name}`);
        }
        
        return step;
      });
    }

    if (updated) {
      const { error: updateError } = await supabase
        .from('workflow_configurations')
        .update({ workflow_config: wf })
        .eq('id', config.id);

      if (updateError) {
        console.error(`Error updating ${config.certificate_type}:`, updateError);
      } else {
        console.log(`✅ Updated ${config.certificate_type}`);
      }
    }
  }
}

fixWorkflows();
