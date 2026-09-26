/**
 * ARTSY PRODUCTION — Statutory Credit Note Generator
 * ===================================================
 * Implements Section 34 of the CGST Act, 2017 & Master Plan §4.3
 * Generated on cancellations, refunds, or service concessions.
 */

export interface CreditNoteData {
  creditNoteNumber: string;
  creditNoteDate: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  artsyDetails: {
    legalName: string;
    tradeName: string;
    gstin: string;
    pan: string;
    state: string;
    stateCode: string;
  };
  clientDetails: {
    name: string;
    phone: string;
    email: string;
    state: string;
    stateCode: string;
    gstin?: string;
  };
  refundDetails: {
    orderId: string;
    sacCode: string; // 999613
    refundAmountPaise: number;
    taxableRefundPaise: number;
    gstReversedPaise: number;
    cgstReversedPaise: number;
    sgstReversedPaise: number;
    igstReversedPaise: number;
    reason: string;
  };
}

export function generateCreditNote(params: {
  orderId: string;
  originalInvoiceNumber: string;
  originalInvoiceDate?: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  refundAmountPaise: number;
  clientStateCode?: string;
  clientGstin?: string;
  reason?: string;
}): CreditNoteData {
  const artsyStateCode = '27'; // Maharashtra
  const clientCode = params.clientStateCode || '27';
  const isInterState = artsyStateCode !== clientCode;

  // Extract 18% embedded GST from refunded amount
  const taxableRefundPaise = Math.round(params.refundAmountPaise / 1.18);
  const gstReversedPaise = params.refundAmountPaise - taxableRefundPaise;

  let cgstReversedPaise = 0;
  let sgstReversedPaise = 0;
  let igstReversedPaise = 0;

  if (isInterState) {
    igstReversedPaise = gstReversedPaise;
  } else {
    cgstReversedPaise = Math.floor(gstReversedPaise / 2);
    sgstReversedPaise = gstReversedPaise - cgstReversedPaise;
  }

  const creditNoteNumber = `CN-${params.orderId.replace(/[^a-zA-Z0-9]/g, '')}-${new Date().getFullYear()}`;

  return {
    creditNoteNumber,
    creditNoteDate: new Date().toISOString().split('T')[0],
    originalInvoiceNumber: params.originalInvoiceNumber,
    originalInvoiceDate: params.originalInvoiceDate || new Date().toISOString().split('T')[0],
    artsyDetails: {
      legalName: 'Artsy Production',
      tradeName: 'Artsy Production',
      gstin: process.env.ARTSY_GSTIN || '27AAAAA0000A1Z5',
      pan: process.env.ARTSY_PAN || 'AAAAA0000A',
      state: 'Maharashtra',
      stateCode: '27',
    },
    clientDetails: {
      name: params.clientName,
      phone: params.clientPhone,
      email: params.clientEmail,
      state: clientCode === '27' ? 'Maharashtra' : 'Other',
      stateCode: clientCode,
      gstin: params.clientGstin,
    },
    refundDetails: {
      orderId: params.orderId,
      sacCode: '999613',
      refundAmountPaise: params.refundAmountPaise,
      taxableRefundPaise,
      gstReversedPaise,
      cgstReversedPaise,
      sgstReversedPaise,
      igstReversedPaise,
      reason: params.reason || 'Cancellation per Artsy 3-Tier Milestone Schedule',
    },
  };
}
