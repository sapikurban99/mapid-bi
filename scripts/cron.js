const cron = require('node-cron');
const { exec } = require('child_process');

console.log('[Scheduler] Email Scraper Cron Job initialized. Scheduled for 07:00 AM daily.');

cron.schedule('0 7 * * *', () => {
    console.log('[Scheduler] Running daily email scraper at 07:00 AM...');
    
    // Execute the python script
    exec('python3 scripts/email-historical-scraper.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`[Scheduler Error] exec error: ${error}`);
            return;
        }
        if (stderr) {
            console.error(`[Scheduler Stderr] ${stderr}`);
        }
        console.log(`[Scheduler Output]\n${stdout}`);
        console.log('[Scheduler] Daily email scraper completed.');
    });
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Assuming WIB for standard Indonesian time
});
