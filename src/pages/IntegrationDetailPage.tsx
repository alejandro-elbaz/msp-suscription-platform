import { useParams, Link, useNavigate } from "react-router-dom";
import { INTEGRATIONS_DATA } from "@/lib/integrations-data";
import { ArrowLeft, AlertTriangle, CheckCircle, Info, Shield, Clock, Server, DollarSign, Lock, CheckCircle2, Cloud } from "lucide-react";
import { ConnectionGuide } from "@/components/integrations/ConnectionGuide";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { IntegrationState, MicrosoftSyncSummary } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

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
  const isConnected = integrationState?.status === 'connected';
  
  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/integrations')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Integrations
        </Button>
      </div>
      
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border-2 flex items-center justify-center bg-gradient-to-br from-background to-muted">
            <Logo className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {integration.name}
              </h1>
              <Badge 
                variant={isConnected ? "default" : "secondary"} 
                className={isConnected ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {isConnected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {integration.description}
            </p>
          </div>
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
            <Alert className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="space-y-2">
                <div className="font-medium text-green-900 dark:text-green-400">Microsoft 365 is connected successfully!</div>
                <div className="text-sm text-green-800 dark:text-green-500">
                  Your Microsoft 365 data is being synced to the Internal Subscriptions page. 
                  {m365Status.summary && (
                    <span> Currently tracking {m365Status.summary.totalUsers} users and {m365Status.summary.totalAssignedLicenses} licenses.</span>
                  )}
                </div>
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" 
                  onClick={() => navigate('/internal-subscriptions')}
                >
                  View synced data in Internal Subscriptions →
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="setup">Setup Guide</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {integration.syncCapabilities && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Cloud className="h-5 w-5" />
                        Sync Capabilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Data Types</p>
                        <div className="flex flex-wrap gap-2">
                          {integration.syncCapabilities.dataTypes.map((type) => (
                            <Badge key={type} variant="secondary">{type}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Sync Frequency</p>
                          <p className="font-medium">{integration.syncCapabilities.syncFrequency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Real-time Updates</p>
                          <p className="font-medium">{integration.syncCapabilities.realTime ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {integration.pricing && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Pricing & Availability
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Pricing Model</p>
                        <p className="font-medium">{integration.pricing.model}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Available In</p>
                        <div className="flex flex-wrap gap-2">
                          {integration.pricing.includedIn.map((plan) => (
                            <Badge key={plan} variant="outline">{plan}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {isConnected && integrationState && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      Connection Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <p className="font-medium">Connected</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Connected Since</p>
                        <p className="font-medium">
                          {integrationState.connectedAt 
                            ? new Date(integrationState.connectedAt).toLocaleDateString()
                            : 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Sync</p>
                        <p className="font-medium">
                          {integrationState.lastSyncedAt 
                            ? new Date(integrationState.lastSyncedAt).toLocaleString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="setup" className="mt-6">
              <ConnectionGuide integration={integration} initialState={integrationState} onRefetch={fetchState} />
            </TabsContent>
            
            <TabsContent value="features" className="space-y-6 mt-6">
              {integration.features && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Features</CardTitle>
                    <CardDescription>
                      Discover what {integration.name} integration can do for your MSP
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {integration.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="security" className="space-y-6 mt-6">
              {integration.security && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security & Compliance
                    </CardTitle>
                    <CardDescription>
                      How we protect your {integration.name} data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Encryption</p>
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{integration.security.encryption}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Compliance Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {integration.security.compliance.map((cert) => (
                          <Badge key={cert} variant="secondary">
                            <Shield className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Data Storage</p>
                      <p className="text-sm">{integration.security.dataLocation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}