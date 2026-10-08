import { createClient } from '@supabase/supabase-js'
import { mockServices } from './mockData'

// Check if Supabase credentials are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export let supabase: any
export let supabaseAdmin: any = null

const isPlaceholder = (val?: string) => {
  if (!val) return true;
  const lower = val.toLowerCase();
  return (
    lower.includes('your-supabase') ||
    lower.includes('[paste') ||
    lower.includes('placeholder') ||
    val.trim() === ''
  );
};

const isValidHttpUrl = (url?: string) => {
  if (!url || isPlaceholder(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured =
  isValidHttpUrl(supabaseUrl) &&
  Boolean(supabaseAnonKey && !isPlaceholder(supabaseAnonKey));

if (isSupabaseConfigured && supabaseUrl && supabaseAnonKey) {
  // Production mode: real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey);

  // If service role key is present and not a placeholder, create admin client
  if (supabaseServiceKey && !isPlaceholder(supabaseServiceKey)) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } else {
    supabaseAdmin = supabase;
  }
} else {
  // Development/mock mode: robust chainable mock Supabase client
  const createMockBuilder = (table: string) => {
    const defaultData = table === 'services' ? mockServices : [];
    const defaultSingle =
      table === 'users'
        ? {
            id: 'mock-user-id',
            phone: '+919876543210',
            full_name: 'Mock User',
            email: 'client@artsyproduction.in',
            role: 'client',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : table === 'orders'
        ? {
            id: 'ARTSY-892410',
            amount_paise: 800000,
            status: 'paid',
            user_id: 'mock-user-id',
            created_at: new Date().toISOString(),
          }
        : null;

    const builder: any = {
      select: () => builder,
      eq: () => builder,
      neq: () => builder,
      match: () => builder,
      in: () => builder,
      lt: () => builder,
      gt: () => builder,
      lte: () => builder,
      gte: () => builder,
      not: () => builder,
      order: () => builder,
      limit: () => builder,
      range: () => builder,
      single: () => Promise.resolve({ data: defaultSingle, error: null }),
      maybeSingle: () => Promise.resolve({ data: defaultSingle, error: null }),
      insert: (data: any) => {
        const row = Array.isArray(data) ? data[0] : data;
        const mockData = { ...row, id: row?.id || 'mock-' + Math.random().toString(36).substring(2, 9) };
        return {
          ...builder,
          select: () => ({
            single: () => Promise.resolve({ data: mockData, error: null }),
            then: (resolve: any) => resolve({ data: [mockData], error: null }),
          }),
          then: (resolve: any) => resolve({ data: [mockData], error: null }),
        };
      },
      update: () => ({
        ...builder,
        eq: () => Promise.resolve({ data: [], error: null }),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }),
      delete: () => ({
        ...builder,
        eq: () => Promise.resolve({ data: [], error: null }),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }),
      then: (resolve: any) => resolve({ data: defaultData, error: null }),
    };

    return builder;
  };

  supabase = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve(),
      signInWithOTP: () => Promise.resolve({ data: { session: null, user: null }, error: null }),
    },
    from: (table: string) => createMockBuilder(table),
  };
  supabaseAdmin = supabase;
}

// Auth helpers - modified to use the supabase client (real or mock)
export const signInWithWhatsApp = async (phoneNumber: string) => {
  // In a real implementation, this would integrate with WhatsApp Cloud API
  // For now, we'll simulate the OTP flow and create a Supabase user

  // This is a placeholder - in reality, you would:
  // 1. Send OTP via WhatsApp Cloud API
  // 2. Verify OTP with user input
  // 3. Create or fetch user in Supabase
  // 4. Set up session

  // For simulation in development:
  return {
    success: true,
    message: `OTP simulation: In production, this would send OTP via WhatsApp to ${phoneNumber}`,
    ...(process.env.NODE_ENV === 'development' && process.env.MOCK_WHATSAPP === 'true' && { testCode: '123456' }),
  }
}

export const verifyWhatsAppOtp = async (phoneNumber: string, code: string, fullName: string = '', role: 'client' | 'freelancer' | 'admin' = 'client') => {
  // Client-side: call backend OTP verification API
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          action: 'verify',
          code,
          role,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Verification failed' };
    } catch {
      // Fall through to fallback
    }
  }

  // In mock mode strictly within local development:
  if (process.env.NODE_ENV === 'development' && process.env.MOCK_WHATSAPP === 'true' && code === '123456') {
    // Try to get existing user or create new one
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phoneNumber)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
      return { success: false, error: fetchError }
    }

    if (existingUser) {
      // Update last sign-in
      await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingUser.id)

      return { success: true, user: existingUser }
    } else {
      const mockUser = {
        id: crypto.randomUUID(),
        email: `${phoneNumber.replace(/\D/g, '')}@artsyprod.studio`,
        phone: phoneNumber,
        full_name: fullName || `User ${phoneNumber.slice(-4)}`,
        role: role,
        status: 'active',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return { success: true, user: mockUser }
    }
  }

  return { success: false, error: 'Invalid verification code. Please try again.' }
}

export const signOut = async () => {
  await supabase.auth.signOut()
  // Clear any local storage items if needed
  localStorage.removeItem('artsy_auth_user')
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  // Fetch extended user data from our users table
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) return null

  return {
    ...user,
    ...profile
  }
}

// Database helper functions
export const getServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error
  return data
}

export const createOrder = async (orderData: {
  service_id: string
  requirements: Record<string, any>
  special_instructions?: string
}) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // Get service details for pricing
  const { data: service } = await supabase
    .from('services')
    .select('base_price')
    .eq('id', orderData.service_id)
    .single()

  if (!service) throw new Error('Service not found')

  const { data, error } = await supabase
    .from('orders')
    .insert({
      client_id: user.id,
      service_id: orderData.service_id,
      requirements: orderData.requirements,
      special_instructions: orderData.special_instructions,
      total_amount: service.base_price // In reality, calculate based on requirements
    })
    .select()

  if (error) throw error
  return data
}

// Initialize sample data (for development)
export const initializeSampleData = async () => {
  // This would typically be run via Supabase migrations or seed scripts
  console.log('Sample data initialization would happen here')
}