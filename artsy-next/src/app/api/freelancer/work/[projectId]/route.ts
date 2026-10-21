import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, project: null });
    }

    // Fetch project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json({ success: true, project: null });
    }

    // Fetch associated order if order_id exists
    let order: any = null;
    let service: any = null;
    let clientUser: any = null;

    if (project.order_id) {
      const { data: orderData } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', project.order_id)
        .maybeSingle();

      if (orderData) {
        order = orderData;
        if (orderData.service_id) {
          const { data: serviceData } = await supabaseAdmin
            .from('services')
            .select('*')
            .eq('id', orderData.service_id)
            .maybeSingle();
          service = serviceData;
        }

        if (orderData.client_id) {
          const { data: clientData } = await supabaseAdmin
            .from('users')
            .select('full_name, email')
            .eq('id', orderData.client_id)
            .maybeSingle();
          clientUser = clientData;
        }
      }
    }

    const enrichedProject = {
      ...project,
      orders: order
        ? {
            ...order,
            services: service,
            clients: clientUser,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      project: enrichedProject,
      order,
      service,
    });
  } catch (err: any) {
    console.error('[API /freelancer/work/[projectId]] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json().catch(() => ({}));
    const { action, checkin_status } = body;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true });
    }

    if (action === 'checkin') {
      let query = supabaseAdmin
        .from('assignments')
        .update({
          checkin_status,
          last_checkin_at: new Date().toISOString(),
        })
        .eq('project_id', projectId);

      if (authUser.id && !authUser.id.startsWith('mock-')) {
        query = query.eq('creator_id', authUser.id);
      }
      await query;
      return NextResponse.json({ success: true });
    }

    if (action === 'deliverable') {
      await supabaseAdmin
        .from('projects')
        .update({
          status: 'submitted',
          actual_delivery: new Date().toISOString(),
        })
        .eq('id', projectId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /freelancer/work/[projectId] PATCH] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
