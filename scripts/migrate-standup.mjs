/**
 * Migration Script: Import Daily Standup data from Excel into Supabase daily_standup table
 * 
 * Prerequisites:
 * 1. Run the SQL migration first: supabase/migrations/20260415_add_crm_and_standup.sql
 * 2. Ensure xlsx package installed: npm install xlsx
 * 
 * Usage: node scripts/migrate-standup.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import pkg from 'xlsx';
const { readFile, utils } = pkg;

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

// Excel serial date to ISO string (YYYY-MM-DD)
function excelDateToISO(serial) {
    if (!serial || typeof serial !== 'number' || serial < 40000) return null;
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().slice(0, 10);
}

async function main() {
    console.log('🚀 Starting Daily Standup Migration...');
    console.log('Supabase URL:', supabaseUrl);

    // 1. Read Excel file
    const workbook = readFile('file dokumen/Monitoring Sheets Event dan Task 2026.xlsx');
    const sheet = workbook.Sheets['DAILY STANDUP'];
    
    if (!sheet) {
        console.error('❌ Sheet "DAILY STANDUP" not found!');
        return;
    }

    const rawData = utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(`📊 Read ${rawData.length} rows from DAILY STANDUP sheet`);

    // 2. Parse structure: Col0=Date (Excel serial), Col1=Nama, Col2=Task, Col3=Update/Status, Col4=Notes, Col5=Hambatan
    // Date appears in Col0 for the first member of each day block, and subsequent rows within that block have empty Col0
    
    const standupEntries = [];
    let currentDate = null;
    let currentMember = null;

    for (let i = 1; i < rawData.length; i++) { // Skip header row
        const row = rawData[i];
        if (!row || row.every(c => c === '' || c === null || c === undefined)) continue;

        // Check if new date
        if (row[0] && typeof row[0] === 'number' && row[0] > 40000) {
            currentDate = excelDateToISO(row[0]);
        }

        // Check if new member
        if (row[1] && typeof row[1] === 'string' && row[1].trim().length > 0 && row[1] !== 'Nama') {
            currentMember = row[1].trim();
        }

        // Check if there's a task in Col2
        const task = row[2] ? String(row[2]).trim() : '';
        if (!task || !currentDate || !currentMember) continue;

        // Parse status from Col3
        let status = 'In Progress';
        if (row[3]) {
            const s = String(row[3]).trim().toLowerCase();
            if (s === 'done') status = 'Done';
            else if (s === 'in progress') status = 'In Progress';
        }

        const notes = row[4] ? String(row[4]).trim() : '';
        const hambatan = row[5] ? String(row[5]).trim() : '';

        standupEntries.push({
            date: currentDate,
            member_name: currentMember,
            task: task,
            status: status,
            notes: notes,
            hambatan: hambatan,
        });
    }

    console.log(`📝 Parsed ${standupEntries.length} standup tasks`);
    
    // Show sample
    if (standupEntries.length > 0) {
        console.log('\n📋 Sample entries:');
        standupEntries.slice(0, 5).forEach(e => {
            console.log(`  ${e.date} | ${e.member_name} | ${e.task.substring(0, 60)} | ${e.status}`);
        });
    }

    // 3. Unique dates and members
    const uniqueDates = new Set(standupEntries.map(e => e.date));
    const uniqueMembers = new Set(standupEntries.map(e => e.member_name));
    console.log(`\n📅 Unique dates: ${uniqueDates.size}`);
    console.log(`👥 Unique members: ${[...uniqueMembers].join(', ')}`);

    // 4. Check if we should skip if data already exists
    const { count } = await supabase.from('daily_standup').select('id', { count: 'exact', head: true });
    console.log(`📌 Current daily_standup count: ${count || 0}`);

    if (count && count > 0) {
        console.log('⚠️  daily_standup table already has data. Skipping insert to avoid duplicates.');
        console.log('    To force re-import, first DELETE all rows from daily_standup.');
        return;
    }

    // 5. Batch insert
    const batchSize = 50;
    let inserted = 0;
    for (let i = 0; i < standupEntries.length; i += batchSize) {
        const batch = standupEntries.slice(i, i + batchSize);
        const { error } = await supabase.from('daily_standup').insert(batch);
        if (error) {
            console.error(`❌ Error inserting batch starting at ${i}:`, error.message);
            // Try one-by-one for debugging
            if (error.message.includes('column')) {
                console.error('   This might be a schema issue. Did you run the SQL migration?');
                break;
            }
        } else {
            inserted += batch.length;
            process.stdout.write(`\r  ✅ Inserted ${inserted}/${standupEntries.length}`);
        }
    }

    console.log(`\n\n✅ Migration complete! ${inserted} standup entries imported.`);
}

main().catch(console.error);
