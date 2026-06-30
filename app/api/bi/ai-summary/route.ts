import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { emails, clientName } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ success: false, message: 'Emails array is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    // Prepare the text content from emails
    const emailsText = emails.map((e: any, i: number) => 
      `[Email ${i + 1}]\nDate: ${new Date(e.email_date).toLocaleString()}\nFrom: ${e.from_addr}\nSubject: ${e.subject || '(No Subject)'}\nBody: ${e.body ? e.body.substring(0, 1000) : 'Empty body'}`
    ).join('\n\n');

    const prompt = `You are a professional B2B assistant. Here is a history of recent email conversations with our client "${clientName}".\n\nPlease provide a very concise, professional, and easy-to-read summary of the key points, action items, or the essence of these conversations. Use bullet points where appropriate. Write in Indonesian language.\n\nEmails:\n${emailsText}`;

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', errorText);
      return NextResponse.json({ success: false, message: 'Failed to generate summary from AI provider.' }, { status: response.status });
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'No summary generated.';

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error('AI Summary Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
