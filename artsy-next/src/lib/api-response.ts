/**
 * ARTSY PRODUCTION — Standardized Secure API Response Helper
 * ==========================================================
 * Ensures:
 * 1. No internal stack traces, DB error codes, table names, or file paths
 *    are ever sent to client browsers.
 * 2. Every error generates a cryptographically random Correlation ID
 *    for tracing incidents in server-side logs.
 * 3. Consistent, predictable JSON envelope for client consumption.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export interface ApiErrorResponse {
  error: string;
  correlationId: string;
}

export function createErrorResponse(
  error: unknown,
  genericMessage: string = 'Unable to process request. Please try again later.',
  status: number = 500
): NextResponse<ApiErrorResponse> {
  const correlationId = `err_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Log full detailed error exclusively on the server with correlation ID for debugging
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(`[API ERROR ${correlationId}] Status: ${status} | Message: ${errorMessage}`, stack ? `\nStack: ${stack}` : '');

  return NextResponse.json(
    {
      error: genericMessage,
      correlationId,
    },
    {
      status,
      headers: {
        'X-Correlation-ID': correlationId,
      },
    }
  );
}

export function createSuccessResponse<T extends Record<string, any>>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}
