import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: projects, error } = await supabaseAdmin
    .from('projects')
    .select('id, title, status, created_at, order_id, project_number, current_revision_round, max_free_revisions, client_deadline')
    .eq('client_id', authUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Client Projects API] Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to load projects', projects: [] }, { status: 500 });
  }

  return NextResponse.json({ success: true, projects: projects || [] });
}
