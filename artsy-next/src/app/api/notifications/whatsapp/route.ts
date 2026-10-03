import { NextRequest, NextResponse } from 'next/server';
import {
  sendWhatsAppNotification,
  checkOpenWAGatewayHealth,
} from '@/lib/whatsapp/openwa-dispatcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = await checkOpenWAGatewayHealth();
    return NextResponse.json({
      status: 'ok',
      health,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: 'error', error },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phone, message, eventType, projectId } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required.' },
        { status: 400 }
      );
    }

    let messageText = message;
    if (!messageText) {
      switch (eventType) {
        case 'PROJECT_CLAIMED':
          messageText = `🎥 Artsy Production Update: Project #${projectId || 'AP-8841'} has been claimed by a verified Senior Video Editor. First rough cut ETA: 48h.`;
          break;
        case 'QA_SUBMITTED':
          messageText = `✨ Artsy Production Update: New 4K draft ready for review on Project #${projectId || 'AP-8841'}. Check your timeline review suite to leave frame comments.`;
          break;
        case 'MILESTONE_COMPLETED':
          messageText = `✅ Artsy Production Update: Milestone for Project #${projectId || 'AP-8841'} has been marked approved. Production Vault payout initiated.`;
          break;
        case 'PAYOUT_DISBURSED':
          messageText = `💸 Artsy Payouts: Production settlement of ₹4,442 for Project #${projectId || 'AP-8841'} has been disbursed via direct NEFT.`;
          break;
        default:
          messageText = `Artsy Alert for Project #${projectId || 'AP-8841'}: Project status has been updated.`;
      }
    }

    const result = await sendWhatsAppNotification(phone, messageText);
    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error },
      { status: 500 }
    );
  }
}
