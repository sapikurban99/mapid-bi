import { NextResponse } from 'next/server';

export async function GET() {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;

  if (!gasUrl) {
    return NextResponse.json({
      isError: true,
      title: "Missing URL",
      message: "NEXT_PUBLIC_GAS_URL belum diisi di file .env.local"
    });
  }

  try {
    const response = await fetch(gasUrl, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store'
    });

    const textData = await response.text();

    try {
      const jsonData = JSON.parse(textData);
      return NextResponse.json(jsonData);

    } catch (parseError) {
      return NextResponse.json({
        isError: true,
        title: "Google Apps Script Error (Bukan JSON)",
        message: "Google mengembalikan halaman web/error HTML, bukan data. Pastikan kamu sudah men-deploy sebagai 'New Version'.",
        raw_google_response: textData.substring(0, 300)
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      isError: true,
      title: "Fetch Error",
      message: error.message
    });
  }
}

export async function POST(request: Request) {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;

  if (!gasUrl) {
    return NextResponse.json({
      success: false,
      message: "NEXT_PUBLIC_GAS_URL belum diisi di file .env.local"
    });
  }

  try {
    const body = await request.json();

    const response = await fetch(gasUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const textData = await response.text();

    try {
      const jsonData = JSON.parse(textData);
      return NextResponse.json(jsonData);
    } catch {
      return NextResponse.json({
        success: false,
        message: "GAS returned non-JSON response. Pastikan doPost() sudah di-deploy sebagai New Version.",
        raw: textData.substring(0, 300)
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `Network error: ${error.message}`
    });
  }
}