const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function updateEventImages() {
  console.log('🔧 Updating event images to use working placeholder...\n');
  
  // Get all ibaoeste events
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', 'ibaoeste');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`Found ${events.length} events\n`);
  
  // Update all events with a working placeholder image
  for (const event of events) {
    console.log(`📝 Updating: ${event.title}`);
    console.log(`   Current image: ${event.image}`);
    
    // Use a reliable placeholder image
    const { error: updateError } = await supabase
      .from('events')
      .update({ image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800' })
      .eq('id', event.id);
    
    if (updateError) {
      console.error(`   ❌ Error updating: ${updateError.message}`);
    } else {
      console.log(`   ✅ Updated successfully!`);
    }
  }
  
  console.log('\n✅ Update complete!');
}

updateEventImages().catch(console.error);
