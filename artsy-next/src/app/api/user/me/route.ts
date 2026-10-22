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

        if (!error && data) {
          dbUser = data;
        } else if (!error && !data && isUuid && !authUser.id.startsWith('usr-')) {
          const isPrivilegedAdmin = isSuperAdminAccount(authUser) || authUser.role === 'admin' || authUser.role === 'super_admin';
          if (isPrivilegedAdmin) {
            dbUser = {
              id: authUser.id,
              role: authUser.role || 'super_admin',
              status: 'active',
              full_name: authUser.full_name || 'Studio Owner (Super Admin)',
              email: authUser.email || CANONICAL_SUPER_ADMIN_EMAIL,
              phone: authUser.phone || `+91${CANONICAL_SUPER_ADMIN_PHONE}`,
            };
          } else {
            // Account was purged from database. Cleanly invalidate cookie and session.
            const res = NextResponse.json(
              { authenticated: false, user: null, error: 'User account not found' },
              {
                status: 401,
                headers: {
                  'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
              }
            );
            res.cookies.delete('artsy_auth_token');
            return res;
          }
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
            .select('id, approval_status, onboarding_status, tracking_id, rejection_reason, bio, skills, software, languages, portfolio_url, public_display_name, public_specialty, bank_account_name, bank_account_number, bank_ifsc_code, pan_number')
            .eq('id', resolvedUser.id)
            .maybeSingle();

          if (creatorProfile) {
            const safeCreatorProfile = {
              ...creatorProfile,
              pan_number: creatorProfile.pan_number ? maskPAN(creatorProfile.pan_number) : null,
              bank_account_number: creatorProfile.bank_account_number ? maskBankAccount(creatorProfile.bank_account_number) : null,
              bank_ifsc_code: creatorProfile.bank_ifsc_code ? maskIFSC(creatorProfile.bank_ifsc_code) : null,
            };
            resolvedUser.creator_profile = safeCreatorProfile;

            const hasSubmitted = Boolean(
              creatorProfile.onboarding_status === 'pending_review' ||
              creatorProfile.tracking_id ||
              creatorProfile.portfolio_url ||
              creatorProfile.public_specialty
            );

            if (creatorProfile.approval_status === 'approved' || creatorProfile.onboarding_status === 'approved') {
              resolvedStatus = 'approved';
            } else if (creatorProfile.approval_status === 'rejected' || creatorProfile.onboarding_status === 'rejected') {
              resolvedStatus = 'rejected';
            } else if (hasSubmitted && (creatorProfile.approval_status === 'pending' || creatorProfile.onboarding_status === 'pending_review')) {
              resolvedStatus = 'pending_review';
            } else {
              resolvedStatus = null;
            }

            resolvedTrackingId = creatorProfile.tracking_id || null;
            resolvedUser.rejection_reason = creatorProfile.rejection_reason || null;
            resolvedUser.bio = creatorProfile.bio || null;
            resolvedUser.skills = creatorProfile.skills || [];
            resolvedUser.software = creatorProfile.software || [];
            resolvedUser.languages = creatorProfile.languages || [];
            resolvedUser.portfolio_url = creatorProfile.portfolio_url || null;
            resolvedUser.public_display_name = creatorProfile.public_display_name || null;
            resolvedUser.public_specialty = creatorProfile.public_specialty || resolvedUser.studio_details?.specialty || null;
            if (!resolvedUser.full_name && creatorProfile.public_display_name) {
              resolvedUser.full_name = creatorProfile.public_display_name;
            }
          } else {
            // Strict rule: No creator profile row -> onboarding_status MUST be null
            resolvedUser.creator_profile = null;
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
