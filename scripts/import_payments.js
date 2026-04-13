const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase credentials not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importCSV() {
    console.log('\n🚀 Starting Revenue Payment Import...');
    const csvFile = '_2026_ MARKETING_Database Payments.csv';
    const csvPath = path.join(process.cwd(), csvFile);
    
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ Error: CSV file not found at: ${csvPath}`);
        return;
    }

    try {
        const workbook = XLSX.readFile(csvPath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`📄 Parsed ${data.length} records from CSV.`);

        const formattedData = data.map(row => {
            let dateVal = row.date;
            let timeVal = row.time || '00:00';

            // Handle Excel serial date (numeric)
            if (typeof dateVal === 'number') {
                // Excel dates are days since 1899-12-30
                const jsDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
                dateVal = jsDate.toISOString().split('T')[0];
                
                // If time is just a fraction in the date cell
                if (row.date % 1 !== 0 && (!row.time || row.time === '00:00')) {
                    timeVal = jsDate.getUTCHours().toString().padStart(2, '0') + ':' + 
                              jsDate.getUTCMinutes().toString().padStart(2, '0');
                }
            } else if (typeof dateVal === 'string') {
                dateVal = dateVal.replace(/\//g, '-');
            }

            // Handle Excel serial time (numeric)
            if (typeof timeVal === 'number') {
                const totalSeconds = Math.round(timeVal * 86400);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                timeVal = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }

            // Clean user names from newlines
            let userName = row.user;
            if (typeof userName === 'string') {
                userName = userName.trim().replace(/\s+/g, ' ');
            }

            return {
                payment_date: dateVal,
                payment_time: timeVal,
                category: row.type || 'Unspecified',
                customer_name: userName || '-',
                amount: Number(row.amount) || 0,
                status: row.status || 'Success',
                invoice_id: row.invoice_id
            };
        }).filter(item => item.invoice_id && item.payment_date);

        console.log(`🛠️ Cleaned data: ${formattedData.length} valid records ready.`);

        // Upsert in batches of 50 to avoid payload limits
        const batchSize = 50;
        let successCount = 0;
        
        for (let i = 0; i < formattedData.length; i += batchSize) {
            const batch = formattedData.slice(i, i + batchSize);
            const { error } = await supabase
                .from('revenue_payments')
                .upsert(batch, { onConflict: 'invoice_id' });

            if (error) {
                console.error(`❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);
            } else {
                successCount += batch.length;
                process.stdout.write(`\r✅ Progress: ${successCount}/${formattedData.length} records synced...`);
            }
        }

        console.log('\n\n✨ Import Complete! Data successfully synced to Supabase.');
        console.log('Next step: Run the aggregation sync in the Admin Panel.');

    } catch (err) {
        console.error('💥 Fatal Error during import:', err.message);
    }
}

importCSV();
