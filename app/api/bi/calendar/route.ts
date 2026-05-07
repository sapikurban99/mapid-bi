import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function parseIcsDate(icsDate: string) {
  if (!icsDate) return '';
  const clean = icsDate.replace(/\D/g, ''); // 20260507030000 or 20260507
  if (clean.length >= 8) {
    const year = clean.substring(0, 4);
    const month = clean.substring(4, 6);
    const day = clean.substring(6, 8);
    let formatted = `${year}-${month}-${day}`;
    if (clean.length >= 14) {
      const hours = clean.substring(8, 10);
      const mins = clean.substring(10, 12);
      formatted += `T${hours}:${mins}:00`;
    }
    return formatted;
  }
  return icsDate;
}

function parseICS(icsString: string) {
  const events: any[] = [];
  const lines = icsString.split(/\r?\n/);
  let currentEvent: any = null;
  let inEvent = false;

  for (let line of lines) {
    // Handle folded lines
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (currentEvent && currentEvent._lastProp) {
        currentEvent[currentEvent._lastProp] += line.substring(1);
      }
      continue;
    }

    const match = line.match(/^([^:;]+)([:;])(.*)$/);
    if (!match) continue;

    const name = match[1];
    const value = match[3];

    if (name === 'BEGIN' && value === 'VEVENT') {
      currentEvent = { description: '', location: '' };
      inEvent = true;
      continue;
    }

    if (name === 'END' && value === 'VEVENT') {
      if (currentEvent) {
        events.push(currentEvent);
      }
      inEvent = false;
      currentEvent = null;
      continue;
    }

    if (inEvent && currentEvent) {
      if (name.startsWith('SUMMARY')) {
        currentEvent.title = value;
        currentEvent._lastProp = 'title';
      } else if (name.startsWith('DESCRIPTION')) {
        currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
        currentEvent._lastProp = 'description';
      } else if (name.startsWith('LOCATION')) {
        currentEvent.location = value;
        currentEvent._lastProp = 'location';
      } else if (name.startsWith('DTSTART')) {
        currentEvent.startDate = parseIcsDate(value);
        currentEvent._lastProp = 'startDate';
      } else if (name.startsWith('DTEND')) {
        currentEvent.endDate = parseIcsDate(value);
        currentEvent._lastProp = 'endDate';
      } else if (name.startsWith('UID')) {
        currentEvent.id = value;
        currentEvent._lastProp = 'id';
      }
    }
  }

  return events;
}

export async function GET() {
  try {
    // 1. Fetch Supabase agendas
    const { data: agendas, error: agendasError } = await supabase
      .from('b2b_agendas')
      .select('*')
      .order('start_date', { ascending: true });

    if (agendasError) {
      console.error('Error fetching Supabase agendas:', agendasError);
    }

    // 2. Fetch PrivateEmail ICS
    let externalEvents: any[] = [];
    try {
      const response = await fetch(
        'https://privateemail.com/ajax/share/0ca1abc905510352caaa6a855103470aa783572a470c39b7/1/2/Y2FsOi8vMC84NQ?ical=true',
        { cache: 'no-store' }
      );
      if (response.ok) {
        const icsText = await response.text();
        externalEvents = parseICS(icsText);
      } else {
        console.error('Failed to fetch PrivateEmail calendar:', response.statusText);
      }
    } catch (err) {
      console.error('Error fetching PrivateEmail calendar:', err);
    }

    return NextResponse.json({
      success: true,
      agendas: agendas || [],
      externalEvents,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function syncToCalDav(event: {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  attachmentLink?: string;
}, isDelete = false) {
  const url = `https://dav.privateemail.com/caldav/Y2FsOi8vMC84NQ/${event.id}.ics`;
  const auth = Buffer.from('cal@mapid.io:Indonesi@a1945').toString('base64');

  if (isDelete) {
    try {
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
    } catch (err) {
      console.error('Failed to delete from CalDAV:', err);
    }
    return;
  }

  // Format dates for ICS
  const cleanStartDate = event.startDate.replace(/-/g, '');
  const cleanEndDate = (event.endDate || event.startDate).replace(/-/g, '');

  let dtstart = '';
  let dtend = '';

  if (event.startTime) {
    const cleanTime = event.startTime.replace(/:/g, '') + '00';
    dtstart = `DTSTART:${cleanStartDate}T${cleanTime}`;
    if (event.endTime) {
      const cleanEndTime = event.endTime.replace(/:/g, '') + '00';
      dtend = `DTEND:${cleanEndDate}T${cleanEndTime}`;
    } else {
      dtend = `DTEND:${cleanEndDate}T${cleanTime}`;
    }
  } else {
    dtstart = `DTSTART;VALUE=DATE:${cleanStartDate}`;
    dtend = `DTEND;VALUE=DATE:${cleanEndDate}`;
  }

  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let descriptionLines = event.description || '';
  if (event.attachmentLink) {
    descriptionLines += `\nAttachment Link: ${event.attachmentLink}`;
  }

  // Escape special chars for ICS format
  const escapedTitle = (event.title || '').replace(/[,;]/g, '\\$&');
  const escapedDesc = descriptionLines.replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n');

  const icsBody = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MAPID BI Dashboard//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}`,
    `DTSTAMP:${dtstamp}`,
    dtstart,
    dtend,
    `SUMMARY:${escapedTitle}`,
    `DESCRIPTION:${escapedDesc}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Authorization': `Basic ${auth}`
      },
      body: icsBody
    });
    if (!res.ok) {
      console.error('CalDAV PUT returned non-OK status:', res.status, res.statusText);
    }
  } catch (err) {
    console.error('Error PUTing event to CalDAV:', err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, startDate, endDate, startTime, endTime, attachmentLink, syncToPrivateEmail } = body;

    if (!title || !startDate) {
      return NextResponse.json({ success: false, message: 'Title and start date are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('b2b_agendas')
      .insert({
        title,
        description,
        start_date: startDate,
        end_date: endDate || null,
        start_time: startTime || null,
        end_time: endTime || null,
        attachment_link: attachmentLink || null,
        sync_to_private_email: syncToPrivateEmail || false,
      })
      .select()
      .single();

    if (error) throw error;

    // Sync to PrivateEmail CalDAV asynchronously only if requested
    if (syncToPrivateEmail) {
      await syncToCalDav({
        id: data.id,
        title: data.title,
        description: data.description || '',
        startDate: data.start_date,
        endDate: data.end_date || data.start_date,
        startTime: data.start_time,
        endTime: data.end_time,
        attachmentLink: data.attachment_link,
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, description, startDate, endDate, startTime, endTime, attachmentLink, syncToPrivateEmail } = body;

    if (!id || !title || !startDate) {
      return NextResponse.json({ success: false, message: 'ID, Title, and start date are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('b2b_agendas')
      .update({
        title,
        description,
        start_date: startDate,
        end_date: endDate || null,
        start_time: startTime || null,
        end_time: endTime || null,
        attachment_link: attachmentLink || null,
        sync_to_private_email: syncToPrivateEmail || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Sync updated data to PrivateEmail CalDAV or delete if unchecked
    if (syncToPrivateEmail) {
      await syncToCalDav({
        id: data.id,
        title: data.title,
        description: data.description || '',
        startDate: data.start_date,
        endDate: data.end_date || data.start_date,
        startTime: data.start_time,
        endTime: data.end_time,
        attachmentLink: data.attachment_link,
      });
    } else {
      await syncToCalDav({ id: data.id } as any, true);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('b2b_agendas').delete().eq('id', id);

    if (error) throw error;

    // Delete from PrivateEmail CalDAV asynchronously
    await syncToCalDav({ id } as any, true);

    return NextResponse.json({ success: true, message: 'Agenda deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
