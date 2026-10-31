import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase, isSupabaseConfigured } from '@/lib/supabase';
import { isSuperAdminAccount, CANONICAL_SUPER_ADMIN_PHONE, CANONICAL_SUPER_ADMIN_EMAIL } from '@/lib/auth-utils';
import { getCachedUser, setCachedUser } from '@/lib/cache';
import { maskPAN, maskBankAccount, maskIFSC } from '@/lib/crypto/pii';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !authUser.id) {
      return NextResponse.json(
        { authenticated: false, user: null, error: 'Unauthorized' },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
    }

    // Sub-20ms Cache Fast Path (unless fresh=true is requested)
    const forceFresh = request.nextUrl.searchParams.get('fresh') === 'true';
    if (!forceFresh) {
      const cached = await getCachedUser(authUser.id);
      if (cached && cached.id) {
        return NextResponse.json(
          {
            authenticated: true,
            user: cached,
            source: 'cache',
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'X-Cache': 'HIT',
            },
          }
        );
      }
    }

    const dbClient = (supabaseAdmin && typeof supabaseAdmin.from === 'function') ? supabaseAdmin : supabase;
    let dbUser: any = null;

    if (isSupabaseConfigured && dbClient && typeof dbClient.from === 'function') {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id);
        let userQuery = dbClient
          .from('users')
          .select('id, email, phone, full_name, display_name, role, status, avatar_url, onboarded, studio_details, created_at, updated_at, token_version');

        if (isUuid) {
          userQuery = userQuery.eq('id', authUser.id);
        } else if (authUser.email) {
          userQuery = userQuery.eq('email', authUser.email);
        } else if (authUser.phone) {
          userQuery = userQuery.eq('phone', authUser.phone);
        } else {
          userQuery = userQuery.eq('id', authUser.id);
        }

        const { data, error } = await userQuery.maybeSingle();

        const isPrivilegedAdmin = isSuperAdminAccount(authUser) || authUser.role === 'admin' || authUser.role === 'super_admin';
        if (!error && data) {
          dbUser = data;
        } else if (isPrivilegedAdmin) {
          dbUser = {
            id: authUser.id,
            role: authUser.role || 'super_admin',
            status: 'active',
            full_name: authUser.full_name || 'Studio Owner (Super Admin)',
            email: authUser.email || CANONICAL_SUPER_ADMIN_EMAIL,
            phone: authUser.phone || `+91${CANONICAL_SUPER_ADMIN_PHONE}`,
          };
        }
      } catch (err) {
        console.warn('[api/user/me] DB query warning:', err);
      }
    }

    // Build the resolved fresh user object
    const isSuperAdmin = isSuperAdminAccount(dbUser) || isSuperAdminAccount(authUser);
    const finalRole = isSuperAdmin ? 'super_admin' : (dbUser?.role || authUser.role || 'client');
    const resolvedUser: any = {
      id: dbUser?.id || authUser.id,
      role: finalRole,
      email: dbUser?.email || authUser.email || '',
      phone: dbUser?.phone || authUser.phone || '',
      full_name: dbUser?.full_name ?? authUser.full_name ?? null,
      display_name: dbUser?.display_name || authUser.display_name || null,
      avatar_url: dbUser?.avatar_url || authUser.avatar_url || '',
      status: dbUser?.status || 'active',
      onboarded: dbUser?.onboarded !== undefined ? Boolean(dbUser.onboarded) : Boolean(authUser.onboarded),
      studio_details: dbUser?.studio_details || authUser.studio_details || null,
      creator_profile: authUser.creator_profile || null,
      created_at: dbUser?.created_at || new Date().toISOString(),
      updated_at: dbUser?.updated_at || new Date().toISOString(),
    };

    // If freelancer, fetch creator profile details
    if (finalRole === 'freelancer') {
      let resolvedStatus: 'pending' | 'approved' | 'rejected' | 'pending_review' | null = null;
      let resolvedTrackingId: string | null = null;

      if (isSupabaseConfigured && dbClient && typeof dbClient.from === 'function') {
        try {
          const { data: creatorProfile } = await dbClient
            .from('creator_profiles')
            .select('id, approval_status, onboarding_status, tracking_id, rejection_reason, bio, skills, software, languages, portfolio_url, public_display_name, public_specialty, bank_account_name, bank_account_number, bank_ifsc_code, pan_number, agreement_signed_at, agreement_accepted, agreement_accepted_at, hardware_config, sample_url_1, sample_url_2, sample_url_3, deleted_at')
            .or(`id.eq.${resolvedUser.id},user_id.eq.${resolvedUser.id}`)
            .maybeSingle();

          if (creatorProfile) {
            const sd = resolvedUser.studio_details || {};
            const safeCreatorProfile = {
              ...creatorProfile,
              bank_name: sd.bankName || sd.bank_name || 'HDFC Bank',
              bank_account_name: creatorProfile.bank_account_name || sd.legalName || resolvedUser.full_name || null,
              pan_number: creatorProfile.pan_number ? maskPAN(creatorProfile.pan_number) : (sd.pan ? maskPAN(sd.pan) : null),
              bank_account_number: creatorProfile.bank_account_number ? maskBankAccount(creatorProfile.bank_account_number) : (sd.bankAccount ? maskBankAccount(sd.bankAccount) : null),
              bank_ifsc_code: creatorProfile.bank_ifsc_code ? maskIFSC(creatorProfile.bank_ifsc_code) : (sd.ifsc ? maskIFSC(sd.ifsc) : null),
            };
            resolvedUser.creator_profile = safeCreatorProfile;

            const isProfileDeleted = Boolean(creatorProfile.deleted_at || dbUser?.status === 'deleted');
            if (isProfileDeleted) {
              resolvedStatus = null;
              resolvedUser.onboarded = false;
              resolvedTrackingId = null;
              resolvedUser.agreement_signed_at = null;
              resolvedUser.agreement_accepted = false;
            } else if (creatorProfile.approval_status === 'approved' || creatorProfile.onboarding_status === 'approved') {
              resolvedStatus = 'approved';
            } else if (creatorProfile.approval_status === 'rejected' || creatorProfile.onboarding_status === 'rejected') {
              resolvedStatus = 'rejected';
            } else if (
              creatorProfile.onboarding_status === 'pending_review' ||
              creatorProfile.onboarding_status === 'pending' ||
              creatorProfile.approval_status === 'pending' ||
              Boolean(creatorProfile.tracking_id)
            ) {
              resolvedStatus = 'pending_review';
            } else {
              resolvedStatus = null;
              resolvedUser.onboarded = false;
              resolvedTrackingId = null;
              resolvedUser.agreement_signed_at = null;
              resolvedUser.agreement_accepted = false;
            }

            resolvedTrackingId = isProfileDeleted ? null : (creatorProfile.tracking_id || null);
            resolvedUser.rejection_reason = creatorProfile.rejection_reason || null;
            resolvedUser.bio = creatorProfile.bio || sd.philosophy || null;
            resolvedUser.skills = (creatorProfile.skills && creatorProfile.skills.length > 0) ? creatorProfile.skills : (sd.skills || ['Commercial & Narrative Film Editor', 'Color Grading', 'Sound Design', '4K Mastering']);
            resolvedUser.software = (creatorProfile.software && creatorProfile.software.length > 0) ? creatorProfile.software : (sd.software || ['DaVinci Resolve Studio', 'Adobe Premiere Pro']);
            resolvedUser.languages = (creatorProfile.languages && creatorProfile.languages.length > 0) ? creatorProfile.languages : (sd.languages || ['Hindi', 'English']);
            resolvedUser.portfolio_url = creatorProfile.portfolio_url || sd.showreelUrl || creatorProfile.sample_url_1 || null;
            resolvedUser.public_display_name = creatorProfile.public_display_name || null;
            resolvedUser.public_specialty = creatorProfile.public_specialty || sd.specialty || null;
            resolvedUser.agreement_signed_at = creatorProfile.agreement_signed_at || creatorProfile.agreement_accepted_at || sd.agreement_signed_at || null;
            resolvedUser.agreement_accepted = Boolean(creatorProfile.agreement_signed_at || creatorProfile.agreement_accepted_at || creatorProfile.agreement_accepted || sd.agreement_accepted);
            resolvedUser.hardware_config = creatorProfile.hardware_config || sd.hardware_config || null;
            resolvedUser.sample_url_1 = creatorProfile.sample_url_1 || sd.sample_url_1 || null;
            resolvedUser.sample_url_2 = creatorProfile.sample_url_2 || sd.sample_url_2 || null;
            resolvedUser.sample_url_3 = creatorProfile.sample_url_3 || sd.sample_url_3 || null;

            if (!resolvedUser.full_name && (sd.legalName || creatorProfile.public_display_name)) {
              resolvedUser.full_name = sd.legalName || creatorProfile.public_display_name;
            }
            if (!resolvedUser.display_name && (sd.alias || resolvedUser.full_name)) {
              resolvedUser.display_name = sd.alias || resolvedUser.full_name;
            }
          } else {
            // Strict rule: No creator profile row -> onboarding_status MUST be null
            resolvedUser.creator_profile = null;
            resolvedUser.agreement_signed_at = null;
            resolvedUser.agreement_accepted = false;
          }
        } catch (pErr) {
          console.warn('[api/user/me] Creator profile lookup warning:', pErr);
        }
      }

      resolvedUser.onboarding_status = resolvedStatus;
      resolvedUser.tracking_id = resolvedTrackingId;
      resolvedUser.onboarded = Boolean(dbUser?.onboarded) && resolvedStatus !== null;
    }

    // Cache fresh resolved user object for instant sub-20ms subsequent queries
    try {
      await setCachedUser(resolvedUser.id, resolvedUser, 600);
    } catch (cErr) {
      console.warn('[api/user/me] Cache write warning:', cErr);
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: resolvedUser,
        source: 'database',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'X-Cache': 'MISS',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('[api/user/me] Exception:', error);
    return NextResponse.json(
      { authenticated: false, user: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
