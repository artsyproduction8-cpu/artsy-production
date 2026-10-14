import { signAuthCookieValue, AUTH_COOKIE_NAME } from '../src/lib/auth-cookie';
import { supabaseAdmin } from '../lib/supabase';

const BASE_URL = 'http://localhost:3005';

// User payloads
const creatorAPayload = {
  id: 'f0000000-0000-0000-0000-000000000001',
  role: 'freelancer' as const,
  email: 'creator_a@test.com',
  phone: '+910000000101',
  full_name: 'Jane Doe',
  token_version: 2,
};

const creatorBPayload = {
  id: 'f0000000-0000-0000-0000-000000000002',
  role: 'freelancer' as const,
  email: 'creator_b@test.com',
  phone: '+910000000102',
  full_name: 'John Doe',
  token_version: 2,
};

const clientPayload = {
  id: 'a0000000-0000-0000-0000-000000000001',
  role: 'client' as const,
  email: 'client@test.com',
  phone: '+910000000999',
  full_name: 'Client Tester',
  token_version: 2,
};

const adminPayload = {
  id: '50d2d4d3-b55f-4c9c-8281-a3fa324c52ad',
  role: 'super_admin' as const,
  email: 'admin_test@artsy.com',
  phone: '+910000000000',
  full_name: 'Super Admin',
  token_version: 2,
};

const cookieA = `${AUTH_COOKIE_NAME}=${signAuthCookieValue(creatorAPayload)}`;
const cookieB = `${AUTH_COOKIE_NAME}=${signAuthCookieValue(creatorBPayload)}`;
const cookieClient = `${AUTH_COOKIE_NAME}=${signAuthCookieValue(clientPayload)}`;
const cookieAdmin = `${AUTH_COOKIE_NAME}=${signAuthCookieValue(adminPayload)}`;

async function runTests() {
  console.log('=== STARTING CREATOR SUBMISSIONS & PORTFOLIO VERIFICATION SUITE ===\n');

  // Clean test submissions and samples from previous runs
  if (supabaseAdmin) {
    await supabaseAdmin.from('creator_submissions').delete().in('creator_id', [creatorAPayload.id, creatorBPayload.id]);
    await supabaseAdmin.from('portfolio_samples').delete().in('creator_id', [creatorAPayload.id, creatorBPayload.id]);
  }

  // TEST 1 — Creator submission + immutability
  console.log('--- TEST 1: Creator submission + immutability ---');
  const t1Res = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Rick Astley Showcase Reel',
      description: 'Color grade and sound conform for commercial teaser.',
    }),
  });
  const t1Data = await t1Res.json();
  console.log('T1.2 Submit status:', t1Res.status, 'Submission status:', t1Data.submission?.status);
  const sub1Id = t1Data.submission?.id;

  // Attempt PATCH
  const t1PatchRes = await fetch(`${BASE_URL}/api/freelancer/submissions/${sub1Id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ title: 'Modified Title' }),
  });
  console.log('T1.3 Attempt PATCH status:', t1PatchRes.status, '(Expected: 405)');
  console.log('TEST 1 RESULT:', t1Res.status === 201 && t1PatchRes.status === 405 ? 'PASS' : 'FAIL', '\n');

  // TEST 2 — Duplicate pending block
  console.log('--- TEST 2: Duplicate pending block ---');
  const t2DupRes = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Rick Astley Duplicate Attempt',
    }),
  });
  const t2DupData = await t2DupRes.json();
  console.log('T2.2 Duplicate pending submit:', t2DupRes.status, t2DupData.error, '(Expected: 409)');

  // Withdraw URL A
  const t2WithdrawRes = await fetch(`${BASE_URL}/api/freelancer/submissions/${sub1Id}`, {
    method: 'DELETE',
    headers: { Cookie: cookieA },
  });
  console.log('T2.3 Withdraw submission status:', t2WithdrawRes.status, '(Expected: 204)');

  // Re-submit URL A after withdrawal
  const t2ResubmitRes = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Rick Astley Re-submitted After Withdrawal',
    }),
  });
  const t2ResubmitData = await t2ResubmitRes.json();
  console.log('T2.4 Re-submit after withdrawal:', t2ResubmitRes.status, 'New ID:', t2ResubmitData.submission?.id, '(Expected: 201)');
  console.log('TEST 2 RESULT:', t2DupRes.status === 409 && t2WithdrawRes.status === 204 && t2ResubmitRes.status === 201 ? 'PASS' : 'FAIL', '\n');

  // TEST 3 — Rejection is final
  console.log('--- TEST 3: Rejection is final ---');
  const t3SubmitRes = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      youtube_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      title: 'Zoo Cut Initial',
    }),
  });
  const t3SubmitData = await t3SubmitRes.json();
  const sub3Id = t3SubmitData.submission?.id;
  console.log('T3.1 Submit URL B status:', t3SubmitRes.status, 'ID:', sub3Id);

  // Admin rejects
  const t3RejectRes = await fetch(`${BASE_URL}/api/admin/submissions/${sub3Id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
    body: JSON.stringify({ reason: 'Lighting and grade do not meet Artsy studio technical requirements.' }),
  });
  const t3RejectData = await t3RejectRes.json();
  console.log('T3.2 Admin reject status:', t3RejectRes.status, 'Status:', t3RejectData.submission?.status, 'Reason:', t3RejectData.submission?.rejection_reason);

  // Creator tries to PATCH rejected submission
  const t3PatchRes = await fetch(`${BASE_URL}/api/freelancer/submissions/${sub3Id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ title: 'Changed' }),
  });
  console.log('T3.3 Creator PATCH rejected status:', t3PatchRes.status, '(Expected: 405)');

  // Creator submits URL B again as NEW submission
  const t3ResubmitRes = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      youtube_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      title: 'Zoo Cut Regraded Version 2',
    }),
  });
  const t3ResubmitData = await t3ResubmitRes.json();
  console.log('T3.4 Re-submit URL B as new submission:', t3ResubmitRes.status, 'New ID:', t3ResubmitData.submission?.id, '(Expected: 201)');

  // Verify two rows exist (one rejected, one pending)
  const { data: bRows } = await supabaseAdmin!
    .from('creator_submissions')
    .select('id, status, youtube_id')
    .eq('creator_id', creatorAPayload.id)
    .eq('youtube_id', 'jNQXAC9IVRw');
  console.log('T3.5 Rows in DB for jNQXAC9IVRw:', bRows?.map((r: any) => r.status).join(', '), '(Expected: rejected, pending)');
  console.log('TEST 3 RESULT:', t3RejectRes.status === 200 && t3ResubmitRes.status === 201 && bRows?.length === 2 ? 'PASS' : 'FAIL', '\n');

  // TEST 4 — Convert flow
  console.log('--- TEST 4: Convert flow ---');
  const t4SubmitRes = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      youtube_url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      title: 'Gangnam Wedding Cinema Master',
    }),
  });
  const t4SubmitData = await t4SubmitRes.json();
  const sub4Id = t4SubmitData.submission?.id;
  console.log('T4.1 Submit URL C status:', t4SubmitRes.status, 'ID:', sub4Id);

  // Admin creates portfolio sample using Artsy URL and converts
  const t4AddPortRes = await fetch(`${BASE_URL}/api/admin/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
    body: JSON.stringify({
      youtube_url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
      title: 'Artsy Official — Wedding Cinema Master Cut',
      category: 'Wedding Cinema',
      creator_id: creatorAPayload.id,
    }),
  });
  const t4AddPortData = await t4AddPortRes.json();
  const sample4Id = t4AddPortData.sample?.id;
  console.log('T4.2 Add Artsy sample status:', t4AddPortRes.status, 'Sample ID:', sample4Id);

  // Mark submission as converted
  const t4ConvertRes = await fetch(`${BASE_URL}/api/admin/submissions/${sub4Id}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
    body: JSON.stringify({ portfolio_sample_id: sample4Id }),
  });
  const t4ConvertData = await t4ConvertRes.json();
  console.log('T4.3 Convert status:', t4ConvertRes.status, 'Submission status:', t4ConvertData.submission?.status, 'Sample ID:', t4ConvertData.submission?.converted_sample_id);

  // Check public creator portfolio
  const t4PublicRes = await fetch(`${BASE_URL}/api/creators/${creatorAPayload.id}/portfolio`);
  const t4PublicData = await t4PublicRes.json();
  const foundSample = t4PublicData.samples?.find((s: any) => s.id === sample4Id);
  console.log('T4.4 Public creator portfolio has video:', !!foundSample, 'Total samples:', t4PublicData.samples?.length);
  console.log('TEST 4 RESULT:', t4ConvertRes.status === 200 && !!foundSample ? 'PASS' : 'FAIL', '\n');

  // TEST 5 — Withdraw only pending
  console.log('--- TEST 5: Withdraw only pending ---');
  // Pending submission withdrawal
  const t5PendingSub = t2ResubmitData.submission?.id;
  const t5WithdrawPendingRes = await fetch(`${BASE_URL}/api/freelancer/submissions/${t5PendingSub}`, {
    method: 'DELETE',
    headers: { Cookie: cookieA },
  });
  console.log('T5.1 Withdraw pending submission:', t5WithdrawPendingRes.status, '(Expected: 204)');

  // Try to withdraw converted/reviewed submission (sub4Id)
  const t5WithdrawConvertedRes = await fetch(`${BASE_URL}/api/freelancer/submissions/${sub4Id}`, {
    method: 'DELETE',
    headers: { Cookie: cookieA },
  });
  const t5WithdrawConvertedData = await t5WithdrawConvertedRes.json().catch(() => ({}));
  console.log('T5.2 Withdraw converted submission:', t5WithdrawConvertedRes.status, t5WithdrawConvertedData.error, '(Expected: 403)');
  console.log('TEST 5 RESULT:', t5WithdrawPendingRes.status === 204 && t5WithdrawConvertedRes.status === 403 ? 'PASS' : 'FAIL', '\n');

  // TEST 6 — Security
  console.log('--- TEST 6: Security ---');
  // Anon POST
  const t6AnonRes = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ youtube_url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Anon' }),
  });
  console.log('T6.1 Anon POST status:', t6AnonRes.status, '(Expected: 401)');

  // Client-role POST
  const t6ClientRes = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieClient },
    body: JSON.stringify({ youtube_url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Client Try' }),
  });
  console.log('T6.2 Client POST status:', t6ClientRes.status, '(Expected: 403)');

  // Creator B creates a submission
  const t6SubB = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieB },
    body: JSON.stringify({ youtube_url: 'https://youtu.be/L_LUpnjgPso', title: 'Creator B Work' }),
  });
  const t6SubBData = await t6SubB.json();
  const subBId = t6SubBData.submission?.id;

  // Creator A fetches submissions -> should NOT see Creator B's submission
  const t6GetARes = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
    headers: { Cookie: cookieA },
  });
  const t6GetAData = await t6GetARes.json();
  const seesB = t6GetAData.submissions?.some((s: any) => s.id === subBId);
  console.log('T6.3 Creator A sees Creator B submission:', seesB, '(Expected: false)');

  // Creator A tries to POST to /api/admin/portfolio
  const t6AdminPortRes = await fetch(`${BASE_URL}/api/admin/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ youtube_url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Unauthorized' }),
  });
  console.log('T6.4 Creator POST /api/admin/portfolio:', t6AdminPortRes.status, '(Expected: 401/403)');

  // Creator A tries to convert
  const t6AdminConvRes = await fetch(`${BASE_URL}/api/admin/submissions/${subBId}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ portfolio_sample_id: sample4Id }),
  });
  console.log('T6.5 Creator POST /api/admin/submissions/[id]/convert:', t6AdminConvRes.status, '(Expected: 401/403)');

  // Creator A tries to delete Creator B submission
  const t6DeleteBRes = await fetch(`${BASE_URL}/api/freelancer/submissions/${subBId}`, {
    method: 'DELETE',
    headers: { Cookie: cookieA },
  });
  console.log('T6.6 Creator A deletes Creator B submission:', t6DeleteBRes.status, '(Expected: 403)');
  console.log(
    'TEST 6 RESULT:',
    t6AnonRes.status === 401 &&
      t6ClientRes.status === 403 &&
      !seesB &&
      (t6AdminPortRes.status === 401 || t6AdminPortRes.status === 403) &&
      (t6AdminConvRes.status === 401 || t6AdminConvRes.status === 403) &&
      t6DeleteBRes.status === 403
      ? 'PASS'
      : 'FAIL',
    '\n'
  );

  // TEST 7 — Submission spam limit
  console.log('--- TEST 7: Submission spam limit ---');
  // First clean Creator A's pending submissions so we start from known count
  await supabaseAdmin!.from('creator_submissions').delete().eq('creator_id', creatorAPayload.id).eq('status', 'pending');

  const validIds = [
    'dQw4w9WgXcQ',
    'jNQXAC9IVRw',
    '9bZkp7q19f0',
    'M7lc1UVf-VE',
    'L_LUpnjgPso',
    '3JZ_D3ELwOQ',
    'kJQP7kiw5Fk',
    'fJ9rUzIMcZQ',
    'RgKAFK5djSk',
    'YQHsXMglC9A',
  ];

  let successCount = 0;
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        youtube_url: `https://youtu.be/${validIds[i]}`,
        title: `Spam Test Batch ${i + 1}`,
      }),
    });
    if (res.status === 201) successCount++;
  }
  console.log(`T7.1 Created ${successCount}/10 pending submissions.`);

  // 11th submission
  const t7EleventhRes = await fetch(`${BASE_URL}/api/freelancer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      youtube_url: 'https://youtu.be/kffacxfA7G4',
      title: 'Spam Test 11th Video',
    }),
  });
  const t7EleventhData = await t7EleventhRes.json();
  console.log('T7.2 11th submission status:', t7EleventhRes.status, t7EleventhData.error, '(Expected: 429)');
  console.log('TEST 7 RESULT:', successCount === 10 && t7EleventhRes.status === 429 ? 'PASS' : 'FAIL', '\n');

  // TEST 8 — Public page verification
  console.log('--- TEST 8: Public page verification ---');
  const t8Res = await fetch(`${BASE_URL}/api/creators/${creatorAPayload.id}/portfolio`);
  const t8Data = await t8Res.json();
  console.log('T8.1 Public portfolio status:', t8Res.status, 'Total items:', t8Data.samples?.length);

  // Check that every item in public portfolio has youtube_id / is_visible = true
  const allLive = t8Data.samples?.every((s: any) => s.video_url && !s.status);
  console.log('T8.2 Only live portfolio_samples returned (no pending/rejected submissions):', allLive);

  // Query Supabase directly with public anon key to confirm RLS prevents reading submissions table
  const anonSupabase = (await import('@supabase/supabase-js')).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: anonSubs, error: anonSubsErr } = await anonSupabase.from('creator_submissions').select('id');
  console.log('T8.3 Anon query to creator_submissions count:', anonSubs?.length ?? 0, 'Error:', anonSubsErr?.message || 'none');
  console.log('TEST 8 RESULT:', t8Res.status === 200 && allLive && (anonSubs?.length === 0 || !!anonSubsErr) ? 'PASS' : 'FAIL', '\n');

  console.log('=== VERIFICATION SUITE FINISHED ===');
}

runTests().catch(console.error);
