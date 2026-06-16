const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function fixLargeImage() {
  console.log('🔧 Fixing large base64 image in events...\n');
  
  // Get all ibaoeste events
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', 'ibaoeste');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  // Find and fix events with base64 images
  for (const event of events) {
    if (event.image && event.image.startsWith('data:')) {
      const sizeInKB = (event.image.length / 1024).toFixed(2);
      console.log(`📝 Event: ${event.title}`);
      console.log(`   Current image size: ${sizeInKB} KB`);
      console.log(`   Replacing with default image...`);
      
      // Replace with a working placeholder image URL
      // Using a reliable external placeholder or the public background
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
  }
  
  console.log('\n✅ Fix complete!');
}

fixLargeImage().catch(console.error);
