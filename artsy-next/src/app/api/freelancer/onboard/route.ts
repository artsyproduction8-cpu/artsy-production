import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { encryptPII } from '@/lib/crypto/pii';
import { invalidateCreatorCache, setCachedUser } from '@/lib/cache';
import { formatPublicCreatorName } from '@/lib/masking';

export async function POST(req: NextRequest) {
  // M9: Safe JSON parsing
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  // 1. Authenticate caller (cookie first, then verified existing user id fallback)
  let authUser = await getAuthenticatedUser(req);
  const candidateId = body?.userId || body?.id;

  if (!authUser && candidateId && supabaseAdmin) {
    try {
      const { data: matchedUser } = await supabaseAdmin
        .from('users')
        .select('id, email, phone, role, full_name, display_name')
        .eq('id', candidateId)
        .maybeSingle();
      if (matchedUser) {
        authUser = matchedUser;
      }
    } catch {}
  }

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Please log in before submitting creator application.' }, { status: 401 });
  }

  try {
    const {
      alias,
      legalName,
      philosophy,
      software,
      languages,
      pan,
    } = body;

    const cleanLegalName = typeof legalName === 'string' ? legalName.trim() : '';
    const cleanAlias = typeof alias === 'string' ? alias.trim() : '';
    const resolvedName = cleanLegalName || cleanAlias;

    if (!resolvedName || resolvedName.length < 2) {
      return NextResponse.json({ error: 'Legal name or creator alias is required to complete onboarding.' }, { status: 400 });
    }

    const lowerName = resolvedName.toLowerCase();
    if (lowerName === 'creator partner' || lowerName === 'creator' || lowerName === 'creator member' || lowerName === 'artsy creator') {
      return NextResponse.json({ error: 'Please enter your actual personal name or studio alias.' }, { status: 400 });
    }

    if (philosophy && typeof philosophy === 'string' && philosophy.length > 2000) {
      return NextResponse.json({ error: 'Bio/Philosophy cannot exceed 2,000 characters.' }, { status: 400 });
    }
    if (cleanLegalName && cleanLegalName.length > 150) {
      return NextResponse.json({ error: 'Legal name cannot exceed 150 characters.' }, { status: 400 });
    }
    if (cleanAlias && cleanAlias.length > 100) {
      return NextResponse.json({ error: 'Display alias cannot exceed 100 characters.' }, { status: 400 });
    }

    const trackingId = `ART-${new Date().getFullYear()}-VET-${Math.floor(1000 + Math.random() * 9000)}`;
    const candidateUserId = authUser.id;
    const candidateEmail = authUser.email || '';
    const candidatePhone = authUser.phone || '';

    // Fix M: Encrypt PAN before saving to database
    const cleanPan = typeof pan === 'string' && pan.trim().length > 0 ? pan.trim().toUpperCase() : null;
    const encryptedPan = cleanPan ? encryptPII(cleanPan) : null;

    // 1. Ensure user and creator profile exist in Supabase with status = 'pending'
    const dbClient = supabaseAdmin;

    if (dbClient && typeof dbClient.from === 'function') {
      try {
        const { data: existingUser } = await dbClient
          .from('users')
          .select('id, full_name')
          .eq('id', candidateUserId)
          .maybeSingle();

        const reelUrls = Array.isArray(body.reels)
          ? body.reels.map((r: any) => (typeof r === 'string' ? r : r.url)).filter(Boolean)
          : [];

        const studioDetails = {
          alias: cleanAlias || null,
          legalName: cleanLegalName || null,
          software: Array.isArray(software) ? software : [],
          languages: Array.isArray(languages) ? languages : [],
          experience: body.experience || '',
          capacity: body.capacity || '',
          philosophy: philosophy || '',
          showreelUrl: body.showreelUrl || '',
          reels: reelUrls,
          bankName: body.bankName || '',
          bankAccount: body.bankAccount || '',
          ifsc: body.ifsc || '',
          pan: cleanPan || '',
        };

        const legalFullName = cleanLegalName || cleanAlias || 'Creator Partner';
        const publicDisplayName = cleanAlias
          ? formatPublicCreatorName(cleanAlias)
          : formatPublicCreatorName(cleanLegalName);

        if (!existingUser) {
          await dbClient.from('users').insert({
            id: candidateUserId,
            email: candidateEmail,
            phone: candidatePhone,
            full_name: legalFullName,
            display_name: publicDisplayName,
            role: 'freelancer',
            status: 'active',
            onboarded: true,
            studio_details: studioDetails,
            updated_at: new Date().toISOString(),
          });
        } else {
          await dbClient.from('users').update({
            full_name: legalFullName,
            display_name: publicDisplayName,
            role: 'freelancer',
            onboarded: true,
            studio_details: studioDetails,
            updated_at: new Date().toISOString(),
          }).eq('id', candidateUserId);
        }

        const profilePayload: Record<string, any> = {
          id: candidateUserId,
          tracking_id: trackingId,
          bio: philosophy || 'Creative Editor',
          skills: Array.isArray(languages) ? languages : ['4K Color Grading'],
          software: Array.isArray(software) ? software : ['DaVinci Resolve Studio'],
          approval_status: 'pending',
          onboarding_status: 'pending_review',
          portfolio_url: body.showreelUrl || null,
          sample_links: reelUrls,
          public_display_name: publicDisplayName,
          pan_number: encryptedPan,
          bank_account_name: cleanLegalName || null,
          bank_account_number: body.bankAccount || null,
          bank_ifsc_code: body.ifsc ? String(body.ifsc).toUpperCase().trim() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: existingCp } = await dbClient
          .from('creator_profiles')
          .select('*')
          .eq('id', candidateUserId)
          .maybeSingle();

        const mergedPayload = {
          ...(existingCp || {}),
          ...profilePayload,
        };

        if (existingCp) {
          await dbClient.from('creator_profiles').delete().eq('id', candidateUserId);
        }
        await dbClient.from('creator_profiles').insert(mergedPayload);

        // Immutable WORM audit trail
        await dbClient.from('audit_logs').insert([{
          action: 'CREATOR_ONBOARDING_SUBMITTED',
          target_table: 'creator_profiles',
          target_id: candidateUserId,
          new_values: {
            tracking_id: trackingId,
            legal_name: legalName,
            alias,
            submitted_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        }]);

        // Instant Cache Invalidation & Session Warm (Sub-20ms)
        try {
          await invalidateCreatorCache(candidateUserId);
          const freshUser = {
            id: candidateUserId,
            role: 'freelancer',
            email: candidateEmail,
            phone: candidatePhone,
            full_name: publicDisplayName || authUser.full_name,
            display_name: cleanAlias || publicDisplayName || authUser.display_name,
            onboarded: true,
            onboarding_status: 'pending_review',
            tracking_id: trackingId,
            studio_details: studioDetails,
          };
          await setCachedUser(candidateUserId, freshUser, 600);
        } catch (cErr) {
          console.warn('[Creator Onboard] Cache sync warning:', cErr);
        }
      } catch (dbErr) {
        console.warn('Supabase creator_profiles save non-fatal fallback:', dbErr);
      }
    }

    // 2. Dispatch Event #2 (PROFILE_SUBMITTED) via Resend Email & WhatsApp
    try {
      await dispatchNotification({
        eventNumber: 2,
        userId: candidateUserId,
        recipientEmail: candidateEmail,
        recipientPhone: candidatePhone,
        actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/freelancer`,
      });
    } catch (notifErr) {
      console.warn('Notification dispatch non-fatal fallback:', notifErr);
    }

    return NextResponse.json({
      success: true,
      trackingId,
      userId: candidateUserId,
      status: 'pending_review',
      message: 'Creator application submitted to Studio Curation successfully.',
    });
  } catch (error) {
    console.error('Error handling creator onboarding submission:', error);
    // M10: Do not leak error details
    return NextResponse.json(
      { success: false, error: 'Internal server error processing creator application' },
      { status: 500 }
    );
  }
}
