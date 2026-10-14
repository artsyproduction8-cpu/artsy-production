import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { items } = body || {};
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    // Process updates in parallel
    const updatePromises = items.map((item: { id: string; display_order: number }) =>
      dbClient
        .from('portfolio_samples')
        .update({
          display_order: Number(item.display_order),
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, message: 'Portfolio order updated' });
  } catch (err: unknown) {
    console.error('[Admin Portfolio Reorder Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
