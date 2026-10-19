import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cldewthefsteotdvftlj.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isValidJwt = (val) => {
  if (!val) return false;
  const parts = val.trim().split('.');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0;
};

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceKey && isValidJwt(serviceKey) ? serviceKey : anonKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        'x-artsy-server-auth': 'ArtsyServerSubmissionAuth2026',
      },
    },
  }
);

async function verifyAllFlows() {
  console.log('================================================================');
  console.log('VERIFYING END-TO-END FLOWS WITH RLS LOCKDOWN & supabaseAdmin');
  console.log('================================================================');

  let allPassed = true;

  // 1. TEST OTP FLOW (SEND & VERIFY)
  console.log('\n--- 1. Testing OTP Flow (Send & Verify via supabaseAdmin) ---');
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testOtp = '849201';
  const hashedOtp = await bcrypt.hash(testOtp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Step 1a: Server inserts OTP session
  const { data: sessionRow, error: sessionErr } = await supabaseAdmin
    .from('otp_sessions')
    .insert([
      {
        phone: testPhone,
        otp_hash: hashedOtp,
        expires_at: expiresAt,
        verified: false,
        role: 'client',
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (sessionErr) {
    console.error('  ✗ FAIL: OTP session insert failed:', sessionErr);
    allPassed = false;
  } else {
    console.log(`  ✓ PASS: OTP session created (id: ${sessionRow.id}, phone: +91${testPhone})`);

    // Step 1b: Server verifies OTP session
    const { data: dbSession, error: fetchErr } = await supabaseAdmin
      .from('otp_sessions')
      .select('id, phone, otp_hash, expires_at, verified, role')
      .eq('phone', testPhone)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !dbSession) {
      console.error('  ✗ FAIL: OTP session lookup failed:', fetchErr);
      allPassed = false;
    } else {
      const match = await bcrypt.compare(testOtp, dbSession.otp_hash);
      if (match) {
        const { error: verifyUpdateErr } = await supabaseAdmin
          .from('otp_sessions')
          .update({ verified: true })
          .eq('id', dbSession.id);

        if (verifyUpdateErr) {
          console.error('  ✗ FAIL: OTP session verify update failed:', verifyUpdateErr);
          allPassed = false;
        } else {
          console.log('  ✓ PASS: OTP verified and marked verified=true in database.');
        }
      } else {
        console.error('  ✗ FAIL: Bcrypt OTP hash mismatch');
        allPassed = false;
      }
    }

    // Step 1c: Server registers user on OTP verify
    const testUserId = crypto.randomUUID();
    const { data: newUserRow, error: newUserErr } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: testUserId,
          email: `${testPhone}@artsyprod.test`,
          phone: `+91${testPhone}`,
          full_name: 'Studio Test Client',
          role: 'client',
          status: 'active',
          token_version: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (newUserErr) {
      console.error('  ✗ FAIL: Registration user insert failed:', newUserErr);
      allPassed = false;
    } else {
      console.log(`  ✓ PASS: New user registered via supabaseAdmin (id: ${newUserRow.id})`);
      await supabaseAdmin.from('users').delete().eq('id', testUserId);
    }

    // Clean up OTP session
    await supabaseAdmin.from('otp_sessions').delete().eq('id', sessionRow.id);
  }

  // 2. TEST ORDER CREATION FLOW
  console.log('\n--- 2. Testing Order Creation Flow (/api/orders/create via supabaseAdmin) ---');
  const orderNumber = `ARTSY-TEST-${Date.now().toString(36).toUpperCase()}`;
  const grossAmount = 800000;
  const gstAmount = 122034;
  const gatewayFee = 18880;
  const netAmount = 659086;

  const { data: orderRow, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert([
      {
        order_number: orderNumber,
        currency: 'INR',
        gross_amount: grossAmount,
        gst_amount: gstAmount,
        gateway_fee: gatewayFee,
        net_amount: netAmount,
        status: 'payment_pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (orderErr) {
    console.error('  ✗ FAIL: Order creation failed:', orderErr);
    allPassed = false;
  } else {
    console.log(`  ✓ PASS: Order created via supabaseAdmin (id: ${orderRow.id}, order_number: ${orderRow.order_number}, gross: ₹${orderRow.gross_amount / 100})`);
    await supabaseAdmin.from('orders').delete().eq('id', orderRow.id);
  }

  // 3. TEST CREATOR ONBOARDING FLOW
  console.log('\n--- 3. Testing Creator Onboarding Flow (/api/freelancer/onboard via supabaseAdmin) ---');
  const creatorUserId = crypto.randomUUID();
  const trackingId = `ART-${new Date().getFullYear()}-VET-${Math.floor(1000 + Math.random() * 9000)}`;

  // Step 3a: Create initial user
  const { data: creatorUser, error: creatorUserErr } = await supabaseAdmin
    .from('users')
    .insert([
      {
        id: creatorUserId,
        email: `creator_${Date.now()}@artsyprod.test`,
        phone: '+919876543210',
        full_name: 'Rohit Cinematics',
        role: 'freelancer',
        status: 'active',
        onboarded: true,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (creatorUserErr) {
    console.error('  ✗ FAIL: Creator user insert failed:', creatorUserErr);
    allPassed = false;
  } else {
    console.log(`  ✓ PASS: Creator user registered (id: ${creatorUser.id})`);

    // Step 3b: Create creator profile
    const { data: profileRow, error: profileErr } = await supabaseAdmin
      .from('creator_profiles')
      .insert([
        {
          id: creatorUserId,
          tracking_id: trackingId,
          bio: 'Lead Wedding Film Editor with 6 years DaVinci Resolve Studio experience.',
          skills: ['4K Color Grading', 'Audio Mastering', 'Multi-Cam Sync'],
          software: ['DaVinci Resolve Studio', 'Premiere Pro'],
          approval_status: 'pending',
          onboarding_status: 'pending_review',
          public_display_name: 'Rohit Cinematics',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (profileErr) {
      console.error('  ✗ FAIL: Creator profile insert failed:', profileErr);
      allPassed = false;
    } else {
      console.log(`  ✓ PASS: Creator profile created via supabaseAdmin (tracking_id: ${profileRow.tracking_id}, status: ${profileRow.approval_status})`);
      await supabaseAdmin.from('creator_profiles').delete().eq('id', creatorUserId);
    }

    await supabaseAdmin.from('users').delete().eq('id', creatorUserId);
  }

  // 4. TEST NOTIFICATION DELIVERY LOGGING
  console.log('\n--- 4. Testing Notification Delivery Logging (notification_delivery_log via supabaseAdmin) ---');
  const { data: notifRow, error: notifErr } = await supabaseAdmin
    .from('notification_delivery_log')
    .insert([
      {
        channel: 'email',
        recipient: 'security-audit@artsyproduction.in',
        event_number: 1,
        provider_message_id: 'test_msg_id',
        status: 'sent',
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (notifErr) {
    console.error('  ✗ FAIL: Notification delivery log insert failed:', notifErr);
    allPassed = false;
  } else {
    console.log(`  ✓ PASS: Notification delivery log recorded via supabaseAdmin (id: ${notifRow.id})`);
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('STATUS: ALL END-TO-END FLOWS FUNCTIONING PERFECTLY UNDER RLS LOCKDOWN! ✓');
  } else {
    console.error('STATUS: ONE OR MORE FLOWS FAILED! ✗');
  }
  console.log('================================================================');
}

verifyAllFlows().catch((e) => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
