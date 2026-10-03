import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

/**
 * DPDP Act (v2.0) Data Export Route (§4.4, §10.2)
 * Right to Access: Generates full machine-readable personal data portfolio
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // 1. Authenticate caller identity
    const authUser = getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    // 2. Authorization check: caller must be owner or admin
    const isOwner = authUser.id === userId;
    const isAdmin = authUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to access this user data' },
        { status: 403 }
      );
    }

    if (isAdmin && !isOwner) {
      console.log(`[DPDP AUDIT] Admin ${authUser.id} exported data portfolio for user ${userId}`);
    }

    if (supabase) {
      // 1. Fetch User Record
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, phone, email, full_name, role, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // 2. Fetch Projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId);

      // 3. Fetch Orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId);

      // 4. Fetch Consent Records
      const { data: consents } = await supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', userId);

      // 5. Fetch Revisions
      const { data: revisions } = await supabase
        .from('revisions')
        .select('*')
        .eq('user_id', userId);

      const exportBundle = {
        dpdpCompliance: 'India Digital Personal Data Protection Act 2023',
        exportDate: new Date().toISOString(),
        fiduciary: 'Artsy Production',
        user,
        projects: projects || [],
        orders: orders || [],
        revisions: revisions || [],
        consentHistory: consents || []
      };

      return NextResponse.json(exportBundle, {
        headers: {
          'Content-Disposition': `attachment; filename="artsy_dpdp_export_${userId}.json"`,
          'Content-Type': 'application/json'
        }
      });
    }

    // Mock Mode Export
    const mockExport = {
      dpdpCompliance: 'India Digital Personal Data Protection Act 2023 (Simulation)',
      exportDate: new Date().toISOString(),
      fiduciary: 'Artsy Production',
      user: {
        id: userId,
        phone: '+919876543210',
        email: 'client@artsyproduction.in',
        role: 'client'
      },
      projects: [],
      orders: [],
      consentHistory: [
        {
          consent_type: 'dpdp_terms_v2',
          granted: true,
          timestamp: new Date().toISOString()
        }
      ]
    };

    return NextResponse.json(mockExport, {
      headers: {
        'Content-Disposition': `attachment; filename="artsy_dpdp_export_${userId}.json"`,
        'Content-Type': 'application/json'
      }
    });
  } catch (err: any) {
    console.error('[DPDP EXPORT ERROR]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal export error' },
      { status: 500 }
    );
  }
}
