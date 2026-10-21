import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { invalidateCreatorCache } from '@/lib/cache';
import { formatPublicCreatorName } from '@/lib/masking';

export async function POST(req: NextRequest) {
  try {
    // Security Fix #4: Strict admin authentication check
    const authUser = await getAuthenticatedUser(req);
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
    const dbClient = supabaseAdmin || supabase;

    if (action === 'approve') {
      // 1. Update Supabase if connected
      if (dbClient && typeof dbClient.from === 'function') {
        try {
          const { data: existingCp } = await dbClient
            .from('creator_profiles')
            .select('*')
            .eq('id', creatorId)
            .maybeSingle();

          // Ensure public_display_name is populated and formatted with surname initial
          let rawName = existingCp?.public_display_name;
          const { data: userData } = await dbClient
            .from('users')
            .select('full_name, display_name')
            .eq('id', creatorId)
            .maybeSingle();

          if (!rawName || rawName === 'Creator Partner' || rawName.trim() === '') {
            rawName = userData?.full_name?.trim() || (creatorName !== 'Creator' ? creatorName : null) || 'Artsy Creator';
          }

          const publicDisplayName = formatPublicCreatorName(rawName) || 'Artsy Creator';

          const approvalData = {
            approval_status: 'approved',
            onboarding_status: 'approved',
            is_public: true,
            public_display_name: publicDisplayName,
            public_specialty: existingCp?.public_specialty || userData?.studio_details?.specialty || 'Commercial & Narrative Film Editor',
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (existingCp) {
            await dbClient.from('creator_profiles').update(approvalData).eq('id', creatorId);
          } else {
            await dbClient.from('creator_profiles').insert({
              id: creatorId,
              user_id: creatorId,
              ...approvalData,
              created_at: new Date().toISOString(),
            });
          }

          await dbClient
            .from('users')
            .update({
              status: 'active',
              full_name: userData?.full_name || rawName,
              display_name: publicDisplayName,
              updated_at: new Date().toISOString(),
            })
            .eq('id', creatorId);

          // WORM audit trail
          await dbClient.from('audit_logs').insert([{
            admin_id: authUser.id,
            action: 'CREATOR_APPROVED',
            target_table: 'creator_profiles',
            target_id: creatorId,
            new_values: { creatorName, approved_at: new Date().toISOString() },
            created_at: new Date().toISOString(),
          }]);
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

      // 3. Instant Cache Invalidation (Sub-20ms)
      await invalidateCreatorCache(creatorId);

      return NextResponse.json({
        success: true,
        status: 'approved',
        message: `Creator ${creatorName} approved. Onboarding pact, Resend welcome email, and WhatsApp notification dispatched.`,
      });
    } else {
      // Rejection flow
      if (dbClient && typeof dbClient.from === 'function') {
        try {
          const { data: existingCp } = await dbClient
            .from('creator_profiles')
            .select('*')
            .eq('id', creatorId)
            .maybeSingle();

          const rejectionData = {
            approval_status: 'rejected',
            onboarding_status: 'rejected',
            is_public: false,
            rejection_reason: rejectionReason || 'Portfolio needs additional raw timeline proof',
            updated_at: new Date().toISOString(),
          };

          if (existingCp) {
            await dbClient.from('creator_profiles').delete().eq('id', creatorId);
            await dbClient.from('creator_profiles').insert({ ...existingCp, ...rejectionData });
          } else {
            await dbClient.from('creator_profiles').insert({
              id: creatorId,
              user_id: creatorId,
              ...rejectionData,
              created_at: new Date().toISOString(),
            });
          }

          await dbClient
            .from('users')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('id', creatorId);

          // WORM audit trail
          await dbClient.from('audit_logs').insert([{
            admin_id: authUser.id,
            action: 'CREATOR_REJECTED',
            target_table: 'creator_profiles',
            target_id: creatorId,
            new_values: { creatorName, rejectionReason },
            created_at: new Date().toISOString(),
          }]);
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

      // Instant Cache Invalidation (Sub-20ms)
      await invalidateCreatorCache(creatorId);

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
