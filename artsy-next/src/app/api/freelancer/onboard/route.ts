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

    const trackingId = `ART-${new Date().getFullYear()}-VET-${Math.floor(1000 + Math.random() * 9000)}`;
    const candidateUserId = authUser.id;
    const candidateEmail = authUser.email || '';
    const candidatePhone = authUser.phone || '';

    // Fix M: Encrypt PAN before saving to database
    const cleanPan = typeof pan === 'string' && pan.trim().length > 0 ? pan.trim().toUpperCase() : null;
    const encryptedPan = cleanPan ? encryptPII(cleanPan) : null;

    // 1. Ensure user and creator profile exist in Supabase with status = 'pending'
    if (supabase && typeof supabase.from === 'function') {
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', candidateUserId)
          .maybeSingle();

        if (!existingUser) {
          await supabase.from('users').insert({
            id: candidateUserId,
            email: candidateEmail,
            phone: candidatePhone,
            full_name: legalName || alias || null,
            role: 'freelancer',
            status: 'active',
          });
        }

        await supabase.from('creator_profiles').upsert([
          {
            id: candidateUserId,
            user_id: candidateUserId,
            bio: philosophy || 'Creative Editor',
            skills: Array.isArray(languages) ? languages : ['4K Color Grading'],
            software: Array.isArray(software) ? software : ['DaVinci Resolve Studio'],
            approval_status: 'pending',
            onboarding_status: 'pending',
            pan_number: encryptedPan,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch (dbErr) {
        console.warn('Supabase creator_profiles upsert non-fatal fallback:', dbErr);
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
