import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Force dynamic so it doesn't cache the API response
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[Email Sync] Starting manual sync...');
    
    // 1. Get last sync timestamp
    const { data: configData } = await supabase
      .from('admin_config')
      .select('value')
      .eq('key', 'last_email_sync_timestamp')
      .single();
      
    let lastSyncDate = new Date();
    lastSyncDate.setDate(lastSyncDate.getDate() - 1); // default yesterday
    if (configData?.value) {
      lastSyncDate = new Date(configData.value);
    }

    // 3. Get all active client names
    const [projectsRes, leadsRes] = await Promise.all([
      supabase.from('kanban_projects').select('client'),
      supabase.from('pse_leads').select('lead_name')
    ]);

    const projectClients = (projectsRes.data || []).map(r => r.client).filter(Boolean);
    const leadClients = (leadsRes.data || []).map(r => r.lead_name).filter(Boolean);
    const allClients = Array.from(new Set([...projectClients, ...leadClients]));

    if (allClients.length === 0) {
      return NextResponse.json({ success: true, message: 'No clients found.' });
    }

    // 4. Connect to IMAP
    const client = new ImapFlow({
      host: process.env.IMAP_HOST || 'imap.privateemail.com',
      port: parseInt(process.env.IMAP_PORT || '993', 10),
      secure: true,
      auth: {
        user: process.env.IMAP_USER || '',
        pass: process.env.IMAP_PASS || ''
      },
      logger: false
    });

    await client.connect();

    // 5. Search emails since last sync
    const searchDate = new Date(lastSyncDate);
    searchDate.setHours(0, 0, 0, 0); // IMAP since is date-only

    // We get a list of existing message_ids from the last 3 days to prevent duplicates
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const { data: existingMails } = await supabase
      .from('client_emails')
      .select('subject')
      .gte('email_date', threeDaysAgo.toISOString());
    const existingSubjects = new Set((existingMails || []).map(m => m.subject));

    let lock = await client.getMailboxLock('INBOX');
    let matchedEmails = [];

    try {
      // Search INBOX for emails since the date of our last sync
      const searchRes = await client.search({ since: searchDate });
      
      if (searchRes && typeof searchRes !== 'boolean' && searchRes.length > 0) {
        const seqs = searchRes.join(',');
        
        // Fetch envelope and body
        const fetchStream = client.fetch(seqs, { envelope: true, source: true });
        for await (const message of fetchStream) {
          try {
            const parsed = (await simpleParser(message.source || Buffer.from(''))) as any;
            const subject = parsed.subject || '';
            const body = parsed.text || '';
            const from = parsed.from?.text || '';
            const to = parsed.to?.text || '';
            const emailDate = parsed.date ? new Date(parsed.date) : new Date();

            if (emailDate <= lastSyncDate) continue; // Skip emails older than our last sync exact time
            
            if (existingSubjects.has(subject)) continue; // skip duplicates

            // Check if subject, body, from, or to contains any client name (case insensitive)
            const combinedText = `${subject} ${body} ${from} ${to}`.toLowerCase();
            let matchedClient = null;
            
            for (const cName of allClients) {
              if (combinedText.includes(cName.toLowerCase())) {
                matchedClient = cName;
                break;
              }
            }

            if (matchedClient) {
              matchedEmails.push({
                client_name: matchedClient,
                subject: parsed.subject,
                from_addr: parsed.from?.text || '',
                to_addr: parsed.to?.text || '',
                email_date: emailDate.toISOString(),
                body: parsed.text || ''
              });
            }
          } catch (e) {
            console.error('Error parsing email UID:', message.uid, e);
          }
        }
      }
    } finally {
      lock.release();
    }
    
    await client.logout();

    // 6. Insert new matching emails
    if (matchedEmails.length > 0) {
      const { error: dbError } = await supabase.from('client_emails').insert(matchedEmails);
      if (dbError) {
        console.error('Error inserting synced emails:', dbError);
      } else {
        console.log(`[Email Sync] Inserted ${matchedEmails.length} new emails.`);
      }
    } else {
      console.log('[Email Sync] No new matching emails found.');
    }

    // Update last sync timestamp to now
    await supabase.from('admin_config').upsert({
      key: 'last_email_sync_timestamp',
      value: new Date().toISOString(),
      description: 'Exact timestamp of the last email sync'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Sync completed', 
      processed: matchedEmails.length,
      emails: matchedEmails.map(m => ({ subject: m.subject, client: m.client_name, date: m.email_date }))
    });

  } catch (error: any) {
    console.error('Email Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
