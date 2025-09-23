import { Hono } from "hono";
import type { Env } from './core-utils';
import { ClientEntity, ServiceEntity, SubscriptionEntity, IntegrationStateEntity, LicensePoolEntity, LicenseAssignmentEntity, ActivityEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Client, MonitoringStatus, Subscription, IntegrationState, LicensePool, LicenseAssignment, Service, Activity } from "@shared/types";
import { subDays } from "date-fns";
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
    const [clients, subscriptions, activities] = await Promise.all([
      ClientEntity.list(c.env).then(p => p.items),
      SubscriptionEntity.list(c.env).then(p => p.items),
      ActivityEntity.list(c.env).then(p => p.items),
    ]);
    const activeClients = clients.filter(client => client.status === 'active').length;
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active' && !sub.isInternal);
    const totalMrr = activeSubscriptions.reduce((sum, sub) => sum + sub.cost, 0);
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;
    const upcomingRenewals = subscriptions.filter(sub =>
      sub.renewalDate > now && sub.renewalDate <= thirtyDaysFromNow
    ).length;
    const servicesWithIssues = subscriptions.filter(sub => sub.monitoringStatus === 'issue' || sub.monitoringStatus === 'degraded').length;
    const mrrTrend = Array.from({ length: 6 }, (_, i) => {
      const date = subDays(new Date(), (5 - i) * 30);
      const month = date.toLocaleString('default', { month: 'short' });
      const randomFactor = 1 - (5 - i) * 0.05 + Math.random() * 0.1;
      const monthMrr = i === 5 ? totalMrr : totalMrr * randomFactor;
      return { name: month, mrr: Math.round(monthMrr / 100) };
    });
    const recentActivity = activities.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
    return ok(c, {
      totalMrr,
      activeClients,
      upcomingRenewals,
      activeSubscriptionsCount: activeSubscriptions.length,
      servicesWithIssues,
      mrrTrend,
      recentActivity,
    });
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
    const { status } = await c.req.json<{ status: IntegrationState['status'] }>();
    if (!status) return bad(c, 'Status is required');
    const stateEntity = new IntegrationStateEntity(c.env, id);
    const newState: IntegrationState = {
      id,
      status,
      connectedAt: status === 'connected' ? Date.now() : undefined,
    };
    if (await stateEntity.exists()) {
      await stateEntity.save(newState);
    } else {
      await IntegrationStateEntity.create(c.env, newState);
    }
    return ok(c, newState);
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