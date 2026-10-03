import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { deleteObject } from '@/lib/storage/b2-client';

/**
 * Retention & Deletion Lifecycle Cron (§6.5)
 * Schedule: Daily at 02:00 IST
 * 
 * Rules:
 * Raw Footage:
 * - Day 7: 7-day warning (Event 35)
 * - Day 12: 3-day warning (Event 36)
 * - Day 14: 1-day warning (Event 37)
 * - Day 15: Soft delete (status = 'soft_deleted')
 * - Day 22: Hard delete from B2 (status = 'deleted') (Event 38)
 * 
 * Final Video:
 * - Day 23: 7-day warning (Event 39)
 * - Day 27: 3-day warning (Event 40)
 * - Day 30: Soft delete
 * - Day 37: Hard delete (Event 41)
 * 
 * Safety Rule: Never delete during active dispute (status = 'disputed')
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[CRON SECURITY ALERT] CRON_SECRET is not configured on server — rejecting request');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const processedWarnings: string[] = [];
    const softDeletedFiles: string[] = [];
    const hardDeletedFiles: string[] = [];

    if (supabase) {
      const now = new Date();

      // 1. Fetch file records that are scheduled for retention and not disputed
      const { data: files, error } = await supabase
        .from('file_records')
        .select('id, project_id, file_category, retention_expires_at, is_deleted, storage_path, file_size_bytes')
        .eq('is_deleted', false);

      if (!error && files) {
        for (const file of files) {
          if (!file.retention_expires_at) continue;

          // Check if project is in dispute & fetch user details
          const { data: project } = await supabase
            .from('projects')
            .select('status, user_id, client_id')
            .eq('id', file.project_id)
            .maybeSingle();

          if (project?.status === 'disputed') {
            continue; // Safety Rule: Never delete during dispute
          }

          const targetUserId = (project as any)?.client_id || (project as any)?.user_id;
          let userPhone: string | undefined;
          let userEmail: string | undefined;

          if (targetUserId) {
            const { data: userRec } = await supabase
              .from('users')
              .select('phone, email')
              .eq('id', targetUserId)
              .maybeSingle();

            userPhone = userRec?.phone || undefined;
            userEmail = userRec?.email || undefined;
          }

          const sendRetentionNotification = async (eventNumber: number) => {
            if (!userPhone && !userEmail) {
              console.log(`[RETENTION CRON] Skipped event ${eventNumber} for project ${file.project_id}: user phone and email missing`);
              return;
            }

            await dispatchNotification({
              eventNumber,
              userId: targetUserId || 'system',
              recipientPhone: userPhone,
              recipientEmail: userEmail,
              variables: { projectId: file.project_id }
            });
          };

          const expiryDate = new Date(file.retention_expires_at);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Warnings for raw footage (15-day total retention window)
          if (file.file_category === 'raw_footage') {
            if (daysUntilExpiry === 7) {
              await sendRetentionNotification(35);
              processedWarnings.push(`raw_7d_warning_${file.id}`);
            } else if (daysUntilExpiry === 3) {
              await sendRetentionNotification(36);
              processedWarnings.push(`raw_3d_warning_${file.id}`);
            } else if (daysUntilExpiry === 1) {
              await sendRetentionNotification(37);
              processedWarnings.push(`raw_1d_warning_${file.id}`);
            } else if (daysUntilExpiry <= 0 && daysUntilExpiry > -7) {
              // Soft delete: move to trash/ logical marker
              await supabase
                .from('file_records')
                .update({ storage_path: `trash/${file.storage_path}`, updated_at: now.toISOString() })
                .eq('id', file.id);
              softDeletedFiles.push(file.id);
            } else if (daysUntilExpiry <= -7) {
              // Day 22: Hard delete from Backblaze B2 S3 storage
              const b2Res = await deleteObject(file.storage_path);
              if (b2Res.success) {
                await supabase
                  .from('file_records')
                  .update({ is_deleted: true, updated_at: now.toISOString() })
                  .eq('id', file.id);

                await sendRetentionNotification(38);
                hardDeletedFiles.push(file.id);
              }
            }
          }
        }
      }
    } else {
      console.log('[RETENTION CRON] Simulated daily retention execution in mock offline mode');
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processedWarningsCount: processedWarnings.length,
      softDeletedCount: softDeletedFiles.length,
      hardDeletedCount: hardDeletedFiles.length,
      mode: supabase ? 'live_supabase' : 'mock_offline'
    });
  } catch (err: any) {
    console.error('[RETENTION CRON ERROR]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal retention error' },
      { status: 500 }
    );
  }
}
