import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { tenants } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { PLAN_LIMITS, PLAN_PRICES_USD } from '@scrollpop/shared';

function getStripe(): Stripe {
  const key = process.env['STRIPE_SECRET_KEY'];
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

const CheckoutBody = z.object({
  plan: z.enum(['starter', 'growth']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const billingRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/billing/plans — available plans + current plan
  fastify.get('/billing/plans', async (request, reply) => {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, request.tenantId),
    });

    const plans = Object.entries(PLAN_LIMITS).map(([key, limits]) => ({
      id: key,
      priceUsd: PLAN_PRICES_USD[key as keyof typeof PLAN_PRICES_USD],
      monthlyViews: limits.monthlyViews,
      sites: limits.sites,
      showPoweredBy: limits.showPoweredBy,
      current: tenant?.plan === key,
    }));

    return reply.send({ data: { plans, currentPlan: tenant?.plan ?? 'free' } });
  });

  // POST /api/v1/billing/checkout — create Stripe Checkout session
  fastify.post('/billing/checkout', async (request, reply) => {
    const body = CheckoutBody.parse(request.body);
    const stripe = getStripe();

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, request.tenantId),
    });

    if (!tenant) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }

    const priceEnvKey = `STRIPE_PRICE_${body.plan.toUpperCase()}` as const;
    const priceId = process.env[priceEnvKey];

    if (!priceId) {
      return reply.code(500).send({
        error: { code: 'CONFIG_ERROR', message: `Stripe price not configured for plan: ${body.plan}` },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(tenant.stripeCustomerId ? { customer: tenant.stripeCustomerId } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      metadata: { tenantId: tenant.id },
    });

    return reply.send({ data: { url: session.url } });
  });

  // POST /api/v1/billing/portal — create Stripe Customer Portal session
  fastify.post('/billing/portal', async (request, reply) => {
    const body = z.object({ returnUrl: z.string().url() }).parse(request.body);
    const stripe = getStripe();

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, request.tenantId),
    });

    if (!tenant?.stripeCustomerId) {
      return reply.code(400).send({
        error: { code: 'NO_SUBSCRIPTION', message: 'No Stripe customer found. Please subscribe first.' },
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: body.returnUrl,
    });

    return reply.send({ data: { url: session.url } });
  });

  // GET /api/v1/billing/usage — current month view count vs. limit
  fastify.get('/billing/usage', async (request, reply) => {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, request.tenantId),
    });

    if (!tenant) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }

    // TODO (Step 8): Query TimescaleDB for actual view count this month
    // For now return the limit info so the dashboard can render the usage meter
    return reply.send({
      data: {
        plan: tenant.plan,
        monthlyViewLimit: tenant.monthlyViewLimit,
        currentMonthViews: 0, // populated in Step 8
        periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
      },
    });
  });
};
