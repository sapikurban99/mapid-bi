import { NextResponse } from 'next/server';
import { deleteWaCrmContact } from '../../../../services/biService';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });

    await deleteWaCrmContact(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
