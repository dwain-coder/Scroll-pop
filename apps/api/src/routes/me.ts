import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import { users, tenants, tenantMembers } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const meRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/me — returns current user + tenant context
  fastify.get('/me', async (request, reply) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.userId),
    });

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, request.tenantId),
    });

    const membership = await db.query.tenantMembers.findFirst({
      where: and(
        eq(tenantMembers.tenantId, request.tenantId),
        eq(tenantMembers.userId, request.userId)
      ),
    });

    if (!user || !tenant || !membership) {
      return reply.code(404).send({
        error: { code: 'NOT_FOUND', message: 'User or tenant not found' },
      });
    }

    return reply.send({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          monthlyViewLimit: tenant.monthlyViewLimit,
        },
        role: membership.role,
      },
    });
  });
};
