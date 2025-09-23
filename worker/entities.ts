import { IndexedEntity } from "./core-utils";
import type { Client, Service, Subscription, IntegrationState, LicensePool, LicenseAssignment, Activity } from "@shared/types";
import { MOCK_CLIENTS, MOCK_SERVICES } from "@shared/mock-data";
export class ClientEntity extends IndexedEntity<Client> {
  static readonly entityName = "client";
  static readonly indexName = "clients";
  static readonly initialState: Client = { id: "", name: "", contactPerson: "", email: "", status: "inactive", createdAt: 0 };
  static seedData = MOCK_CLIENTS;
}
export class ServiceEntity extends IndexedEntity<Service> {
  static readonly entityName = "service";
  static readonly indexName = "services";
  static readonly initialState: Service = { id: "", name: "", category: "SaaS", description: "" };
  static seedData = MOCK_SERVICES;
}
export class SubscriptionEntity extends IndexedEntity<Subscription> {
  static readonly entityName = "subscription";
  static readonly indexName = "subscriptions";
  static readonly initialState: Subscription = {
    id: "",
    clientId: "",
    serviceId: "",
    plan: "",
    quantity: 0,
    cost: 0,
    renewalDate: 0,
    status: "pending",
    monitoringStatus: "ok",
    usage: 0,
    isInternal: false,
  };
  // No seed data for subscriptions initially
}
export class IntegrationStateEntity extends IndexedEntity<IntegrationState> {
  static readonly entityName = "integrationState";
  static readonly indexName = "integrationStates";
  static readonly initialState: IntegrationState = { id: "", status: "not_connected" };
}
export class LicensePoolEntity extends IndexedEntity<LicensePool> {
  static readonly entityName = "licensePool";
  static readonly indexName = "licensePools";
  static readonly initialState: LicensePool = { id: "", name: "", serviceId: "", totalSeats: 0 };
}
export class LicenseAssignmentEntity extends IndexedEntity<LicenseAssignment> {
  static readonly entityName = "licenseAssignment";
  static readonly indexName = "licenseAssignments";
  static readonly initialState: LicenseAssignment = { id: "", poolId: "", clientId: "", assignedSeats: 0, assignedAt: 0 };
}
export class ActivityEntity extends IndexedEntity<Activity> {
  static readonly entityName = "activity";
  static readonly indexName = "activities";
  static readonly initialState: Activity = { id: "", createdAt: 0, description: "", type: "" };
}