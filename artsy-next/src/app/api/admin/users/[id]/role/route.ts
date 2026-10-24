import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { isSuperAdminAccount, PUBLIC_SUPPORT_PHONE_RAW } from '@/lib/auth-utils';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthenticatedUser(request);
  const { id } = await params;

  const isCallerSuperAdmin = Boolean(authUser && (authUser.role === 'super_admin' || isSuperAdminAccount(authUser)));
  if (!authUser || !isCallerSuperAdmin) {
    return NextResponse.json({ error: 'Only Super Admin can manage user roles' }, { status: 403 });
  }

  const limit = await checkRateLimit(`admin_role_patch_${authUser.id}`, 'admin', 10, 600);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Role modification limit reached. Please wait.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const { role } = body;

  if (!['client', 'freelancer', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role. Cannot assign super_admin.' }, { status: 400 });
  }

  // Prevent modifying mock or canonical Super Admin
  if (id === 'usr-superadmin-000' || id === 'usr-superadmin-canonical') {
    return NextResponse.json({ error: 'Cannot modify the canonical Super Admin account' }, { status: 403 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
  }

  const { data: targetUser, error: fetchErr } = await dbClient.from('users').select('*').eq('id', id).single();

  if (fetchErr || !targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (isSuperAdminAccount(targetUser)) {
    return NextResponse.json({ error: 'Cannot modify Super Admin account' }, { status: 403 });
  }

  const targetPhone = targetUser.phone ? targetUser.phone.replace(/\D/g, '').slice(-10) : '';
  if (targetPhone === PUBLIC_SUPPORT_PHONE_RAW) {
    return NextResponse.json(
      { error: 'Contact +91 83692 51112 is reserved strictly for public support and cannot be granted admin roles.' },
      { status: 400 }
    );
  }

  const { error } = await dbClient.from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: id, newRole: role });
}
