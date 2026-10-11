const token = process.env.WHATSAPP_ACCESS_TOKEN;
const wabaId = '1865476298200327';

if (!token) {
  console.error('ERROR: WHATSAPP_ACCESS_TOKEN not set in environment');
  process.exit(1);
}

const templates = [
  {
    name: 'artsy_footage_received',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, we have received your footage for project {{2}}. Our team will review it and assign an editor within 24 hours. Track progress at {{3}} to view your project updates.',
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
            text: 'Track Project',
            url: 'https://artsyproduction.com/client/projects',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_editor_assigned',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, an editor has been assigned to your project {{2}}. Editing has begun and you will receive a first cut for review soon. View project details at {{3}} in your dashboard.',
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
            text: 'View Project',
            url: 'https://artsyproduction.com/client/projects',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_draft_ready',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your first cut for project {{2}} is ready for review. Please watch and share your feedback at {{3}} to help us finalize the cut.',
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
    name: 'artsy_revision_requested',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, we have received your revision request for project {{2}}. Our editor is working on the changes and will deliver an updated version at {{3}} once completed.',
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
            text: 'View Project',
            url: 'https://artsyproduction.com/client/projects',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_approval_needed',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your project {{2}} is ready for final approval. Please review and approve at {{3}} so we can deliver the final files.',
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
            text: 'Approve Now',
            url: 'https://artsyproduction.com/client/projects',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_final_delivery',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your final video for project {{2}} is ready to download. Access your files at {{3}} to download the deliverables.',
        example: {
          body_text: [['Rahul', 'AP-8841', 'https://artsyproduction.com/client/files']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Download Files',
            url: 'https://artsyproduction.com/client/files',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_invoice_ready',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your invoice {{2}} for project {{3}} is ready. View and download it at {{4}} from your account.',
        example: {
          body_text: [['Rahul', 'AP/26-27/00042', 'AP-8841', 'https://artsyproduction.com/client/invoices']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'View Invoice',
            url: 'https://artsyproduction.com/client/invoices',
          },
        ],
      },
    ],
  },
  {
    name: 'artsy_retention_warning',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your files for project {{2}} will be deleted in {{3}} days. Download them at {{4}} before they expire.',
        example: {
          body_text: [['Rahul', 'AP-8841', '7', 'https://artsyproduction.com/client/files']],
        },
      },
      { type: 'FOOTER', text: 'Artsy Production' },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Download Now',
            url: 'https://artsyproduction.com/client/files',
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
  console.log('CREATING 8 NEW UTILITY TEMPLATES VIA META GRAPH API');
  console.log('WABA ID:', wabaId);
  console.log('===============================================================\n');

  const results = [];
  for (const tpl of templates) {
    const res = await createOrCheckTemplate(tpl);
    results.push(res);
  }

  console.log('\n===============================================================');
  console.log('SUMMARY OF TEMPLATES CREATED / CHECKED');
  console.log('===============================================================');
  console.table(results);
}

run();
