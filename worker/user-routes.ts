import { Hono } from "hono";
import type { Env } from './core-utils';
import { ClientEntity, ServiceEntity, SubscriptionEntity, IntegrationStateEntity, LicensePoolEntity, LicenseAssignmentEntity, ActivityEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Client, MonitoringStatus, Subscription, IntegrationState, LicensePool, LicenseAssignment, Service, Activity, MicrosoftSku, MicrosoftSyncSummary, InternalSubscriptionSummary, DashboardStats } from "@shared/types";
import { subDays } from "date-fns";
import { graphFetch, graphFetchAll } from "./microsoft-graph";
async function createActivity(env: Env, type: string, description: string) {
  const activity: Activity = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    type,
    description,
  };
  await ActivityEntity.create(env, activity);
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Ensure seed data is loaded on first request
  app.use('/api/*', async (c, next) => {
    await Promise.all([
      ClientEntity.ensureSeed(c.env),
      ServiceEntity.ensureSeed(c.env),
    ]);
    await next();
  });
  // CLIENTS API
  app.get('/api/clients', async (c) => {
    const page = await ClientEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/clients', async (c) => {
    const { name, contactPerson, email, status } = await c.req.json<Partial<Client>>();
    if (!isStr(name) || !isStr(contactPerson) || !isStr(email)) {
      return bad(c, 'name, contactPerson, and email are required');
    }
    const newClient: Client = {
      id: crypto.randomUUID(),
      name,
      contactPerson,
      email,
      status: status || 'active',
      createdAt: Date.now(),
    };
    const client = await ClientEntity.create(c.env, newClient);
    await createActivity(c.env, 'client_created', `New client added: ${client.name}`);
    return ok(c, client);
  });
  app.get('/api/clients/:id', async (c) => {
    const { id } = c.req.param();
    const client = new ClientEntity(c.env, id);
    if (!await client.exists()) return notFound(c, 'Client not found');
    return ok(c, await client.getState());
  });
  app.put('/api/clients/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<Client>>();
    const clientEntity = new ClientEntity(c.env, id);
    if (!await clientEntity.exists()) return notFound(c, 'Client not found');
    const updatedClient = await clientEntity.mutate(current => ({ ...current, ...updates, id: current.id, createdAt: current.createdAt }));
    await createActivity(c.env, 'client_updated', `Client details updated for ${updatedClient.name}`);
    return ok(c, updatedClient);
  });
  app.delete('/api/clients/:id', async (c) => {
    const { id } = c.req.param();
    const clientEntity = new ClientEntity(c.env, id);
    if (!await clientEntity.exists()) return notFound(c, 'Client not found');
    const client = await clientEntity.getState();
    const deleted = await ClientEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Client not found');
    await createActivity(c.env, 'client_deleted', `Client removed: ${client.name}`);
    return ok(c, { id, deleted });
  });
  // SERVICES API
  app.get('/api/services', async (c) => {
    const page = await ServiceEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/services', async (c) => {
    const body = await c.req.json<Omit<Service, 'id'>>();
    const newService: Service = { id: crypto.randomUUID(), ...body };
    const service = await ServiceEntity.create(c.env, newService);
    await createActivity(c.env, 'service_created', `New service added: ${service.name}`);
    return ok(c, service);
  });
  app.put('/api/services/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<Service>>();
    const serviceEntity = new ServiceEntity(c.env, id);
    if (!await serviceEntity.exists()) return notFound(c, 'Service not found');
    const updated = await serviceEntity.mutate(current => ({ ...current, ...updates, id: current.id }));
    await createActivity(c.env, 'service_updated', `Service updated: ${updated.name}`);
    return ok(c, updated);
  });
  app.delete('/api/services/:id', async (c) => {
    const { id } = c.req.param();
    const serviceEntity = new ServiceEntity(c.env, id);
    if (!await serviceEntity.exists()) return notFound(c, 'Service not found');
    const service = await serviceEntity.getState();
    const deleted = await ServiceEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Service not found');
    await createActivity(c.env, 'service_deleted', `Service removed: ${service.name}`);
    return ok(c, { id, deleted });
  });
  // SUBSCRIPTIONS API
  app.get('/api/subscriptions', async (c) => {
    const page = await SubscriptionEntity.list(c.env);
    return ok(c, page.items);
  });
  app.get('/api/clients/:clientId/subscriptions', async (c) => {
    const { clientId } = c.req.param();
    const allSubscriptions = (await SubscriptionEntity.list(c.env)).items;
    const clientSubscriptions = allSubscriptions.filter(sub => sub.clientId === clientId && !sub.isInternal);
    return ok(c, clientSubscriptions);
  });
  app.post('/api/subscriptions', async (c) => {
    const body = await c.req.json<Omit<Subscription, 'id'>>();
    const newSubscription: Subscription = {
      id: crypto.randomUUID(),
      ...body,
      isInternal: false,
      monitoringStatus: 'ok',
      usage: Math.floor(Math.random() * 101),
    };
    const subscription = await SubscriptionEntity.create(c.env, newSubscription);
    const [client, service] = await Promise.all([
      new ClientEntity(c.env, subscription.clientId).getState(),
      new ServiceEntity(c.env, subscription.serviceId).getState(),
    ]);
    await createActivity(c.env, 'subscription_created', `New subscription for ${service.name} added to ${client.name}`);
    return ok(c, subscription);
  });
  app.get('/api/subscriptions/:id', async (c) => {
    const { id } = c.req.param();
    const sub = new SubscriptionEntity(c.env, id);
    if (!await sub.exists()) return notFound(c, 'Subscription not found');
    return ok(c, await sub.getState());
  });
  app.put('/api/subscriptions/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<Subscription>>();
    const subEntity = new SubscriptionEntity(c.env, id);
    if (!await subEntity.exists()) return notFound(c, 'Subscription not found');
    const updatedSub = await subEntity.mutate(current => ({ ...current, ...updates, id: current.id, clientId: current.clientId, serviceId: current.serviceId, isInternal: current.isInternal }));
    return ok(c, updatedSub);
  });
  app.delete('/api/subscriptions/:id', async (c) => {
    const { id } = c.req.param();
    const subEntity = new SubscriptionEntity(c.env, id);
    if (!await subEntity.exists()) return notFound(c, 'Subscription not found');
    const sub = await subEntity.getState();
    const deleted = await SubscriptionEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Subscription not found');
    const [client, service] = await Promise.all([
      new ClientEntity(c.env, sub.clientId).getState(),
      new ServiceEntity(c.env, sub.serviceId).getState(),
    ]);
    await createActivity(c.env, 'subscription_deleted', `Subscription for ${service.name} removed from ${client.name}`);
    return ok(c, { id, deleted });
  });
  app.post('/api/subscriptions/:id/sync', async (c) => {
    const { id } = c.req.param();
    const subEntity = new SubscriptionEntity(c.env, id);
    if (!await subEntity.exists()) return notFound(c, 'Subscription not found');
    const statuses: MonitoringStatus[] = ['ok', 'issue', 'degraded'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomUsage = Math.floor(Math.random() * 101);
    const updatedSub = await subEntity.mutate(current => ({
      ...current,
      monitoringStatus: randomStatus,
      usage: randomUsage,
    }));
    return ok(c, updatedSub);
  });
  // INTERNAL SUBSCRIPTIONS API
  app.get('/api/internal-subscriptions', async (c) => {
    const allSubscriptions = (await SubscriptionEntity.list(c.env)).items;
    const internalSubscriptions = allSubscriptions.filter(sub => sub.isInternal);
    return ok(c, internalSubscriptions);
  });
  app.get('/api/internal-subscriptions/summary', async (c) => {
    const [servicesResult, subscriptionsResult, poolsResult, assignmentsResult] = await Promise.all([
      ServiceEntity.list(c.env),
      SubscriptionEntity.list(c.env),
      LicensePoolEntity.list(c.env),
      LicenseAssignmentEntity.list(c.env),
    ]);
    const services = servicesResult.items;
    const subscriptions = subscriptionsResult.items.filter(sub => sub.isInternal);
    const pools = poolsResult.items.filter(pool => pool.id.startsWith('m365-'));
    const assignments = assignmentsResult.items;
    const servicesById = new Map(services.map(service => [service.id, service]));
    let assignedLicenses = 0;
    let nextRenewalDate: number | null = null;
    let nextPaymentAmount = 0;
    const currency = 'USD';
    const serviceItems: InternalSubscriptionSummary['services'] = subscriptions.map(sub => {
      assignedLicenses += sub.quantity;
      nextPaymentAmount += sub.cost;
      if (nextRenewalDate === null || sub.renewalDate < nextRenewalDate) {
        nextRenewalDate = sub.renewalDate;
      }
      const service = servicesById.get(sub.serviceId);
      return {
        id: sub.id,
        serviceId: sub.serviceId,
        serviceName: service?.name ?? 'Unknown Service',
        plan: sub.plan,
        quantity: sub.quantity,
        cost: sub.cost,
        renewalDate: sub.renewalDate,
        status: sub.status,
        monitoringStatus: sub.monitoringStatus,
        usage: sub.usage,
      };
    });
    const assignmentsByPool = assignments.reduce((acc, assignment) => {
      acc[assignment.poolId] = (acc[assignment.poolId] || 0) + assignment.assignedSeats;
      return acc;
    }, {} as Record<string, number>);
    const licensePoolItems: InternalSubscriptionSummary['licensePools'] = pools.map(pool => {
      const service = servicesById.get(pool.serviceId);
      return {
        id: pool.id,
        name: pool.name,
        serviceId: pool.serviceId,
        serviceName: service?.name ?? 'Unknown Service',
        totalSeats: pool.totalSeats,
        assignedSeats: assignmentsByPool[pool.id] || 0,
      };
    });
    const integrationState = new IntegrationStateEntity(c.env, 'microsoft-365');
    let graphSummary: MicrosoftSyncSummary | null = null;
    if (await integrationState.exists()) {
      const state = await integrationState.getState();
      if (state.config && typeof state.config === 'object' && 'summary' in state.config) {
        const summary = (state.config as { summary?: MicrosoftSyncSummary }).summary;
        graphSummary = summary ?? null;
      }
    }
    const summary: InternalSubscriptionSummary = {
      activeProducts: serviceItems.length,
      assignedLicenses,
      nextRenewalDate,
      nextPaymentAmount,
      currency,
      services: serviceItems,
      licensePools: licensePoolItems,
      graphSummary,
    };
    return ok(c, summary);
  });
  app.post('/api/internal-subscriptions', async (c) => {
    const body = await c.req.json<Omit<Subscription, 'id' | 'clientId'>>();
    const newSubscription: Subscription = {
      id: crypto.randomUUID(),
      ...body,
      clientId: 'internal', // Use a placeholder or empty string
      isInternal: true,
      monitoringStatus: 'ok',
      usage: Math.floor(Math.random() * 101),
    };
    const subscription = await SubscriptionEntity.create(c.env, newSubscription);
    return ok(c, subscription);
  });
  // DASHBOARD API
  app.get('/api/dashboard-stats', async (c) => {
    const [clients, subscriptions, activities, services, pools, assignments] = await Promise.all([
      ClientEntity.list(c.env).then(p => p.items),
      SubscriptionEntity.list(c.env).then(p => p.items),
      ActivityEntity.list(c.env).then(p => p.items),
      ServiceEntity.list(c.env).then(p => p.items),
      LicensePoolEntity.list(c.env).then(p => p.items),
      LicenseAssignmentEntity.list(c.env).then(p => p.items),
    ]);
    
    const activeClients = clients.filter(client => client.status === 'active').length;
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active' && !sub.isInternal);
    const internalSubscriptions = subscriptions.filter(sub => sub.status === 'active' && sub.isInternal);
    const totalMrr = activeSubscriptions.reduce((sum, sub) => sum + sub.cost, 0);
    
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;
    const upcomingRenewals = subscriptions.filter(sub =>
      sub.renewalDate > now && sub.renewalDate <= thirtyDaysFromNow
    ).length;
    
    const servicesWithIssues = subscriptions.filter(sub => sub.monitoringStatus === 'issue' || sub.monitoringStatus === 'degraded').length;
    
    // Calculate total seats managed
    const totalSeatsManaged = assignments.reduce((sum, assignment) => sum + assignment.assignedSeats, 0);
    
    // Calculate internal vs external subscriptions
    const internalVsExternalSplit = {
      internal: internalSubscriptions.length,
      external: activeSubscriptions.length,
    };
    
    // Calculate top services by client count and seats
    const serviceStats = new Map<string, { clientCount: Set<string>; totalSeats: number }>();
    
    for (const sub of subscriptions) {
      if (sub.status === 'active') {
        const stats = serviceStats.get(sub.serviceId) || { clientCount: new Set(), totalSeats: 0 };
        if (sub.clientId !== 'internal') {
          stats.clientCount.add(sub.clientId);
        }
        stats.totalSeats += sub.quantity;
        serviceStats.set(sub.serviceId, stats);
      }
    }
    
    const topServices = Array.from(serviceStats.entries())
      .map(([serviceId, stats]) => ({
        serviceId,
        serviceName: services.find(s => s.id === serviceId)?.name || 'Unknown',
        clientCount: stats.clientCount.size,
        totalSeats: stats.totalSeats,
      }))
      .sort((a, b) => b.clientCount - a.clientCount)
      .slice(0, 5);
    
    // Calculate license utilization
    const totalAvailable = pools.reduce((sum, pool) => sum + pool.totalSeats, 0);
    const licenseUtilization = totalAvailable > 0 ? Math.round((totalSeatsManaged / totalAvailable) * 100) : 0;
    
    const mrrTrend = Array.from({ length: 6 }, (_, i) => {
      const date = subDays(new Date(), (5 - i) * 30);
      const month = date.toLocaleString('default', { month: 'short' });
      const randomFactor = 1 - (5 - i) * 0.05 + Math.random() * 0.1;
      const monthMrr = i === 5 ? totalMrr : totalMrr * randomFactor;
      return { name: month, mrr: Math.round(monthMrr / 100) };
    });
    
    const recentActivity = activities.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
    
    const stats: DashboardStats = {
      totalMrr,
      activeClients,
      upcomingRenewals,
      activeSubscriptionsCount: activeSubscriptions.length,
      servicesWithIssues,
      mrrTrend,
      recentActivity,
      totalSeatsManaged,
      internalVsExternalSplit,
      topServices,
      licenseUtilization,
    };
    
    return ok(c, stats);
  });
  // INTEGRATIONS API
  app.get('/api/integration-states', async (c) => {
    const page = await IntegrationStateEntity.list(c.env);
    return ok(c, page.items);
  });
  app.get('/api/integration-states/:id', async (c) => {
    const { id } = c.req.param();
    const state = new IntegrationStateEntity(c.env, id);
    if (!await state.exists()) return ok(c, { id, status: 'not_connected' });
    return ok(c, await state.getState());
  });
  app.post('/api/integration-states/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json<Partial<IntegrationState>>();
    if (!body.status) return bad(c, 'Status is required');
    const stateEntity = new IntegrationStateEntity(c.env, id);
    if (await stateEntity.exists()) {
      const updated = await stateEntity.mutate(current => ({
        ...current,
        id,
        status: body.status!,
        connectedAt: body.status === 'connected' ? current.connectedAt ?? Date.now() : current.connectedAt,
        lastSyncedAt: body.lastSyncedAt ?? current.lastSyncedAt,
        config: body.config ? { ...current.config, ...body.config } : current.config,
      }));
      return ok(c, updated);
    }
    const newState: IntegrationState = {
      id,
      status: body.status,
      connectedAt: body.status === 'connected' ? Date.now() : undefined,
      config: body.config,
      lastSyncedAt: body.lastSyncedAt,
    };
    await IntegrationStateEntity.create(c.env, newState);
    return ok(c, newState);
  });
  // Microsoft 365 integration helper endpoints
  app.get('/api/integrations/m365/status', async (c) => {
    const entity = new IntegrationStateEntity(c.env, 'microsoft-365');
    const exists = await entity.exists();
    if (!exists) {
      return ok(c, { status: 'not_connected', lastSyncedAt: null, summary: null });
    }
    const state = await entity.getState();
    const summary = (state.config && typeof state.config === 'object' && 'summary' in state.config)
      ? (state.config as { summary?: MicrosoftSyncSummary }).summary ?? null
      : null;
    return ok(c, { status: state.status, lastSyncedAt: state.lastSyncedAt ?? null, summary });
  });

  app.post('/api/integrations/m365/test', async (c) => {
    try {
      const skuResponse = await graphFetch<{ value: unknown[] }>(c.env, '/subscribedSkus');
      return ok(c, { success: true, skuCount: skuResponse.value?.length ?? 0 });
    } catch (error) {
      console.error('[M365 TEST] Failed to reach Microsoft Graph', error);
      return bad(c, error instanceof Error ? error.message : 'Failed to reach Microsoft Graph');
    }
  });

  app.post('/api/integrations/m365/sync', async (c) => {
    const entity = new IntegrationStateEntity(c.env, 'microsoft-365');
    try {
      const stateEntity = new IntegrationStateEntity(c.env, 'microsoft-365');
      const existingState = await stateEntity.exists() ? await stateEntity.getState() : undefined;
      const defaultCost = existingState?.config && typeof existingState.config === 'object' && 'defaultSeatCost' in existingState.config
        ? Number((existingState.config as Record<string, unknown>).defaultSeatCost)
        : undefined;
      const [skus, users] = await Promise.all([
        graphFetchAll<MicrosoftSku>(c.env, '/subscribedSkus'),
        graphFetchAll<{ id: string; displayName?: string; mail?: string; assignedLicenses?: { skuId?: string | null }[] }>(c.env, '/users?$select=id,displayName,mail,assignedLicenses'),
      ]);
      const skuMap = new Map<string, MicrosoftSku>();
      for (const sku of skus) {
        if (sku.skuId) {
          skuMap.set(sku.skuId, sku);
        }
      }
      const clients = await ClientEntity.list(c.env).then(p => p.items);
      const services = await ServiceEntity.list(c.env).then(p => p.items);
      const subscriptions = await SubscriptionEntity.list(c.env).then(p => p.items);
      const licenseAssignments = await LicenseAssignmentEntity.list(c.env).then(p => p.items);
      const pools = await LicensePoolEntity.list(c.env).then(p => p.items);

      const clientsByEmail = new Map<string, Client>();
      const clientsById = new Map<string, Client>();
      for (const client of clients) {
        clientsById.set(client.id, client);
        if (client.email) {
          clientsByEmail.set(client.email.toLowerCase(), client);
        }
      }

      const serviceBySku = new Map<string, Service>();
      const serviceById = new Map<string, Service>();
      for (const service of services) {
        serviceById.set(service.id, service);
        const parts = service.id.split(':');
        if (parts.length === 2 && parts[0] === 'm365Sku') {
          serviceBySku.set(parts[1], service);
        }
      }

      const poolById = new Map<string, LicensePool>(pools.map(pool => [pool.id, pool]));
      const assignmentSet = new Set(licenseAssignments.map(a => `${a.clientId}:${a.poolId}`));
      const subscriptionByKey = new Map<string, Subscription>(subscriptions.map(sub => [`${sub.clientId}:${sub.serviceId}`, sub]));

      const updatedClients: Client[] = [];
      const newSubscriptions: Subscription[] = [];
      const newAssignments: LicenseAssignment[] = [];
      const subscriptionSeatCounts = new Map<string, number>();

      for (const user of users) {
        const email = (user.mail ?? `${user.id}@unknown`).toLowerCase();
        let client = clientsByEmail.get(email);
        if (!client) {
          const name = user.displayName ?? user.mail ?? `User ${user.id}`;
          const newClient: Client = {
            id: `m365-${user.id}`,
            name,
            contactPerson: name,
            email,
            status: 'active',
            createdAt: Date.now(),
          };
          await ClientEntity.create(c.env, newClient);
          clients.push(newClient);
          clientsByEmail.set(email, newClient);
          clientsById.set(newClient.id, newClient);
          updatedClients.push(newClient);
          client = newClient;
        }
        if (!client) continue;

        const assigned = user.assignedLicenses ?? [];
        for (const license of assigned) {
          const skuId = license.skuId ?? undefined;
          if (!skuId) continue;
          const service = serviceBySku.get(skuId);
          const serviceId = service ? service.id : `m365Sku:${skuId}`;
          let resolvedService = service;
          if (!resolvedService) {
            resolvedService = await ServiceEntity.create(c.env, {
              id: serviceId,
              name: skuMap.get(skuId)?.skuPartNumber ?? `Microsoft 365 SKU ${skuId}`,
              category: 'SaaS',
              description: 'Imported from Microsoft 365',
            });
            serviceBySku.set(skuId, resolvedService);
            serviceById.set(resolvedService.id, resolvedService);
            await createActivity(c.env, 'service_created', `Microsoft 365 SKU added: ${resolvedService.name}`);
          }

          const poolId = `m365-${skuId}`;
          let pool = poolById.get(poolId);
          const enabledUnits = skuMap.get(skuId)?.prepaidUnits?.enabled ?? skuMap.get(skuId)?.consumedUnits ?? 0;
          if (!pool) {
            pool = {
              id: poolId,
              name: skuMap.get(skuId)?.skuPartNumber ?? `Microsoft SKU ${skuId}`,
              serviceId: resolvedService.id,
              totalSeats: enabledUnits,
            };
            await LicensePoolEntity.create(c.env, pool);
            poolById.set(poolId, pool);
          } else {
            const poolEntity = new LicensePoolEntity(c.env, poolId);
            await poolEntity.mutate(current => ({
              ...current,
              serviceId: resolvedService!.id,
              totalSeats: enabledUnits,
            }));
          }

          const assignmentKey = `${client.id}:${poolId}`;
          if (!assignmentSet.has(assignmentKey)) {
            const assignment: LicenseAssignment = {
              id: `m365-${client.id}-${skuId}`,
              poolId,
              clientId: client.id,
              assignedSeats: 1,
              assignedAt: Date.now(),
            };
            await LicenseAssignmentEntity.create(c.env, assignment);
            assignmentSet.add(assignmentKey);
            newAssignments.push(assignment);
          }

          const subscriptionKey = `${client.id}:${resolvedService.id}`;
          subscriptionSeatCounts.set(subscriptionKey, (subscriptionSeatCounts.get(subscriptionKey) ?? 0) + 1);
        }
      }

      for (const [subscriptionKey, quantity] of subscriptionSeatCounts) {
        const [clientId, serviceId] = subscriptionKey.split(':');
        const existing = subscriptionByKey.get(subscriptionKey);
        if (existing) {
          const subEntity = new SubscriptionEntity(c.env, existing.id);
          await subEntity.mutate(current => ({
            ...current,
            quantity,
            status: 'active',
            isInternal: current.isInternal ?? false,
          }));
        } else {
          const newSubscription: Subscription = {
            id: crypto.randomUUID(),
            clientId,
            serviceId,
            plan: serviceById.get(serviceId)?.name ?? 'Microsoft 365 License',
            quantity,
            cost: 0,
            renewalDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
            status: 'active',
            monitoringStatus: 'ok',
            usage: 0,
            isInternal: false,
          };
          await SubscriptionEntity.create(c.env, newSubscription);
          subscriptionByKey.set(subscriptionKey, newSubscription);
          newSubscriptions.push(newSubscription);
        }
      }
      if (updatedClients.length) {
        await createActivity(c.env, 'client_created', `${updatedClients.length} Microsoft 365 users imported`);
      }
      if (newSubscriptions.length) {
        await createActivity(c.env, 'subscription_created', `${newSubscriptions.length} Microsoft 365 subscriptions created`);
      }
      const syncTime = Date.now();
      const totalAssignedLicenses = Array.from(subscriptionSeatCounts.values()).reduce((acc, qty) => acc + qty, 0);
      const activeProducts = subscriptionSeatCounts.size;
      const defaultSeatCost = Number.isFinite(defaultCost) ? Number(defaultCost) : 0;
      const nextRenewalDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const nextPaymentAmount = totalAssignedLicenses * defaultSeatCost;

      const summary: MicrosoftSyncSummary = {
        totalUsers: users.length,
        totalNewClients: updatedClients.length,
        totalSubscriptions: subscriptionSeatCounts.size,
        totalAssignedLicenses,
        activeProducts,
        nextRenewalDate,
        nextPaymentAmount,
        currency: 'USD',
        skuSummary: skus
          .filter(sku => sku.skuId)
          .map(sku => ({
            skuId: sku.skuId!,
            skuPartNumber: sku.skuPartNumber,
            availableUnits: sku.prepaidUnits?.enabled ?? 0,
            consumedUnits: sku.consumedUnits,
            serviceId: serviceBySku.get(sku.skuId!)?.id ?? `m365Sku:${sku.skuId}`,
          })),
      };
      const updatedState = await entity.mutate(current => ({
        ...current,
        id: 'microsoft-365',
        status: 'connected',
        lastSyncedAt: syncTime,
        connectedAt: current.connectedAt ?? syncTime,
        config: { ...(current.config ?? {}), summary },
      }));
      return ok(c, {
        syncedAt: syncTime,
        skuCount: skus.length,
        userCount: users.length,
        newClients: updatedClients.length,
        summary,
        state: updatedState,
      });
    } catch (error) {
      console.error('[M365 SYNC] Failed', error);
      return bad(c, error instanceof Error ? error.message : 'Failed to sync Microsoft 365 data');
    }
  });
  // LICENSE POOLS API
  app.get('/api/license-pools', async (c) => {
    const pools = await LicensePoolEntity.list(c.env);
    const assignments = await LicenseAssignmentEntity.list(c.env);
    const assignmentsByPool = assignments.items.reduce((acc, assignment) => {
      acc[assignment.poolId] = (acc[assignment.poolId] || 0) + assignment.assignedSeats;
      return acc;
    }, {} as Record<string, number>);
    const data = pools.items.map(pool => ({
      ...pool,
      assignedSeats: assignmentsByPool[pool.id] || 0,
    }));
    return ok(c, data);
  });
  app.post('/api/license-pools', async (c) => {
    const body = await c.req.json<Omit<LicensePool, 'id'>>();
    const newPool: LicensePool = { id: crypto.randomUUID(), ...body };
    const pool = await LicensePoolEntity.create(c.env, newPool);
    return ok(c, pool);
  });
  app.put('/api/license-pools/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<LicensePool>>();
    const poolEntity = new LicensePoolEntity(c.env, id);
    if (!await poolEntity.exists()) return notFound(c, 'Pool not found');
    const updatedPool = await poolEntity.mutate(current => ({ ...current, ...updates, id: current.id }));
    return ok(c, updatedPool);
  });
  app.delete('/api/license-pools/:id', async (c) => {
    const { id } = c.req.param();
    const deleted = await LicensePoolEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Pool not found');
    return ok(c, { id, deleted });
  });
  // LICENSE ASSIGNMENTS API
  app.get('/api/clients/:clientId/license-assignments', async (c) => {
    const { clientId } = c.req.param();
    const allAssignments = (await LicenseAssignmentEntity.list(c.env)).items;
    const clientAssignments = allAssignments.filter(a => a.clientId === clientId);
    return ok(c, clientAssignments);
  });
  app.post('/api/license-assignments', async (c) => {
    const body = await c.req.json<Omit<LicenseAssignment, 'id' | 'assignedAt'>>();
    const newAssignment: LicenseAssignment = { id: crypto.randomUUID(), ...body, assignedAt: Date.now() };
    const assignment = await LicenseAssignmentEntity.create(c.env, newAssignment);
    return ok(c, assignment);
  });
  app.put('/api/license-assignments/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<LicenseAssignment>>();
    const assignmentEntity = new LicenseAssignmentEntity(c.env, id);
    if (!await assignmentEntity.exists()) return notFound(c, 'Assignment not found');
    const updated = await assignmentEntity.mutate(current => ({ ...current, ...updates, id: current.id }));
    return ok(c, updated);
  });
  app.delete('/api/license-assignments/:id', async (c) => {
    const { id } = c.req.param();
    const deleted = await LicenseAssignmentEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Assignment not found');
    return ok(c, { id, deleted });
  });
}