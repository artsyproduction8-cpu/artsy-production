import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/../lib/supabase';
import { generateInvoiceData, InvoiceData } from '@/lib/invoices/generator';
import { archiveInvoiceToVault } from '@/lib/invoices/vault';
import { sendInvoiceEmail } from '@/lib/email/dispatcher';

async function resolveOrderDetails(orderId: string) {
  let totalPaise = 800000;
  let clientName = 'Artsy Client';
  let clientPhone = '+919876543210';
  let clientEmail = 'client@artsyproduction.in';
  let serviceName = 'Wedding Highlight Cinema (Post-Production)';

  if (supabase) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId);
    
    let query = supabase.from('orders').select('*, users(full_name, phone, email)');
    if (isUUID) {
      query = query.eq('id', orderId);
    } else {
      query = query.or(`order_number.eq.${orderId},razorpay_order_id.eq.${orderId}`);
    }

    const { data: order } = await query.maybeSingle();

    if (order) {
      totalPaise = order.gross_amount || order.amount_paise || totalPaise;
      clientName = order.client_name || order.users?.full_name || clientName;
      clientPhone = order.client_phone || order.users?.phone || clientPhone;
      clientEmail = order.client_email || order.users?.email || clientEmail;
      if (order.service_key) {
        serviceName = order.service_key;
      }
    }
  }

  return {
    orderId,
    clientName,
    clientPhone,
    clientEmail,
    serviceName,
    totalPaise,
  };
}

/**
 * GET /api/invoices/[orderId]
 * Returns statutory HTML or JSON tax invoice.
 * Query param ?sendEmail=true triggers delivery via Resend email.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const format = request.nextUrl.searchParams.get('format') || 'html';
    const shouldSendEmail = request.nextUrl.searchParams.get('sendEmail') === 'true';

    const orderDetails = await resolveOrderDetails(orderId);
    const invoice = generateInvoiceData(orderDetails);

    // If query parameter requests email dispatch, trigger it asynchronously
    if (shouldSendEmail && orderDetails.clientEmail) {
      await sendInvoiceEmail(orderDetails.clientEmail, invoice);
    }

    if (format === 'json') {
      return NextResponse.json(invoice);
    }

    // Return statutory styled HTML Tax Invoice
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1d1d1f; margin: 0; padding: 40px; background: #fff; }
    .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e5e5e7; padding: 40px; border-radius: 12px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1d1d1f; padding-bottom: 20px; }
    .title { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; }
    .badge { background: #f5f5f7; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #86868b; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; font-size: 13px; line-height: 1.6; }
    .grid h4 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #86868b; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; font-size: 13px; }
    th { text-align: left; padding: 12px; background: #f5f5f7; border-bottom: 1px solid #e5e5e7; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    td { padding: 12px; border-bottom: 1px solid #f5f5f7; }
    .text-right { text-align: right; }
    .totals { width: 320px; margin-left: auto; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals-row.grand { font-size: 16px; font-weight: 800; border-top: 2px solid #1d1d1f; margin-top: 8px; padding-top: 12px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e7; font-size: 11px; color: #86868b; text-align: center; }
    @media print {
      body { padding: 0; }
      .invoice-card { border: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 20px; text-align: right;">
    <button onclick="window.print()" style="background: #1d1d1f; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="title">ARTSY PRODUCTION</div>
        <div style="font-size: 12px; color: #86868b; margin-top: 4px;">TAX INVOICE (RULE 46 OF CGST RULES)</div>
      </div>
      <div style="text-align: right;">
        <span class="badge">ORIGINAL FOR RECIPIENT</span>
        <div style="font-size: 13px; font-weight: 700; margin-top: 8px;">Invoice: ${invoice.invoiceNumber}</div>
        <div style="font-size: 12px; color: #86868b;">Date: ${invoice.invoiceDate}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <h4>SUPPLIER (DATA FIDUCIARY / SERVICE PROVIDER)</h4>
        <strong>${invoice.artsyDetails.legalName}</strong><br>
        ${invoice.artsyDetails.address}<br>
        <strong>GSTIN:</strong> ${invoice.artsyDetails.gstin}<br>
        <strong>PAN:</strong> ${invoice.artsyDetails.pan}<br>
        <strong>State:</strong> ${invoice.artsyDetails.state} (Code: ${invoice.artsyDetails.stateCode})
      </div>
      <div>
        <h4>BILLED TO (RECIPIENT)</h4>
        <strong>${invoice.clientDetails.name}</strong><br>
        ${invoice.clientDetails.billingAddress}<br>
        <strong>Phone:</strong> ${invoice.clientDetails.phone}<br>
        <strong>Email:</strong> ${invoice.clientDetails.email}<br>
        <strong>Place of Supply:</strong> ${invoice.orderDetails.placeOfSupply}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description of Service</th>
          <th>SAC Code</th>
          <th class="text-right">Taxable Value</th>
          <th class="text-right">GST Rate</th>
          <th class="text-right">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${invoice.orderDetails.serviceName}</strong><br>
            <span style="font-size: 11px; color: #86868b;">Order Ref: #${invoice.orderDetails.orderId}</span>
          </td>
          <td>${invoice.orderDetails.sacCode}</td>
          <td class="text-right font-mono">₹${(invoice.orderDetails.taxableAmountPaise / 100).toFixed(2)}</td>
          <td class="text-right">18%</td>
          <td class="text-right font-mono">₹${(invoice.orderDetails.totalPaidPaise / 100).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Taxable Amount:</span>
        <span class="font-mono">₹${(invoice.orderDetails.taxableAmountPaise / 100).toFixed(2)}</span>
      </div>
      ${
        invoice.orderDetails.isInterState
          ? `<div class="totals-row">
              <span>Integrated GST (IGST 18%):</span>
              <span class="font-mono">₹${(invoice.orderDetails.igstPaise / 100).toFixed(2)}</span>
             </div>`
          : `<div class="totals-row">
              <span>Central GST (CGST 9%):</span>
              <span class="font-mono">₹${(invoice.orderDetails.cgstPaise / 100).toFixed(2)}</span>
             </div>
             <div class="totals-row">
              <span>State GST (SGST 9%):</span>
              <span class="font-mono">₹${(invoice.orderDetails.sgstPaise / 100).toFixed(2)}</span>
             </div>`
      }
      <div class="totals-row grand">
        <span>Total Amount (Paid):</span>
        <span class="font-mono">₹${(invoice.orderDetails.totalPaidPaise / 100).toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      This is a computer-generated tax invoice issued by Artsy Production under SAC 999613.<br>
      Electronic Payment captured via ${invoice.orderDetails.paymentMode}.
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[INVOICE ROUTE ERROR]:', errorMsg);
    return NextResponse.json(
      { error: errorMsg || 'Error generating invoice' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices/[orderId]
 * Explicitly sends the tax invoice via Resend email to the specified or stored recipient.
 * Body: { email?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const orderDetails = await resolveOrderDetails(orderId);

    const recipientEmail = body.email || orderDetails.clientEmail;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required to send invoice.' },
        { status: 400 }
      );
    }

    const invoice = generateInvoiceData({
      ...orderDetails,
      clientEmail: recipientEmail,
    });

    // Archive invoice to statutory WORM vault
    await archiveInvoiceToVault(invoice);

    // Send invoice via Resend email
    const emailResult = await sendInvoiceEmail(recipientEmail, invoice);

    return NextResponse.json({
      success: emailResult.success,
      message: emailResult.success ? 'Invoice sent via Email' : 'Failed to send invoice email',
      invoiceNumber: invoice.invoiceNumber,
      orderId,
      recipient: recipientEmail,
      emailId: emailResult.id,
      error: emailResult.error,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[INVOICE SEND ERROR]:', errorMsg);
    return NextResponse.json(
      { error: errorMsg || 'Failed to dispatch invoice' },
      { status: 500 }
    );
  }
}
