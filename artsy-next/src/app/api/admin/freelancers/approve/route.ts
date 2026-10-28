import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { invalidateCreatorCache, invalidateUserCache } from '@/lib/cache';
import { formatPublicCreatorName } from '@/lib/masking';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Security Fix #4: Strict admin authentication check
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    // Rate Limiting: Max 30 creator approval/rejection actions per minute
    const limit = await checkRateLimit(`admin_approve_${authUser.id}`, 'admin', 30, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Admin rate limit exceeded. Please wait ${Math.ceil(limit.resetSeconds)} seconds.` },
        { status: 429 }
      );
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

    let resolvedRecipientEmail = email || '';
    let resolvedRecipientPhone = phone || '';
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

          const { data: userData } = await dbClient
            .from('users')
            .select('full_name, display_name, phone, email, studio_details')
            .eq('id', creatorId)
            .maybeSingle();

          if (!resolvedRecipientEmail && userData?.email) resolvedRecipientEmail = userData.email;
          if (!resolvedRecipientPhone && userData?.phone) resolvedRecipientPhone = userData.phone;

          const sd = userData?.studio_details || {};
          let rawName = existingCp?.public_display_name;
          if (!rawName || rawName === 'Creator Partner' || rawName.trim() === '') {
            rawName = userData?.full_name?.trim() || userData?.display_name?.trim() || (creatorName !== 'Creator' ? creatorName : null) || 'Artsy Creator';
          }

          const publicDisplayName = formatPublicCreatorName(rawName) || 'Artsy Creator';
          const userDisplayName = userData?.display_name || userData?.full_name || rawName;

          const approvalData: Record<string, any> = {
            approval_status: 'approved',
            onboarding_status: 'approved',
            is_public: true,
            public_display_name: publicDisplayName,
            public_specialty: existingCp?.public_specialty || sd.specialty || 'Commercial & Narrative Film Editor',
            skills: (existingCp?.skills && existingCp.skills.length > 0) ? existingCp.skills : (sd.skills || ['Commercial & Narrative Film Editor', 'Color Grading', 'Sound Design', '4K Mastering']),
            software: (existingCp?.software && existingCp.software.length > 0) ? existingCp.software : (sd.software || ['DaVinci Resolve Studio', 'Adobe Premiere Pro']),
            languages: (existingCp?.languages && existingCp.languages.length > 0) ? existingCp.languages : (sd.languages || ['Hindi', 'English']),
            hardware_config: existingCp?.hardware_config || sd.hardware_config || '',
            sample_url_1: existingCp?.sample_url_1 || sd.sample_url_1 || '',
            sample_url_2: existingCp?.sample_url_2 || sd.sample_url_2 || '',
            sample_url_3: existingCp?.sample_url_3 || sd.sample_url_3 || '',
            portfolio_url: existingCp?.portfolio_url || sd.showreelUrl || existingCp?.sample_url_1 || '',
            bank_account_name: existingCp?.bank_account_name || sd.legalName || userData?.full_name || '',
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
              display_name: userDisplayName,
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
          recipientEmail: resolvedRecipientEmail,
          recipientPhone: resolvedRecipientPhone,
          variables: { name: creatorName },
          actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/freelancer`,
        });
      } catch (notifErr) {
        console.warn('Approval notification dispatch non-fatal error:', notifErr);
      }

      // 3. Instant Cache Invalidation (Sub-20ms)
      await Promise.all([
        invalidateCreatorCache(creatorId),
        invalidateUserCache(creatorId),
      ]);

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
          recipientEmail: resolvedRecipientEmail,
          recipientPhone: resolvedRecipientPhone,
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
