import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthenticatedUser(request);
  const { id } = await params;

  if (!authUser || authUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can manage user roles' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { role } = body;

  if (!['client', 'freelancer', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role. Cannot assign super_admin.' }, { status: 400 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
  }

  const { data: targetUser, error: fetchErr } = await dbClient.from('users').select('role').eq('id', id).single();

  if (fetchErr || !targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (targetUser.role === 'super_admin') {
    return NextResponse.json({ error: 'Cannot modify Super Admin account' }, { status: 403 });
  }

  const { error } = await dbClient.from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: id, newRole: role });
}
