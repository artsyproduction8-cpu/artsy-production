import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const brainDir = 'C:/Users/ARTSY/.gemini/antigravity/brain/a5ae88b7-8434-41b5-beb7-9ee5fb0140ae';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  // Test 1: Login page
  console.log('Testing /auth/login...');
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1440, height: 900 });

  const startLogin = Date.now();
  await page1.goto('https://artsyproduction.com/auth/login', { waitUntil: 'domcontentloaded' });
  console.log(`Login DOM loaded in ${Date.now() - startLogin}ms`);

  // Wait 1.5 seconds to let first video frames stream
  await new Promise(r => setTimeout(r, 1500));
  await page1.screenshot({ path: path.join(brainDir, 'verified_login_instant_speed.png'), fullPage: false });
  console.log('Saved verified_login_instant_speed.png');

  // Test 2: Coverflow on landing page
  console.log('Testing / (Landing Page Coverflow)...');
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1440, height: 900 });

  const startHome = Date.now();
  await page2.goto('https://artsyproduction.com', { waitUntil: 'domcontentloaded' });
  console.log(`Home DOM loaded in ${Date.now() - startHome}ms`);

  // Scroll to Coverflow section
  await page2.evaluate(() => {
    const el = document.getElementById('featured-reels');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });

  await new Promise(r => setTimeout(r, 1500));
  await page2.screenshot({ path: path.join(brainDir, 'verified_coverflow_instant_speed.png'), fullPage: false });
  console.log('Saved verified_coverflow_instant_speed.png');

  await browser.close();
  console.log('Verification done!');
}

main().catch(console.error);
