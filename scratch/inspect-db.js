const postgres = require('postgres');

const sql = postgres('postgresql://scrollpop:scrollpop_dev@localhost:5433/scrollpop');

async function main() {
  try {
    console.log('=== SITES ===');
    const sites = await sql`SELECT id, name, domain, public_key, verified_at, deleted_at FROM sites`;
    console.table(sites);

    console.log('=== CAMPAIGNS ===');
    const campaigns = await sql`SELECT id, name, site_id, status, deleted_at FROM campaigns`;
    console.table(campaigns);

    console.log('=== DESIGNS ===');
    const designs = await sql`SELECT id, campaign_id, kind, affiliate_slots FROM designs`;
    console.table(designs.map(d => ({
      id: d.id,
      campaignId: d.campaign_id,
      kind: d.kind,
      slotsCount: Array.isArray(d.affiliate_slots) ? d.affiliate_slots.length : typeof d.affiliate_slots === 'string' ? JSON.parse(d.affiliate_slots).length : 0
    })));

    console.log('=== TRIGGERS ===');
    const triggers = await sql`SELECT id, campaign_id, type, params FROM triggers`;
    console.table(triggers);

    console.log('=== TARGETING RULES ===');
    const targeting = await sql`SELECT id, campaign_id, kind, operator, value FROM targeting_rules`;
    console.table(targeting);

    console.log('=== FREQUENCY RULES ===');
    const frequency = await sql`SELECT id, campaign_id, frequency FROM frequency_rules`;
    console.table(frequency);

  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await sql.end();
  }
}

main();
