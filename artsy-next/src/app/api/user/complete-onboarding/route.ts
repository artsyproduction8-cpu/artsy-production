import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ onboarded: true, updated_at: new Date().toISOString() })
    .eq('id', authUser.id);

  if (error) {
    console.error('[Complete Onboarding] Error updating user:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Onboarding completed successfully' });
}
