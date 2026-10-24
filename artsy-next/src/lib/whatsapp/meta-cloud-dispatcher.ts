const META_API_URL = 'https://graph.facebook.com/v23.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

export async function sendMetaTemplate(
  phone: string,
  templateName: string,
  params: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1389485034246532';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';

  if (!accessToken || !phoneId) {
    console.warn('[META_CAPI] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
    return { success: false, error: 'Meta WhatsApp credentials unconfigured' };
  }

  // Normalize phone to international format without leading '+' (e.g. 10 digits -> 91...)
  const cleanPhone = phone.replace(/^\+/, '').replace(/\D/g, '');
  const recipientPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const defaultLang = process.env.WHATSAPP_TEMPLATE_LANG || 'en_US';

  const makePayload = (langCode: string) => ({
    messaging_product: 'whatsapp',
    to: recipientPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: langCode },
      components: [
        {
          type: 'body',
          parameters: params.map((p) => ({ type: 'text', text: p })),
        },
      ],
    },
  });

  const sendWithLang = async (lang: string) => {
    return fetch(`${META_API_URL}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(makePayload(lang)),
      signal: AbortSignal.timeout(6000),
    });
  };

  try {
    let response = await sendWithLang(defaultLang);
    let data = await response.json();

    // If template does not exist in specified language (Meta error code 132001), try alternate language ('en' vs 'en_US')
    if (!response.ok && data?.error?.code === 132001) {
      const alternateLang = defaultLang === 'en_US' ? 'en' : 'en_US';
      console.warn(`[META_CAPI] Language mismatch (${defaultLang}) for template "${templateName}". Retrying with "${alternateLang}"...`);
      response = await sendWithLang(alternateLang);
      data = await response.json();
    }

    if (!response.ok) {
      const errDetails = data?.error
        ? `[Code: ${data.error.code || 'N/A'}, Subcode: ${data.error.error_subcode || 'N/A'}, Title: "${data.error.error_user_title || 'N/A'}", Message: "${data.error.message || 'N/A'}"]`
        : JSON.stringify(data);
      console.error(`[META_CAPI] Send failed with status ${response.status} for template "${templateName}":`, errDetails);
      return {
        success: false,
        error: data?.error?.message ? `${data.error.message} (code ${data.error.code})` : `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (err: any) {
    console.error(`[META_CAPI] Exception sending template "${templateName}":`, err?.message || err);
    return { success: false, error: err?.message || 'Network exception during Meta API call' };
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
