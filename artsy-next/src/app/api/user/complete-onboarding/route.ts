import { NextResponse } from 'next/server';
import { getAuthenticatedUser, signAuthCookieValue, AUTH_COOKIE_NAME } from '@/lib/auth-cookie';
import { supabaseAdmin } from '@/lib/supabase';
import { invalidateUserCache } from '@/lib/cache';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate Limiting: Max 10 requests per 10 minutes
  const limit = await checkRateLimit(`complete_onboard_${authUser.id}`, 'api', 10, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${Math.ceil(limit.resetSeconds / 60)} minutes.` },
      { status: 429 }
    );
  }

  if (supabaseAdmin && typeof supabaseAdmin.from === 'function') {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ onboarded: true, updated_at: new Date().toISOString() })
      .eq('id', authUser.id);

    if (error) {
      console.error('[Complete Onboarding] Error updating user:', error);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
  }

  try {
    await invalidateUserCache(authUser.id);
  } catch (cErr) {
    console.warn('[Complete Onboarding] Cache invalidation warning:', cErr);
  }

  const response = NextResponse.json({ success: true, message: 'Onboarding completed successfully' });
  const signedCookie = signAuthCookieValue({
    id: authUser.id,
    role: authUser.role,
    email: authUser.email,
    phone: authUser.phone,
    full_name: authUser.full_name,
    display_name: authUser.display_name,
    onboarded: true,
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
