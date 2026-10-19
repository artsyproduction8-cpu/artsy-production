import fetch from 'node-fetch';

async function testSearch() {
  console.log('\n======================================================');
  console.log(' TESTING SEARCH WORKFLOW & PRICE MATCHING (CINEMATIC)');
  console.log('======================================================\n');

  // Test 1: Search "cinematic"
  console.log('[Test 1] Searching query: "cinematic"...');
  const res1 = await fetch('http://localhost:3000/api/search?q=cinematic');
  const data1 = await res1.json();

  console.log(`- Success: ${data1.success}`);
  console.log(`- Total Results: ${data1.total}`);
  console.log(`- Services Count: ${data1.services?.length}`);
  console.log(`- Portfolio Count: ${data1.portfolio?.length}`);

  console.log('\n[Matched Services for "cinematic"]:');
  data1.services?.forEach((s, idx) => {
    console.log(`  ${idx + 1}. [${s.categoryTitle}] "${s.name}"`);
    console.log(`     Price: ${s.base_price_formatted} (INR ${s.base_price})`);
    console.log(`     Duration: ${s.duration_label} | SLA: ${s.standard_delivery}`);
    console.log(`     Book URL: ${s.book_url}`);
    console.log(`     Service URL: ${s.service_url}`);
  });

  // Verify prices
  const cinematicStory = data1.services?.find(s => s.name === 'Cinematic Story');
  const cinematicStoryBundle = data1.services?.find(s => s.name === 'Cinematic Story + Teaser + Reel');

  console.log('\n[Verification Check]');
  console.log(`  * "Cinematic Story" price in search: ${cinematicStory?.base_price_formatted}`);
  console.log(`    Expected on /services & /book: ₹8,000 -> MATCH: ${cinematicStory?.base_price === 8000 ? 'YES' : 'NO'}`);

  console.log(`  * "Cinematic Story + Teaser + Reel" price in search: ${cinematicStoryBundle?.base_price_formatted}`);
  console.log(`    Expected on /services & /book: ₹10,000 -> MATCH: ${cinematicStoryBundle?.base_price === 10000 ? 'YES' : 'NO'}`);

  // Verify portfolio videos
  console.log('\n[Matched Portfolio Samples]:');
  data1.portfolio?.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.category}] "${p.title}" (YouTube: ${p.youtube_id})`);
  });

  const hasTestVideo = data1.portfolio?.some(p => ['dQw4w9WgXcQ', 'test087694'].includes(p.youtube_id));
  console.log(`  * Contains Rick Roll or test video: ${hasTestVideo ? 'FAIL (Found test video)' : 'PASS (0 test videos)'}`);

  // Test 2: Search "wedding"
  console.log('\n[Test 2] Searching query: "wedding"...');
  const res2 = await fetch('http://localhost:3000/api/search?q=wedding');
  const data2 = await res2.json();
  console.log(`- Services found for "wedding": ${data2.services?.length}`);
  data2.services?.slice(0, 4).forEach((s, idx) => {
    console.log(`  ${idx + 1}. "${s.name}" -> ${s.base_price_formatted} (Book: ${s.book_url})`);
  });

  // Test 3: Check /search page render
  console.log('\n[Test 3] Verifying /search page frontend HTML...');
  const pageRes = await fetch('http://localhost:3000/search?q=cinematic');
  const pageHtml = await pageRes.text();

  const hasLightBg = pageHtml.includes('bg-[#F5F5F7]');
  const hasDarkBgRemoved = !pageHtml.includes('bg-[#0A0A0A] text-white flex flex-col font-sans');
  console.log(`  * /search rendered with Artsy light luxury background (#F5F5F7): ${hasLightBg ? 'YES' : 'NO'}`);
  console.log(`  * Dark neon background replaced: ${hasDarkBgRemoved ? 'YES' : 'NO'}`);

  console.log('\n>>> Search workflow & price verification complete! <<<\n');
}

testSearch().catch(console.error);
