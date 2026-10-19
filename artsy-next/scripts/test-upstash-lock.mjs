import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
let url = '', tok = '';
for (const l of env.split('\n')) {
  if (l.startsWith('UPSTASH_REDIS_REST_URL=')) url = l.split('=')[1].replace(/['"]+/g, '').trim();
  if (l.startsWith('UPSTASH_REDIS_REST_TOKEN=')) tok = l.split('=')[1].replace(/['"]+/g, '').trim();
}

async function test() {
  const k = 'test:lock:' + Date.now();
  const r1 = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', k, 'locked', 'NX', 'EX', 60])
  }).then(r => r.json());
  console.log('r1 (should be OK):', r1);

  const r2 = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', k, 'locked', 'NX', 'EX', 60])
  }).then(r => r.json());
  console.log('r2 (should be null):', r2);
}

test().catch(console.error);
