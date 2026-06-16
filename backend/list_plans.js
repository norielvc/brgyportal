const { supabase } = require('./services/supabaseClient');

async function check() {
  const { data, error } = await supabase.from('subscription_plans').select('*');
  if (error) {
      console.error('Error:', error);
  } else {
      console.log('Plans:', data);
  }
}
check();
