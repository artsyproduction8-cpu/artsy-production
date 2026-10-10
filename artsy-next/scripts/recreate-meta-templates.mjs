const token = process.env.WHATSAPP_ACCESS_TOKEN;
const wabaId = '1865476298200327';

async function create(template) {
  const res = await fetch('https://graph.facebook.com/v23.0/' + wabaId + '/message_templates', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  const data = await res.json();
  console.log(template.name, res.status, JSON.stringify(data, null, 2));
}

// Template 1: artsy_account_confirmed
// Text includes non-trailing closing phrase 'to view your details.' to comply with Meta rule 2388299
await create({
  name: 'artsy_account_confirmed',
  category: 'UTILITY',
  language: 'en_US',
  components: [
    {
      type: 'BODY',
      text: 'Hi {{1}}, your Artsy Production account {{2}} has been confirmed. Access your dashboard at {{3}} to view your details.',
      example: {
        body_text: [['Rahul', 'ARTSY-USER-8841', 'https://artsyproduction.com/client-dashboard']],
      },
    },
    { type: 'FOOTER', text: 'Artsy Production' },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'Open Dashboard',
          url: 'https://artsyproduction.com/client-dashboard',
        },
      ],
    },
  ],
});

// Template 2: artsy_project_status
// Text includes sufficient word ratio (rule 2388293) and non-trailing closing phrase (rule 2388299)
await create({
  name: 'artsy_project_status',
  category: 'UTILITY',
  language: 'en_US',
  components: [
    {
      type: 'BODY',
      text: 'This is a status update for project {{1}} ({{2}}). The current status is: {{3}}. Open the project at {{4}} to review your timeline.',
      example: {
        body_text: [['AP-8841', 'Uddhav Wedding Highlight', 'Ready for review', 'https://artsyproduction.com/client/projects']],
      },
    },
    { type: 'FOOTER', text: 'Artsy Production' },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'Open Project',
          url: 'https://artsyproduction.com/client/projects',
        },
      ],
    },
  ],
});
