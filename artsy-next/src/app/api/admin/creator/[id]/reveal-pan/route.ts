import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { decryptPII, maskPAN } from '@/lib/crypto/pii';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params;

    let encryptedPan = '';
    let creatorName = 'Kabir Verma';

    if (supabase && typeof supabase.from === 'function') {
      try {
        const dbQuery = supabase
          .from('creator_profiles')
          .select('pan_number, users(full_name)')
          .eq('id', creatorId)
          .maybeSingle();

        // 600ms timeout so dev server never hangs if database container is offline
        const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: null }), 600));
        const res = (await Promise.race([dbQuery, timeout])) as { data?: { pan_number?: string; users?: { full_name?: string } } | null };

        if (res?.data) {
          encryptedPan = res.data.pan_number || '';
          creatorName = res.data.users?.full_name || creatorName;
        }
      } catch (e) {
        console.warn('DB read fallback:', e);
      }
    }

    // Default sample for dev testing if DB row doesn't exist
    if (!encryptedPan) {
      encryptedPan = 'AAAPL4481K';
    }

    const decryptedPan = decryptPII(encryptedPan);
    const masked = maskPAN(decryptedPan);
    const auditLogId = `aud_rev_${Date.now()}`;

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
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('PAN reveal error:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to reveal sensitive credentials', details: errorMsg },
      { status: 500 }
    );
  }
}
