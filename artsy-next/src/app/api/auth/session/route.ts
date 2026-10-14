import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAndParseAuthCookie,
  getAuthenticatedUser,
  AUTH_COOKIE_NAME,
  invalidateUserTokenVersionCache,
} from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  if (!cookie) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = await verifyAndParseAuthCookie(cookie.value);
  if (user) {
    return NextResponse.json({ authenticated: true, user });
  }

  return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
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
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
