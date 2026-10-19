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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id);
    let updateQuery = dbClient.from('users').update(updates);
    if (isUuid) {
      updateQuery = updateQuery.eq('id', authUser.id);
    } else if (authUser.email) {
      updateQuery = updateQuery.eq('email', authUser.email);
    } else if (authUser.phone) {
      updateQuery = updateQuery.eq('phone', authUser.phone);
    } else {
      updateQuery = updateQuery.eq('id', authUser.id);
    }

    const { error } = await updateQuery;

    if (error) {
      console.warn('[Update Profile] DB update warning:', error);
      // Attempt upsert if UUID
      if (isUuid) {
        try {
          await dbClient.from('users').upsert({
            id: authUser.id,
            email: authUser.email || `${authUser.id}@artsyproduction.com`,
            phone: authUser.phone || '+919999999999',
            role: authUser.role === 'freelancer' ? 'freelancer' : (authUser.role === 'admin' ? 'admin' : 'client'),
            status: 'active',
            ...updates,
          });
        } catch (upsertErr) {
          console.warn('[Update Profile] User upsert fallback error:', upsertErr);
        }
      }
    }

    // If freelancer, attempt updating creator_profiles fields as well
    const creatorPayload = body.creator_profile;
    if (creatorPayload && typeof creatorPayload === 'object' && isUuid) {
      try {
        const cpUpdates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (creatorPayload.bio) cpUpdates.bio = String(creatorPayload.bio).trim();
        if (creatorPayload.public_bio) cpUpdates.public_bio = String(creatorPayload.public_bio).trim();
        if (creatorPayload.public_display_name) cpUpdates.public_display_name = String(creatorPayload.public_display_name).trim();
        if (Array.isArray(creatorPayload.software)) cpUpdates.software = creatorPayload.software;
        if (Array.isArray(creatorPayload.languages)) cpUpdates.languages = creatorPayload.languages;
        if (Array.isArray(creatorPayload.skills)) cpUpdates.skills = creatorPayload.skills;
        if (creatorPayload.bank_account_name) cpUpdates.bank_account_name = String(creatorPayload.bank_account_name).trim();
        if (creatorPayload.bank_account_number) cpUpdates.bank_account_number = String(creatorPayload.bank_account_number).trim();
        if (creatorPayload.bank_ifsc_code) cpUpdates.bank_ifsc_code = String(creatorPayload.bank_ifsc_code).trim().toUpperCase();
        if (creatorPayload.pan_number) cpUpdates.pan_number = String(creatorPayload.pan_number).trim().toUpperCase();

        await dbClient
          .from('creator_profiles')
          .update(cpUpdates)
          .eq('id', authUser.id);
      } catch (cpErr) {
        console.warn('[Update Profile] Non-fatal creator_profiles sync warning:', cpErr);
      }
    }
  }

  const resolvedUser = {
    ...authUser,
    ...updates,
    studio_details: updates.studio_details ?? authUser.studio_details ?? null,
    creator_profile: body.creator_profile ?? authUser.creator_profile ?? null,
  };

  const response = NextResponse.json({ success: true, user: resolvedUser, updates });
  const signedCookie = signAuthCookieValue({
    id: authUser.id,
    role: authUser.role,
    email: authUser.email,
    phone: authUser.phone,
    full_name: updates.full_name ?? authUser.full_name,
    display_name: updates.display_name ?? authUser.display_name,
    studio_details: updates.studio_details ?? authUser.studio_details ?? null,
    creator_profile: body.creator_profile ?? authUser.creator_profile ?? null,
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
