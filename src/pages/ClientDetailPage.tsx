import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api-client";
import type { Client, Subscription, Service, LicenseAssignment, LicensePool } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, ArrowLeft, Mail, User, RefreshCw } from "lucide-react";
import { SubscriptionDataTable } from "@/components/subscriptions/SubscriptionDataTable";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import { LicenseAssignmentDataTable } from "@/components/pools/LicenseAssignmentDataTable";
import { LicenseAssignmentForm } from "@/components/pools/LicenseAssignmentForm";
import { LicensePoolWithAssigned } from "./LicensePoolsPage";
export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [assignments, setAssignments] = useState<LicenseAssignment[]>([]);
  const [pools, setPools] = useState<LicensePoolWithAssigned[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubFormOpen, setIsSubFormOpen] = useState(false);
  const [isAssignFormOpen, setIsAssignFormOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<LicenseAssignment | null>(null);
  const fetchData = useCallback(async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const [clientData, subsData, servicesData, assignmentsData, poolsData] = await Promise.all([
        api<Client>(`/api/clients/${clientId}`),
        api<Subscription[]>(`/api/clients/${clientId}/subscriptions`),
        api<Service[]>('/api/services'),
        api<LicenseAssignment[]>(`/api/clients/${clientId}/license-assignments`),
        api<LicensePoolWithAssigned[]>('/api/license-pools'),
      ]);
      setClient(clientData);
      setSubscriptions(subsData);
      setServices(servicesData);
      setAssignments(assignmentsData);
      setPools(poolsData);
    } catch (error) {
      toast.error("Failed to fetch client details.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, [clientId]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleAddSubscription = () => {
    setSelectedSubscription(null);
    setIsSubFormOpen(true);
  };
  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsSubFormOpen(true);
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
      await api<Subscription>(`/api/subscriptions/${subscriptionId}/sync`, { method: "POST" });
      toast.success("Subscription synced successfully.");
      fetchData();
    } catch (error) {
      toast.error("Failed to sync subscription.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  const handleSyncAll = async () => {
    setIsSyncing(true);
    toast.info("Syncing all subscriptions...");
    try {
      const syncPromises = subscriptions.map(sub => api(`/api/subscriptions/${sub.id}/sync`, { method: "POST" }));
      await Promise.all(syncPromises);
      toast.success("All subscriptions synced successfully.");
      fetchData();
    } catch (error) {
      toast.error("An error occurred while syncing subscriptions.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  const handleSubFormSuccess = () => {
    setIsSubFormOpen(false);
    fetchData();
  };
  const handleAddAssignment = () => {
    setSelectedAssignment(null);
    setIsAssignFormOpen(true);
  };
  const handleEditAssignment = (assignment: LicenseAssignment) => {
    setSelectedAssignment(assignment);
    setIsAssignFormOpen(true);
  };
  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await api(`/api/license-assignments/${assignmentId}`, { method: "DELETE" });
      toast.success("License assignment deleted.");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete assignment.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  const handleAssignFormSuccess = () => {
    setIsAssignFormOpen(false);
    fetchData();
  };
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (!client) {
    return <div>Client not found.</div>;
  }
  return (
    <div className="flex flex-col w-full space-y-6">
      <Link to="/clients" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </Link>
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {client.name}
        </h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{client.contactPerson}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Per-Client Subscriptions</h2>
          <div className="flex items-center gap-2">
            <Button onClick={handleSyncAll} variant="outline" disabled={isSyncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? "Syncing..." : "Sync All"}
            </Button>
            <Button onClick={handleAddSubscription}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Subscription
            </Button>
          </div>
        </div>
        <SubscriptionDataTable
          data={subscriptions}
          services={services}
          isLoading={loading}
          onEdit={handleEditSubscription}
          onDelete={handleDeleteSubscription}
          onSync={handleSyncOne}
        />
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Shared License Assignments</h2>
          <Button onClick={handleAddAssignment}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Assign License
          </Button>
        </div>
        <LicenseAssignmentDataTable
          data={assignments}
          pools={pools}
          services={services}
          isLoading={loading}
          onEdit={handleEditAssignment}
          onDelete={handleDeleteAssignment}
        />
      </div>
      {clientId && (
        <>
          <SubscriptionForm
            isOpen={isSubFormOpen}
            onOpenChange={setIsSubFormOpen}
            subscription={selectedSubscription}
            clientId={clientId}
            services={services}
            onSuccess={handleSubFormSuccess}
          />
          <LicenseAssignmentForm
            isOpen={isAssignFormOpen}
            onOpenChange={setIsAssignFormOpen}
            assignment={selectedAssignment}
            clientId={clientId}
            pools={pools}
            services={services}
            onSuccess={handleAssignFormSuccess}
          />
        </>
      )}
    </div>
  );
}