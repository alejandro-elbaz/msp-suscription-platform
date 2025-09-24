import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { Subscription, Service, Client } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw, Users2 } from "lucide-react";
import { SubscriptionDataTable } from "@/components/subscriptions/SubscriptionDataTable";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ExternalSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [subscriptionsData, servicesData, clientsData] = await Promise.all([
        api<Subscription[]>('/api/subscriptions'),
        api<Service[]>('/api/services'),
        api<Client[]>('/api/clients')
      ]);
      
      // Filter out internal subscriptions
      const externalSubscriptions = subscriptionsData.filter(sub => !sub.isInternal && sub.clientId !== 'internal');
      setSubscriptions(externalSubscriptions);
      setServices(servicesData);
      setClients(clientsData);
    } catch (error) {
      toast.error("Failed to fetch client subscriptions.", {
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
    if (selectedClientId === "all") {
      toast.error("Please select a client first to add a subscription.");
      return;
    }
    setSelectedSubscription(null);
    setIsFormOpen(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setSelectedClient(clients.find(c => c.id === subscription.clientId) || null);
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
      const subscriptionsToSync = filteredSubscriptions;
      const syncPromises = subscriptionsToSync.map(sub =>
        api(`/api/subscriptions/${sub.id}/sync`, { method: 'POST' })
      );
      await Promise.all(syncPromises);
      toast.success(`Synced ${subscriptionsToSync.length} client subscriptions successfully.`);
      fetchData();
    } catch (error) {
      toast.error("Failed to sync client subscriptions.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredSubscriptions = selectedClientId === "all" 
    ? subscriptions 
    : subscriptions.filter(sub => sub.clientId === selectedClientId);

  const clientsById = new Map(clients.map(c => [c.id, c]));
  const servicesById = new Map(services.map(s => [s.id, s]));

  // Calculate summary stats
  const summaryStats = {
    totalSubscriptions: filteredSubscriptions.length,
    activeSubscriptions: filteredSubscriptions.filter(s => s.status === 'active').length,
    totalMonthlySpend: filteredSubscriptions.reduce((sum, sub) => sum + sub.cost, 0),
    subscriptionsWithIssues: filteredSubscriptions.filter(s => s.monitoringStatus === 'issue').length,
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Client Subscriptions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your clients' SaaS and cloud subscriptions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleSyncAll} 
            disabled={isSyncing || loading || filteredSubscriptions.length === 0}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            Sync {selectedClientId === "all" ? "All" : ""}
          </Button>
          <Button 
            onClick={handleAddSubscription}
            disabled={selectedClientId === "all"}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.activeSubscriptions} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <Badge variant="secondary">USD</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(summaryStats.totalMonthlySpend / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {selectedClientId === "all" ? "all clients" : "selected client"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredSubscriptions.map(s => s.serviceId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.subscriptionsWithIssues}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Subscriptions Table */}
      <div>
        <SubscriptionDataTable
          data={filteredSubscriptions}
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
        clientId={selectedSubscription?.clientId || selectedClientId}
        services={services}
        onSuccess={handleFormSuccess}
        isInternal={false}
      />
    </div>
  );
}
