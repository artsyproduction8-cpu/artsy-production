import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import { maskPAN, maskBankAccount, maskIFSC } from '@/lib/crypto/pii';
import { createErrorResponse } from '@/lib/api-response';
import { getCachedData, setCachedData, invalidateCreatorCache } from '@/lib/cache';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }


  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return createErrorResponse('Database client unavailable', 'Database service is currently unavailable', 503);
  }

  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('id');

  try {
    // If specific creator detail requested
    if (creatorId) {
      const cacheKey = `cache:admin:creator:${creatorId}`;
      const cached = await getCachedData<any>(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: { 'X-Cache': 'HIT' },
        });
      }

      const { data: creatorUser } = await dbClient
        .from('users')
        .select('*')
        .eq('id', creatorId)
        .single();

      const { data: profile } = await dbClient
        .from('creator_profiles')
        .select('*')
        .eq('id', creatorId)
        .maybeSingle();

      if (!creatorUser && !profile) {
        return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
      }

      // Fetch creator assignments
      const { data: assignments } = await dbClient
        .from('assignments')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      // Fetch creator payouts with TDS breakdown
      const { data: payouts } = await dbClient
        .from('creator_payouts')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      // Fetch revisions submitted / assigned
      const { data: revisions } = await dbClient
        .from('revisions')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      // Fetch portfolio samples
      const { data: samples } = await dbClient
        .from('portfolio_samples')
        .select('*')
        .eq('creator_id', creatorId)
        .order('display_order', { ascending: true });

      // Active projects count
      const { count: activeWorkload } = await dbClient
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_creator_id', creatorId)
        .in('status', ['creator_assigned', 'in_production', 'review_ready', 'revision_requested']);

      // Apply field-level masking to sensitive financial PII
      const safeProfile = profile ? {
        ...profile,
        pan_number: profile.pan_number ? maskPAN(profile.pan_number) : null,
        bank_account_number: profile.bank_account_number ? maskBankAccount(profile.bank_account_number) : null,
        bank_ifsc_code: profile.bank_ifsc_code ? maskIFSC(profile.bank_ifsc_code) : null,
      } : {};

      const responsePayload = {
        success: true,
        creator: {
          id: creatorId,
          display_name: creatorUser?.display_name || creatorUser?.full_name || 'Creator',
          full_name: creatorUser?.full_name || '',
          phone: creatorUser?.phone || '',
          email: creatorUser?.email || '',
          status: creatorUser?.status || 'active',
          avatar_url: creatorUser?.avatar_url || '',
          studio_details: creatorUser?.studio_details || null,
          profile: safeProfile,
          assignments: assignments || [],
          payouts: payouts || [],
          revisions: revisions || [],
          samples: (samples || []).map((s: any) => ({
            id: s.id,
            title: s.title,
            category: s.category,
            video_url: s.video_url,
            codec: s.description || 'ProRes 422',
            resolution: s.thumbnail_url?.includes('4k') ? '4K UHD' : '1080p Full HD',
          })),
          metrics: {
            activeWorkload: activeWorkload || 0,
            totalProjectsCompleted: profile?.total_projects_completed || (assignments || []).filter((a: any) => a.status === 'completed').length,
            rating: profile?.avg_rating || 4.9,
          },
        },
      };

      await setCachedData(cacheKey, responsePayload, 120);

      return NextResponse.json(responsePayload, {
        headers: { 'X-Cache': 'MISS' },
      });
    }

    // Default: List all creators
    const listCacheKey = 'cache:admin:creators:list';
    const cachedList = await getCachedData<any>(listCacheKey);
    if (cachedList) {
      return NextResponse.json(cachedList, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    const { data: creatorUsers } = await dbClient
      .from('users')
      .select('id, full_name, display_name, phone, email, role, status, created_at, studio_details, avatar_url')
      .eq('role', 'freelancer')
      .order('created_at', { ascending: false });

    const { data: profiles } = await dbClient
      .from('creator_profiles')
      .select('*');

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.id] = p;
    });

    // Payout stats for total_earned
    const { data: payouts } = await dbClient
      .from('creator_payouts')
      .select('creator_id, gross_amount, net_payout, status');

    const earnedMap: Record<string, number> = {};
    (payouts || []).forEach((pay: any) => {
      if (pay.creator_id && pay.status === 'processed') {
        earnedMap[pay.creator_id] = (earnedMap[pay.creator_id] || 0) + (pay.net_payout || 0);
      }
    });

    const creators = (creatorUsers || []).map((u: any) => {
      const p = profileMap[u.id] || {};
      return {
        id: u.id,
        display_name: u.display_name || u.full_name || 'Creator Member',
        full_name: u.full_name || '',
        phone: u.phone || '',
        email: u.email || '',
        avatar_url: u.avatar_url || '',
        studio_details: u.studio_details || null,
        skills: p.skills || ['Video Editing', 'Color Grading'],
        approval_status: p.approval_status || 'pending',
        is_suspended: p.is_suspended || u.status === 'suspended',
        rating: p.avg_rating || 4.9,
        total_jobs: p.total_projects_completed || 0,
        total_earned: earnedMap[u.id] || 0,
        is_public: Boolean(p.is_public),
        public_display_name: p.public_display_name || u.display_name || u.full_name,
        public_specialty: p.public_specialty || '',
        creator_tier: p.creator_tier || 'rising_talent',
        created_at: u.created_at,
      };
    });

    const listPayload = {
      success: true,
      creators,
    };

    await setCachedData(listCacheKey, listPayload, 120);

    return NextResponse.json(listPayload, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (err: any) {
    return createErrorResponse(err, 'Failed to fetch creator profiles', 500);
  }
}

export async function PATCH(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { id, action, reason } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }

    if (!['approve', 'reject', 'suspend', 'reactivate', 'update_public_profile', 'update_profile', 'create', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // CREATE CREATOR
    if (action === 'create') {
      const {
        full_name,
        email,
        phone,
        bio,
        skills,
        software,
        portfolio_url,
        years_of_experience,
        public_display_name,
        public_specialty,
        public_bio,
        creator_tier,
        is_public,
        is_accepting_work,
        avg_rating,
        total_projects_completed
      } = body;

      if (!full_name || !email) {
        return NextResponse.json({ error: 'Full name and email are required to register a creator' }, { status: 400 });
      }

      const newId = randomUUID();
      const now = new Date().toISOString();

      const nameParts = full_name.trim().split(' ');
      const suggestedName = nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
        : nameParts[0];

      // Parse arrays
      const skillsArray = Array.isArray(skills)
        ? skills
        : typeof skills === 'string'
        ? skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : ['Video Editing', 'Color Grading'];

      const softwareArray = Array.isArray(software)
        ? software
        : typeof software === 'string'
        ? software.split(',').map((s: string) => s.trim()).filter(Boolean)
        : ['Premiere Pro', 'DaVinci Resolve'];

      const expNum = Number(years_of_experience) || 3;
      const completedNum = Number(total_projects_completed) || 0;
      const tierVal = creator_tier || (completedNum > 50 ? 'senior' : completedNum >= 10 ? 'standard' : 'rising_talent');

      // 1. Insert into users
      const { error: userErr } = await dbClient.from('users').insert([{
        id: newId,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        role: 'freelancer',
        status: 'active',
        created_at: now,
        updated_at: now,
      }]);

      if (userErr) {
        return createErrorResponse(userErr, 'Failed to create creator account', 500);
      }

      // 2. Insert into creator_profiles
      const { error: profErr } = await dbClient.from('creator_profiles').insert([{
        id: newId,
        user_id: newId,
        bio: bio || public_bio || `${full_name} is a verified Artsy Production editing partner.`,
        skills: skillsArray,
        software: softwareArray,
        portfolio_url: portfolio_url || null,
        experience_years: expNum,
        years_of_experience: expNum,
        approval_status: 'approved',
        approved_by: authUser.id,
        approved_at: now,
        is_suspended: false,
        is_public: is_public !== undefined ? Boolean(is_public) : true,
        public_display_name: public_display_name || suggestedName,
        public_specialty: public_specialty || (skillsArray[0] ? `${skillsArray[0]} Specialist` : 'Video Editor & Colorist'),
        public_bio: public_bio || bio || `${full_name} crafts premium cinematic edits and color grading.`,
        creator_tier: tierVal,
        is_accepting_work: is_accepting_work !== undefined ? Boolean(is_accepting_work) : true,
        avg_rating: avg_rating ? Number(avg_rating) : 4.9,
        total_projects_completed: completedNum,
        created_at: now,
        updated_at: now,
      }]);

      if (profErr) {
        await dbClient.from('users').delete().eq('id', newId);
        return createErrorResponse(profErr, 'Failed to create creator profile', 500);
      }

      // Audit log
      await dbClient.from('audit_logs').insert([{
        admin_id: authUser.id,
        action: 'CREATOR_CREATE',
        target_table: 'creator_profiles',
        target_id: newId,
        new_values: { full_name, email, role: 'freelancer' },
        created_at: now,
      }]);

      await invalidateCreatorCache(newId);

      return NextResponse.json({ success: true, creatorId: newId, action: 'create' });
    }

    // For all other actions, ID is required
    if (!id) {
      return NextResponse.json({ error: 'Creator ID required' }, { status: 400 });
    }

    // DELETE CREATOR
    if (action === 'delete') {
      const { error: delErr } = await dbClient.from('users').delete().eq('id', id);
      if (delErr) {
        return createErrorResponse(delErr, 'Failed to delete creator', 500);
      }

      await dbClient.from('audit_logs').insert([{
        admin_id: authUser.id,
        action: 'CREATOR_DELETE',
        target_table: 'users',
        target_id: id,
        new_values: { reason: reason || 'Admin deleted creator profile' },
        created_at: new Date().toISOString(),
      }]);

      await invalidateCreatorCache(id);

      return NextResponse.json({ success: true, creatorId: id, action: 'delete' });
    }

    let profileUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
    let userUpdate: Record<string, any> = { updated_at: new Date().toISOString() };

    if (action === 'approve') {
      profileUpdate.approval_status = 'approved';
      profileUpdate.onboarding_status = 'approved';
      profileUpdate.is_public = true;
      profileUpdate.approved_by = authUser.id;
      profileUpdate.approved_at = new Date().toISOString();
      userUpdate.status = 'active';
    } else if (action === 'reject') {
      profileUpdate.approval_status = 'rejected';
      profileUpdate.onboarding_status = 'rejected';
      profileUpdate.rejection_reason = reason || 'Portfolio review criteria not met';
      profileUpdate.is_public = false; // Cannot be public if rejected
      userUpdate.status = 'inactive';
    } else if (action === 'suspend') {
      profileUpdate.is_suspended = true;
      profileUpdate.suspended_reason = reason || 'Administrative suspension';
      profileUpdate.suspended_at = new Date().toISOString();
      userUpdate.status = 'suspended';
    } else if (action === 'reactivate') {
      profileUpdate.is_suspended = false;
      profileUpdate.suspended_reason = null;
      userUpdate.status = 'active';
    } else if (action === 'update_public_profile' || action === 'update_profile') {
      const {
        full_name,
        email,
        phone,
        bio,
        skills,
        software,
        portfolio_url,
        is_public,
        public_display_name,
        public_specialty,
        public_bio,
        years_of_experience,
        creator_tier,
        is_accepting_work,
        avg_rating,
        total_projects_completed,
      } = body;

      // Update user details if provided
      if (full_name !== undefined) userUpdate.full_name = full_name.trim();
      if (email !== undefined) userUpdate.email = email.trim().toLowerCase();
      if (phone !== undefined) userUpdate.phone = phone.trim();
      if (body.studio_details !== undefined && typeof body.studio_details === 'object') {
        userUpdate.studio_details = body.studio_details;
      }

      // Check current approval_status
      const { data: currentProf } = await dbClient
        .from('creator_profiles')
        .select('approval_status, total_projects_completed')
        .eq('id', id)
        .single();

      let targetIsPublic = is_public !== undefined ? Boolean(is_public) : undefined;
      if (currentProf?.approval_status !== 'approved' && targetIsPublic) {
        targetIsPublic = false; // Rule: Cannot be public if not approved
      }

      if (targetIsPublic !== undefined) profileUpdate.is_public = targetIsPublic;
      if (public_display_name !== undefined) profileUpdate.public_display_name = public_display_name;
      if (public_specialty !== undefined) profileUpdate.public_specialty = public_specialty;
      if (public_bio !== undefined) profileUpdate.public_bio = public_bio;
      if (bio !== undefined) profileUpdate.bio = bio;
      if (portfolio_url !== undefined) profileUpdate.portfolio_url = portfolio_url;
      if (years_of_experience !== undefined) {
        profileUpdate.years_of_experience = Number(years_of_experience);
        profileUpdate.experience_years = Number(years_of_experience);
      }
      if (creator_tier !== undefined) profileUpdate.creator_tier = creator_tier;
      if (is_accepting_work !== undefined) profileUpdate.is_accepting_work = Boolean(is_accepting_work);
      if (avg_rating !== undefined) profileUpdate.avg_rating = Number(avg_rating);
      if (total_projects_completed !== undefined) profileUpdate.total_projects_completed = Number(total_projects_completed);

      if (skills !== undefined) {
        profileUpdate.skills = Array.isArray(skills)
          ? skills
          : typeof skills === 'string'
          ? skills.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];
      }
      if (software !== undefined) {
        profileUpdate.software = Array.isArray(software)
          ? software
          : typeof software === 'string'
          ? software.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];
      }
    }

    // Safe profile update avoiding PostgreSQL 42P17 infinite recursion
    const { data: existingCp } = await dbClient
      .from('creator_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (existingCp) {
      const mergedCp = {
        ...existingCp,
        ...profileUpdate,
        updated_at: new Date().toISOString(),
      };
      await dbClient.from('creator_profiles').delete().eq('id', id);
      await dbClient.from('creator_profiles').insert(mergedCp);
    } else {
      await dbClient.from('creator_profiles').insert({
        id,
        user_id: id,
        ...profileUpdate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Update user
    await dbClient.from('users').update(userUpdate).eq('id', id);

    // Record audit log
    await dbClient.from('audit_logs').insert([
      {
        admin_id: authUser.id,
        action: `CREATOR_${action.toUpperCase()}`,
        target_table: 'creator_profiles',
        target_id: id,
        new_values: { action, reason: reason || null, profileUpdate, userUpdate },
        created_at: new Date().toISOString(),
      },
    ]);

    // Instant Cache Invalidation across Admin, Public directory, and Session (Sub-20ms)
    await invalidateCreatorCache(id);

    return NextResponse.json({ success: true, creatorId: id, action });
  } catch (err: any) {
    return createErrorResponse(err, 'Failed to update creator profile', 500);
  }
}

export async function POST(request: Request) {
  return PATCH(request);
}
