import { NextResponse } from 'next/server';
import { syncSocialsFromN8n, getSocialScrapeLogs } from '../../../services/biService';

export async function GET() {
  try {
    const logs = await getSocialScrapeLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform } = body;

    if (!platform) {
      return NextResponse.json({ success: false, message: 'Platform is required' }, { status: 400 });
    }

    const result = await syncSocialsFromN8n(platform);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
