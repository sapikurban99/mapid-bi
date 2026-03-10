import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        // The n8n webhook URL defaults to a process.env variable, or a dummy endpoint
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.example.com/webhook/wa-blast';

        // Forward payload to n8n webhook
        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any necessary authentication headers for n8n if required
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('n8n webhook error:', response.statusText);
            return NextResponse.json(
                { error: 'Failed to trigger n8n workflow' },
                { status: response.status }
            );
        }

        const data = await response.json().catch(() => ({ message: 'Workflow triggered successfully but no JSON response.' }));
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('API Route Error:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
