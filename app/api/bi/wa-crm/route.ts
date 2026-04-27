import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { getWaCrmData } from '../../../services/biService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;
    
    const data = await getWaCrmData(startDate, endDate);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message,
    }, { status: 500 });
  }
}
