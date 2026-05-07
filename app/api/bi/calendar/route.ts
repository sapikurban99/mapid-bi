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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, startDate, endDate, startTime, endTime, attachmentLink } = body;

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
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, description, startDate, endDate, startTime, endTime, attachmentLink } = body;

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
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

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

    return NextResponse.json({ success: true, message: 'Agenda deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
