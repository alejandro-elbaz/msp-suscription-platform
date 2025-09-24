import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { Subscription, Service, InternalSubscriptionSummary } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw, Cloud, AlertCircle, CheckCircle } from "lucide-react";
import { SubscriptionDataTable } from "@/components/subscriptions/SubscriptionDataTable";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export default function InternalSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [summary, setSummary] = useState<InternalSubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [subscriptionsData, servicesData, summaryData] = await Promise.all([
        api<Subscription[]>('/api/internal-subscriptions'),
        api<Service[]>('/api/services'),
        api<InternalSubscriptionSummary>('/api/internal-subscriptions/summary'),
      ]);
      setSubscriptions(subscriptionsData);
      setServices(servicesData);
      setSummary(summaryData);
    } catch (error) {
      toast.error("Failed to fetch internal subscriptions.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleAddSubscription = () => {
    setSelectedSubscription(null);
    setIsFormOpen(true);
  };
  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsFormOpen(true);
  };
  const handleDeleteSubscription = async (subscriptionId: string) => {
    try {
      await api(`/api/subscriptions/${subscriptionId}`, { method: "DELETE" });
      toast.success("Subscription deleted successfully.");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete subscription.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  const handleSyncOne = async (subscriptionId: string) => {
    try {
      await api(`/api/subscriptions/${subscriptionId}/sync`, { method: "POST" });
      toast.success("Subscription synced successfully.");
      fetchData();
    } catch (error) {
      toast.error("Failed to sync subscription.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchData();
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const syncPromises = subscriptions.map(sub =>
        api(`/api/subscriptions/${sub.id}/sync`, { method: 'POST' })
      );
      await Promise.all(syncPromises);
      toast.success("All internal subscriptions synced successfully.");
      fetchData();
    } catch (error) {
      toast.error("Failed to sync all internal subscriptions.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  return (
    <div className="flex flex-col w-full space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Internal Subscriptions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your own company's SaaS and cloud resource subscriptions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSyncAll} disabled={isSyncing || loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            Sync All
          </Button>
          <Button onClick={handleAddSubscription}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </div>
      </header>
      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Renewals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Active Products</p>
                  <p className="text-2xl font-bold">{summary.activeProducts}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Licenses</p>
                  <p className="text-2xl font-bold">{summary.assignedLicenses}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Renewal</p>
                  <p className="text-lg font-medium">
                    {summary.nextRenewalDate
                      ? new Date(summary.nextRenewalDate).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Payment</p>
                  <p className="text-lg font-medium">
                    {summary.currency} {(summary.nextPaymentAmount / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Spending by Product</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={summary.services} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="serviceName" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={70} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${(value / 100).toFixed(0)}`} />
                    <Tooltip formatter={(value: number) => [`$${(value / 100).toFixed(2)}`, 'Monthly Cost']} />
                    <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>License Pools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.licensePools.length === 0 ? (
                <p className="text-sm text-muted-foreground">No license pools are currently tracked.</p>
              ) : (
                summary.licensePools.map(pool => (
                  <div key={pool.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{pool.name}</p>
                        <p className="text-xs text-muted-foreground">{pool.serviceName}</p>
                      </div>
                      <span className="text-sm font-semibold">
                        {pool.assignedSeats} / {pool.totalSeats} seats
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {summary?.graphSummary && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                <CardTitle>Microsoft 365 Integration</CardTitle>
              </div>
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{summary.graphSummary.totalUsers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned Licenses</p>
                <p className="text-2xl font-bold">{summary.graphSummary.totalAssignedLicenses}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Payment</p>
                <p className="text-xl font-semibold">
                  {(summary.graphSummary.currency ?? 'USD')} {summary.graphSummary.nextPaymentAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Renewal</p>
                <p className="text-lg font-medium">
                  {summary.graphSummary.nextRenewalDate
                    ? new Date(summary.graphSummary.nextRenewalDate).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3">License Distribution</h4>
              <div className="space-y-2">
                {summary.graphSummary.skuSummary.map((sku) => (
                  <div key={sku.skuId} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{sku.skuPartNumber}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={sku.consumedUnits > sku.availableUnits * 0.9 ? "destructive" : "secondary"} className="text-xs">
                          {Math.round((sku.consumedUnits / sku.availableUnits) * 100)}% utilized
                        </Badge>
                        {sku.consumedUnits > sku.availableUnits * 0.9 && (
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{sku.consumedUnits} / {sku.availableUnits}</p>
                      <p className="text-xs text-muted-foreground">licenses used</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div>
        <SubscriptionDataTable
          data={subscriptions}
          services={services}
          isLoading={loading}
          onEdit={handleEditSubscription}
          onDelete={handleDeleteSubscription}
          onSync={handleSyncOne}
        />
      </div>
      <SubscriptionForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        subscription={selectedSubscription}
        services={services}
        onSuccess={handleFormSuccess}
        isInternal={true}
      />
    </div>
  );
}