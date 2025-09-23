import { LucideIcon } from "lucide-react";
export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
export type ClientStatus = 'active' | 'inactive' | 'archived';
export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  status: ClientStatus;
  createdAt: number;
}
export type ServiceCategory = 'SaaS' | 'IaaS' | 'Cybersecurity' | 'Creative' | 'Collaboration' | 'Development';
export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
}
export type SubscriptionStatus = 'active' | 'pending' | 'cancelled' | 'expired';
export type MonitoringStatus = 'ok' | 'issue' | 'degraded';
export interface Subscription {
  id: string;
  clientId: string;
  serviceId: string;
  plan: string;
  quantity: number;
  cost: number; // in cents to avoid floating point issues
  renewalDate: number; // timestamp
  status: SubscriptionStatus;
  monitoringStatus?: MonitoringStatus;
  usage?: number; // percentage
  isInternal?: boolean;
}
// Integrations
export type IntegrationStatus = 'connected' | 'not_connected' | 'error';
export interface IntegrationStep {
  title: string;
  description: string;
  fields?: {
    id: string;
    label: string;
    type: 'text' | 'password' | 'file';
    placeholder?: string;
  }[];
}
export interface Integration {
  id: string;
  name: string;
  description: string;
  logo: LucideIcon | ((props: any) => JSX.Element);
  status: IntegrationStatus;
  steps: IntegrationStep[];
}
export interface IntegrationState {
  id: string; // Corresponds to Integration.id
  status: IntegrationStatus;
  connectedAt?: number;
}
// Dashboard
export interface Activity {
  id: string;
  createdAt: number;
  description: string;
  type: string; // e.g., 'new_subscription', 'client_updated'
}
export interface DashboardStats {
  totalMrr: number; // in cents
  activeClients: number;
  upcomingRenewals: number;
  activeSubscriptionsCount: number;
  servicesWithIssues: number;
  mrrTrend: { name: string; mrr: number }[];
  recentActivity: Activity[];
}
// License Pools
export interface LicensePool {
  id: string;
  name: string;
  serviceId: string;
  totalSeats: number;
}
export interface LicenseAssignment {
  id: string;
  poolId: string;
  clientId: string;
  assignedSeats: number;
  assignedAt: number;
}