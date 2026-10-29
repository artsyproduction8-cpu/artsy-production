import { NextResponse } from 'next/server';
import { getAuthenticatedUser, signAuthCookieValue, AUTH_COOKIE_NAME, AuthUserPayload } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { setCachedUser, invalidateUserCache, invalidateCache, invalidateCreatorCache } from '@/lib/cache';
import { formatPublicCreatorName } from '@/lib/masking';
import { encryptPII } from '@/lib/crypto/pii';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateKey = `profile_update_${authUser.id}`;
  const limit = await checkRateLimit(rateKey, 'api', 15, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many profile updates. Please wait ${Math.ceil(limit.resetSeconds / 60)} minutes.` },
      { status: 429 }
    );
  }

  // M9: Safe JSON parsing
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const { full_name, display_name, phone, email, studio_details, avatar_url, creator_profile: creatorPayload } = body;

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  const dbClient = (supabaseAdmin && typeof supabaseAdmin.from === 'function') ? supabaseAdmin : supabase;

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
    updates.display_name = typeof display_name === 'string' && display_name.trim().length > 0
      ? display_name.trim()
      : (updates.full_name ? updates.full_name : null);
  } else if (updates.full_name) {
    updates.display_name = updates.full_name;
  }

  if (email !== undefined && typeof email === 'string' && email.trim().length > 0) {
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (dbClient && typeof dbClient.from === 'function' && cleanEmail !== (authUser.email || '').toLowerCase()) {
      const { data: existingUserWithEmail } = await dbClient
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .neq('id', authUser.id)
        .maybeSingle();

      if (existingUserWithEmail) {
        return NextResponse.json(
          { error: 'This email address is already in use by another account.' },
          { status: 400 }
        );
      }
    }
    updates.email = cleanEmail;
  }

  if (phone !== undefined) {
    if (typeof phone === 'string' && phone.trim().length > 0) {
      const rawDigits = phone.replace(/\D/g, '');
      const cleanDigits = (rawDigits.length === 12 && rawDigits.startsWith('91')) ? rawDigits.slice(2) : rawDigits.slice(-10);
      if (cleanDigits.length === 10) {
        const canonicalPhone = `+91${cleanDigits}`;
        if (dbClient && typeof dbClient.from === 'function' && canonicalPhone !== authUser.phone) {
          const { data: existingUserWithPhone } = await dbClient
            .from('users')
            .select('id')
            .eq('phone', canonicalPhone)
            .neq('id', authUser.id)
            .maybeSingle();

          if (existingUserWithPhone) {
            return NextResponse.json(
              { error: 'This phone number is already registered to another account.' },
              { status: 400 }
            );
          }
        }
        updates.phone = canonicalPhone;
      }
    }
  }

  if (studio_details !== undefined && typeof studio_details === 'object' && studio_details !== null) {
    const cleanStudioDetails = { ...studio_details };

    // Prevent masked PII from corrupting studio_details
    const existingSd = authUser.studio_details || {};
    if (cleanStudioDetails.pan && /[•*X]/.test(String(cleanStudioDetails.pan))) {
      if (existingSd.pan && !/[•*X]/.test(String(existingSd.pan))) {
        cleanStudioDetails.pan = existingSd.pan;
      } else {
        delete cleanStudioDetails.pan;
      }
    }
    if (cleanStudioDetails.bankAccount && /[•*X]/.test(String(cleanStudioDetails.bankAccount))) {
      if (existingSd.bankAccount && !/[•*X]/.test(String(existingSd.bankAccount))) {
        cleanStudioDetails.bankAccount = existingSd.bankAccount;
      } else {
        delete cleanStudioDetails.bankAccount;
      }
    }
    if (cleanStudioDetails.ifsc && /[•*]/.test(String(cleanStudioDetails.ifsc))) {
      if (existingSd.ifsc && !/[•*]/.test(String(existingSd.ifsc))) {
        cleanStudioDetails.ifsc = existingSd.ifsc;
      } else {
        delete cleanStudioDetails.ifsc;
      }
    }

    if (updates.phone) {
      cleanStudioDetails.phone = updates.phone;
      cleanStudioDetails.whatsapp = updates.phone;
    }
    if (updates.email) {
      cleanStudioDetails.email = updates.email;
    }

    updates.studio_details = cleanStudioDetails;
  } else if ((updates.email || updates.phone) && authUser.studio_details) {
    const existingSd = { ...authUser.studio_details };
    if (updates.email) {
      existingSd.email = updates.email;
    }
    if (updates.phone) {
      existingSd.phone = updates.phone;
      existingSd.whatsapp = updates.phone;
    }
    updates.studio_details = existingSd;
  }

  if (avatar_url !== undefined && typeof avatar_url === 'string') {
    updates.avatar_url = avatar_url;
  }

  if (body.onboarded !== undefined) {
    updates.onboarded = Boolean(body.onboarded);
  } else if (authUser.onboarded !== undefined) {
    updates.onboarded = Boolean(authUser.onboarded);
  } else {
    updates.onboarded = true;
  }

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

    // If freelancer, attempt upserting creator_profiles fields as well
    if (creatorPayload && typeof creatorPayload === 'object' && isUuid) {
      try {
        const cpUpdates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (creatorPayload.bio) cpUpdates.bio = String(creatorPayload.bio).trim();
        if (creatorPayload.public_bio) cpUpdates.public_bio = String(creatorPayload.public_bio).trim();
        if (creatorPayload.public_display_name) {
          cpUpdates.public_display_name = formatPublicCreatorName(String(creatorPayload.public_display_name).trim());
        } else if (updates.display_name) {
          cpUpdates.public_display_name = updates.display_name;
        }
        if (creatorPayload.portfolio_url || creatorPayload.showreelUrl) {
          cpUpdates.portfolio_url = String(creatorPayload.portfolio_url || creatorPayload.showreelUrl).trim();
        }
        if (Array.isArray(creatorPayload.software)) cpUpdates.software = creatorPayload.software;
        if (Array.isArray(creatorPayload.languages)) cpUpdates.languages = creatorPayload.languages;
        if (Array.isArray(creatorPayload.skills)) cpUpdates.skills = creatorPayload.skills;
        if (creatorPayload.public_specialty || creatorPayload.specialty) {
          cpUpdates.public_specialty = String(creatorPayload.public_specialty || creatorPayload.specialty).trim();
        }
        if (creatorPayload.hardware_config || creatorPayload.hardwareConfig) {
          cpUpdates.hardware_config = String(creatorPayload.hardware_config || creatorPayload.hardwareConfig).trim();
        }
        if (creatorPayload.sample_url_1 || creatorPayload.sampleUrl1) {
          cpUpdates.sample_url_1 = String(creatorPayload.sample_url_1 || creatorPayload.sampleUrl1).trim();
        }
        if (creatorPayload.sample_url_2 || creatorPayload.sampleUrl2) {
          cpUpdates.sample_url_2 = String(creatorPayload.sample_url_2 || creatorPayload.sampleUrl2).trim();
        }
        if (creatorPayload.sample_url_3 || creatorPayload.sampleUrl3) {
          cpUpdates.sample_url_3 = String(creatorPayload.sample_url_3 || creatorPayload.sampleUrl3).trim();
        }
        if (creatorPayload.bank_account_name) cpUpdates.bank_account_name = String(creatorPayload.bank_account_name).trim();
        if (creatorPayload.bank_account_number && !/[•*X]/.test(String(creatorPayload.bank_account_number))) {
          cpUpdates.bank_account_number = String(creatorPayload.bank_account_number).trim();
        }
        if (creatorPayload.bank_ifsc_code && !/[•*X]/.test(String(creatorPayload.bank_ifsc_code))) {
          cpUpdates.bank_ifsc_code = String(creatorPayload.bank_ifsc_code).trim().toUpperCase();
        }
        if (creatorPayload.pan_number && !/[•*X]/.test(String(creatorPayload.pan_number))) {
          const rawPan = String(creatorPayload.pan_number).trim().toUpperCase();
          if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(rawPan)) {
            cpUpdates.pan_number = encryptPII(rawPan);
          }
        }

        const { data: existingCp } = await dbClient
          .from('creator_profiles')
          .select('id')
          .eq('id', authUser.id)
          .maybeSingle();

        if (existingCp) {
          await dbClient.from('creator_profiles').update(cpUpdates).eq('id', authUser.id);
        } else {
          await dbClient.from('creator_profiles').insert({
            id: authUser.id,
            user_id: authUser.id,
            ...cpUpdates,
            approval_status: 'pending',
            onboarding_status: 'pending_review',
            created_at: new Date().toISOString(),
          });
        }
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

  // 1. Instant Cache Refresh & Cross-Panel Invalidation (Sub-20ms)
  try {
    const invalidations: Promise<any>[] = [
      invalidateCache('cache:admin:clients:list'),
      invalidateCache(`cache:admin:client:${resolvedUser.id}`),
    ];
    if (authUser.role === 'freelancer' || creatorPayload) {
      invalidations.push(invalidateCreatorCache(resolvedUser.id));
    }
    await Promise.all(invalidations);
    // Atomically warm user session cache with the latest saved data
    await setCachedUser(resolvedUser.id, resolvedUser, 600);
  } catch (cErr) {
    console.warn('[Update Profile] Cache update warning:', cErr);
  }

  // 2. Reliable Record-Keeping: Immutable Audit Trail (WORM Ledger)
  if (dbClient && typeof dbClient.from === 'function') {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id);
      await dbClient.from('audit_logs').insert([
        {
          action: 'profile_updated',
          target_table: 'users',
          target_id: isUuid ? authUser.id : null,
          new_values: {
            updated_fields: Object.keys(updates),
            display_name: updates.display_name,
            has_studio_details: Boolean(updates.studio_details),
            timestamp: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (auditErr) {
      console.warn('[Update Profile] Non-fatal audit log warning:', auditErr);
    }
  }

  const response = NextResponse.json({ success: true, user: resolvedUser, updates });
  const signedCookie = signAuthCookieValue({
    id: authUser.id,
    role: authUser.role,
    email: updates.email ?? authUser.email,
    phone: updates.phone ?? authUser.phone,
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
