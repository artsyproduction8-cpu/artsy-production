import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { isSuperAdminAccount } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Sample ID required' }, { status: 400 });
  }

  const authUser = await getAuthenticatedUser(request);
  const isAuthorized = Boolean(
    authUser && (['admin', 'super_admin'].includes(authUser.role) || isSuperAdminAccount(authUser))
  );
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { title, category, description, is_visible, display_order, creator_id } = body;

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updatePayload.title = String(title).trim();
    if (category !== undefined) updatePayload.category = String(category).trim();
    if (description !== undefined) updatePayload.description = description ? String(description).trim() : null;
    if (is_visible !== undefined) updatePayload.is_visible = Boolean(is_visible);
    if (display_order !== undefined) updatePayload.display_order = Number(display_order);
    if (creator_id !== undefined) updatePayload.creator_id = creator_id || null;

    let { error: updateError } = await dbClient
      .from('portfolio_samples')
      .update(updatePayload)
      .eq('id', id);

    if (updateError && dbClient !== anonSupabase && anonSupabase) {
      console.warn('[Admin Portfolio PATCH Warning] Primary dbClient failed, trying anon client:', updateError.message);
      const fb = await anonSupabase
        .from('portfolio_samples')
        .update(updatePayload)
        .eq('id', id);
      if (!fb.error) {
        updateError = null;
      }
    }

    if (updateError) {
      console.error('[Admin Portfolio PATCH Error]', updateError);
      return NextResponse.json({ error: 'Failed to update sample' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sample: { id, ...updatePayload } });
  } catch (err: unknown) {
    console.error('[Admin Portfolio PATCH Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Sample ID required' }, { status: 400 });
  }

  const authUser = await getAuthenticatedUser(request);
  const isAuthorized = Boolean(
    authUser && (['admin', 'super_admin'].includes(authUser.role) || isSuperAdminAccount(authUser))
  );
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    let { error: deleteError } = await dbClient
      .from('portfolio_samples')
      .delete()
      .eq('id', id);

    if (deleteError && dbClient !== anonSupabase && anonSupabase) {
      console.warn('[Admin Portfolio DELETE Warning] Primary dbClient failed, trying anon client:', deleteError.message);
      const fb = await anonSupabase
        .from('portfolio_samples')
        .delete()
        .eq('id', id);
      if (!fb.error) {
        deleteError = null;
      }
    }

    if (deleteError) {
      console.error('[Admin Portfolio DELETE Error]', deleteError);
      return NextResponse.json({ error: 'Failed to delete sample' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    console.error('[Admin Portfolio DELETE Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
