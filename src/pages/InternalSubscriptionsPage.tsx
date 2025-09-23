import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { Subscription, Service } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw } from "lucide-react";
import { SubscriptionDataTable } from "@/components/subscriptions/SubscriptionDataTable";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
export default function InternalSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [subscriptionsData, servicesData] = await Promise.all([
        api<Subscription[]>('/api/internal-subscriptions'),
        api<Service[]>('/api/services')
      ]);
      setSubscriptions(subscriptionsData);
      setServices(servicesData);
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