import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const invoiceId = pathname.split('/').slice(-2)[0]; // Extract invoiceId from path

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // For now, return a mock PDF download URL
    const downloadUrl = `https://files.stripe.com/v1/files/${invoiceId}/contents`;

    return NextResponse.json({ 
      downloadUrl,
      filename: `invoice-${invoiceId}.pdf` 
    });

  } catch (error) {
    console.error('Error generating invoice download:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
