import { useParams, Link, useNavigate } from "react-router-dom";
import { INTEGRATIONS_DATA } from "@/lib/integrations-data";
import { ArrowLeft, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { ConnectionGuide } from "@/components/integrations/ConnectionGuide";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { IntegrationState, MicrosoftSyncSummary } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
export function IntegrationDetailPage() {
  const { integrationId } = useParams<{ integrationId: string }>();
  const navigate = useNavigate();
  const [integrationState, setIntegrationState] = useState<IntegrationState | null>(null);
  const [m365Status, setM365Status] = useState<{ status: string; lastSyncedAt: number | null; summary: MicrosoftSyncSummary | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const integration = INTEGRATIONS_DATA.find(i => i.id === integrationId);
  const fetchState = async () => {
    if (!integrationId) return;
    try {
      setLoading(true);
      const state = await api<IntegrationState>(`/api/integration-states/${integrationId}`);
      setIntegrationState(state);
      if (integrationId === 'microsoft-365') {
        const status = await api<{ status: string; lastSyncedAt: number | null; summary: MicrosoftSyncSummary | null }>(`/api/integrations/m365/status`);
        setM365Status(status);
      }
    } catch (error) {
      toast.error("Failed to fetch integration status.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
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
        <div className="space-y-6">
          {integration.id === 'microsoft-365' && m365Status && m365Status.status === 'connected' && (
            <Alert className="border-green-200 bg-green-50/50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="space-y-2">
                <div className="font-medium text-green-900">Microsoft 365 is connected successfully!</div>
                <div className="text-sm text-green-800">
                  Your Microsoft 365 data is being synced to the Internal Subscriptions page. 
                  {m365Status.summary && (
                    <span> Currently tracking {m365Status.summary.totalUsers} users and {m365Status.summary.totalAssignedLicenses} licenses.</span>
                  )}
                </div>
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-green-700 hover:text-green-900" 
                  onClick={() => navigate('/internal-subscriptions')}
                >
                  View synced data in Internal Subscriptions →
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <ConnectionGuide integration={integration} initialState={integrationState} onRefetch={fetchState} />
        </div>
      )}
    </div>
  );
}