/**
 * Artsy Production — Free Tier Services & Blockers Verification Script
 */

async function run() {
  console.log('--- 1. Testing /api/health ---');
  const healthRes = await fetch('http://localhost:3000/api/health');
  const health = await healthRes.json();
  console.log('Health response status:', healthRes.status);
  console.log('Health payload:', JSON.stringify(health, null, 2));

  console.log('\n--- 2. Testing /api/orders/create (Order Creation Engine) ---');
  const orderRes = await fetch('http://localhost:3000/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceId: 'wedding_highlight',
      amount: 600000,
      clientPhone: '+919876543210',
      clientName: 'Ananya Sharma',
      clientEmail: 'ananya@example.com',
    }),
  });
  const order = await orderRes.json();
  console.log('Order creation status:', orderRes.status);
  console.log('Order data:', JSON.stringify(order, null, 2));

  console.log('\n--- 3. Testing /api/auth/otp (Send Action) ---');
  const otpSendRes = await fetch('http://localhost:3000/api/auth/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '9876543210',
      role: 'client',
      consentGiven: true,
    }),
  });
  const otpSend = await otpSendRes.json();
  console.log('OTP Send status:', otpSendRes.status);
  console.log('OTP Send data:', JSON.stringify(otpSend, null, 2));

  console.log('\n--- 4. Testing /api/auth/otp (Verify Action) ---');
  const otpVerifyRes = await fetch('http://localhost:3000/api/auth/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '9876543210',
      action: 'verify',
      code: '123456',
      role: 'client',
    }),
  });
  const otpVerify = await otpVerifyRes.json();
  console.log('OTP Verify status:', otpVerifyRes.status);
  console.log('OTP Verify data:', JSON.stringify(otpVerify, null, 2));

  const allPassed =
    healthRes.ok &&
    orderRes.ok &&
    order.success === true &&
    otpSendRes.ok &&
    otpSend.success === true &&
    otpVerifyRes.ok &&
    otpVerify.success === true;

  console.log('\n========================================');
  console.log(allPassed ? 'ALL FREE TIER SERVICES & ROUTES PASSED!' : 'SOME CHECKS FAILED');
  console.log('========================================');
}

run().catch(console.error);
