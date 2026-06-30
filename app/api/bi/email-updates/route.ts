import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/bi/email-updates?client=X or GET /api/bi/email-updates?clients=true
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Return distinct client names (for n8n to consume)
    if (searchParams.get('clients') === 'true') {
      const [projectsRes, leadsRes] = await Promise.all([
        supabase.from('kanban_projects').select('client'),
        supabase.from('pse_leads').select('lead_name'),
      ]);
      const projectClients = (projectsRes.data || []).map(r => r.client).filter(Boolean);
      const leadNames = (leadsRes.data || []).map(r => r.lead_name).filter(Boolean);
      const uniqueClients = [...new Set([...projectClients, ...leadNames])].sort();
      return NextResponse.json({ success: true, clients: uniqueClients });
    }

    // Return email updates for a specific client
    const client = searchParams.get('client');
    if (!client) {
      return NextResponse.json({ success: false, message: 'client param is required' }, { status: 400 });
    }

    const rawEmailsRes = await supabase
      .from('client_emails')
      .select('*')
      .eq('client_name', client)
      .order('email_date', { ascending: true });

    if (rawEmailsRes.error) throw rawEmailsRes.error;
    
    return NextResponse.json({ success: true, raw_emails: rawEmailsRes.data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
