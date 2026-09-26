import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    // Test connectivity to Supabase using a lightweight query
    const { error } = await supabase.from('platform_config').select('key').limit(1);
    dbLatencyMs = Date.now() - dbStart;
    
    if (!error) {
      dbStatus = 'healthy';
    } else {
      dbStatus = `degraded: ${error.message}`;
    }
  } catch (err: unknown) {
    dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === 'healthy' || dbStatus.startsWith('degraded');

  const healthPayload = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : null,
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
    responseTimeMs,
    version: '1.0.0',
  };

  return NextResponse.json(healthPayload, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
