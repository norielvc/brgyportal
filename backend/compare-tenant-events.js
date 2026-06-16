const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function compareEvents() {
  console.log('🔍 Comparing events between demo and ibaoeste tenants...\n');
  
  // Get demo events
  const { data: demoEvents, error: demoError } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', 'demo')
    .order('order_index', { ascending: true });
  
  if (demoError) {
    console.error('❌ Error fetching demo events:', demoError.message);
    return;
  }
  
  // Get ibaoeste events
  const { data: ibaoEvents, error: ibaoError } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', 'ibaoeste')
    .order('order_index', { ascending: true });
  
  if (ibaoError) {
    console.error('❌ Error fetching ibaoeste events:', ibaoError.message);
    return;
  }
  
  console.log('='.repeat(80));
  console.log('DEMO TENANT EVENTS');
  console.log('='.repeat(80));
  console.log(`Total: ${demoEvents.length} events\n`);
  
  demoEvents.forEach((event, i) => {
    console.log(`${i + 1}. ${event.title}`);
    console.log(`   Order Index: ${event.order_index}`);
    console.log(`   Image: ${event.image}`);
    console.log(`   Date: ${event.date}`);
    if (event.body) {
      console.log(`   Body: ${event.body.substring(0, 100)}...`);
    }
    console.log('');
  });
  
  console.log('='.repeat(80));
  console.log('IBAOESTE TENANT EVENTS');
  console.log('='.repeat(80));
  console.log(`Total: ${ibaoEvents.length} events\n`);
  
  ibaoEvents.forEach((event, i) => {
    console.log(`${i + 1}. ${event.title}`);
    console.log(`   Order Index: ${event.order_index}`);
    console.log(`   Image: ${event.image}`);
    console.log(`   Date: ${event.date}`);
    if (event.body) {
      console.log(`   Body: ${event.body.substring(0, 100)}...`);
    }
    console.log('');
  });
  
  console.log('='.repeat(80));
  console.log('COMPARISON SUMMARY');
  console.log('='.repeat(80));
  console.log(`Demo events: ${demoEvents.length}`);
  console.log(`Ibaoeste events: ${ibaoEvents.length}`);
  console.log('');
  
  // Check image patterns
  const demoImageTypes = demoEvents.map(e => {
    if (!e.image) return 'null';
    if (e.image.startsWith('data:')) return 'base64';
    if (e.image.startsWith('http')) return 'external URL';
    if (e.image.startsWith('/')) return 'relative path';
    return 'other';
  });
  
  const ibaoImageTypes = ibaoEvents.map(e => {
    if (!e.image) return 'null';
    if (e.image.startsWith('data:')) return 'base64';
    if (e.image.startsWith('http')) return 'external URL';
    if (e.image.startsWith('/')) return 'relative path';
    return 'other';
  });
  
  console.log('Demo image types:', [...new Set(demoImageTypes)].join(', '));
  console.log('Ibaoeste image types:', [...new Set(ibaoImageTypes)].join(', '));
}

compareEvents().catch(console.error);
