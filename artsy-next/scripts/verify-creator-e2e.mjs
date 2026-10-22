import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  global: { headers: { 'x-artsy-server-auth': 'ArtsyServerSubmissionAuth2026' } },
});

const BASE_URL = 'http://localhost:3005';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ARTSY\\.gemini\\antigravity\\brain\\8b19f260-a9dc-4056-8559-6a2cf06abfb4';

// Generate a random brand new phone number that has NEVER been used (strictly 10 digits)
const randomNum = Math.floor(10000 + Math.random() * 90000);
const TEST_PHONE = `98200${randomNum}`;
const FULL_PHONE = `+91${TEST_PHONE}`;
const TEST_EMAIL = `creator_${randomNum}@artsyprod.studio`;

console.log('===============================================================');
console.log('   SURGICAL VERIFICATION: CREATOR ONBOARDING STATE MACHINE');
console.log('===============================================================');
console.log(`Testing with BRAND NEW Phone: ${FULL_PHONE}`);
console.log(`Testing with BRAND NEW Email: ${TEST_EMAIL}`);

async function run() {
  // 1. Verify user does not exist in DB
  const { data: existingUser } = await sb.from('users').select('*').or(`phone.eq.${FULL_PHONE},email.eq.${TEST_EMAIL}`).maybeSingle();
  if (existingUser) {
    console.log('Cleaning up existing user record...');
    await sb.from('creator_profiles').delete().eq('id', existingUser.id);
    await sb.from('users').delete().eq('id', existingUser.id);
  }

  // 2. Launch headless Chrome browser
  console.log('\n[1/5] Launching Chrome Browser via Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => console.log('  [BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.error('  [PAGE ERROR]', err.message));
  page.on('dialog', async (dialog) => {
    console.log('  [DIALOG ALERT]:', dialog.message());
    await dialog.accept();
  });
  page.on('response', async (res) => {
    if (res.url().includes('/api/auth/otp') || res.url().includes('/api/freelancer/onboard')) {
      const text = await res.text().catch(() => '');
      console.log(`  [API ${new URL(res.url()).pathname}] ${res.status()}:`, text.slice(0, 200));
    }
  });

  try {
    // 3. Navigate to login with role=freelancer
    console.log(`\n[2/5] Navigating to ${BASE_URL}/auth/login?role=freelancer ...`);
    await page.goto(`${BASE_URL}/auth/login?role=freelancer`, { waitUntil: 'networkidle0' });

    // Ensure phone input is available
    await page.waitForSelector('input[type="tel"]', { timeout: 10000 });
    console.log('  ✓ Login page loaded successfully');

    // Type phone number
    await page.type('input[type="tel"]', TEST_PHONE);
    console.log(`  ✓ Typed phone number: ${TEST_PHONE}`);

    // Type email
    await page.type('#login-email-input', TEST_EMAIL);
    console.log(`  ✓ Typed email address: ${TEST_EMAIL}`);

    // Check terms checkbox
    const termsEl = await page.$('#terms-checkbox');
    if (termsEl) {
      await termsEl.click();
      console.log('  ✓ Checked terms of service checkbox');
    }

    // Wait a brief moment for form validation state
    await new Promise((r) => setTimeout(r, 200));

    // Click "CONTINUE WITH OTP ->" button
    const submitBtn = await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
    await submitBtn.click();
    console.log('  ✓ Clicked Continue with OTP button');

    // Wait for OTP input to appear
    await page.waitForSelector('#login-otp-input', { timeout: 10000 });
    console.log('  ✓ OTP step visible on page');

    // 4. Overwrite OTP session in DB with known hash
    const testOtp = '839201';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(testOtp, salt);

    console.log(`  ✓ Setting cryptographic OTP session hash for ${TEST_PHONE}...`);
    // Wait 500ms for API route to insert session row
    await new Promise((r) => setTimeout(r, 600));

    // Update DB record
    const { data: updatedSessions, error: updErr } = await sb
      .from('otp_sessions')
      .update({ otp_hash: hash, role: 'freelancer' })
      .or(`phone.eq.${TEST_PHONE},phone.eq.+91${TEST_PHONE}`)
      .eq('verified', false)
      .select();

    if (updErr || !updatedSessions || updatedSessions.length === 0) {
      console.log('  Note: Inserting direct OTP session record into Supabase...');
      await sb.from('otp_sessions').insert([
        {
          phone: TEST_PHONE,
          otp_hash: hash,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          verified: false,
          role: 'freelancer',
          created_at: new Date().toISOString(),
        },
      ]);
    }

    // 5. Enter 6-digit OTP in input
    console.log(`  ✓ Entering OTP: ${testOtp}`);
    await page.type('#login-otp-input', testOtp);

    // Click "VERIFY & COMPLETE APPLICATION ->" button
    await new Promise((r) => setTimeout(r, 300));
    const verifyBtn = await page.waitForSelector('button[type="submit"]:not([disabled])');
    await verifyBtn.click();
    console.log('  ✓ Clicked Verify Code button');

    // Wait for navigation after OTP verification
    console.log('\n[3/5] Awaiting post-OTP verification routing...');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});

    // Sleep 1 second for any client-side layout router push
    await new Promise((r) => setTimeout(r, 1500));

    const landingUrl = page.url();
    console.log(`  -> CURRENT URL AFTER OTP: ${landingUrl}`);

    // Verify State Transition 1: Must be on /freelancer/onboarding
    if (landingUrl.includes('/freelancer/onboarding')) {
      console.log('  🎉 SUCCESS: Landed directly on /freelancer/onboarding!');
    } else if (landingUrl.includes('/freelancer/pending-approval')) {
      throw new Error(`CRITICAL FAILURE: State Machine bypassed to /freelancer/pending-approval! URL: ${landingUrl}`);
    } else {
      throw new Error(`Unexpected landing page: ${landingUrl}`);
    }

    // Take Screenshot 1: Landed on Onboarding Form
    const ss1Path = path.join(ARTIFACT_DIR, '01_creator_onboarding_landing.png');
    await page.screenshot({ path: ss1Path, fullPage: true });
    console.log(`  ✓ Screenshot saved to: ${ss1Path}`);

    // 6. Fill out the Onboarding Form
    console.log('\n[4/5] Filling out Creator Onboarding Application Form...');
    
    // Creator Alias (Field 1)
    const aliasInput = await page.waitForSelector('input[placeholder*="Rahul" i]', { timeout: 10000 });
    await aliasInput.type('Rohan Edits');
    console.log('  ✓ Entered Creator Alias: Rohan Edits');

    // Showreel URL (Field 2)
    const reelInput = await page.$('input[placeholder*="Vimeo" i]');
    if (reelInput) {
      await reelInput.type('https://vimeo.com/987654321');
      console.log('  ✓ Entered Showreel URL: https://vimeo.com/987654321');
    }

    // Philosophy / Bio
    const bioTextarea = await page.$('textarea');
    if (bioTextarea) {
      await bioTextarea.type('Lead colorist and commercial film editor with 4 years experience in DaVinci Resolve.');
      console.log('  ✓ Entered Creator Philosophy');
    }

    // Two Required Sample Reel URLs
    const sampleInputs = await page.$$('input[placeholder*="Google Drive link"]');
    if (sampleInputs[0]) {
      await sampleInputs[0].focus();
      await sampleInputs[0].type('https://youtube.com/watch?v=sample1');
    }
    if (sampleInputs[1]) {
      await sampleInputs[1].focus();
      await sampleInputs[1].type('https://youtube.com/watch?v=sample2');
    }
    console.log('  ✓ Typed Sample Reel 1 & 2');

    // PAN (Field in Tax section)
    const panInput = await page.$('input[placeholder*="ABCDE" i]');
    if (panInput) {
      await panInput.focus();
      await panInput.type('ABCDE1234F');
      console.log('  ✓ Entered PAN: ABCDE1234F');
    }

    // Legal Name (as per PAN)
    const legalNameInput = await page.$('input[placeholder*="Name as per PAN" i]');
    if (legalNameInput) {
      await legalNameInput.focus();
      await legalNameInput.type('Rohan Varma');
      console.log('  ✓ Entered Legal Name: Rohan Varma');
    }

    // Bank Account Number (type="password")
    const bankAccountInput = await page.$('input[type="password"]');
    if (bankAccountInput) {
      await bankAccountInput.focus();
      await bankAccountInput.type('123456789012');
      console.log('  ✓ Entered Bank Account: 123456789012');
    }

    // IFSC Code
    const allInputs = await page.$$('input');
    for (const inp of allInputs) {
      const ph = await page.evaluate((el) => el.placeholder, inp);
      if (ph && ph.toLowerCase().includes('hdfc0001234')) {
        await inp.focus();
        await inp.type('HDFC0001234');
        console.log('  ✓ Entered IFSC Code: HDFC0001234');
        break;
      }
    }

    // Check Agreement Checkbox
    await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const ndaLabel = labels.find((l) => l.innerText.includes('CREATOR AGREEMENT') || l.innerText.includes('CONFIDENTIALITY'));
      if (ndaLabel) {
        const cb = ndaLabel.querySelector('input[type="checkbox"]');
        if (cb && !cb.checked) {
          cb.click();
        }
      }
    });
    console.log('  ✓ Accepted NDA and Service Agreement checkbox');

    // Check Form Validity before clicking submit
    const validity = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return { hasForm: false };
      const invalidEls = Array.from(form.querySelectorAll(':invalid')).map((el) => ({
        tag: el.tagName,
        type: el.type,
        placeholder: el.placeholder,
        value: el.value,
        msg: el.validationMessage,
      }));
      return { hasForm: true, isValid: form.checkValidity(), invalidEls };
    });
    console.log('  [FORM VALIDITY CHECK]:', JSON.stringify(validity));

    // Submit Application
    const submitAppBtn = await page.waitForSelector('button[type="submit"]:not([disabled])');
    await submitAppBtn.click();
    console.log('  ✓ Clicked Submit Application button');

    // Wait for either automatic layout guard transition OR modal appearance
    console.log('  ✓ Waiting for transition to /freelancer/pending-approval or modal...');
    await page.waitForFunction(
      () => window.location.pathname.includes('/freelancer/pending-approval') || document.body.innerText.includes('APPLICATION SUBMITTED'),
      { timeout: 20000 }
    );

    // If modal is visible and not yet on /freelancer/pending-approval, click button
    if (!page.url().includes('/freelancer/pending-approval')) {
      console.log('  ✓ Modal visible, clicking View Application Status button...');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const statusBtn = btns.find((b) => b.innerText.includes('View Application Status'));
        if (statusBtn) statusBtn.click();
      });
    }

    // Wait for URL to update to /freelancer/pending-approval
    await page.waitForFunction(() => window.location.pathname.includes('/freelancer/pending-approval'), { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    const finalUrl = page.url();
    console.log(`\n[5/5] POST-SUBMISSION URL: ${finalUrl}`);

    // Verify State Transition 2: Must be on /freelancer/pending-approval
    if (finalUrl.includes('/freelancer/pending-approval')) {
      console.log('  🎉 SUCCESS: Transitioned smoothly to /freelancer/pending-approval!');
    } else {
      throw new Error(`Expected /freelancer/pending-approval but landed on: ${finalUrl}`);
    }

    // Take Screenshot 2: Pending Approval Page with Tracking ID
    const ss2Path = path.join(ARTIFACT_DIR, '02_creator_pending_approval_landing.png');
    await page.screenshot({ path: ss2Path, fullPage: true });
    console.log(`  ✓ Screenshot saved to: ${ss2Path}`);

    // Check Guard: Try navigating back to /freelancer (Workstation Dashboard)
    console.log('\n[Guard Check] Attempting unauthorized access to /freelancer (Dashboard)...');
    await page.goto(`${BASE_URL}/freelancer`, { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));
    const guardedUrl = page.url();
    console.log(`  -> URL after trying to access /freelancer: ${guardedUrl}`);
    if (guardedUrl.includes('/freelancer/pending-approval')) {
      console.log('  ✓ PASS: Guard forcefully intercepted access and kept creator at /freelancer/pending-approval!');
    } else {
      throw new Error(`Guard failure: Creator accessed ${guardedUrl} without approval!`);
    }

    // Check Guard: Try navigating back to /freelancer/onboarding
    console.log('\n[Guard Check] Attempting to access /freelancer/onboarding after submission...');
    await page.goto(`${BASE_URL}/freelancer/onboarding`, { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));
    const onboardingGuardUrl = page.url();
    console.log(`  -> URL after trying to access /freelancer/onboarding: ${onboardingGuardUrl}`);
    if (onboardingGuardUrl.includes('/freelancer/pending-approval')) {
      console.log('  ✓ PASS: Guard redirected pending creator to /freelancer/pending-approval!');
    } else {
      throw new Error(`Guard failure: Creator returned to onboarding: ${onboardingGuardUrl}`);
    }

    console.log('\n===============================================================');
    console.log('  ALL CREATOR STATE MACHINE TRANSITIONS VERIFIED 100%!');
    console.log('===============================================================');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
