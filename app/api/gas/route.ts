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
      // Coba ubah response jadi JSON
      const jsonData = JSON.parse(textData); 
      return NextResponse.json(jsonData);
      
    } catch (parseError) {
      // JIKA GAGAL, kirim cuplikan HTML/Error ke Frontend
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