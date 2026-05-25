import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { tenants } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const UpdateTenantBody = z.object({
  name: z.string().min(1).max(100).optional(),
  plan: z.enum(['free', 'starter', 'growth', 'scale', 'agency']).optional(),
});

export const tenantRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/tenants
  fastify.get('/tenants', async (request, reply) => {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, request.tenantId),
    });

    if (!tenant) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }

    return reply.send({ data: [tenant] }); // Refine's useList expects an array
  });

  // PATCH /api/v1/tenants/:id
  fastify.patch<{ Params: { id: string } }>('/tenants/:id', async (request, reply) => {
    const body = UpdateTenantBody.parse(request.body);

    const [updated] = await db
      .update(tenants)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.plan !== undefined ? { plan: body.plan } : {}),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, request.params.id))
      .returning();

    if (!updated) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }

    return reply.send({ data: updated });
  });
};
