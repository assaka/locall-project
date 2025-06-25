import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = url.searchParams.get('to');

  const twiml = `
    <Response>
      <Dial record="record-from-answer-dual">${to}</Dial>
    </Response>
  `;
  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
