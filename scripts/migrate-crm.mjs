/**
 * Migration Script: Import CRM data from CSV + Excel into Supabase pse_leads table
 * Now handles: INSERT new companies + UPDATE existing ones with CRM fields
 * 
 * Usage: node scripts/migrate-crm.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load env manually
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV manually (simple parser)
function parseCSV(content) {
    const lines = content.split('\n');
    const rows = [];
    for (const line of lines) {
        const row = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') { inQuotes = !inQuotes; continue; }
            if (c === ',' && !inQuotes) { row.push(current.trim()); current = ''; continue; }
            if (c === '\r') continue;
            current += c;
        }
        row.push(current.trim());
        rows.push(row);
    }
    return rows;
}

// Map CRM status to PRESALES_STAGES
function mapStatus(status) {
    const statusMap = {
        'Lead': 'Lead Generation',
        'Contacted': 'Discovery Meeting',
        'Demo/Call of Interest': 'Discovery Meeting',
        'Feasibility Check': 'Feasibility Check',
        'Proposal made': 'Solution Design & FRD',
        'Negotiation': 'Commercial Negotiation',
        'POC': 'Validation & Demo',
        'Won': 'Closed Lost',
        'Lost': 'Closed Lost',
        'Fridge': 'Freeze',
    };
    return statusMap[status] || 'Lead Generation';
}

function parseProbability(val) {
    if (!val) return 0;
    const s = String(val).replace('%', '').trim();
    const n = parseFloat(s);
    if (isNaN(n)) return 0;
    if (n > 1 && n <= 100) return n / 100;
    return n;
}

function parseValue(val) {
    if (!val) return 0;
    const s = String(val).replace(/[^0-9.-]/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}

async function main() {
    console.log('🚀 Starting CRM Migration...');

    // 1. Read CSV data
    const csvContent = readFileSync('file dokumen/MAPID Sales CRM(Sales Funnel).csv', 'utf-8');
    const csvRows = parseCSV(csvContent);
    
    const crmData = new Map();
    
    for (let i = 5; i < csvRows.length; i++) {
        const row = csvRows[i];
        const companyName = row[0];
        if (!companyName || companyName.trim() === '') continue;
        
        crmData.set(companyName.trim(), {
            lead_name: companyName.trim(),
            contact_name: row[1] || null,
            contact_email: row[2] || null,
            contact_number: row[3] || null,
            stage: mapStatus(row[4] || ''),
            forecasted_value: parseValue(row[5]),
            probability: parseProbability(row[6]),
            demo_date: row[7] || null,
            expected_close_date: row[8] || null,
            pic_sales: row[9] || null,
            pse_name_raw: row[10] || null,
            progress: Math.round(parseProbability(row[11]) * 100),
            last_interacted_on: row[12] || null,
            next_step: row[13] || null,
            proposal_link: row[14] || null,
            priority: 'Medium',
            is_closed: (row[4] === 'Lost' || row[4] === 'Won'),
            notes: '',
        });
    }

    console.log(`📊 Parsed ${crmData.size} companies from CSV`);

    // 2. Get existing PSE members
    const { data: pseMembers } = await supabase.from('pse_members').select('*');
    const pseMap = {};
    (pseMembers || []).forEach(p => { pseMap[p.name.toLowerCase()] = p.id; });
    console.log(`👥 PSE members: ${Object.keys(pseMap).join(', ')}`);

    // 3. Get all existing leads
    const { data: existingLeads } = await supabase.from('pse_leads').select('*');
    const existingByName = {};
    (existingLeads || []).forEach(l => { existingByName[l.lead_name.toLowerCase()] = l; });
    console.log(`📌 Existing leads: ${existingLeads?.length || 0}`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const [name, data] of crmData) {
        // Map PSE name to ID
        let pseId = null;
        if (data.pse_name_raw) {
            const rawName = data.pse_name_raw.toLowerCase().trim();
            pseId = pseMap[rawName] || null;
        }

        const crmFields = {
            pic_sales: data.pic_sales,
            contact_name: data.contact_name,
            contact_email: data.contact_email,
            contact_number: data.contact_number,
            forecasted_value: data.forecasted_value,
            probability: data.probability,
            demo_date: data.demo_date,
            expected_close_date: data.expected_close_date,
            last_interacted_on: data.last_interacted_on,
            next_step: data.next_step,
            proposal_link: data.proposal_link,
        };

        const existing = existingByName[name.toLowerCase()];
        
        if (existing) {
            // UPDATE existing record with CRM fields
            const { error } = await supabase.from('pse_leads').update(crmFields).eq('id', existing.id);
            if (error) {
                console.error(`  ❌ Error updating ${name}:`, error.message);
            } else {
                updated++;
                console.log(`  🔄 Updated: ${name}`);
            }
        } else {
            // INSERT new record
            const { error } = await supabase.from('pse_leads').insert({
                lead_name: data.lead_name,
                pse_id: pseId,
                is_closed: data.is_closed,
                stage: data.stage,
                progress: data.progress || 0,
                priority: data.priority,
                notes: data.notes,
                ...crmFields,
            });
            if (error) {
                console.error(`  ❌ Error inserting ${name}:`, error.message);
            } else {
                inserted++;
                console.log(`  ✅ Inserted: ${name}`);
            }
        }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Total CRM entries: ${crmData.size}`);
}

main().catch(console.error);
