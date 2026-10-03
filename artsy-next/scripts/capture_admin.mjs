import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir1 = 'c:\\Users\\ARTSY\\Desktop\\ARTSY WEB\\screenshots\\current-pages';
const targetDir2 = 'c:\\Users\\ARTSY\\Desktop\\ARTSY WEB\\artsy-next\\public\\screenshots\\current-pages';

const pages = [
  { name: 'page20_admin_unified_dashboard.png', url: 'http://localhost:3000/admin' },
  { name: 'page21_admin_vetting.png', url: 'http://localhost:3000/admin/vetting' },
  { name: 'page22_admin_freelancers.png', url: 'http://localhost:3000/admin/freelancers' },
  { name: 'page23_admin_pricing.png', url: 'http://localhost:3000/admin/pricing' },
  { name: 'page24_admin_vault.png', url: 'http://localhost:3000/admin/vault' },
  { name: 'page25_admin_telemetry.png', url: 'http://localhost:3000/admin/telemetry' },
  { name: 'page26_admin_catalog.png', url: 'http://localhost:3000/admin/catalog' },
  { name: 'page27_admin_login.png', url: 'http://localhost:3000/admin/login' },
  { name: 'page28_admin_clients.png', url: 'http://localhost:3000/admin/clients' },
];

async function capture() {
  for (const page of pages) {
    const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-admin-'));
    const outFile1 = path.join(targetDir1, page.name);
    const outFile2 = path.join(targetDir2, page.name);

    console.log(`Capturing ${page.url} -> ${page.name}...`);
    try {
      await execFileAsync(chromePath, [
        '--headless=new',
        '--disable-gpu',
        '--window-size=1440,1100',
        `--user-data-dir=${tempUserDataDir}`,
        `--screenshot=${outFile1}`,
        page.url,
      ]);

      if (fs.existsSync(outFile1)) {
        fs.copyFileSync(outFile1, outFile2);
        const stats = fs.statSync(outFile1);
        console.log(`✓ Saved ${page.name} (${Math.round(stats.size / 1024)} KB)`);
      } else {
        console.error(`✕ Failed to generate ${page.name}`);
      }
    } catch (err) {
      console.error(`Error on ${page.name}:`, err.message);
    } finally {
      try {
        fs.rmSync(tempUserDataDir, { recursive: true, force: true });
      } catch {}
    }
  }
}

capture();
