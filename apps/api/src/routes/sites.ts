import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { sites } from '../db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';

const CreateSiteBody = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().url().or(z.string().regex(/^[a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/)),
  platform: z.enum(['wordpress', 'shopify', 'html', 'donorbox', 'gofundme', 'other']).default('html'),
});

const UpdateSiteBody = z.object({
  name: z.string().min(1).max(100).optional(),
  platform: z.enum(['wordpress', 'shopify', 'html', 'donorbox', 'gofundme', 'other']).optional(),
});

export const siteRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/sites
  fastify.get('/sites', async (request, reply) => {
    const tenantSites = await db.query.sites.findMany({
      where: and(eq(sites.tenantId, request.tenantId), isNull(sites.deletedAt)),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });
    return reply.send({ data: tenantSites });
  });

  // POST /api/v1/sites
  fastify.post('/sites', async (request, reply) => {
    const body = CreateSiteBody.parse(request.body);

    // Normalize domain: strip protocol, trailing slash
    const domain = body.domain
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .toLowerCase();

    // Check if domain is already registered for this tenant
    const existing = await db.query.sites.findFirst({
      where: and(eq(sites.tenantId, request.tenantId), eq(sites.domain, domain)),
    });

    if (existing) {
      if (existing.deletedAt) {
        // Domain was previously soft-deleted — reactivate it!
        const [reactivated] = await db
          .update(sites)
          .set({
            name: body.name,
            platform: body.platform,
            deletedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(sites.id, existing.id))
          .returning();
        return reply.code(201).send({ data: reactivated });
      } else {
        // Domain is active
        return reply.code(409).send({
          error: { code: 'DUPLICATE_DOMAIN', message: 'This domain is already registered.' },
        });
      }
    }

    const [site] = await db
      .insert(sites)
      .values({
        tenantId: request.tenantId,
        name: body.name,
        domain,
        platform: body.platform,
      })
      .returning();

    return reply.code(201).send({ data: site });
  });

  // GET /api/v1/sites/:id
  fastify.get<{ Params: { id: string } }>('/sites/:id', async (request, reply) => {
    const site = await db.query.sites.findFirst({
      where: and(
        eq(sites.id, request.params.id),
        eq(sites.tenantId, request.tenantId),
        isNull(sites.deletedAt)
      ),
    });

    if (!site) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    return reply.send({ data: site });
  });

  // PATCH /api/v1/sites/:id
  fastify.patch<{ Params: { id: string } }>('/sites/:id', async (request, reply) => {
    const body = UpdateSiteBody.parse(request.body);

    const [updated] = await db
      .update(sites)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.platform !== undefined ? { platform: body.platform } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(sites.id, request.params.id), eq(sites.tenantId, request.tenantId)))
      .returning();

    if (!updated) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    return reply.send({ data: updated });
  });

  // DELETE /api/v1/sites/:id (soft delete)
  fastify.delete<{ Params: { id: string } }>('/sites/:id', async (request, reply) => {
    const [deleted] = await db
      .update(sites)
      .set({ deletedAt: new Date() })
      .where(and(eq(sites.id, request.params.id), eq(sites.tenantId, request.tenantId)))
      .returning();

    if (!deleted) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    }
    return reply.code(200).send({ data: deleted });
  });

  // GET /api/v1/sites/:id/snippet — returns the install snippet HTML
  fastify.get<{ Params: { id: string } }>('/sites/:id/snippet', async (request, reply) => {
    const site = await db.query.sites.findFirst({
      where: and(
        eq(sites.id, request.params.id),
        eq(sites.tenantId, request.tenantId),
        isNull(sites.deletedAt)
      ),
    });

    if (!site) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Site not found' } });

    const cdnUrl = process.env['SNIPPET_CDN_URL'] ?? 'https://cdn.scrollpop.io';

    const snippetHtml = `<!-- ScrollPop -->
<script>
(function(w,d,s){
  var p=w.__sp=w.__sp||{q:[],identify:function(v){p.q.push(['identify',v])},loaded:false};
  if(p.loaded)return; p.loaded=true;
  var el=d.createElement(s); el.async=true; el.defer=true;
  el.src='${cdnUrl}/v1/${site.publicKey}/p.js';
  d.head.appendChild(el);
})(window,document,'script');
</script>
<!-- End ScrollPop -->`;

    return reply.send({
      data: {
        publicKey: site.publicKey,
        platform: site.platform,
        snippetHtml,
        installInstructions: getInstallInstructions(site.platform, site.publicKey, cdnUrl),
      },
    });
  });

  // POST /api/v1/sites/:id/verify
  fastify.post<{ Params: { id: string } }>('/sites/:id/verify', async (request, reply) => {
    const site = await db.query.sites.findFirst({
      where: and(
        eq(sites.id, request.params.id),
        eq(sites.tenantId, request.tenantId),
        isNull(sites.deletedAt)
      ),
    });

    if (!site) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Site not found' } });

    const [updated] = await db
      .update(sites)
      .set({ verifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(sites.id, site.id))
      .returning();

    if (!updated) {
      return reply.code(500).send({ error: { code: 'UPDATE_FAILED', message: 'Failed to verify site' } });
    }

    return reply.send({ 
      data: { 
        verified: true, 
        verifiedAt: updated.verifiedAt, 
        message: 'Site successfully verified in Local Development!' 
      } 
    });
  });
};

function getInstallInstructions(
  platform: string,
  publicKey: string,
  cdnUrl: string
): Record<string, string> {
  const stub = `<script>
(function(w,d,s){
  var p=w.__sp=w.__sp||{q:[],identify:function(v){p.q.push(['identify',v])},loaded:false};
  if(p.loaded)return; p.loaded=true;
  var el=d.createElement(s); el.async=true; el.defer=true;
  el.src='${cdnUrl}/v1/${publicKey}/p.js';
  d.head.appendChild(el);
})(window,document,'script');
</script>`;

  return {
    html: `Paste this snippet inside <head> on every page:\n\n${stub}`,
    wordpress: `Install the ScrollPop WordPress plugin, then go to Settings → ScrollPop and enter your Site Public Key: ${publicKey}`,
    shopify: `In your Shopify admin: Online Store → Themes → Customize → App Embeds → Enable ScrollPop. Your Site Key: ${publicKey}`,
    gtm: `In Google Tag Manager, create a new Custom HTML tag with the snippet above. Set trigger to "All Pages".`,
  };
}
