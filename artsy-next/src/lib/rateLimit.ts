/**
 * ARTSY PRODUCTION — Rate Limiting Service
 * ========================================
 * Implements sliding window rate limiting for:
 * 1. Auth & OTP dispatch (Max 5 requests per 10 mins)
 * 2. Payment checkout initiation (Max 10 requests per 10 mins)
 *
 * Supports Upstash Redis with automated in-memory fallback for local dev/demo.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store for development/fallback
const memoryStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export async function checkRateLimit(
  identifier: string,
  prefix: 'auth' | 'pay' | 'api' = 'api',
  maxAllowed: number = 5,
  windowSeconds: number = 600 // 10 minutes
): Promise<RateLimitResult> {
  const key = `ratelimit:${prefix}:${identifier}`;
  const now = Date.now();

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Try Upstash Redis if configured
  if (upstashUrl && upstashToken && !upstashUrl.includes('your-upstash')) {
    try {
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSeconds, 'NX'],
          ['TTL', key],
        ]),
      });

      if (res.ok) {
        const data = await res.json();
        const currentCount = Number(data[0]?.result || 1);
        const ttl = Number(data[2]?.result || windowSeconds);

        return {
          allowed: currentCount <= maxAllowed,
          remaining: Math.max(0, maxAllowed - currentCount),
          resetSeconds: ttl > 0 ? ttl : windowSeconds,
        };
      }
    } catch (err) {
      console.warn('Upstash Redis rate limit failed, falling back to memory store:', err);
    }
  }

  // 2. In-Memory Fallback
  const existing = memoryStore.get(key);

  if (!existing || now > existing.resetAt) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: maxAllowed - 1,
      resetSeconds: windowSeconds,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, maxAllowed - existing.count);
  const resetSeconds = Math.max(0, Math.ceil((existing.resetAt - now) / 1000));

  return {
    allowed: existing.count <= maxAllowed,
    remaining,
    resetSeconds,
  };
}
