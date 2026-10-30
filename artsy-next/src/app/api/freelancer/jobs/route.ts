import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['freelancer', 'admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Creator access required' }, { status: 401 });
  }

  const db = supabaseAdmin || supabase;
  if (!db || typeof db.from !== 'function') {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  const creatorId = authUser.id;

  try {
    // 1. Fetch assignments for this creator
    const { data: assignments, error: assignErr } = await db
      .from('assignments')
      .select(`
        id,
        project_id,
        status,
        offered_at,
        expires_at,
        responded_at,
        decline_reason,
        created_at,
        projects:project_id (
          id,
          project_number,
          title,
          status,
          client_id,
          order_id,
          created_at,
          orders:order_id (
            id,
            order_number,
            gross_amount,
            status,
            service_key,
            requirements_snapshot,
            client_name,
            client_phone,
            client_email
          )
        )
      `)
      .eq('creator_id', creatorId)
      .in('status', ['offered', 'accepted'])
      .order('created_at', { ascending: false });

    if (assignErr) {
      console.warn('[Freelancer Jobs API] Error fetching assignments:', assignErr);
      return NextResponse.json({ success: true, offeredJobs: [], activeProjects: [] });
    }

    const offeredJobs: any[] = [];
    const activeProjects: any[] = [];

    (assignments || []).forEach((item: any) => {
      const proj = item.projects;
      if (!proj) return;
      const ord = proj.orders || {};
      const snap = ord.requirements_snapshot || {};

      // Dynamic payout calculation
      const grossPaise = ord.gross_amount || 100000;
      const waterfall = calculateFinancialWaterfall(grossPaise);
      const payoutPaise = waterfall.creatorAmount;
      const payoutInr = Math.round(payoutPaise / 100);

      // Turnaround label
      const turnaround = snap.turnaround || 'standard';
      const turnaroundLabel =
        turnaround === 'rush' || turnaround === 'express'
          ? '48 Hours Express'
          : turnaround === 'priority'
          ? '4–5 Working Days'
          : '7–10 Working Days Standard';

      // Deliverable title
      let displayTitle = proj.title || 'Cinematic Edit';
      const rawSub = snap.subCategory || snap.serviceId;
      if (rawSub) {
        const cleanSub = String(rawSub).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        const rawCat = snap.category || ord.service_key || '';
        const cleanCat = rawCat ? String(rawCat).replace(/\b\w/g, (c: string) => c.toUpperCase()) : '';
        displayTitle = cleanCat ? `${cleanCat} • ${cleanSub}` : cleanSub;
      }

      const jobRecord = {
        assignmentId: item.id,
        projectId: proj.id,
        projectNumber: proj.project_number || `PRJ-${String(proj.id).slice(0, 8)}`,
        orderId: ord.id,
        orderNumber: ord.order_number || `ORD-${String(ord.id).slice(0, 8)}`,
        title: displayTitle,
        category: snap.category || ord.service_key || 'Personal',
        angles: snap.angles === 'multi' ? 'Multi-Camera' : 'Single Camera',
        turnaround: turnaroundLabel,
        payoutInr,
        payoutPaise,
        grossPaise,
        status: item.status,
        projectStatus: proj.status,
        offeredAt: item.offered_at,
        expiresAt: item.expires_at,
        clientName: ord.client_name || 'Client Partner',
      };

      if (item.status === 'offered') {
        offeredJobs.push(jobRecord);
      } else if (item.status === 'accepted') {
        activeProjects.push(jobRecord);
      }
    });

    return NextResponse.json({
      success: true,
      offeredJobs,
      activeProjects,
    });
  } catch (err: any) {
    console.error('[Freelancer Jobs API Exception]', err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
