const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkImageUrls() {
  const { data } = await supabase.from('events').select('title, image').eq('tenant_id', 'ibaoeste');
  console.log('--- EVENTS IMAGE URLS (ibaoeste) ---');
  data.forEach(item => {
      console.log(`[${item.title}] -> ${item.image}`);
  });
}

checkImageUrls();
