import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key') || 'unspecified';
    const blob = await request.arrayBuffer();

    console.log(`[Storage Mock Ingest] Received direct PUT upload for key: ${key} (${blob.byteLength} bytes)`);

    return new NextResponse(null, {
      status: 200,
      headers: {
        'x-amz-request-id': `mock_req_${Date.now()}`,
        'ETag': `"mock_etag_${Date.now()}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Mock upload failed' }, { status: 500 });
  }
}
