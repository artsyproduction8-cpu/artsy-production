import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { decryptPII, maskPAN } from '@/lib/crypto/pii';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Security Fix #4: Strict admin authentication check
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { id: creatorId } = await params;

    let encryptedPan = '';
    let creatorName = 'Creator';

    if (supabase && typeof supabase.from === 'function') {
      try {
        const dbQuery = supabase
          .from('creator_profiles')
          .select('pan_number, users(full_name)')
          .eq('id', creatorId)
          .maybeSingle();

        const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: null }), 1000));
        const res = (await Promise.race([dbQuery, timeout])) as { data?: { pan_number?: string; users?: { full_name?: string } } | null };

        if (res?.data) {
          encryptedPan = res.data.pan_number || '';
          creatorName = res.data.users?.full_name || creatorName;
        }
      } catch (e) {
        console.warn('DB read fallback:', e);
      }
    }

    if (!encryptedPan) {
      return NextResponse.json({ error: 'Creator PAN record not found' }, { status: 404 });
    }

    const decryptedPan = decryptPII(encryptedPan);
    const masked = maskPAN(decryptedPan);
    const auditLogId = `aud_rev_${Date.now()}`;

    // Security audit log entry
    console.info(`[SECURITY AUDIT] PAN revealed by admin ${authUser.id.slice(0, 8)} for creator [REDACTED]`);

    return NextResponse.json({
      success: true,
      creatorId,
      creatorName,
      maskedPan: masked,
      decryptedPan,
      auditLogId,
      revealedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[PAN reveal error]:', err);
    return NextResponse.json(
      { error: 'Failed to reveal sensitive credentials' },
      { status: 500 }
    );
  }
}
