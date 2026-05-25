import postgres from 'postgres';

const sql = postgres('postgresql://scrollpop:scrollpop_dev@localhost:5433/scrollpop');

async function main() {
  try {
    const publicKey = 'a3e8630f904adceddc1d0553d7bcda0c';
    console.log('Querying site for key:', publicKey);

    const [site] = await sql`SELECT * FROM sites WHERE public_key = ${publicKey} AND deleted_at IS NULL`;
    if (!site) {
      console.log('Site not found');
      return;
    }
    console.log('Found site:', site.id, site.domain);

    const activeCampaigns = await sql`SELECT * FROM campaigns WHERE site_id = ${site.id} AND status = 'active' AND deleted_at IS NULL`;
    console.log('Active campaigns count:', activeCampaigns.length);

    for (const campaign of activeCampaigns) {
      console.log('Evaluating campaign:', campaign.id, campaign.name);
      const [design] = await sql`SELECT * FROM designs WHERE campaign_id = ${campaign.id}`;
      const campaignTriggers = await sql`SELECT * FROM triggers WHERE campaign_id = ${campaign.id}`;
      const targeting = await sql`SELECT * FROM targeting_rules WHERE campaign_id = ${campaign.id}`;
      const [freq] = await sql`SELECT * FROM frequency_rules WHERE campaign_id = ${campaign.id}`;

      console.log('Design config:', design ? 'FOUND' : 'MISSING', design?.config);
      console.log('Triggers:', campaignTriggers);
      console.log('Targeting:', targeting);
      console.log('Frequency:', freq);

      const campaignConfig = {
        id: campaign.id,
        design: design ? (typeof design.config === 'string' ? JSON.parse(design.config) : design.config) : null,
        triggers: campaignTriggers.map((t) => ({
          id: t.id,
          type: t.type,
          params: typeof t.params === 'string' ? JSON.parse(t.params) : t.params,
        })),
        targeting: targeting.map((r) => ({
          id: r.id,
          kind: r.kind,
          operator: r.operator,
          value: typeof r.value === 'string' ? JSON.parse(r.value) : r.value,
        })),
        frequency: { frequency: freq?.frequency ?? 'once_per_session' },
        affiliateSlots: design ? (typeof design.affiliate_slots === 'string' ? JSON.parse(design.affiliate_slots) : design.affiliate_slots) : [],
      };

      console.log('Mapped Campaign Config:', JSON.stringify(campaignConfig, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

main();
