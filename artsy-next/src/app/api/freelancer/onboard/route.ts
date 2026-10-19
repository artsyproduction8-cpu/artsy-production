import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/../lib/supabase';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { encryptPII } from '@/lib/crypto/pii';

export async function POST(req: NextRequest) {
  // 1. Authenticate caller
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // M9: Safe JSON parsing
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
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

    if (philosophy && typeof philosophy === 'string' && philosophy.length > 2000) {
      return NextResponse.json({ error: 'Bio/Philosophy cannot exceed 2,000 characters.' }, { status: 400 });
    }
    if (legalName && typeof legalName === 'string' && legalName.length > 150) {
      return NextResponse.json({ error: 'Legal name cannot exceed 150 characters.' }, { status: 400 });
    }
    if (alias && typeof alias === 'string' && alias.length > 100) {
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
    const { supabaseAdmin } = await import('@/lib/supabase');
    const dbClient = (supabaseAdmin && typeof supabaseAdmin.from === 'function') ? supabaseAdmin : supabase;

    if (dbClient && typeof dbClient.from === 'function') {
      try {
        const { data: existingUser } = await dbClient
          .from('users')
          .select('id, full_name')
          .eq('id', candidateUserId)
          .maybeSingle();

        const resolvedName = legalName || alias || null;

        if (!existingUser) {
          await dbClient.from('users').insert({
            id: candidateUserId,
            email: candidateEmail,
            phone: candidatePhone,
            full_name: resolvedName,
            role: 'freelancer',
            status: 'active',
            onboarded: true,
            updated_at: new Date().toISOString(),
          });
        } else {
          await dbClient.from('users').update({
            full_name: resolvedName || existingUser.full_name,
            role: 'freelancer',
            onboarded: true,
            updated_at: new Date().toISOString(),
          }).eq('id', candidateUserId);
        }

        const reelUrls = Array.isArray(body.reels)
          ? body.reels.map((r: any) => (typeof r === 'string' ? r : r.url)).filter(Boolean)
          : [];

        const profilePayload = {
          id: candidateUserId,
          tracking_id: trackingId,
          bio: philosophy || 'Creative Editor',
          skills: Array.isArray(languages) ? languages : ['4K Color Grading'],
          software: Array.isArray(software) ? software : ['DaVinci Resolve Studio'],
          approval_status: 'pending',
          onboarding_status: 'pending_review',
          portfolio_url: body.showreelUrl || null,
          sample_links: reelUrls,
          public_display_name: alias || legalName || null,
          pan_number: encryptedPan,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: insErr } = await dbClient.from('creator_profiles').insert([profilePayload]);
        if (insErr && (insErr.code === '23505' || insErr.message?.includes('duplicate'))) {
          // Row already initialized at OTP signup; update fields
          await dbClient.from('creator_profiles').update({
            tracking_id: trackingId,
            bio: profilePayload.bio,
            skills: profilePayload.skills,
            software: profilePayload.software,
            portfolio_url: profilePayload.portfolio_url,
            sample_links: profilePayload.sample_links,
            public_display_name: profilePayload.public_display_name,
            pan_number: encryptedPan,
            updated_at: new Date().toISOString(),
          }).eq('id', candidateUserId);
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
