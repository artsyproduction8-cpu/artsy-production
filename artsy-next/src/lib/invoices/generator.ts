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
      address: 'Artsy Creative Studios, Studio Row, Mumbai, MH, 400001',
      state: 'Maharashtra',
      stateCode: '27',
      email: 'billing@artsyproduction.in',
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
