import crypto from 'crypto';

const COOKIE_SIGNING_SECRET = process.env.COOKIE_SIGNING_SECRET || '';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://artsyproduction.com';

function signCookie(payload) {
  const payloadWithExp = {
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const jsonStr = JSON.stringify(payloadWithExp);
  const base64 = Buffer.from(jsonStr).toString('base64');
  const hmac = crypto.createHmac('sha256', COOKIE_SIGNING_SECRET).update(base64).digest('hex');
  return `${base64}.${hmac}`;
}

const clientA = {
  id: 'a6f142bf-69b8-4c45-947b-37d67e90fa32',
  role: 'client',
  email: 'test9999@artsyproduction.in',
  phone: '+919999999999',
  full_name: 'Client A Test',
};

const cookieA = signCookie(clientA);

async function run() {
  console.log('--- TEST A1: Client A requests presign for Client B project (Expected: 403) ---');
  const resB = await fetch(`${BASE_URL}/api/storage/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `artsy_auth_token=${cookieA}`,
    },
    body: JSON.stringify({
      projectId: 'aae0af60-844e-44a2-b8b5-ec7e4e2acd60',
      fileName: 'leak_attempt.mp4',
    }),
  });
  console.log('Status:', resB.status, 'Body:', await resB.text());

  console.log('\n--- TEST A2: Client A requests presign for own project (Expected: 200) ---');
  const resOwn = await fetch(`${BASE_URL}/api/storage/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `artsy_auth_token=${cookieA}`,
    },
    body: JSON.stringify({
      projectId: '18bb488c-1675-4ec2-a47d-009dd97b6a96',
      fileName: 'my_footage.mp4',
    }),
  });
  console.log('Status:', resOwn.status, 'Body:', await resOwn.text());

  console.log('\n--- TEST A3: Client A requests presign for non-existent project (Expected: 404) ---');
  const resNone = await fetch(`${BASE_URL}/api/storage/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `artsy_auth_token=${cookieA}`,
    },
    body: JSON.stringify({
      projectId: '00000000-0000-0000-0000-000000000000',
      fileName: 'ghost.mp4',
    }),
  });
  console.log('Status:', resNone.status, 'Body:', await resNone.text());

  console.log('\n--- TEST A4: Client A requests invoice for Client B order (Expected: 403) ---');
  const resInvB = await fetch(`${BASE_URL}/api/invoices/fb8b50f0-ff14-46d6-a969-5d0051c933a2?format=json`, {
    method: 'GET',
    headers: {
      Cookie: `artsy_auth_token=${cookieA}`,
    },
  });
  console.log('Status:', resInvB.status, 'Body:', await resInvB.text());

  console.log('\n--- TEST A5: Client A requests invoice for own order (Expected: 200) ---');
  const resInvOwn = await fetch(`${BASE_URL}/api/invoices/36781e00-7c6b-4ffb-bdd2-adbeaa537bb0?format=json`, {
    method: 'GET',
    headers: {
      Cookie: `artsy_auth_token=${cookieA}`,
    },
  });
  console.log('Status:', resInvOwn.status, 'Body:', await resInvOwn.text());
}

run().catch(console.error);
