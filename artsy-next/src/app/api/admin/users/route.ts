import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { createErrorResponse } from '@/lib/api-response';
import {
  isSuperAdminAccount,
  CANONICAL_SUPER_ADMIN_EMAIL,
  CANONICAL_SUPER_ADMIN_FORMATTED_PHONE,
  PUBLIC_SUPPORT_PHONE_RAW,
} from '@/lib/auth-utils';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  const isCurrentSuperAdmin = Boolean(authUser && (authUser.role === 'super_admin' || isSuperAdminAccount(authUser)));
  const isAuthorized = Boolean(authUser && (['admin', 'super_admin'].includes(authUser.role) || isCurrentSuperAdmin));

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return createErrorResponse('Database client unavailable', 'Database service is currently unavailable', 503);
  }

  try {
    // 1. Fetch all admin and super_admin users
    let adminsList: any[] = [];
    const { data: dbAdmins, error: adminErr } = await dbClient
      .from('users')
      .select('id, full_name, display_name, phone, email, role, status, avatar_url, studio_details, created_at, updated_at')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: true });

    if (!adminErr && dbAdmins) {
      adminsList = [...dbAdmins];
    } else if (adminErr) {
      console.warn('[admin/users] Admin lookup warning:', adminErr.message);
    }

    // 2. Fetch clients eligible for promotion
    let clientCandidates: any[] = [];
    const { data: candidates } = await dbClient
      .from('users')
      .select('id, full_name, display_name, phone, email, role, status, avatar_url, studio_details, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false })
      .limit(20);

    if (candidates) {
      clientCandidates = candidates;
    }

    // 3. Ensure the single canonical Super Admin is always present in the active roster
    const hasCanonicalSuperAdmin = adminsList.some((u) => isSuperAdminAccount(u));
    if (!hasCanonicalSuperAdmin) {
      adminsList.unshift({
        id: 'usr-superadmin-000',
        full_name: 'Studio Owner (Super Admin)',
        phone: CANONICAL_SUPER_ADMIN_FORMATTED_PHONE,
        email: CANONICAL_SUPER_ADMIN_EMAIL,
        role: 'super_admin',
        status: 'active',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString(),
      });
    }

    // 4. Strictly filter out 8369251112 - it is public WhatsApp/call support, NEVER an admin
    adminsList = adminsList.filter((u) => {
      const p = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
      return p !== PUBLIC_SUPPORT_PHONE_RAW;
    });

    // 5. Enrich admins with verified super admin status and account protection
    const enrichedAdmins = adminsList.map((u: any) => {
      const isSuper = isSuperAdminAccount(u);
      return {
        ...u,
        role: isSuper ? 'super_admin' : (u.role || 'admin'),
        isProtected: isSuper,
      };
    });

    return NextResponse.json({
      success: true,
      currentUserRole: isCurrentSuperAdmin ? 'super_admin' : authUser?.role,
      isSuperAdmin: isCurrentSuperAdmin,
      admins: enrichedAdmins,
      clientCandidates,
    });
  } catch (err: any) {
    return createErrorResponse(err, 'Failed to retrieve administrative users', 500);
  }
}
