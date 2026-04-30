const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: camps } = await supabase.from('campaigns').select('*').limit(1);
  const { data: buds } = await supabase.from('budget').select('*').limit(1);
  console.log("Campaigns:", camps);
  console.log("Budget:", buds);
}
run();
