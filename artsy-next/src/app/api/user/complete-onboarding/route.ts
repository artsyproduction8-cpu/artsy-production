import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin } from '@/lib/supabase';
import { invalidateUserCache } from '@/lib/cache';

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
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

  try {
    await invalidateUserCache(authUser.id);
  } catch (cErr) {
    console.warn('[Complete Onboarding] Cache invalidation warning:', cErr);
  }

  return NextResponse.json({ success: true, message: 'Onboarding completed successfully' });
}
