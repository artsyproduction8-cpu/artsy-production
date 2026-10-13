import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/../lib/supabase';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
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
            pan_number: pan || null,
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
    return NextResponse.json(
      { success: false, error: 'Internal server error processing creator application' },
      { status: 500 }
    );
  }
}
