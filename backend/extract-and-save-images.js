const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function extractImages() {
  console.log('🔍 Extracting base64 images from demo tenant...\n');
  
  // Get demo events with base64 images
  const { data: demoEvents, error } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', 'demo')
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`Found ${demoEvents.length} demo events\n`);
  
  // Create output directory
  const outputDir = path.join(__dirname, 'extracted-images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Extract and save each image
  demoEvents.forEach((event, i) => {
    if (event.image && event.image.startsWith('data:')) {
      console.log(`📸 Extracting image from: ${event.title}`);
      
      // Parse the base64 data
      const matches = event.image.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const extension = matches[1]; // webp, jpeg, png, etc.
        const base64Data = matches[2];
        
        // Create filename
        const filename = `demo-event-${i + 1}-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${extension}`;
        const filepath = path.join(outputDir, filename);
        
        // Save to file
        fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
        
        const sizeInKB = (fs.statSync(filepath).size / 1024).toFixed(2);
        console.log(`   ✅ Saved: ${filename} (${sizeInKB} KB)`);
      }
    }
  });
  
  console.log(`\n✅ Images extracted to: ${outputDir}`);
  console.log('\nYou can now:');
  console.log('1. Use these images as templates for ibaoeste events');
  console.log('2. Upload proper event photos through the admin panel');
  console.log('3. Store images in Supabase Storage and reference them by URL');
}

extractImages().catch(console.error);
