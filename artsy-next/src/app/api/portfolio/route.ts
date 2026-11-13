import { NextResponse } from 'next/server';
import { getEnrichedPortfolioVideos } from '@/lib/portfolio';

export const revalidate = 60;

export async function GET() {
  try {
    const samples = await getEnrichedPortfolioVideos();

    return NextResponse.json(
      { success: true, samples },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: unknown) {
    console.error('[Portfolio API Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
