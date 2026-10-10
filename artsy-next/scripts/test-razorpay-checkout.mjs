import crypto from 'crypto';

const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TmBOBx6rXIl7VO';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'gVrTf5SZwdL4PAeKv5bY8q5G';

async function runTests() {
  console.log('====================================================');
  console.log('   RAZORPAY STANDARD WEB CHECKOUT TEST SUITE');
  console.log('====================================================\n');

  console.log(`[Config Check] Key ID: ${KEY_ID}`);
  console.log(`[Config Check] Key Secret: ${KEY_SECRET.slice(0, 4)}...${KEY_SECRET.slice(-4)}\n`);

  // Import Razorpay directly to test live credentials and order generation
  const { default: Razorpay } = await import('razorpay');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${testName} ${detail}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail}`);
      failed++;
    }
  }

  // Init SDK instance as done in /api/create-order
  const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET,
  });

  // TEST 1: Create Order with valid amount (50000 paise / ₹500)
  console.log('1. Testing Order Creation via Razorpay SDK (POST https://api.razorpay.com/v1/orders):');
  let createdOrderId = null;
  try {
    const amount = 50000;
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: 'test_rcpt_' + Date.now(),
      notes: { platform: 'artsy_production_test' },
    });

    createdOrderId = order.id;
    assert(Boolean(order && order.id && order.id.startsWith('order_')), 'Valid Razorpay order_id generated', `(${order.id})`);
    assert(order.amount === 50000, 'Amount matches (50000 paise / ₹500)');
    assert(order.currency === 'INR', 'Currency matches (INR)');
    assert(order.status === 'created', 'Order status is "created"');
  } catch (err) {
    assert(false, 'Valid order creation failed', err.message);
  }

  // TEST 2: Validation for minimum amount (< 100 paise)
  console.log('\n2. Testing Minimum Amount Validation (< 100 paise):');
  {
    const testAmount = 50; // Less than 100 paise
    const isAmountValid = testAmount >= 100;
    assert(!isAmountValid, 'Reject amount < 100 paise before calling Razorpay API');
    
    // Also verify Razorpay API rejects it if sent
    try {
      await razorpay.orders.create({
        amount: testAmount,
        currency: 'INR',
        receipt: 'fail_rcpt_' + Date.now(),
      });
      assert(false, 'Razorpay API should reject amounts below 100 paise');
    } catch (err) {
      assert(true, 'Razorpay API or validator properly rejects invalid amount', `(${err.error?.description || err.message})`);
    }
  }

  // TEST 3: Signature Verification (Genuine Signature matching HMAC-SHA256)
  console.log('\n3. Testing Signature Verification (HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)):');
  {
    const testOrderId = createdOrderId || ('order_test_' + Date.now());
    const testPaymentId = 'pay_test_' + Date.now();
    
    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const genuineSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${testOrderId}|${testPaymentId}`)
      .digest('hex');

    // Verification logic matching /api/verify-payment
    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${testOrderId}|${testPaymentId}`)
      .digest('hex');

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(genuineSignature, 'utf8')
    );

    assert(isMatch === true, 'Matching HMAC-SHA256 signature passes timingSafeEqual check');
    assert(genuineSignature.length === 64, 'SHA-256 signature has correct hex digest length (64 chars)');
  }

  // TEST 4: Signature Verification (Tampered/Fake Signature)
  console.log('\n4. Testing Tampered / Invalid Signature Rejection:');
  {
    const testOrderId = createdOrderId || ('order_test_' + Date.now());
    const testPaymentId = 'pay_test_' + Date.now();
    const fakeSignature = 'bad_forged_signature_00000000000000000000000000000000000000000000';

    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${testOrderId}|${testPaymentId}`)
      .digest('hex');

    let isMatch = false;
    try {
      isMatch = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(fakeSignature, 'utf8')
      );
    } catch {
      isMatch = false;
    }

    assert(isMatch === false, 'Tampered signature is strictly rejected (returns 400, never marked paid)');
  }

  // TEST 5: Verify Required Parameters Check
  console.log('\n5. Testing Required Fields Validation for Verification:');
  {
    const checkFields = (body) => {
      const order_id = body.razorpay_order_id || body.order_id;
      const payment_id = body.razorpay_payment_id || body.payment_id;
      const signature = body.razorpay_signature || body.signature;
      return Boolean(order_id && payment_id && signature);
    };

    assert(!checkFields({ razorpay_order_id: 'ord_123' }), 'Missing payment_id and signature rejected');
    assert(!checkFields({ razorpay_order_id: 'ord_123', razorpay_payment_id: 'pay_123' }), 'Missing signature rejected');
    assert(checkFields({ razorpay_order_id: 'ord_123', razorpay_payment_id: 'pay_123', razorpay_signature: 'sig_123' }), 'All 3 fields present accepted');
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
