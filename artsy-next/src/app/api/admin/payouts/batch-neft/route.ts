import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { checkRateLimit } from '@/lib/rateLimit';

interface NeftBatchRecord {
  transactionRef: string;
  projectId: string;
  creatorId: string;
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  grossAmountPaise: number;
  tdsRate: number;
  tdsAmountPaise: number;
  netPayoutPaise: number;
  netPayoutRupees: number;
  pan: string;
  narration: string;
}

export async function GET(request: NextRequest) {
  try {
    // Security Fix #4: Enforce admin authentication
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const limitGet = await checkRateLimit(`admin_batch_neft_get_${authUser.id}`, 'admin', 10, 600);
    if (!limitGet.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${Math.ceil(limitGet.resetSeconds / 60)} minutes.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    // PAN masked by default. Explicit second confirmation flag required to reveal full PAN
    const revealFullPan = searchParams.get('revealPan') === 'true' && searchParams.get('confirm') === 'true';

    if (revealFullPan) {
      console.warn(`[SECURITY AUDIT LOG] Unmasked PAN export accessed by admin ${authUser.id} at ${new Date().toISOString()}`);
    }

    let batchRecords: NeftBatchRecord[] = [];

    const db = supabaseAdmin || supabase;
    if (db) {
      // Fetch approved pending payouts with creator profile details
      const { data: payouts, error } = await db
        .from('creator_payouts')
        .select(`
          id,
          project_id,
          creator_id,
          gross_amount,
          tds_rate,
          tds_amount,
          net_payout,
          status,
          creator_profiles:creator_id (
            bank_account_name,
            bank_account_number,
            bank_ifsc_code,
            pan_number
          ),
          users:creator_id (
            full_name
          )
        `)
        .in('status', ['approved', 'pending']);

      if (!error && payouts && payouts.length > 0) {
        batchRecords = payouts.map((p: any) => {
          const profile = p.creator_profiles || {};
          const user = p.users || {};
          const beneficiaryName = profile.bank_account_name || user.full_name || 'CREATOR BENEFICIARY';
          const accountNumber = profile.bank_account_number || '000000000000';
          const ifscCode = profile.bank_ifsc_code || 'HDFC0000001';
          const pan = profile.pan_number || 'PANNOTPROVIDED';

          return {
            transactionRef: `NFT-${p.id.slice(0, 8).toUpperCase()}`,
            projectId: p.project_id,
            creatorId: p.creator_id,
            beneficiaryName: beneficiaryName.toUpperCase().replace(/[^A-Z0-9 ]/g, ''),
            accountNumber,
            ifscCode: ifscCode.toUpperCase().trim(),
            grossAmountPaise: p.gross_amount,
            tdsRate: Number(p.tds_rate) || 0.02,
            tdsAmountPaise: p.tds_amount,
            netPayoutPaise: p.net_payout,
            netPayoutRupees: p.net_payout / 100,
            pan: pan.toUpperCase(),
            narration: `ARTSY PROD POSTPROD AP-${p.project_id.slice(0, 6)}`.slice(0, 30),
          };
        });
      }
    }

    // Default sample for authorized admin dev preview if no pending payouts
    if (batchRecords.length === 0) {
      batchRecords = [
        {
          transactionRef: 'NFT-AP8841-01',
          projectId: 'proj-8841',
          creatorId: 'creator-1',
          beneficiaryName: 'KABIR VERMA',
          accountNumber: '50100239481234',
          ifscCode: 'HDFC0000128',
          grossAmountPaise: 461360,
          tdsRate: 0.02,
          tdsAmountPaise: 9227,
          netPayoutPaise: 452133,
          netPayoutRupees: 4521.33,
          pan: 'AAAPL4481K',
          narration: 'ARTSY PROD AP-8841 UDAIPUR',
        },
      ];
    }

    if (format === 'json') {
      const totalNetRupees = batchRecords.reduce((acc, r) => acc + r.netPayoutRupees, 0);
      const totalTdsRupees = batchRecords.reduce((acc, r) => acc + r.tdsAmountPaise / 100, 0);

      const sanitizedRecords = batchRecords.map(r => ({
        ...r,
        pan: revealFullPan ? r.pan : (r.pan.length >= 10 ? `XXXXX${r.pan.slice(-4)}` : 'XXXXXXXXXX'),
        accountNumber: r.accountNumber.length > 4 ? `XXXXXX${r.accountNumber.slice(-4)}` : r.accountNumber,
      }));

      return NextResponse.json({
        success: true,
        batchId: `BATCH-NEFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
        generatedAt: new Date().toISOString(),
        statutoryTdsSection: '194J-Tech (2% FTS)',
        recordsCount: sanitizedRecords.length,
        totalNetRupees: Number(totalNetRupees.toFixed(2)),
        totalTdsRupees: Number(totalTdsRupees.toFixed(2)),
        records: sanitizedRecords,
      });
    }

    // Default: Standard Corporate Banking NEFT CSV Format
    const csvHeaders = [
      'Transaction Reference',
      'Beneficiary Name',
      'Beneficiary Account Number',
      'IFSC Code',
      'Amount (INR)',
      'Transaction Narration',
      'Statutory TDS Deducted (INR)',
      'TDS Section',
      'Beneficiary PAN',
      'Project Reference',
    ];

    const csvRows = batchRecords.map((r) => {
      const maskedPan = r.pan && r.pan.length >= 10
        ? `XXXXXX${r.pan.slice(-4)}`
        : (r.pan || 'NOT_PROVIDED');
      const panOutput = revealFullPan ? r.pan : maskedPan;

      return [
        `"${r.transactionRef}"`,
        `"${r.beneficiaryName}"`,
        `"${r.accountNumber}"`,
        `"${r.ifscCode}"`,
        r.netPayoutRupees.toFixed(2),
        `"${r.narration}"`,
        (r.tdsAmountPaise / 100).toFixed(2),
        `"194J-Tech (2%)"`,
        `"${panOutput}"`,
        `"${r.projectId}"`,
      ];
    });

    const csvContent = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\r\n');
    const fileName = `ARTSY_NEFT_BATCH_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    console.error('[BATCH NEFT EXPORT ERROR]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal error generating NEFT batch' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Security Fix #4: Enforce admin authentication
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const limitPost = await checkRateLimit(`admin_batch_neft_post_${authUser.id}`, 'admin', 10, 600);
    if (!limitPost.allowed) {
      return NextResponse.json(
        { error: `Batch dispatch rate limit exceeded. Please wait ${Math.ceil(limitPost.resetSeconds / 60)} minutes.` },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { payoutIds, batchNotes } = body;

    const timestamp = new Date().toISOString();
    const batchRef = `BATCH-NEFT-${Date.now()}`;

    if (supabase && payoutIds && Array.isArray(payoutIds) && payoutIds.length > 0) {
      await supabase
        .from('creator_payouts')
        .update({
          status: 'processing',
          processed_at: timestamp,
          notes: `${batchNotes || 'Dispatched via Corporate NEFT'} [Batch: ${batchRef}]`,
        })
        .in('id', payoutIds);

      // Record immutable financial event for the payout run
      for (const pId of payoutIds) {
        await supabase.from('financial_events').insert({
          event_type: 'creator_payout',
          amount: 0,
          currency: 'INR',
          reference_id: pId,
          reference_table: 'creator_payouts',
          metadata: { batch_ref: batchRef, dispatched_at: timestamp, admin_id: authUser.id },
        });
      }
    }

    return NextResponse.json({
      success: true,
      batchRef,
      dispatchedAt: timestamp,
      message: 'NEFT batch marked as processing. Bank UTR reconciliation pending.',
    });
  } catch (err: any) {
    console.error('[BATCH NEFT DISPATCH ERROR]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal error dispatching batch' },
      { status: 500 }
    );
  }
}
