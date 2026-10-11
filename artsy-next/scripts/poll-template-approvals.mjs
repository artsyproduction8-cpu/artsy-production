const token = process.env.WHATSAPP_ACCESS_TOKEN;
const wabaId = '1865476298200327';

const targetTemplates = [
  'artsy_footage_received',
  'artsy_editor_assigned',
  'artsy_draft_ready',
  'artsy_revision_requested',
  'artsy_approval_needed',
  'artsy_final_delivery',
  'artsy_invoice_ready',
  'artsy_retention_warning'
];

async function check() {
  const maxAttempts = 20; // 20 * 15s = 5 minutes
  for (let i = 1; i <= maxAttempts; i++) {
    const res = await fetch(`https://graph.facebook.com/v23.0/${wabaId}/message_templates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const map = new Map((data.data || []).map(t => [t.name, t]));

    const statuses = targetTemplates.map(name => {
      const t = map.get(name);
      return { name, status: t?.status || 'UNKNOWN', category: t?.category || 'UNKNOWN' };
    });

    const pendingCount = statuses.filter(s => s.status === 'PENDING').length;
    const approvedCount = statuses.filter(s => s.status === 'APPROVED').length;
    const rejectedCount = statuses.filter(s => s.status === 'REJECTED').length;

    console.log(`[Attempt ${i}/${maxAttempts}] Approved: ${approvedCount}/8, Pending: ${pendingCount}/8, Rejected: ${rejectedCount}/8`);

    if (pendingCount === 0) {
      console.log('All templates finalized!');
      console.table(statuses);
      return;
    }

    if (i < maxAttempts) {
      await new Promise(r => setTimeout(r, 15000));
    }
  }
}

check();
