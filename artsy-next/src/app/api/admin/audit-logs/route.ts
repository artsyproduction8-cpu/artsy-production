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
  const search = searchParams.get('search')?.toLowerCase() || '';
  const actionFilter = searchParams.get('action') || '';
  const targetFilter = searchParams.get('target') || '';
  const format = searchParams.get('format'); // 'json' | 'csv'

  try {
    const query = dbClient
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    const { data: logs, error } = await query;

    if (error) {
      return createErrorResponse(error, 'Failed to fetch audit records', 500);
    }

    let filtered = logs || [];

    if (search) {
      filtered = filtered.filter((l: any) =>
        (l.admin_email && l.admin_email.toLowerCase().includes(search)) ||
        (l.action && l.action.toLowerCase().includes(search)) ||
        (l.target_table && l.target_table.toLowerCase().includes(search)) ||
        (l.target_id && String(l.target_id).toLowerCase().includes(search))
      );
    }

    if (actionFilter && actionFilter !== 'all') {
      filtered = filtered.filter((l: any) => l.action === actionFilter);
    }

    if (targetFilter && targetFilter !== 'all') {
      filtered = filtered.filter((l: any) => l.target_table === targetFilter);
    }

    if (format === 'csv') {
      const headers = ['Timestamp', 'Admin Email', 'Action', 'Target Table', 'Target ID', 'Changes (JSON)', 'IP Address'];
      const rows = filtered.map((l: any) => [
        `"${l.created_at}"`,
        `"${l.admin_email || l.admin_id || ''}"`,
        `"${l.action}"`,
        `"${l.target_table}"`,
        `"${l.target_id || ''}"`,
        `"${JSON.stringify(l.new_values || l.old_values || {}).replace(/"/g, '""')}"`,
        `"${l.ip_address || ''}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="artsy_audit_log_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      logs: filtered,
    });
  } catch (err: any) {
    return createErrorResponse(err, 'Failed to retrieve administrative audit logs', 500);
  }
}
