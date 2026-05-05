import { NextResponse } from 'next/server';
import { getWaBlastContacts, saveWaBlastContacts } from '../../../services/biService';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupName = searchParams.get('group_name') || undefined;
    const data = await getWaBlastContacts(groupName);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'upload') {
      const { contacts } = body;
      if (!contacts || !Array.isArray(contacts)) {
        return NextResponse.json({ success: false, message: 'Invalid contacts data' }, { status: 400 });
      }
      const data = await saveWaBlastContacts(contacts);
      return NextResponse.json({ success: true, data });
    } 
    
    if (action === 'send') {
      const { groupName, message, imageUrl } = body;
      if (!groupName) {
        return NextResponse.json({ success: false, message: 'Group name is required' }, { status: 400 });
      }

      const { data: contacts, error } = await supabase
        .from('wa_blast_contacts')
        .select('*')
        .eq('group_name', groupName);
        
      if (error) throw error;
      if (!contacts || contacts.length === 0) {
        return NextResponse.json({ success: false, message: 'No contacts found' }, { status: 404 });
      }

      const n8nWebhookUrl = 'https://n8n.mapid.co.id/webhook/wa-business-blast';
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName,
          message,
          imageUrl,
          contacts: contacts.map((c: any) => {
            const personalizedMessage = message.replace(/{name}/g, c.name || 'Pelanggan');
            return {
              name: c.name,
              phoneNumber: c.phone_number,
              message: personalizedMessage
            };
          })
        })
      });

      if (!response.ok) {
        throw new Error(`n8n responded with ${response.status}`);
      }

      await supabase
        .from('wa_blast_contacts')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('group_name', groupName);

      return NextResponse.json({ success: true, message: 'Blast triggered' });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
