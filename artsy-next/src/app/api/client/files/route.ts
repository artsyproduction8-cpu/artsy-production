import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function isFileExpiring(retentionDate?: string): boolean {
  if (!retentionDate) return false;
  const now = Date.now();
  const diff = new Date(retentionDate).getTime() - now;
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, files: [] });
    }

    // First fetch client's project IDs if client role
    let projectIds: string[] = [];
    if (authUser.role === 'client' && authUser.id && !authUser.id.startsWith('mock-')) {
      const { data: clientProjects } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('client_id', authUser.id);

      if (clientProjects && clientProjects.length > 0) {
        projectIds = clientProjects.map((p: { id: string }) => p.id);
      }
    }

    let query = supabaseAdmin
      .from('file_records')
      .select('*')
      .eq('is_soft_deleted', false)
      .order('created_at', { ascending: false });

    if (projectIds.length > 0) {
      query = query.in('project_id', projectIds);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[API /client/files] Error fetching file records:', error);
      return NextResponse.json({ success: true, files: [] });
    }

    const mapped = (data || []).map((item: any) => {
      const isExpiring = isFileExpiring(item.retention_delete_at);

      let status: 'delivered' | 'in_progress' | 'expiring_soon' = 'in_progress';
      if (isExpiring) {
        status = 'expiring_soon';
      } else if (item.file_type === 'master_delivery') {
        status = 'delivered';
      }

      return {
        ...item,
        project_title: `Project ${item.project_id}`,
        status,
      };
    });

    return NextResponse.json({ success: true, files: mapped });
  } catch (err: any) {
    console.error('[API /client/files] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
