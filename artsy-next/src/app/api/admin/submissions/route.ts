import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = dbClient
      .from('creator_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: submissions, error } = await query;
    if (error) {
      console.error('[Admin Submissions GET Error]', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    // Enrich with creator names and emails from users / creator_profiles
    const creatorIds = Array.from(new Set((submissions || []).map((s: any) => s.creator_id)));
    let creatorMap: Record<string, { name: string; email?: string; phone?: string }> = {};

    if (creatorIds.length > 0) {
      const { data: usersData } = await dbClient
        .from('users')
        .select('id, full_name, email, phone')
        .in('id', creatorIds);

      (usersData || []).forEach((u: any) => {
        creatorMap[u.id] = {
          name: u.full_name || 'Creator',
          email: u.email,
          phone: u.phone,
        };
      });

      const { data: profilesData } = await dbClient
        .from('creator_profiles')
        .select('id, public_display_name')
        .in('id', creatorIds);

      (profilesData || []).forEach((p: any) => {
        if (p.public_display_name && creatorMap[p.id]) {
          creatorMap[p.id].name = p.public_display_name;
        }
      });
    }

    const enriched = (submissions || []).map((s: any) => ({
      ...s,
      creator: creatorMap[s.creator_id] || { name: 'Unknown Creator' },
    }));

    return NextResponse.json({ success: true, submissions: enriched });
  } catch (err: unknown) {
    console.error('[Admin Submissions GET Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
