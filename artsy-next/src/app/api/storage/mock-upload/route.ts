import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  // Reject mock uploads in production
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const key = request.nextUrl.searchParams.get('key') || 'unspecified';
    const blob = await request.arrayBuffer();

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
