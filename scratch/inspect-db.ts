import postgres from 'postgres';

const sql = postgres('postgresql://scrollpop:scrollpop_dev@localhost:5433/scrollpop');

async function main() {
  try {
    console.log('=== SITES ===');
    const sitesList = await sql`SELECT id, name, domain, public_key, verified_at, deleted_at FROM sites`;
    console.table(sitesList);

    console.log('=== CAMPAIGNS ===');
    const campaignsList = await sql`SELECT id, name, site_id, status, deleted_at FROM campaigns`;
    console.table(campaignsList);

    console.log('=== DESIGNS ===');
    const designsList = await sql`SELECT id, campaign_id, kind, affiliate_slots FROM designs`;
    console.table(designsList.map(d => ({
      id: d.id,
      campaignId: d.campaign_id,
      kind: d.kind,
      slotsCount: Array.isArray(d.affiliate_slots) ? d.affiliate_slots.length : typeof d.affiliate_slots === 'string' ? JSON.parse(d.affiliate_slots).length : 0
    })));

    console.log('=== TRIGGERS ===');
    const triggersList = await sql`SELECT id, campaign_id, type, params FROM triggers`;
    console.table(triggersList);

    console.log('=== TARGETING RULES ===');
    const targetingList = await sql`SELECT id, campaign_id, kind, operator, value FROM targeting_rules`;
    console.table(targetingList);

    console.log('=== FREQUENCY RULES ===');
    const frequencyList = await sql`SELECT id, campaign_id, frequency FROM frequency_rules`;
    console.table(frequencyList);

  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await sql.end();
  }
}

main();
