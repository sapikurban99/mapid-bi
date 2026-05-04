import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const PROBABILITY_MAP = {
  'Lead Generation': 0.1,
  'Discovery Meeting': 0.2,
  'MoM & BRD Creation': 0.3,
  'Technical Handover': 0.4,
  'Feasibility Check': 0.5,
  'Solution Design & FRD': 0.6,
  'Validation & Demo': 0.8,
  'Commercial Negotiation': 0.9,
  'Freeze': 0,
  'Closed Lost': 0,
  'Feasibility & Design': 0.5,
  'Demo / POC': 0.6,
  'Development & Data': 0.7,
  'Internal Testing': 0.8,
  'UAT with Client': 0.9,
  'Training & Go Live': 1.0,
  'Value Review': 1.0,
  'Done': 1.0,
  'Lost': 0
};

async function main() {
  console.log("Fetching leads...");
  const { data: leads } = await supabase.from('pse_leads').select('id, stage');
  for (const l of leads || []) {
    const p = PROBABILITY_MAP[l.stage] ?? 0;
    const progress = Math.round(p * 100);
    await supabase.from('pse_leads').update({ progress, probability: p }).eq('id', l.id);
  }
  
  console.log("Fetching projects...");
  const { data: projects } = await supabase.from('kanban_projects').select('id, stage');
  for (const p of projects || []) {
    const prob = PROBABILITY_MAP[p.stage] ?? 0;
    const progress = Math.round(prob * 100);
    await supabase.from('kanban_projects').update({ progress_pct: progress, probability: prob }).eq('id', p.id);
  }
  
  console.log("Done updating progress!");
}
main();
