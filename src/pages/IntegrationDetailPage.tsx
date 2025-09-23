import { useParams, Link, useNavigate } from "react-router-dom";
import { INTEGRATIONS_DATA } from "@/lib/integrations-data";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { ConnectionGuide } from "@/components/integrations/ConnectionGuide";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { IntegrationState } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
export function IntegrationDetailPage() {
  const { integrationId } = useParams<{ integrationId: string }>();
  const navigate = useNavigate();
  const [integrationState, setIntegrationState] = useState<IntegrationState | null>(null);
  const [loading, setLoading] = useState(true);
  const integration = INTEGRATIONS_DATA.find(i => i.id === integrationId);
  useEffect(() => {
    if (!integrationId) return;
    const fetchState = async () => {
      try {
        setLoading(true);
        const state = await api<IntegrationState>(`/api/integration-states/${integrationId}`);
        setIntegrationState(state);
      } catch (error) {
        toast.error("Failed to fetch integration status.");
      } finally {
        setLoading(false);
      }
    };
    fetchState();
  }, [integrationId]);
  if (!integration) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Integration Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The integration you are looking for does not exist.
        </p>
        <Button asChild>
          <Link to="/integrations">Back to Integrations</Link>
        </Button>
      </div>
    );
  }
  const Logo = integration.logo;
  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/integrations')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Integrations
        </Button>
      </div>
      <header className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-lg border flex items-center justify-center bg-card">
          <Logo className="w-8 h-8 text-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Connect to {integration.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Follow the steps below to sync your {integration.name} data.
          </p>
        </div>
      </header>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <ConnectionGuide integration={integration} initialState={integrationState} />
      )}
    </div>
  );
}