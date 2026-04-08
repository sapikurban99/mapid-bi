const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  const workbook = XLSX.readFile('mapid-bi.xlsx');
  
  const mappings = [
    { sheet: 'DB_Revenue', table: 'revenue', map: row => ({ sub_product: row['SubProduct'], quarter: row['Quarter'], target: row['Target'], actual: row['Actual'], achievement_pct: row['Achievement_Pct'] }) },
    { sheet: 'DB_Projects', table: 'projects', map: row => ({ name: row['Name'], phase: row['Phase'], progress: row['Progress'], issue: row['Issue'] }) },
    { sheet: 'DB_Pipeline', table: 'pipeline', map: row => ({ client: row['Client'], industry: row['Industry'], stage: row['Stage'], value_idr: row['Value_IDR'], action: row['Action'], eta: row['ETA'] }) },
    { sheet: 'DB_Campaigns', table: 'campaigns', map: row => ({ campaign_name: row['Campaign_Name'], period: row['Period'], status: row['Status'], leads: row['Leads'], participants: row['Participants'], conversion_pct: row['Conversion_Pct'] }) },
    { sheet: 'DB_Socials', table: 'socials', map: row => ({ month: row['Month'], week: row['Week'], platform: row['Platform'], metric: row['Metric'], value: row['Value'] }) },
    { sheet: 'DB_UserGrowth', table: 'user_growth', map: row => ({ month: row['Month'], week: row['Week'], new_regist: row['NewRegist'], active_geo_users: row['ActiveGeoUsers'], conversion_rate: row['ConversionRate'] }) },
    { sheet: 'DB_Trends', table: 'trends', map: row => ({ label: row['Label'], timeframe: row['Category'] || 'month', revenue_m: row['Revenue_M'], dealsizeavg_m: row['DealSizeAvg_M'] }) },
    { sheet: 'DB_Docs', table: 'docs', map: row => ({ title: row['Title'], category: row['Category'], format: row['Format'], link: row['Link'], description: row['Description'] }) },
    { sheet: 'DB_Academy', table: 'academy', map: row => ({ program: row['Program'], batch: row['Batch'], registrants: row['Registrants'], converted: row['Converted'] }) },
    { sheet: 'DB_Budget', table: 'budget', map: row => ({ date: row['Date'], category: row['Category'], amount: row['Amount'], description: row['Description'] }) },
    { sheet: 'DB_PSE_Members', table: 'pse_members', map: row => ({ name: row['Name'], max_capacity: row['Max_Capacity'], is_active: row['Is_Active'] === true || row['Is_Active'] === 'TRUE' }) },
    // Kanban related might need member IDs, we'll handle them carefully
  ];

  for (const m of mappings) {
    const sheet = workbook.Sheets[m.sheet];
    if (!sheet) {
      console.warn(`Sheet ${m.sheet} not found in Excel`);
      continue;
    }
    const data = XLSX.utils.sheet_to_json(sheet);
    if (data.length === 0) continue;

    console.log(`Migrating ${data.length} rows to ${m.table}...`);
    const formatted = data.map(m.map);
    
    const { error } = await supabase.from(m.table).insert(formatted);
    if (error) {
      console.error(`Error migrating ${m.table}:`, error.message);
    } else {
      console.log(`Successfully migrated ${m.table}`);
    }
  }

  // Handle Kanban Projects, Leads, Partners separately to link with PSE Members
  // We'll fetch members first to create a name -> id map
  const { data: members } = await supabase.from('pse_members').select('id, name');
  const memberMap = {};
  members?.forEach(m => memberMap[m.name] = m.id);

  const kanbanMappings = [
    { sheet: 'DB_Kanban_Projects', table: 'kanban_projects', map: row => ({ client: row['Client'], project_name: row['Project_Name'], pse_id: memberMap[row['PSE_Name']] || null, stage: row['Stage'], progress_pct: row['Progress_Pct'], priority: row['Priority'], notes: row['Notes'] }) },
    { sheet: 'DB_PSE_Leads', table: 'pse_leads', map: row => ({ lead_name: row['Lead_Name'], pse_id: memberMap[row['PSE_Name']] || null, is_closed: row['Is_Closed'] === true, stage: row['Stage'], progress: row['Progress'], priority: row['Priority'], notes: row['Notes'] }) },
    { sheet: 'DB_PSE_Partners', table: 'pse_partners', map: row => ({ partner_name: row['Partner_Name'], pse_id: memberMap[row['PSE_Name']] || null, is_active: row['Is_Active'] === true, type: row['Type'], stage: row['Stage'], progress: row['Progress'], priority: row['Priority'], notes: row['Notes'] }) },
  ];

  for (const m of kanbanMappings) {
    const sheet = workbook.Sheets[m.sheet];
    if (!sheet) continue;
    const data = XLSX.utils.sheet_to_json(sheet);
    const formatted = data.map(m.map);
    const { error } = await supabase.from(m.table).insert(formatted);
    if (error) console.error(`Error migrating ${m.table}:`, error.message);
    else console.log(`Successfully migrated ${m.table}`);
  }

  console.log('Migration completed!');
}

migrate();
