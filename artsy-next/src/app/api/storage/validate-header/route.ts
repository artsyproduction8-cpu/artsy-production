import { NextRequest, NextResponse } from 'next/server';
import { validateHeaderBytesServer } from '@/lib/storage/validator';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileRecordId, fileName, headerHex } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    let headerBytes = new Uint8Array();
    if (headerHex) {
      const match = headerHex.match(/.{1,2}/g);
      if (match) {
        headerBytes = new Uint8Array(match.map((byte: string) => parseInt(byte, 16)));
      }
    }

    const validation = validateHeaderBytesServer(headerBytes, fileName);

    if (!validation.isValid) {
      // Mark file record as failed in database if record exists
      if (supabase && fileRecordId) {
        await supabase
          .from('file_records')
          .update({
            is_soft_deleted: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', fileRecordId);
      }

      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid or corrupt video container header',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      format: validation.format,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Storage validation route error:', err);
    return NextResponse.json(
      { error: 'Header verification failed' },
      { status: 500 }
    );
  }
}
