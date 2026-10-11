const token = process.env.WHATSAPP_ACCESS_TOKEN;
const wabaId = '1865476298200327';

if (!token) {
  console.error('ERROR: WHATSAPP_ACCESS_TOKEN not set in environment');
  process.exit(1);
}

const templates = [
  {
    name: 'artsy_creator_welcome',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your Artsy Production creator account {{2}} has been created. Complete your profile at {{3}} to start receiving project offers.',
        example: {
          body_text: [['Rahul', 'CREATOR-8841', 'https://artsyproduction.com/freelancer/onboarding']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Complete Profile',
            url: 'https://artsyproduction.com/freelancer/onboarding',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_job_offer',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, a new project {{2}} is available for you. Budget: {{3}}. Review and respond at {{4}} to accept the assignment.',
        example: {
          body_text: [['Rahul', 'AP-8841', 'Rs.4500', 'https://artsyproduction.com/freelancer']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'View Offer',
            url: 'https://artsyproduction.com/freelancer',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_payout_sent',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your payout of {{2}} has been sent to your bank account. NEFT reference: {{3}}. View details at {{4}} in your dashboard.',
        example: {
          body_text: [['Rahul', 'Rs.4442', 'NEFT-2026-8841', 'https://artsyproduction.com/freelancer/payouts']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'View Payout',
            url: 'https://artsyproduction.com/freelancer/payouts',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_creator_suspended',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your Artsy Production creator account has been temporarily suspended. Reason: {{2}}. Review details at {{3}} to appeal.',
        example: {
          body_text: [['Rahul', 'Missed multiple deadlines', 'https://artsyproduction.com/freelancer']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'View Account',
            url: 'https://artsyproduction.com/freelancer',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_dispute_opened',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, we have received your dispute for project {{2}}. Our team will respond within 48 hours. View details at {{3}} in your dashboard.',
        example: {
          body_text: [['Rahul', 'AP-8841', 'https://artsyproduction.com/client/projects']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'View Dispute',
            url: 'https://artsyproduction.com/client/projects',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_change_order',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, a scope change has been created for project {{2}}. Additional amount: {{3}}. Review and approve at {{4}} to proceed with updates.',
        example: {
          body_text: [['Rahul', 'AP-8841', 'Rs.1500', 'https://artsyproduction.com/client/projects']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Review Change',
            url: 'https://artsyproduction.com/client/projects',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_refund_processed',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your refund of {{2}} for project {{3}} has been initiated. It will reflect in your account within 5-7 business days with reference {{4}} for tracking.',
        example: {
          body_text: [['Rahul', 'Rs.8000', 'AP-8841', 'RFND-2026-8841']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'View Refund',
            url: 'https://artsyproduction.com/client/invoices',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_sla_breach',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, we are running behind on project {{2}}. Your new expected delivery is {{3}}. Track progress at {{4}} to view timeline updates.',
        example: {
          body_text: [['Rahul', 'AP-8841', '15 Oct 2026', 'https://artsyproduction.com/client/projects']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Track Project',
            url: 'https://artsyproduction.com/client/projects',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_upload_reminder',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, we are waiting for your raw footage for project {{2}}. Please upload at {{3}} to avoid delays.',
        example: {
          body_text: [['Rahul', 'AP-8841', 'https://artsyproduction.com/client/projects']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Upload Now',
            url: 'https://artsyproduction.com/client/projects',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_review_reminder',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your draft for project {{2}} is awaiting review. Please take a look at {{3}} when you have a moment.',
        example: {
          body_text: [['Rahul', 'AP-8841', 'https://artsyproduction.com/client/projects']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Review Draft',
            url: 'https://artsyproduction.com/client/projects',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_daily_checkin',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, quick check-in on project {{2}}. Please update your progress at {{3}} for today.',
        example: {
          body_text: [['Rahul', 'AP-8841', 'https://artsyproduction.com/freelancer/work/AP-8841']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Update Progress',
            url: 'https://artsyproduction.com/freelancer/work/AP-8841',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_admin_alert',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Admin Alert: Project {{1}} requires attention. Reason: {{2}}. Action needed at {{3}} in the dashboard.',
        example: {
          body_text: [['AP-8841', 'Missed check-in', 'https://artsyproduction.com/admin']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'View Admin',
            url: 'https://artsyproduction.com/admin',
          },
        ],
      },
    ],
  },
];

async function createOrCheckTemplate(tpl) {
  const checkRes = await fetch(
    `https://graph.facebook.com/v23.0/${wabaId}/message_templates?name=${tpl.name}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const checkData = await checkRes.json();
  const existing = checkData?.data?.find((t) => t.name === tpl.name);

  if (existing) {
    console.log(`[EXISTS] ${tpl.name}: Status=${existing.status}, Category=${existing.category}, ID=${existing.id}`);
    return { name: tpl.name, status: existing.status, category: existing.category, id: existing.id };
  }

  const res = await fetch(`https://graph.facebook.com/v23.0/${wabaId}/message_templates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tpl),
  });
  const data = await res.json();

  if (res.status === 200) {
    console.log(`[CREATED] ${tpl.name}: Status=${data.status}, Category=${data.category}, ID=${data.id}`);
    return { name: tpl.name, status: data.status, category: data.category, id: data.id };
  } else {
    console.error(`[ERROR] ${tpl.name}: HTTP ${res.status}`, JSON.stringify(data, null, 2));
    return { name: tpl.name, error: data };
  }
}

async function run() {
  console.log('===============================================================');
  console.log('CREATING 12 NEW UTILITY TEMPLATES VIA META GRAPH API');
  console.log('WABA ID:', wabaId);
  console.log('===============================================================\n');

  const results = [];
  for (const tpl of templates) {
    const res = await createOrCheckTemplate(tpl);
    results.push(res);
  }

  console.log('\n===============================================================');
  console.log('SUMMARY OF 12 TEMPLATES CREATED / CHECKED');
  console.log('===============================================================');
  console.table(results);
}

run();
