import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateInvoiceData } from '@/lib/invoices/generator';

/**
 * GST Tax Invoice Route (§4.3, §15.1)
 * Renders statutory tax invoice with SAC 999613, CGST/SGST/IGST, and Place of Supply
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const format = request.nextUrl.searchParams.get('format') || 'html';

    let totalPaise = 800000;
    let clientName = 'Artsy Client';
    let clientPhone = '+919876543210';
    let clientEmail = 'client@artsyproduction.in';
    const serviceName = 'Wedding Highlight Cinema (Post-Production)';

    if (supabase) {
      const { data: order } = await supabase
        .from('orders')
        .select('*, users(full_name, phone, email)')
        .eq('id', orderId)
        .maybeSingle();

      if (order) {
        totalPaise = order.amount_paise;
        if (order.users) {
          clientName = order.users.full_name || clientName;
          clientPhone = order.users.phone || clientPhone;
          clientEmail = order.users.email || clientEmail;
        }
      }
    }

    const invoice = generateInvoiceData({
      orderId,
      clientName,
      clientPhone,
      clientEmail,
      serviceName,
      totalPaise
    });

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
  } catch (err: any) {
    console.error('[INVOICE ROUTE ERROR]:', err);
    return NextResponse.json(
      { error: err.message || 'Error generating invoice' },
      { status: 500 }
    );
  }
}
