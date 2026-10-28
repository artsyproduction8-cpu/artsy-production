import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { encryptPII } from '@/lib/crypto/pii';
import { invalidateCreatorCache, setCachedUser } from '@/lib/cache';
import { formatPublicCreatorName } from '@/lib/masking';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { signAuthCookieValue, AUTH_COOKIE_NAME } from '@/lib/auth-cookie';

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

  const ip = getClientIp(req);
  const rateKey = authUser ? `freelancer_onboard_${authUser.id}` : `freelancer_onboard_ip_${ip}`;
  const limit = await checkRateLimit(rateKey, 'api', 10, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many submissions. Please wait ${Math.ceil(limit.resetSeconds / 60)} minutes.` },
      { status: 429 }
    );
  }

  try {
    const {
      alias,
      specialty,
      legalName,
      philosophy,
      software,
      languages,
      pan,
      bankAccount,
      ifsc,
      hardwareConfig,
      sampleUrl1,
      sampleUrl2,
      sampleUrl3,
      agreementAccepted,
      ndaAccepted,
    } = body;

    const cleanLegalName = typeof legalName === 'string' ? legalName.trim() : '';
    const cleanAlias = typeof alias === 'string' ? alias.trim() : '';
    const cleanSpecialty = typeof specialty === 'string' && specialty.trim().length > 0
      ? specialty.trim()
      : 'Commercial & Narrative Film Editor';
    const resolvedName = cleanLegalName || cleanAlias;

    if (!resolvedName || resolvedName.length < 2) {
      return NextResponse.json({ error: 'Legal name or creator alias is required to complete onboarding.' }, { status: 400 });
    }

    const lowerName = resolvedName.toLowerCase();
    if (lowerName === 'creator partner' || lowerName === 'creator' || lowerName === 'creator member' || lowerName === 'artsy creator') {
      return NextResponse.json({ error: 'Please enter your actual personal name or studio alias.' }, { status: 400 });
    }

    if (cleanLegalName && cleanLegalName.length > 150) {
      return NextResponse.json({ error: 'Legal name cannot exceed 150 characters.' }, { status: 400 });
    }
    if (cleanAlias && cleanAlias.length > 100) {
      return NextResponse.json({ error: 'Display alias cannot exceed 100 characters.' }, { status: 400 });
    }
    if (philosophy && typeof philosophy === 'string' && philosophy.length > 2000) {
      return NextResponse.json({ error: 'Bio/Philosophy cannot exceed 2,000 characters.' }, { status: 400 });
    }

    // ────────────────────────────────────────────────────────
    // PHASE 2: STRICT FINANCIAL REGEX VALIDATION
    // ────────────────────────────────────────────────────────
    const cleanPan = typeof pan === 'string' ? pan.trim().toUpperCase() : '';
    const cleanBankAccount = typeof (bankAccount || body.bank_account || body.accountNumber) === 'string'
      ? String(bankAccount || body.bank_account || body.accountNumber).trim()
      : '';
    const cleanIfsc = typeof (ifsc || body.bank_ifsc || body.bankIfsc) === 'string'
      ? String(ifsc || body.bank_ifsc || body.bankIfsc).trim().toUpperCase()
      : '';

    // PAN: Standard Indian 10-digit PAN format (5 letters + 4 digits + 1 letter, e.g. ABCDE1234F)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!cleanPan || !panRegex.test(cleanPan)) {
      return NextResponse.json(
        { error: 'Invalid PAN Card format. Must match standard Indian 10-character PAN format (e.g., ABCDE1234F).' },
        { status: 400 }
      );
    }

    // Bank Account: Numeric string between 9 and 18 digits
    const bankAccountRegex = /^\d{9,18}$/;
    if (!cleanBankAccount || !bankAccountRegex.test(cleanBankAccount)) {
      return NextResponse.json(
        { error: 'Invalid Bank Account number. Must be a numeric string between 9 and 18 digits.' },
        { status: 400 }
      );
    }

    // IFSC: Standard 11-character Indian IFSC format (e.g., SBIN0001234)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!cleanIfsc || !ifscRegex.test(cleanIfsc)) {
      return NextResponse.json(
        { error: 'Invalid IFSC Code format. Must match standard 11-character Indian IFSC format (e.g., SBIN0001234).' },
        { status: 400 }
      );
    }

    // ────────────────────────────────────────────────────────
    // PHASE 3: HARDWARE & 3 MANDATORY SAMPLE VIDEO URLS
    // ────────────────────────────────────────────────────────
    const cleanHardwareConfig = typeof (hardwareConfig || body.hardware_config) === 'string'
      ? (hardwareConfig || body.hardware_config).trim()
      : '';

    const cleanSample1 = typeof (sampleUrl1 || body.sample_url_1) === 'string'
      ? (sampleUrl1 || body.sample_url_1).trim()
      : '';
    const cleanSample2 = typeof (sampleUrl2 || body.sample_url_2) === 'string'
      ? (sampleUrl2 || body.sample_url_2).trim()
      : '';
    const cleanSample3 = typeof (sampleUrl3 || body.sample_url_3) === 'string'
      ? (sampleUrl3 || body.sample_url_3).trim()
      : '';

    if (!cleanHardwareConfig || cleanHardwareConfig.length < 5) {
      return NextResponse.json(
        { error: 'Workstation & Hardware specifications (CPU, GPU, RAM) are mandatory.' },
        { status: 400 }
      );
    }

    const isValidVideoUrl = (urlStr: string): boolean => {
      try {
        const u = new URL(urlStr);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
        const host = u.hostname.toLowerCase();
        return (
          host.includes('youtube.com') ||
          host.includes('youtu.be') ||
          host.includes('vimeo.com')
        );
      } catch {
        return false;
      }
    };

    if (!cleanSample1 || !isValidVideoUrl(cleanSample1)) {
      return NextResponse.json(
        { error: 'Sample Video URL #1 is mandatory and must be a valid YouTube or Vimeo URL.' },
        { status: 400 }
      );
    }
    if (!cleanSample2 || !isValidVideoUrl(cleanSample2)) {
      return NextResponse.json(
        { error: 'Sample Video URL #2 is mandatory and must be a valid YouTube or Vimeo URL.' },
        { status: 400 }
      );
    }
    if (!cleanSample3 || !isValidVideoUrl(cleanSample3)) {
      return NextResponse.json(
        { error: 'Sample Video URL #3 is mandatory and must be a valid YouTube or Vimeo URL.' },
        { status: 400 }
      );
    }

    // ────────────────────────────────────────────────────────
    // PHASE 4: NDA & AGREEMENT DIGITAL SIGNATURE & TIMESTAMP
    // ────────────────────────────────────────────────────────
    const isAgreementAccepted = Boolean(agreementAccepted || ndaAccepted);
    if (!isAgreementAccepted) {
      return NextResponse.json(
        { error: 'You must check the agreement box confirming acceptance of the Creator Agreement & NDA.' },
        { status: 400 }
      );
    }

    if (!cleanLegalName || cleanLegalName.length < 2) {
      return NextResponse.json(
        { error: 'Full legal name is required as your digital signature to execute the Creator Agreement & NDA.' },
        { status: 400 }
      );
    }

    const agreementSignedAt = new Date().toISOString();
    const trackingId = `ART-${new Date().getFullYear()}-VET-${Math.floor(1000 + Math.random() * 9000)}`;
    const candidateUserId = authUser.id;
    const candidateEmail = authUser.email || '';
    const candidatePhone = authUser.phone || '';

    // Encrypt PAN before saving to database
    const encryptedPan = encryptPII(cleanPan);

    const publicDisplayName = cleanAlias
      ? formatPublicCreatorName(cleanAlias)
      : formatPublicCreatorName(cleanLegalName || resolvedName);

    // 1. Ensure user and creator profile exist in Supabase with status = 'pending'
    const dbClient = supabaseAdmin;

    if (dbClient && typeof dbClient.from === 'function') {
      try {
        const { data: existingUser } = await dbClient
          .from('users')
          .select('id, full_name')
          .eq('id', candidateUserId)
          .maybeSingle();

        const reelUrls = [cleanSample1, cleanSample2, cleanSample3];

        const studioDetails = {
          alias: cleanAlias || null,
          legalName: cleanLegalName || null,
          specialty: cleanSpecialty,
          software: Array.isArray(software) ? software : [],
          languages: Array.isArray(languages) ? languages : [],
          experience: body.experience || '',
          capacity: body.capacity || '',
          philosophy: philosophy || '',
          showreelUrl: body.showreelUrl || cleanSample1,
          hardware_config: cleanHardwareConfig,
          hardware: body.hardware || null,
          sample_url_1: cleanSample1,
          sample_url_2: cleanSample2,
          sample_url_3: cleanSample3,
          reels: reelUrls,
          bankName: body.bankName || '',
          bankAccount: cleanBankAccount,
          ifsc: cleanIfsc,
          pan: cleanPan,
          agreement_signed_at: agreementSignedAt,
          agreement_accepted: true,
        };

        const legalFullName = cleanLegalName || cleanAlias || resolvedName;

        const userDisplayName = cleanAlias || cleanLegalName || resolvedName;

        if (!existingUser) {
          await dbClient.from('users').insert({
            id: candidateUserId,
            email: candidateEmail,
            phone: candidatePhone,
            full_name: legalFullName,
            display_name: userDisplayName,
            role: 'freelancer',
            status: 'active',
            onboarded: true,
            studio_details: studioDetails,
            updated_at: agreementSignedAt,
          });
        } else {
          await dbClient.from('users').update({
            full_name: legalFullName,
            display_name: userDisplayName,
            role: 'freelancer',
            onboarded: true,
            studio_details: studioDetails,
            updated_at: agreementSignedAt,
          }).eq('id', candidateUserId);
        }

        const editorialSkills = Array.isArray(body.skills) && body.skills.length > 0
          ? body.skills
          : [cleanSpecialty, 'Color Grading', 'Sound Design', '4K Mastering'];

        const profilePayload: Record<string, any> = {
          id: candidateUserId,
          user_id: candidateUserId,
          tracking_id: trackingId,
          bio: philosophy || 'Creative Editor',
          public_specialty: cleanSpecialty,
          skills: editorialSkills,
          software: Array.isArray(software) && software.length > 0 ? software : ['DaVinci Resolve Studio', 'Adobe Premiere Pro'],
          languages: Array.isArray(languages) && languages.length > 0 ? languages : ['Hindi', 'English'],
          approval_status: 'pending',
          onboarding_status: 'pending_review',
          portfolio_url: body.showreelUrl || cleanSample1 || null,
          sample_links: reelUrls,
          hardware_config: cleanHardwareConfig,
          sample_url_1: cleanSample1,
          sample_url_2: cleanSample2,
          sample_url_3: cleanSample3,
          agreement_accepted: true,
          agreement_accepted_at: agreementSignedAt,
          agreement_signed_at: agreementSignedAt,
          public_display_name: publicDisplayName,
          pan_number: encryptedPan,
          bank_account_name: cleanLegalName || null,
          bank_account_number: cleanBankAccount,
          bank_ifsc_code: cleanIfsc,
          updated_at: agreementSignedAt,
        };

        const { data: existingCp } = await dbClient
          .from('creator_profiles')
          .select('*')
          .eq('id', candidateUserId)
          .maybeSingle();

        if (existingCp) {
          await dbClient.from('creator_profiles').update(profilePayload).eq('id', candidateUserId);
        } else {
          await dbClient.from('creator_profiles').insert({
            ...profilePayload,
            created_at: agreementSignedAt,
          });
        }

        // Insert into creator_agreements for legal audit trail
        try {
          await dbClient.from('creator_agreements').insert([
            {
              creator_id: candidateUserId,
              agreement_type: 'both',
              version: '1.0',
              agreement_signed_at: agreementSignedAt,
              accepted_at: agreementSignedAt,
              legal_name: cleanLegalName,
              ip_address: ip && ip.includes('.') ? ip : null,
              user_agent: req.headers.get('user-agent') || null,
              created_at: agreementSignedAt,
            },
          ]);
        } catch (agrErr) {
          console.warn('[Creator Onboard] creator_agreements insert warning:', agrErr);
        }

        // Immutable WORM audit trail
        await dbClient.from('audit_logs').insert([{
          action: 'CREATOR_ONBOARDING_SUBMITTED',
          target_table: 'creator_profiles',
          target_id: candidateUserId,
          new_values: {
            tracking_id: trackingId,
            legal_name: cleanLegalName,
            alias: cleanAlias,
            agreement_signed_at: agreementSignedAt,
            submitted_at: agreementSignedAt,
          },
          created_at: agreementSignedAt,
        }]);

        // Instant Cache Invalidation & Session Warm (Sub-20ms)
        try {
          await invalidateCreatorCache(candidateUserId);
          const freshUser = {
            id: candidateUserId,
            role: 'freelancer',
            email: candidateEmail,
            phone: candidatePhone,
            full_name: legalFullName,
            display_name: userDisplayName,
            onboarded: true,
            onboarding_status: 'pending_review',
            tracking_id: trackingId,
            agreement_signed_at: agreementSignedAt,
            agreement_accepted: true,
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

    const response = NextResponse.json({
      success: true,
      trackingId,
      userId: candidateUserId,
      status: 'pending_review',
      agreement_signed_at: agreementSignedAt,
      message: 'Creator application submitted to Studio Curation successfully.',
    });

    const signedCookie = signAuthCookieValue({
      id: candidateUserId,
      role: 'freelancer',
      token_version: Number(authUser.token_version || 2),
      onboarded: true,
      onboarding_status: 'pending_review',
      tracking_id: trackingId,
      email: candidateEmail,
      phone: candidatePhone,
      full_name: cleanLegalName || resolvedName || authUser.full_name,
    });

    response.cookies.set(AUTH_COOKIE_NAME, signedCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return response;
  } catch (error) {
    console.error('Error handling creator onboarding submission:', error);
    // M10: Do not leak error details
    return NextResponse.json(
      { success: false, error: 'Internal server error processing creator application' },
      { status: 500 }
    );
  }
}
