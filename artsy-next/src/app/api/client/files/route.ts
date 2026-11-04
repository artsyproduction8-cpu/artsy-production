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

    // 1. Fetch client's projects and linked orders
    let clientProjects: any[] = [];
    let projectIds: string[] = [];

    if (authUser.role === 'client' && authUser.id && !authUser.id.startsWith('mock-')) {
      const { data: projs } = await supabaseAdmin
        .from('projects')
        .select(`
          id, project_number, title, status, final_download_url, raw_footage_b2_prefix, created_at, updated_at, order_id,
          orders:order_id ( id, order_number, requirements_snapshot, status )
        `)
        .eq('client_id', authUser.id)
        .order('created_at', { ascending: false });

      if (projs && projs.length > 0) {
        clientProjects = projs;
        projectIds = projs.map((p: { id: string }) => p.id);
      }
    }

    // 2. Fetch client's studio_details for ingest / footage links
    let studioDetails: any = {};
    if (authUser.id && !authUser.id.startsWith('mock-')) {
      try {
        const { data: clientUser } = await supabaseAdmin
          .from('users')
          .select('studio_details')
          .eq('id', authUser.id)
          .maybeSingle();
        if (clientUser?.studio_details) {
          studioDetails = clientUser.studio_details;
        }
      } catch {}
    }

    // 3. Fetch file records from file_records table
    let dbFiles: any[] = [];
    try {
      let query = supabaseAdmin
        .from('file_records')
        .select('*')
        .eq('is_soft_deleted', false)
        .order('created_at', { ascending: false });

      if (projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      }

      const { data: records } = await query;
      if (records) dbFiles = records;
    } catch (e) {
      console.warn('[API /client/files] file_records query warning:', e);
    }

    // 4. Map DB file_records
    const mappedDbFiles = dbFiles.map((item: any) => {
      const isExpiring = isFileExpiring(item.retention_delete_at);
      let status: 'delivered' | 'in_progress' | 'expiring_soon' = 'in_progress';
      if (isExpiring) {
        status = 'expiring_soon';
      } else if (item.file_type === 'master_delivery') {
        status = 'delivered';
      }

      const matchingProj = clientProjects.find((p) => p.id === item.project_id);
      return {
        ...item,
        project_title: matchingProj?.title || `Project #${item.project_id?.slice(0, 8)}`,
        project_number: matchingProj?.project_number || item.project_id?.slice(0, 8),
        status,
        download_url: item.download_url || `/api/storage/download?fileId=${item.id}`,
      };
    });

    // 5. Generate structured link assets for each project (Raw footage, final/approved video, draft preview)
    const projectAssetFiles: any[] = [];
    const seenUrls = new Set<string>();
    mappedDbFiles.forEach((f) => {
      if (f.download_url) seenUrls.add(f.download_url);
    });

    clientProjects.forEach((proj: any) => {
      const snap = proj.orders?.requirements_snapshot || {};
      const projTitle = proj.title || `Project #${proj.project_number || proj.id.slice(0, 8)}`;
      const projNum = proj.project_number || proj.id.slice(0, 8);

      // A) Raw Footage Link
      const rawFootageUrl =
        snap.rawFootageUrl ||
        snap.raw_footage_link ||
        proj.raw_footage_b2_prefix ||
        studioDetails.ingestLink;

      if (rawFootageUrl && !seenUrls.has(rawFootageUrl)) {
        seenUrls.add(rawFootageUrl);
        const provider =
          studioDetails.ingestProvider ||
          (rawFootageUrl.includes('drive.google.com')
            ? 'Google Drive Vault'
            : rawFootageUrl.includes('dropbox.com')
            ? 'Dropbox Enterprise'
            : 'Cloud Storage Vault');

        projectAssetFiles.push({
          id: `raw-${proj.id}`,
          project_id: proj.id,
          project_title: projTitle,
          project_number: projNum,
          file_name: `Original Camera Raw Footage (${provider})`,
          file_size_bytes: 0,
          file_type: 'raw_footage',
          storage_provider: provider,
          download_url: rawFootageUrl,
          status: 'ready',
          created_at: proj.created_at,
        });
      }

      // B) Final or Approved Video Link
      const finalUrl = proj.final_download_url || snap.deliverable_url || snap.master_url;
      const isApproved =
        proj.status === 'completed' ||
        proj.status === 'delivered' ||
        proj.status === 'approved' ||
        Boolean(snap.client_approval?.approvedAt);

      if (finalUrl && !seenUrls.has(finalUrl)) {
        seenUrls.add(finalUrl);
        const streamOrHost =
          finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be')
            ? 'Master 4K Video Stream'
            : finalUrl.includes('drive.google.com')
            ? 'Google Drive 4K Master'
            : finalUrl.includes('vimeo.com')
            ? 'Vimeo Pro Master'
            : 'Artsy Master Cloud Storage';

        projectAssetFiles.push({
          id: `final-${proj.id}`,
          project_id: proj.id,
          project_title: projTitle,
          project_number: projNum,
          file_name: `${projTitle} — Final Master Cut (4K Export)`,
          file_size_bytes: 0,
          file_type: 'master_delivery',
          storage_provider: streamOrHost,
          download_url: finalUrl,
          status: isApproved ? 'delivered' : 'ready',
          created_at: proj.updated_at || proj.created_at,
        });
      }

      // C) Draft Review Cut Preview
      const draftUrl = snap.draft_cut_url;
      if (draftUrl && draftUrl !== finalUrl && !seenUrls.has(draftUrl)) {
        seenUrls.add(draftUrl);
        projectAssetFiles.push({
          id: `draft-${proj.id}`,
          project_id: proj.id,
          project_title: projTitle,
          project_number: projNum,
          file_name: `${projTitle} — Draft Preview Cut v1.0`,
          file_size_bytes: 0,
          file_type: 'proxy',
          storage_provider: 'Video Review Suite',
          download_url: draftUrl,
          status: 'in_progress',
          created_at: proj.created_at,
        });
      }
    });

    const combinedFiles = [...projectAssetFiles, ...mappedDbFiles];
    return NextResponse.json({ success: true, files: combinedFiles });
  } catch (err: any) {
    console.error('[API /client/files] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
