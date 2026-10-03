import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Server-side auth check for admin role
    const authUser = getAuthenticatedUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required for statutory GSTR-1 exports' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || String(new Date().getMonth() + 1).padStart(2, '0');
    const year = searchParams.get('year') || String(new Date().getFullYear());
    const taxPeriod = `${month}${year}`;

    const artsyGstin = process.env.ARTSY_GSTIN || '27AAAAA0000A1Z5';

    // Mock initial demo data when offline / unpopulated
    let totalB2cTaxable = 0;
    let totalB2cCgst = 0;
    let totalB2cSgst = 0;
    let totalB2cIgst = 0;
    let invoiceCount = 0;

    const b2csList: Array<{
      sply_ty: 'INTRA' | 'INTER';
      rt: number;
      typ: string;
      pos: string;
      txval: number;
      camt?: number;
      samt?: number;
      iamt?: number;
      csamt: number;
    }> = [];

    const hsnData = [
      {
        num: 1,
        hsn_sc: '999613',
        desc: 'Video post-production and editing services',
        uqc: 'OTH',
        qty: 0,
        txval: 0,
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0,
      },
    ];

    if (supabase && typeof supabase.from === 'function') {
      // Query paid orders for the period
      const startDate = `${year}-${month}-01T00:00:00.000Z`;
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();

      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'paid')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (orders && orders.length > 0) {
        invoiceCount = orders.length;
        orders.forEach((order: { gross_amount: number }) => {
          const grossRupees = Math.round((order.gross_amount || 0) / 100);
          const taxable = Math.round(grossRupees / 1.18);
          const gst = grossRupees - taxable;
          const cgst = Math.floor(gst / 2);
          const sgst = gst - cgst;

          totalB2cTaxable += taxable;
          totalB2cCgst += cgst;
          totalB2cSgst += sgst;
        });

        hsnData[0].qty = invoiceCount;
        hsnData[0].txval = totalB2cTaxable;
        hsnData[0].camt = totalB2cCgst;
        hsnData[0].samt = totalB2cSgst;
      }
    } else {
      // Demo dataset for testing
      invoiceCount = 8;
      totalB2cTaxable = 48474;
      totalB2cCgst = 4363;
      totalB2cSgst = 4363;
      totalB2cIgst = 0;

      hsnData[0].qty = 8;
      hsnData[0].txval = totalB2cTaxable;
      hsnData[0].camt = totalB2cCgst;
      hsnData[0].samt = totalB2cSgst;
    }

    b2csList.push({
      sply_ty: 'INTRA',
      rt: 18.0,
      typ: 'OE',
      pos: '27',
      txval: totalB2cTaxable,
      camt: totalB2cCgst,
      samt: totalB2cSgst,
      csamt: 0,
    });

    const gstr1Payload = {
      gstin: artsyGstin,
      fp: taxPeriod,
      gt: totalB2cTaxable + totalB2cCgst + totalB2cSgst,
      cur_gt: totalB2cTaxable + totalB2cCgst + totalB2cSgst,
      b2b: [], // B2B orders with recipient GSTIN
      b2cs: b2csList,
      cdnr: [],
      cdnur: [],
      exp: [],
      at: [],
      atadj: [],
      exemp: {
        nil_supp: 0,
        expt_supp: 0,
        ngsup_supp: 0,
      },
      hsn: {
        data: hsnData,
      },
      doc_issue: {
        doc_det: [
          {
            doc_num: 1, // Invoices
            doc_typ: 'Invoices for outward supply',
            from: `INV-${year}${month}001`,
            to: `INV-${year}${month}${String(invoiceCount).padStart(3, '0')}`,
            totnum: invoiceCount,
            canc: 0,
            net_issue: invoiceCount,
          },
        ],
      },
      metadata: {
        generator: 'Artsy Production Statutory Engine v2.1',
        sacCode: '999613',
        rate: '18% GST',
        exportDate: new Date().toISOString(),
      },
    };

    const isDownload = searchParams.get('download') === 'true';

    return NextResponse.json(gstr1Payload, {
      status: 200,
      headers: {
        ...(isDownload && {
          'Content-Disposition': `attachment; filename="GSTR1_${artsyGstin}_${taxPeriod}.json"`,
        }),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    console.error('GSTR-1 export generation failed:', err);
    return NextResponse.json(
      { error: 'Failed to generate GSTR-1 payload' },
      { status: 500 }
    );
  }
}
