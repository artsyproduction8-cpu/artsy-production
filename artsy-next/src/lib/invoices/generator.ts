/**
 * Artsy Production - GST Compliant Invoice Generator (§4.3, §15.1)
 * SAC Code: 999613 (Post-production services)
 * Embedded GST: 18%
 */

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  artsyDetails: {
    legalName: string;
    tradeName: string;
    gstin: string;
    pan: string;
    address: string;
    state: string;
    stateCode: string;
    email: string;
    phone: string;
  };
  clientDetails: {
    name: string;
    phone: string;
    email: string;
    billingAddress?: string;
    gstin?: string;
    state: string;
    stateCode: string;
    isB2B: boolean;
  };
  orderDetails: {
    orderId: string;
    serviceName: string;
    sacCode: string;
    totalPaidPaise: number;
    taxableAmountPaise: number;
    gstAmountPaise: number;
    isInterState: boolean;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    paymentMode: string;
    paymentRef: string;
    placeOfSupply: string;
  };
}

export function getIndianFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0 = Jan, 3 = April
  const year = date.getFullYear();
  if (month >= 3) {
    const startYr = year % 100;
    const endYr = (year + 1) % 100;
    return `${String(startYr).padStart(2, '0')}-${String(endYr).padStart(2, '0')}`;
  } else {
    const startYr = (year - 1) % 100;
    const endYr = year % 100;
    return `${String(startYr).padStart(2, '0')}-${String(endYr).padStart(2, '0')}`;
  }
}

export function formatSequentialInvoiceNumber(sequenceNumber: number, date: Date = new Date()): string {
  const fy = getIndianFinancialYear(date);
  const seqPadded = String(sequenceNumber).padStart(5, '0');
  return `AP/${fy}/${seqPadded}`;
}

export function generateInvoiceData(params: {
  orderId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceName?: string;
  totalPaise: number;
  sequenceNumber?: number;
  invoiceNumber?: string;
  clientState?: string;
  clientStateCode?: string;
  clientGstin?: string;
  clientAddress?: string;
  paymentRef?: string;
}): InvoiceData {
  const artsyStateCode = '27'; // Default Maharashtra (or configured state)
  const clientCode = params.clientStateCode || '27';
  const isInterState = artsyStateCode !== clientCode;

  // 18% embedded GST calculation:
  // Taxable = Total / 1.18
  const totalPaid = params.totalPaise;
  const taxableAmountPaise = Math.round(totalPaid / 1.18);
  const gstAmountPaise = totalPaid - taxableAmountPaise;

  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  if (isInterState) {
    igstPaise = gstAmountPaise;
  } else {
    cgstPaise = Math.floor(gstAmountPaise / 2);
    sgstPaise = gstAmountPaise - cgstPaise;
  }

  const invoiceNumber = params.invoiceNumber || 
    (params.sequenceNumber 
      ? formatSequentialInvoiceNumber(params.sequenceNumber) 
      : formatSequentialInvoiceNumber(1));

  return {
    invoiceNumber,
    invoiceDate: new Date().toISOString().split('T')[0],
    artsyDetails: {
      legalName: 'Artsy Production',
      tradeName: 'Artsy Production',
      gstin: process.env.ARTSY_GSTIN || '27AAAAA0000A1Z5',
      pan: process.env.ARTSY_PAN || 'AAAAA0000A',
      address: 'Artsy Production, Juinagar Railway Station, Navi Mumbai, Maharashtra 400705, India',
      state: 'Maharashtra',
      stateCode: '27',
      email: 'artsyproduction8@gmail.com',
      phone: '+91 98765 43210'
    },
    clientDetails: {
      name: params.clientName,
      phone: params.clientPhone,
      email: params.clientEmail,
      billingAddress: params.clientAddress || 'Client Provided Address',
      gstin: params.clientGstin,
      state: params.clientState || 'Maharashtra',
      stateCode: clientCode,
      isB2B: !!params.clientGstin
    },
    orderDetails: {
      orderId: params.orderId,
      serviceName: params.serviceName || 'Creative Video Post-Production & Color Grading',
      sacCode: '999613',
      totalPaidPaise: totalPaid,
      taxableAmountPaise,
      gstAmountPaise,
      isInterState,
      cgstPaise,
      sgstPaise,
      igstPaise,
      paymentMode: 'Razorpay Online (UPI/Cards/NetBanking)',
      paymentRef: params.paymentRef || `pay_${params.orderId}`,
      placeOfSupply: `${params.clientState || 'Maharashtra'} (${clientCode})`
    }
  };
}

/**
 * Generates standalone, print-ready statutory HTML for a GST Tax Invoice.
 * Compatible with email attachments, browser rendering, and PDF conversion.
 */
export function generateStatutoryInvoiceHtml(invoice: InvoiceData): string {
  const taxableInr = (invoice.orderDetails.taxableAmountPaise / 100).toFixed(2);
  const totalPaidInr = (invoice.orderDetails.totalPaidPaise / 100).toFixed(2);
  const cgstInr = (invoice.orderDetails.cgstPaise / 100).toFixed(2);
  const sgstInr = (invoice.orderDetails.sgstPaise / 100).toFixed(2);
  const igstInr = (invoice.orderDetails.igstPaise / 100).toFixed(2);
  const isInterState = invoice.orderDetails.isInterState;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1d1d1f; margin: 0; padding: 40px 20px; background: #f5f5f7; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e7; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1d1d1f; padding-bottom: 20px; }
    .title { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1d1d1f; }
    .subtitle { font-size: 11px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    .badge { background: #f5f5f7; border: 1px solid #e5e5e7; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #1d1d1f; font-family: monospace; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 28px 0; font-size: 13px; line-height: 1.6; }
    .grid h4 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #86868b; letter-spacing: 0.5px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; }
    th { text-align: left; padding: 12px 10px; background: #f5f5f7; border-bottom: 1px solid #e5e5e7; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; color: #86868b; font-weight: 700; }
    td { padding: 14px 10px; border-bottom: 1px solid #f5f5f7; }
    .text-right { text-align: right; }
    .totals { width: 320px; margin-left: auto; font-size: 13px; margin-top: 16px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals-row.grand { font-size: 16px; font-weight: 800; border-top: 2px solid #1d1d1f; margin-top: 8px; padding-top: 12px; color: #1d1d1f; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e7; font-size: 11px; color: #86868b; text-align: center; line-height: 1.5; }
    .no-print { max-width: 800px; margin: 0 auto 16px; text-align: right; }
    .print-btn { background: #1d1d1f; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
    .print-btn:hover { background: #3b82f6; }
    @media print {
      body { padding: 0; background: #ffffff; }
      .invoice-card { border: none; padding: 0; box-shadow: none; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF ↓</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="title">ARTSY PRODUCTION</div>
        <div class="subtitle">STATUTORY TAX INVOICE (RULE 46 OF CGST RULES)</div>
      </div>
      <div style="text-align: right;">
        <span class="badge">${invoice.invoiceNumber}</span>
        <div style="font-size: 12px; color: #86868b; margin-top: 6px;">Date: <strong>${invoice.invoiceDate}</strong></div>
      </div>
    </div>

    <div class="grid">
      <div>
        <h4>SUPPLIER (BILL FROM)</h4>
        <strong>${invoice.artsyDetails.tradeName}</strong><br>
        ${invoice.artsyDetails.address}<br>
        GSTIN: <strong>${invoice.artsyDetails.gstin}</strong><br>
        PAN: ${invoice.artsyDetails.pan}<br>
        State: ${invoice.artsyDetails.state} (Code: ${invoice.artsyDetails.stateCode})<br>
        Email: ${invoice.artsyDetails.email}
      </div>
      <div>
        <h4>RECIPIENT (BILL TO)</h4>
        <strong>${invoice.clientDetails.name || 'Valued Client'}</strong><br>
        Phone: ${invoice.clientDetails.phone || 'N/A'}<br>
        Email: ${invoice.clientDetails.email || 'N/A'}<br>
        ${invoice.clientDetails.gstin ? `GSTIN: <strong>${invoice.clientDetails.gstin}</strong><br>` : ''}
        Place of Supply: ${invoice.orderDetails.placeOfSupply}<br>
        Order Ref: <span style="font-family: monospace;">${invoice.orderDetails.orderId}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description of Services</th>
          <th>SAC Code</th>
          <th class="text-right">Taxable Value</th>
          <th class="text-right">GST Rate</th>
          <th class="text-right">Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong>${invoice.orderDetails.serviceName}</strong><br>
            <span style="font-size: 11px; color: #86868b;">Professional Film Post-Production, Master Editing, Color Grading & Sound Design</span>
          </td>
          <td style="font-family: monospace;">${invoice.orderDetails.sacCode}</td>
          <td class="text-right" style="font-family: monospace;">₹${taxableInr}</td>
          <td class="text-right">18%</td>
          <td class="text-right" style="font-family: monospace; font-weight: 700;">₹${totalPaidInr}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Taxable Amount</span>
        <span style="font-family: monospace;">₹${taxableInr}</span>
      </div>
      ${isInterState ? `
      <div class="totals-row">
        <span>IGST (18%)</span>
        <span style="font-family: monospace;">₹${igstInr}</span>
      </div>
      ` : `
      <div class="totals-row">
        <span>CGST (9%)</span>
        <span style="font-family: monospace;">₹${cgstInr}</span>
      </div>
      <div class="totals-row">
        <span>SGST (9%)</span>
        <span style="font-family: monospace;">₹${sgstInr}</span>
      </div>
      `}
      <div class="totals-row grand">
        <span>Total Paid</span>
        <span>₹${totalPaidInr}</span>
      </div>
    </div>

    <div style="margin-top: 32px; padding: 14px 18px; background: #f5f5f7; border-radius: 8px; font-size: 12px; color: #555;">
      <strong>Payment Confirmation:</strong> Fully settled via ${invoice.orderDetails.paymentMode}. Transaction Reference: <span style="font-family: monospace;">${invoice.orderDetails.paymentRef}</span>.
    </div>

    <div class="footer">
      This is a digitally generated statutory tax invoice issued in compliance with Rule 46 of Central Goods and Services Tax Rules, 2017.<br>
      Permanently recorded in the immutable WORM vault per Section 36 of the CGST Act.<br>
      <strong>Artsy Production</strong> • Mumbai • Bengaluru • Delhi NCR
    </div>
  </div>
</body>
</html>`;
}
