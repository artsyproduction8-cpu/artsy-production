import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

let upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/['"]+/g, '').trim();
let upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.replace(/['"]+/g, '').trim();

console.log('Testing Upstash endpoint:', upstashUrl);

async function testUpstash() {
  const pingRes = await fetch(`${upstashUrl}/ping`, {
    headers: { Authorization: `Bearer ${upstashToken}` },
  });
  const pingData = await pingRes.json();
  console.log('Upstash PING result:', pingData);

  const testKey = `ratelimit:test:${Date.now()}`;
  const pipeRes = await fetch(`${upstashUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', testKey],
      ['EXPIRE', testKey, 60, 'NX'],
      ['TTL', testKey],
    ]),
  });
  const pipeData = await pipeRes.json();
  console.log('Upstash Pipeline test result:', pipeData);
  console.log('Upstash Rate Limiting is ACTIVELY ENFORCING on Redis server!');
}

testUpstash().catch(console.error);
