import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAndParseAuthCookie,
  getAuthenticatedUser,
  signAuthCookieValue,
  AUTH_COOKIE_NAME,
  invalidateUserTokenVersionCache,
} from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { isSuperAdminAccount } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const user = body.user;
    if (!user || !user.role) {
      const errRes = NextResponse.json({ error: 'Invalid user payload' }, { status: 400 });
      errRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return errRes;
    }

    // Strict validation of token_version against the database
    const dbClient = supabaseAdmin || supabase;
    if (dbClient && typeof dbClient.from === 'function') {
      try {
        let dbQuery = dbClient.from('users').select('id, token_version, status, role');
        if (user.id && !user.id.startsWith('mock-')) {
          dbQuery = dbQuery.eq('id', user.id);
        } else if (user.email) {
          dbQuery = dbQuery.eq('email', user.email.toLowerCase().trim());
        } else if (user.phone) {
          dbQuery = dbQuery.ilike('phone', `%${user.phone.replace(/\D/g, '').slice(-10)}%`);
        }

        const { data: dbUser } = await dbQuery.maybeSingle();

        if (dbUser) {
          if (dbUser.status === 'suspended' || dbUser.status === 'deactivated') {
            const resp = NextResponse.json({ error: 'Account is deactivated' }, { status: 401 });
            resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
            return resp;
          }

          if (dbUser.token_version !== undefined && dbUser.token_version !== null) {
            const dbTokenVersion = Number(dbUser.token_version);
            const userTokenVersion = Number(user.token_version || 1);
            if (dbTokenVersion > userTokenVersion) {
              const resp = NextResponse.json(
                { error: 'Session token version revoked. Please log in again.' },
                { status: 401 }
              );
              resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
              return resp;
            }
          }
        }
      } catch (dbErr) {
        console.warn('[POST /api/auth/session] token_version check warning:', dbErr);
      }
    }

    const isSuper = isSuperAdminAccount(user);
    const resolvedRole = isSuper ? 'super_admin' : user.role;
    const effectiveTokenVersion = Math.max(Number(user.token_version || 2), 2);

    const cookieValue = signAuthCookieValue({
      id: user.id || (isSuper ? 'usr-superadmin-000' : 'usr-client-001'),
      role: resolvedRole,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      display_name: user.display_name,
      onboarded: user.onboarded !== false,
      token_version: effectiveTokenVersion,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        ...user,
        role: resolvedRole,
        token_version: effectiveTokenVersion,
      },
    });

    // Never cache session sync or status checks
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    response.cookies.set(AUTH_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });
    return response;
  } catch (err: any) {
    const errRes = NextResponse.json({ error: err.message || 'Session creation failed' }, { status: 500 });
    errRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return errRes;
  }
}

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  if (!cookie) {
    const unauthRes = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    unauthRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return unauthRes;
  }

  const authUser = await verifyAndParseAuthCookie(cookie.value);
  if (!authUser) {
    const unauthRes = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    unauthRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return unauthRes;
  }

  const dbClient = supabaseAdmin || supabase;
  let resolvedUser: any = authUser;

  if (dbClient && typeof dbClient.from === 'function') {
    try {
      const { data: dbUser } = await dbClient
        .from('users')
        .select('id, email, phone, full_name, display_name, role, status, avatar_url, onboarded, studio_details, created_at, updated_at')
        .eq('id', authUser.id)
        .maybeSingle();

      if (dbUser) {
        resolvedUser = {
          ...authUser,
          ...dbUser,
        };

        if (dbUser.role === 'freelancer') {
          const { data: creatorProfile } = await dbClient
            .from('creator_profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (creatorProfile) {
            resolvedUser.onboarding_status =
              creatorProfile.onboarding_status || creatorProfile.approval_status || 'pending';
            resolvedUser.tracking_id = creatorProfile.tracking_id || null;
            resolvedUser.rejection_reason = creatorProfile.rejection_reason || null;
            resolvedUser.rejected_at = creatorProfile.rejected_at || null;
            resolvedUser.creator_profile = creatorProfile;
          }
        }
      }
    } catch (err) {
      console.warn('[api/auth/session] DB query warning:', err);
    }
  }

  return NextResponse.json(
    { authenticated: true, user: resolvedUser },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (user && user.id) {
      const dbClient = supabaseAdmin || supabase;
      if (dbClient) {
        const { data } = await dbClient
          .from('users')
          .select('token_version')
          .eq('id', user.id)
          .maybeSingle();

        const currentVersion = Number(data?.token_version) || Number(user.token_version) || 2;
        const newVersion = currentVersion + 1;

        await dbClient
          .from('users')
          .update({ token_version: newVersion })
          .eq('id', user.id);

        invalidateUserTokenVersionCache(user.id, newVersion);
      }
    }
  } catch (err) {
    console.warn('[LOGOUT] Server-side session invalidation non-fatal warning:', err);
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
