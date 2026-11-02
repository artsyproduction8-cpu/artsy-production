import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['freelancer', 'admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Creator access required' }, { status: 401 });
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id);
  if (!isUuid) {
    return NextResponse.json({
      success: true,
      totalPaidOut: 0,
      pendingInProgress: 0,
      readyForPayout: 0,
      completedCount: 0,
      payouts: [],
    });
  }

  const db = supabaseAdmin || supabase;
  if (!db || typeof db.from !== 'function') {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    // 1. Fetch all accepted assignments for this creator
    const { data: assignments, error: assignErr } = await db
      .from('assignments')
      .select('id, project_id, status, created_at')
      .eq('creator_id', authUser.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (assignErr) {
      console.error('[Freelancer Payouts API] Error fetching assignments:', assignErr);
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        success: true,
        totalPaidOut: 0,
        pendingInProgress: 0,
        readyForPayout: 0,
        completedCount: 0,
        payouts: [],
      });
    }

    const projectIds = assignments.map((a: any) => a.project_id).filter(Boolean);

    // 2. Fetch projects and their orders
    const { data: projects, error: projErr } = await db
      .from('projects')
      .select(`
        id, title, status, project_number, order_id, created_at,
        orders:order_id (id, order_number, gross_amount, status, service_key, paid_at)
      `)
      .in('id', projectIds);

    if (projErr) {
      console.error('[Freelancer Payouts API] Error fetching projects:', projErr);
    }

    // 3. Fetch past recorded creator_payouts if table exists
    const { data: dbPayouts } = await db
      .from('creator_payouts')
      .select('*')
      .eq('creator_id', authUser.id);

    const dbPayoutMap: Record<string, any> = {};
    (dbPayouts || []).forEach((dp: any) => {
      if (dp.project_id) dbPayoutMap[dp.project_id] = dp;
    });

    let totalPaidOut = 0;
    let pendingInProgress = 0;
    let readyForPayout = 0;
    let completedCount = 0;

    const payouts = (projects || []).map((p: any) => {
      const ord = p.orders || {};
      const grossPaise = Number(ord.gross_amount) || 800000;
      
      // Calculate statutory financial waterfall
      const waterfall = calculateFinancialWaterfall(grossPaise);
      const grossRupees = Math.round(waterfall.creatorAmount / 100);
      const tdsRupees = Math.round(waterfall.tdsAmount / 100);
      const netPayoutRupees = Math.round(waterfall.creatorNetPayout / 100);

      const isCompleted = p.status === 'completed' || p.status === 'approved';
      const existingPayout = dbPayoutMap[p.id];
      const isPaid = existingPayout?.status === 'dispatched' || existingPayout?.status === 'paid';

      let payoutStatus: 'pending' | 'ready' | 'paid' = 'pending';
      if (isPaid) {
        payoutStatus = 'paid';
        totalPaidOut += netPayoutRupees;
        completedCount++;
      } else if (isCompleted) {
        payoutStatus = 'ready';
        readyForPayout += netPayoutRupees;
        completedCount++;
      } else {
        payoutStatus = 'pending';
        pendingInProgress += netPayoutRupees;
      }

      const orderRef = ord.order_number || p.project_number || `ORD-${p.id.slice(0, 8)}`;
      const dateStr = ord.paid_at || p.created_at
        ? new Date(ord.paid_at || p.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'Active';

      return {
        id: p.id,
        projectId: p.id,
        projectTitle: p.title || 'Cinematic Video Edit',
        orderRef,
        date: dateStr,
        grossShare: grossRupees,
        tdsDeduction: tdsRupees,
        netPayout: netPayoutRupees,
        status: payoutStatus,
        statusLabel:
          payoutStatus === 'paid'
            ? 'Transferred via NEFT'
            : payoutStatus === 'ready'
            ? 'Ready for Payout'
            : 'In Progress (Client Review)',
      };
    });

    return NextResponse.json({
      success: true,
      totalPaidOut,
      pendingInProgress,
      readyForPayout,
      completedCount,
      payouts,
    });
  } catch (err: any) {
    console.error('[Freelancer Payouts API] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

