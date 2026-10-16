import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { createErrorResponse } from '@/lib/api-response';

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
  const clientId = searchParams.get('id');

  try {
    // If specific client ID requested, return full detail view
    if (clientId) {
      const { data: client, error: clientErr } = await dbClient
        .from('users')
        .select('id, full_name, phone, email, role, status, created_at, updated_at, deleted_at')
        .eq('id', clientId)
        .single();

      if (clientErr || !client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      // Fetch client orders
      const { data: orders } = await dbClient
        .from('orders')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      const orderIds = (orders || []).map((o: any) => o.id);

      // Fetch client payments (filtered to exclude gateway_signature and raw gateway_response)
      let payments: any[] = [];
      if (orderIds.length > 0) {
        const { data: payData } = await dbClient
          .from('payments')
          .select('id, order_id, amount, currency, gateway, payment_method, status, captured_at, created_at')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false });
        payments = payData || [];
      }

      // Fetch client projects
      const { data: projects } = await dbClient
        .from('projects')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      // Fetch client invoices
      const { data: invoices } = await dbClient
        .from('invoice_records')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      // Fetch notifications sent to client email or phone
      let notifications: any[] = [];
      const cleanPhone = client.phone ? client.phone.replace(/\D/g, '').slice(-10) : '';
      const filterConditions = [];
      if (client.email) filterConditions.push(`recipient.eq.${client.email}`);
      if (cleanPhone) {
        filterConditions.push(`recipient.eq.${cleanPhone}`);
        filterConditions.push(`recipient.eq.+91${cleanPhone}`);
      }

      if (filterConditions.length > 0) {
        const { data: notifData } = await dbClient
          .from('notification_delivery_log')
          .select('*')
          .or(filterConditions.join(','))
          .order('created_at', { ascending: false })
          .limit(50);
        notifications = notifData || [];
      }

      return NextResponse.json({
        success: true,
        client: {
          ...client,
          orders: orders || [],
          payments,
          projects: projects || [],
          invoices: invoices || [],
          notifications,
        },
      });
    }

    // Default: List all clients with aggregated statistics
    const { data: clients, error: usersErr } = await dbClient
      .from('users')
      .select('id, full_name, phone, email, role, status, created_at, updated_at, deleted_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false });

    if (usersErr) {
      return createErrorResponse(usersErr, 'Failed to fetch clients', 500);
    }

    // Fetch all orders to compute total_orders and lifetime_value per client
    const { data: orders } = await dbClient
      .from('orders')
      .select('client_id, gross_amount, status');

    const orderStats: Record<string, { totalOrders: number; lifetimeValue: number }> = {};
    (orders || []).forEach((o: any) => {
      if (o.client_id) {
        if (!orderStats[o.client_id]) {
          orderStats[o.client_id] = { totalOrders: 0, lifetimeValue: 0 };
        }
        orderStats[o.client_id].totalOrders += 1;
        if (o.status === 'paid') {
          orderStats[o.client_id].lifetimeValue += (o.gross_amount || 0);
        }
      }
    });

    const enrichedClients = (clients || []).map((c: any) => {
      const stats = orderStats[c.id] || { totalOrders: 0, lifetimeValue: 0 };
      return {
        ...c,
        total_orders: stats.totalOrders,
        lifetime_value: stats.lifetimeValue,
      };
    });

    return NextResponse.json({
      success: true,
      clients: enrichedClients,
    });
  } catch (err: any) {
    return createErrorResponse(err, 'Failed to fetch studio client directory', 500);
  }
}
