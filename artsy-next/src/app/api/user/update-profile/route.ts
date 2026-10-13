import { NextResponse } from 'next/server';
import { getAuthenticatedUser, signAuthCookieValue, AUTH_COOKIE_NAME, AuthUserPayload } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { full_name } = body;

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }

  const trimmedName = full_name.trim();
  const dbClient = (supabaseAdmin && typeof supabaseAdmin.from === 'function') ? supabaseAdmin : supabase;

  if (dbClient && typeof dbClient.from === 'function') {
    const { error } = await dbClient
      .from('users')
      .update({
        full_name: trimmedName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id);

    if (error) {
      console.error('[Update Profile] Error updating user:', error);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
  }

  const response = NextResponse.json({ success: true });
  const updatedPayload: AuthUserPayload = {
    ...authUser,
    full_name: trimmedName,
  };
  const signedCookie = signAuthCookieValue(updatedPayload);
  response.cookies.set(AUTH_COOKIE_NAME, signedCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400,
  });

  return response;
}

