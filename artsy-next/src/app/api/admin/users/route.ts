import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

const SUPER_ADMIN_PHONE = '+917777078742';
const SUPER_ADMIN_EMAIL = 'lilsammy96@gmail.com';

export async function GET(request: Request) {
  const authUser = getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    // 1. Fetch all admin and super_admin users
    const { data: admins, error: adminErr } = await dbClient
      .from('users')
      .select('id, full_name, phone, email, role, status, created_at, updated_at, last_sign_in_at')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: true });

    if (adminErr) {
      return NextResponse.json({ error: adminErr.message }, { status: 500 });
    }

    // 2. Fetch clients eligible for promotion
    const { data: clientCandidates } = await dbClient
      .from('users')
      .select('id, full_name, phone, email, role, status, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false })
      .limit(20);

    const enrichedAdmins = (admins || []).map((u: any) => {
      const isSuperAdmin = u.role === 'super_admin' || u.phone === SUPER_ADMIN_PHONE || u.email === SUPER_ADMIN_EMAIL;
      return {
        ...u,
        role: isSuperAdmin ? 'super_admin' : u.role,
        isProtected: isSuperAdmin,
      };
    });

    return NextResponse.json({
      success: true,
      currentUserRole: authUser.role,
      isSuperAdmin: authUser.role === 'super_admin',
      admins: enrichedAdmins,
      clientCandidates: clientCandidates || [],
    });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
