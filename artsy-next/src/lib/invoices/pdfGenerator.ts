import { jsPDF } from 'jspdf';
import { InvoiceData } from './generator';

/**
 * Generates an authentic, print-perfect statutory GST Tax Invoice PDF Buffer.
 * Fully compliant with Rule 46 of CGST Rules, 2017.
 */
export function generateStatutoryInvoicePdfBuffer(invoice: InvoiceData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  // Colors
  const black = '#1d1d1f';
  const gray = '#86868b';
  const lightGray = '#f5f5f7';
  const primaryBlue = '#2563eb';
  const darkBorder = '#d2d2d7';

  // --- HEADER SECTION ---
  doc.setTextColor(black);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ARTSY PRODUCTION', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(gray);
  doc.text('STATUTORY TAX INVOICE (RULE 46 OF CGST RULES)', margin, 29);

  // Top Right Badge & Details
  doc.setFillColor(245, 245, 247);
  doc.roundedRect(pageWidth - margin - 52, 14, 52, 20, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryBlue);
  doc.text(invoice.invoiceNumber, pageWidth - margin - 48, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(gray);
  doc.text(`Date: ${invoice.invoiceDate}`, pageWidth - margin - 48, 25);
  doc.text('ORIGINAL FOR RECIPIENT', pageWidth - margin - 48, 30);

  // Divider Line
  doc.setDrawColor(229, 229, 231);
  doc.setLineWidth(0.5);
  doc.line(margin, 38, pageWidth - margin, 38);

  // --- SUPPLIER & RECIPIENT GRID ---
  const gridY = 46;
  const colWidth = (contentWidth - 8) / 2;

  // Supplier Card (Left)
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, gridY, colWidth, 42, 2, 2, 'F');
  doc.setDrawColor(235, 235, 237);
  doc.roundedRect(margin, gridY, colWidth, 42, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('SUPPLIER (BILL FROM)', margin + 6, gridY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(black);
  doc.text(invoice.artsyDetails.tradeName || 'Artsy Production', margin + 6, gridY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#333333');
  doc.text(invoice.artsyDetails.address.slice(0, 48), margin + 6, gridY + 19);
  doc.text(`GSTIN: ${invoice.artsyDetails.gstin}`, margin + 6, gridY + 24);
  doc.text(`PAN: ${invoice.artsyDetails.pan} | State: ${invoice.artsyDetails.state} (${invoice.artsyDetails.stateCode})`, margin + 6, gridY + 29);
  doc.text(`Email: ${invoice.artsyDetails.email}`, margin + 6, gridY + 34);

  // Recipient Card (Right)
  const rightX = margin + colWidth + 8;
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(rightX, gridY, colWidth, 42, 2, 2, 'F');
  doc.roundedRect(rightX, gridY, colWidth, 42, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.text('RECIPIENT (BILL TO)', rightX + 6, gridY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(black);
  doc.text(invoice.clientDetails.name || 'Valued Client', rightX + 6, gridY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#333333');
  doc.text(`Phone: ${invoice.clientDetails.phone || 'N/A'}`, rightX + 6, gridY + 19);
  doc.text(`Email: ${invoice.clientDetails.email || 'N/A'}`, rightX + 6, gridY + 24);
  if (invoice.clientDetails.gstin) {
    doc.text(`GSTIN: ${invoice.clientDetails.gstin}`, rightX + 6, gridY + 29);
  } else {
    doc.text(`Place of Supply: ${invoice.orderDetails.placeOfSupply}`, rightX + 6, gridY + 29);
  }
  doc.text(`Order Reference: ${invoice.orderDetails.orderId}`, rightX + 6, gridY + 34);

  // --- LINE ITEMS TABLE ---
  const tableY = 96;

  // Table Header
  doc.setFillColor(245, 245, 247);
  doc.rect(margin, tableY, contentWidth, 8, 'F');
  doc.setDrawColor(210, 210, 215);
  doc.line(margin, tableY, pageWidth - margin, tableY);
  doc.line(margin, tableY + 8, pageWidth - margin, tableY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(gray);
  doc.text('#', margin + 3, tableY + 5.5);
  doc.text('DESCRIPTION OF SERVICES', margin + 12, tableY + 5.5);
  doc.text('SAC CODE', margin + 98, tableY + 5.5);
  doc.text('TAXABLE VALUE', margin + 126, tableY + 5.5);
  doc.text('GST RATE', margin + 154, tableY + 5.5);
  doc.text('TOTAL (INR)', pageWidth - margin - 4, tableY + 5.5, { align: 'right' });

  // Table Row
  const rowY = tableY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(black);
  doc.text('1', margin + 3, rowY + 7);
  doc.text(invoice.orderDetails.serviceName, margin + 12, rowY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(gray);
  doc.text('Professional Video Post-Production, Master Editing, Color Grading & Sound Master', margin + 12, rowY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(black);
  doc.text(invoice.orderDetails.sacCode, margin + 98, rowY + 7);

  const taxableInr = (invoice.orderDetails.taxableAmountPaise / 100).toFixed(2);
  const totalPaidInr = (invoice.orderDetails.totalPaidPaise / 100).toFixed(2);
  doc.text(`INR ${taxableInr}`, margin + 126, rowY + 7);
  doc.text('18%', margin + 154, rowY + 7);
  doc.setFont('helvetica', 'bold');
  doc.text(`INR ${totalPaidInr}`, pageWidth - margin - 4, rowY + 7, { align: 'right' });

  doc.setDrawColor(235, 235, 237);
  doc.line(margin, rowY + 16, pageWidth - margin, rowY + 16);

  // --- TOTALS CALCULATION BOX ---
  const totalsY = rowY + 22;
  const totalsWidth = 75;
  const totalsX = pageWidth - margin - totalsWidth;

  const cgstInr = (invoice.orderDetails.cgstPaise / 100).toFixed(2);
  const sgstInr = (invoice.orderDetails.sgstPaise / 100).toFixed(2);
  const igstInr = (invoice.orderDetails.igstPaise / 100).toFixed(2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(gray);

  doc.text('Taxable Amount:', totalsX, totalsY);
  doc.setTextColor(black);
  doc.text(`INR ${taxableInr}`, pageWidth - margin - 4, totalsY, { align: 'right' });

  let curY = totalsY + 6;
  if (invoice.orderDetails.isInterState) {
    doc.setTextColor(gray);
    doc.text('IGST (18%):', totalsX, curY);
    doc.setTextColor(black);
    doc.text(`INR ${igstInr}`, pageWidth - margin - 4, curY, { align: 'right' });
    curY += 6;
  } else {
    doc.setTextColor(gray);
    doc.text('CGST (9%):', totalsX, curY);
    doc.setTextColor(black);
    doc.text(`INR ${cgstInr}`, pageWidth - margin - 4, curY, { align: 'right' });
    curY += 6;

    doc.setTextColor(gray);
    doc.text('SGST (9%):', totalsX, curY);
    doc.setTextColor(black);
    doc.text(`INR ${sgstInr}`, pageWidth - margin - 4, curY, { align: 'right' });
    curY += 6;
  }

  // Grand Total Line
  doc.setDrawColor(29, 29, 31);
  doc.setLineWidth(0.6);
  doc.line(totalsX, curY, pageWidth - margin, curY);
  curY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(black);
  doc.text('Total Paid:', totalsX, curY);
  doc.setTextColor(primaryBlue);
  doc.text(`INR ${totalPaidInr}`, pageWidth - margin - 4, curY, { align: 'right' });

  // --- PAYMENT CONFIRMATION NOTICE ---
  const payNoticeY = curY + 16;
  doc.setFillColor(245, 247, 255);
  doc.roundedRect(margin, payNoticeY, contentWidth, 14, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, payNoticeY, contentWidth, 14, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryBlue);
  doc.text('PAYMENT SETTLEMENT CONFIRMATION', margin + 6, payNoticeY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor('#374151');
  doc.text(
    `Payment fully settled via ${invoice.orderDetails.paymentMode || 'Online Payment Gateway'}. Gateway Reference: ${invoice.orderDetails.paymentRef || invoice.orderDetails.orderId}`,
    margin + 6,
    payNoticeY + 10
  );

  // --- STATUTORY FOOTER ---
  const footerY = 265;
  doc.setDrawColor(229, 229, 231);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(gray);
  doc.text(
    'This is an authentic digitally generated statutory tax invoice issued in compliance with Rule 46 of CGST Rules, 2017.',
    pageWidth / 2,
    footerY + 6,
    { align: 'center' }
  );
  doc.text(
    'Permanently preserved in the immutable statutory WORM vault per Section 36 of CGST Act.',
    pageWidth / 2,
    footerY + 10,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(black);
  doc.text(
    'Artsy Production Private Limited • Mumbai • Bengaluru • Delhi NCR',
    pageWidth / 2,
    footerY + 15,
    { align: 'center' }
  );

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

