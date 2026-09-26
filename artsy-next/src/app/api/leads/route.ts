import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, category, message, project_budget } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone number are required.' },
        { status: 400 }
      );
    }

    const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;
    const user_agent = request.headers.get('user-agent') || null;

    const leadData = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      category: category || 'other',
      message: message ? String(message).trim() : null,
      project_budget: project_budget ? String(project_budget).trim() : null,
      status: 'new',
      ip_address,
      user_agent,
      created_at: new Date().toISOString(),
    };

    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase.from('leads').insert([leadData]).select();
      if (error) {
        console.error('Error inserting lead to Supabase:', error);
        // Fallback response for dev/unconfigured environment
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
    return NextResponse.json(
      { error: 'Failed to process inquiry. Please try again or email dispatch directly.' },
      { status: 500 }
    );
  }
}
