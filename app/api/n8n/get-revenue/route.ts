import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const url = process.env.N8N_REVENUE_WEBHOOK_URL || 'https://n8n.mapid.co.id/webhook/mapid-dashboard-get';
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            // next: { revalidate: 60 } // optional caching
        });

        if (!response.ok) {
            console.error('N8N webhook trigger via proxy failed:', response.statusText);
            return NextResponse.json(
                { error: 'Failed to fetch revenue data from n8n' },
                { status: response.status }
            );
        }

        const data = await response.json().catch(() => null);
        
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('API Route Error fetching proxy n8n:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
