import { useEffect, useState } from "react";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { INTEGRATIONS_DATA } from "@/lib/integrations-data";
import { api } from "@/lib/api-client";
import type { IntegrationState, Integration } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
export function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS_DATA);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchIntegrationStates = async () => {
      try {
        setLoading(true);
        const states = await api<IntegrationState[]>("/api/integration-states");
        const statesMap = new Map(states.map(s => [s.id, s.status]));
        const updatedIntegrations = INTEGRATIONS_DATA.map(integration => ({
          ...integration,
          status: statesMap.get(integration.id) || 'not_connected',
        }));
        setIntegrations(updatedIntegrations);
      } catch (error) {
        toast.error("Failed to fetch integration statuses.", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchIntegrationStates();
  }, []);
  return (
    <div className="flex flex-col w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Integrations Hub
        </h1>
        <p className="text-muted-foreground mt-2">
          Connect your third-party services to NexusMSP to automate license and usage tracking.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          : integrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
      </div>
    </div>
  );
}