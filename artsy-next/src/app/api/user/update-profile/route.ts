import { NextResponse } from 'next/server';
import { getAuthenticatedUser, signAuthCookieValue, AUTH_COOKIE_NAME, AuthUserPayload } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // M9: Safe JSON parsing
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const { full_name, display_name, studio_details, avatar_url } = body;

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (full_name !== undefined) {
    if (typeof full_name !== 'string' || full_name.trim().length < 2) {
      return NextResponse.json({ error: 'Full name must be at least 2 characters' }, { status: 400 });
    }
    const trimmedName = full_name.trim();
    if (trimmedName.length > 100) {
      return NextResponse.json({ error: 'Full name must not exceed 100 characters' }, { status: 400 });
    }
    updates.full_name = trimmedName;
  }

  if (display_name !== undefined) {
    updates.display_name = typeof display_name === 'string' ? display_name.trim() : null;
  }

  if (studio_details !== undefined && typeof studio_details === 'object') {
    updates.studio_details = studio_details;
  }

  if (avatar_url !== undefined && typeof avatar_url === 'string') {
    updates.avatar_url = avatar_url;
  }

  if (body.onboarded !== undefined) {
    updates.onboarded = Boolean(body.onboarded);
  } else {
    updates.onboarded = true;
  }

  const dbClient = (supabaseAdmin && typeof supabaseAdmin.from === 'function') ? supabaseAdmin : supabase;

  if (dbClient && typeof dbClient.from === 'function') {
    const { error } = await dbClient
      .from('users')
      .update(updates)
      .eq('id', authUser.id);

    if (error) {
      console.error('[Update Profile] Error updating user:', error);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
  }

  const response = NextResponse.json({ success: true, updates });
  const signedCookie = signAuthCookieValue({
    id: authUser.id,
    role: authUser.role,
    full_name: updates.full_name ?? authUser.full_name,
    display_name: updates.display_name ?? authUser.display_name,
    onboarded: updates.onboarded,
    token_version: authUser.token_version,
  });
  response.cookies.set(AUTH_COOKIE_NAME, signedCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400,
  });

  return response;
}
