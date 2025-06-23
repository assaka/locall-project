import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { name, phone, message } = await request.json();

  if (!name || !phone || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  console.log('Form submission:', { name, phone, message });
  return NextResponse.json({ success: true });
} 