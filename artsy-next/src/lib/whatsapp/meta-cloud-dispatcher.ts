const META_API_URL = 'https://graph.facebook.com/v23.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

export async function sendMetaTemplate(
  phone: string,
  templateName: string,
  params: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const payload = {
    messaging_product: 'whatsapp',
    to: phone.replace(/^\+/, ''),
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: params.map((p) => ({ type: 'text', text: p })),
        },
      ],
    },
  };

  try {
    const response = await fetch(`${META_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[META_CAPI] Send failed with status:', response.status, data.error?.message || '');
      return { success: false, error: data.error?.message || 'Unknown error' };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (err: any) {
    console.error('[META_CAPI] Exception:', err?.message || 'Unknown');
    return { success: false, error: err.message };
  }
}

export async function sendMetaOTP(
  phone: string,
  otp: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const otpTemplateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'artsy_otp_login';
  if (!otpTemplateName) {
    return { success: false, error: 'WHATSAPP_OTP_TEMPLATE_NAME not configured' };
  }

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || PHONE_NUMBER_ID || '1389485034246532';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ACCESS_TOKEN;
  const langCode = process.env.WHATSAPP_OTP_TEMPLATE_LANG || (otpTemplateName === 'artsy_otp_login' ? 'en' : 'en_US');

  const normalizedPhone = phone.replace(/^\+/, '').replace(/\D/g, '');
  const recipientPhone = normalizedPhone.length === 10 ? `91${normalizedPhone}` : normalizedPhone;

  const payload = {
    messaging_product: 'whatsapp',
    to: recipientPhone,
    type: 'template',
    template: {
      name: otpTemplateName,
      language: { code: langCode },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: otp }],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 0,
          parameters: [{ type: 'text', text: otp }],
        },
      ],
    },
  };

  try {
    const response = await fetch(
      `${META_API_URL}/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[META_OTP] Send failed with status:', response.status, data.error?.message || '');
      return { success: false, error: data.error?.message || 'Send failed' };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (err: any) {
    console.error('[META_OTP] Exception:', err);
    return { success: false, error: err.message };
  }
}
