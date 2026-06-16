const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkDemoImages() {
  console.log('🔍 Checking demo tenant event images...\n');
  
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', 'demo')
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`Found ${events.length} events\n`);
  
  events.forEach((event, i) => {
    console.log(`${i + 1}. ${event.title}`);
    console.log(`   Order Index: ${event.order_index}`);
    console.log(`   Date: ${event.date}`);
    
    if (event.image) {
      if (event.image.startsWith('data:')) {
        const sizeInKB = (event.image.length / 1024).toFixed(2);
        const sizeInMB = (event.image.length / (1024 * 1024)).toFixed(2);
        console.log(`   ⚠️  BASE64 IMAGE: ${sizeInKB} KB (${sizeInMB} MB)`);
        console.log(`   First 100 chars: ${event.image.substring(0, 100)}...`);
      } else {
        console.log(`   ✅ Image URL: ${event.image}`);
      }
    } else {
      console.log(`   ℹ️  No image`);
    }
    
    if (event.body) {
      console.log(`   Body: ${event.body.substring(0, 100)}...`);
    }
    console.log('');
  });
}

checkDemoImages().catch(console.error);
