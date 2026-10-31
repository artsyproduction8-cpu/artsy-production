import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[trimmed.slice(0, idx).trim()] = val;
  }
}

import { dispatchCreatorJobOffer } from '../src/lib/matching/dispatch-offer';

async function main() {
  const result = await dispatchCreatorJobOffer({
    projectId: 'ea894936-dc15-4d53-a03b-60b5b78fbc49',
    orderId: '52c4c2c7-8800-488f-8690-71d639194643',
    creatorId: '5bd042d7-7248-4d1e-8b9b-fc7442c692ea',
    grossAmountPaise: 100000,
    serviceTitle: 'Personal • Birthday Reel',
    turnaroundLabel: '7–10 Working Days Standard'
  });
  console.log('Dispatch offer result:', result);
}

main().catch(console.error);

