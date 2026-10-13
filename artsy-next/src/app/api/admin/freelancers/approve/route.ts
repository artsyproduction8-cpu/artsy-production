import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/../lib/supabase';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

export async function POST(req: NextRequest) {
  try {
    // Security Fix #4: Strict admin authentication check
    const authUser = getAuthenticatedUser(req);
    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      creatorId,
      name,
      email,
      phone,
      action = 'approve',
      rejectionReason,
    } = body;

    if (!creatorId) {
      return NextResponse.json({ success: false, error: 'creatorId is required' }, { status: 400 });
    }

    const recipientEmail = email || '';
    const recipientPhone = phone || '';
    const creatorName = name || 'Creator';

    if (action === 'approve') {
      // 1. Update Supabase if connected
      if (supabase && typeof supabase.from === 'function') {
        try {
          await supabase
            .from('creator_profiles')
            .update({
              approval_status: 'approved',
              approved_at: new Date().toISOString(),
            })
            .eq('id', creatorId);
        } catch (dbErr) {
          console.warn('Supabase creator approval non-fatal error:', dbErr);
        }
      }

      // 2. Dispatch Event #3 (PROFILE_APPROVED) via Resend Email and WhatsApp
      try {
        await dispatchNotification({
          eventNumber: 3,
          userId: creatorId,
          recipientEmail,
          recipientPhone,
          variables: { name: creatorName },
          actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/freelancer`,
        });
      } catch (notifErr) {
        console.warn('Approval notification dispatch non-fatal error:', notifErr);
      }

      return NextResponse.json({
        success: true,
        status: 'approved',
        message: `Creator ${creatorName} approved. Onboarding pact, Resend welcome email, and WhatsApp notification dispatched.`,
      });
    } else {
      // Rejection flow
      if (supabase && typeof supabase.from === 'function') {
        try {
          await supabase
            .from('creator_profiles')
            .update({
              approval_status: 'rejected',
              rejection_reason: rejectionReason || 'Portfolio needs additional raw timeline proof',
            })
            .eq('id', creatorId);
        } catch (dbErr) {
          console.warn('Supabase creator rejection non-fatal error:', dbErr);
        }
      }

      try {
        await dispatchNotification({
          eventNumber: 4,
          userId: creatorId,
          recipientEmail,
          recipientPhone,
          variables: { name: creatorName },
        });
      } catch (notifErr) {
        console.warn('Rejection notification dispatch non-fatal error:', notifErr);
      }

      return NextResponse.json({
        success: true,
        status: 'rejected',
        message: `Creator ${creatorName} application archived. Notification sent.`,
      });
    }
  } catch (error) {
    console.error('Error in admin freelancer approval route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing approval' },
      { status: 500 }
    );
  }
}
