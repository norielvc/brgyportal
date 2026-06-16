const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkImageSizes() {
  console.log('🔍 Checking image data in events for ibaoeste...\n');
  
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', 'ibaoeste')
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`Found ${events.length} events\n`);
  
  events.forEach((event, i) => {
    console.log(`${i + 1}. ${event.title}`);
    console.log(`   Image: ${event.image}`);
    
    // Check if image is a data URL (base64)
    if (event.image && event.image.startsWith('data:')) {
      const sizeInBytes = event.image.length;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      
      console.log(`   ⚠️  BASE64 IMAGE DETECTED!`);
      console.log(`   Size: ${sizeInKB} KB (${sizeInMB} MB)`);
      console.log(`   First 100 chars: ${event.image.substring(0, 100)}...`);
    } else if (event.image) {
      console.log(`   ✅ URL reference (good)`);
    } else {
      console.log(`   ℹ️  No image`);
    }
    
    // Check body field
    if (event.body) {
      const bodySize = event.body.length;
      console.log(`   Body size: ${bodySize} characters`);
      if (bodySize > 10000) {
        console.log(`   ⚠️  Large body field!`);
      }
    }
    
    console.log('');
  });
  
  // Calculate total data size
  const totalSize = JSON.stringify(events).length;
  const totalKB = (totalSize / 1024).toFixed(2);
  const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log('='.repeat(80));
  console.log(`Total events data size: ${totalKB} KB (${totalMB} MB)`);
  
  if (totalSize > 100000) {
    console.log('⚠️  WARNING: Events data is very large! This could cause slow loading.');
  } else if (totalSize > 50000) {
    console.log('⚠️  Events data is moderately large. Consider optimizing.');
  } else {
    console.log('✅ Events data size is reasonable.');
  }
}

checkImageSizes().catch(console.error);
