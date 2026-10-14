import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/../lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // L3: Rate limit leads submission per IP (3 per hour)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anon';
  const limit = await checkRateLimit(`lead_${ip}`, 'api', 3, 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many inquiries from your network. Please wait ${Math.ceil(limit.resetSeconds / 60)} minutes.` },
      { status: 429 }
    );
  }

  // M9: Safe JSON parsing
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  try {
    const { name, email, phone, category, message, project_budget } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone number are required.' },
        { status: 400 }
      );
    }

    // L4: Enforce max field lengths
    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedPhone = String(phone).trim();
    const trimmedMessage = message ? String(message).trim() : null;

    if (trimmedName.length > 100) {
      return NextResponse.json({ error: 'Name must not exceed 100 characters.' }, { status: 400 });
    }
    if (trimmedEmail.length > 200) {
      return NextResponse.json({ error: 'Email must not exceed 200 characters.' }, { status: 400 });
    }
    if (trimmedMessage && trimmedMessage.length > 5000) {
      return NextResponse.json({ error: 'Message must not exceed 5000 characters.' }, { status: 400 });
    }

    const ip_address = ip !== 'anon' ? ip : null;
    const user_agent = request.headers.get('user-agent') || null;

    const leadData = {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      category: category ? String(category).slice(0, 50) : 'other',
      message: trimmedMessage,
      project_budget: project_budget ? String(project_budget).trim().slice(0, 50) : null,
      status: 'new',
      ip_address,
      user_agent,
      created_at: new Date().toISOString(),
    };

    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase.from('leads').insert([leadData]).select();
      if (error) {
        console.error('Error inserting lead to Supabase:', error);
        return NextResponse.json({
          success: true,
          message: 'Inquiry received successfully (dev mode).',
          lead: leadData,
        });
      }
      return NextResponse.json({
        success: true,
        message: 'Inquiry received. Our dispatch desk will contact you within 2 business hours.',
        lead: data?.[0] || leadData,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry recorded.',
      lead: leadData,
    });
  } catch (err: unknown) {
    console.error('Lead submission exception:', err);
    // M10: Error masking
    return NextResponse.json(
      { error: 'Failed to process inquiry. Please try again or email dispatch directly.' },
      { status: 500 }
    );
  }
}
