import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, display_name } = body;

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      full_name: full_name.trim(),
      display_name: display_name?.trim() || full_name.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', authUser.id);

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
