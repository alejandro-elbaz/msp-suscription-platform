import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Integration, IntegrationState, IntegrationStatus } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { api } from '@/lib/api-client';
interface ConnectionGuideProps {
  integration: Integration;
  initialState: IntegrationState | null;
}
export function ConnectionGuide({ integration, initialState }: ConnectionGuideProps) {
  const [connectionStatus, setConnectionStatus] = useState<IntegrationStatus>('not_connected');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  useEffect(() => {
    if (initialState) {
      setConnectionStatus(initialState.status);
      setLastSyncedAt(initialState.lastSyncedAt ?? null);
    }
  }, [initialState]);
  const formSchema = z.object(
    integration.steps.reduce((acc, step) => {
      if (step.fields) {
        step.fields.forEach(field => {
          acc[field.id] = z.string().min(1, `${field.label} is required.`);
        });
      }
      return acc;
    }, {} as Record<string, z.ZodString>)
  );
  type FormData = z.infer<typeof formSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  const onSubmit = async (data: FormData) => {
    toast.info(`Saving credentials for ${integration.name}...`);
    try {
      await api(`/api/integration-states/${integration.id}`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'connected',
          config: data,
        }),
      });
      setConnectionStatus('connected');
      toast.success(`Credentials saved. Run a test to verify connectivity.`);
    } catch (error) {
      toast.error("Failed to save integration status.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never synced';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await api<{ success: boolean; skuCount?: number }>(`/api/integrations/m365/test`, {
        method: 'POST',
      });
      if (result.success) {
        toast.success(`Successfully reached Microsoft Graph`, {
          description: `Found ${result.skuCount ?? 0} subscribed SKUs.`,
        });
        setConnectionStatus('connected');
      } else {
        toast.error('Test completed with warnings.');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Test failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setTestingConnection(false);
    }
  };
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await api<{ syncedAt: number }>(`/api/integrations/m365/sync`, {
        method: 'POST',
      });
      setLastSyncedAt(result.syncedAt);
      toast.success('Microsoft 365 data synced.', {
        description: `Last sync: ${formatLastSync(result.syncedAt)}`,
      });
    } catch (error) {
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSyncing(false);
    }
  };
  const hasFields = integration.steps.some(step => step.fields);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connection Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
            {integration.steps.map((step, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>{step.title}</AccordionTrigger>
                <AccordionContent className="prose prose-sm dark:prose-invert">
                  <p>{step.description}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      {hasFields && (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Enter Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {integration.steps.map(step =>
                step.fields?.map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      {...register(field.id as keyof FormData)}
                      disabled={isSubmitting || connectionStatus === 'connected'}
                    />
                    {errors[field.id as keyof FormData] && (
                      <p className="text-sm text-destructive">{errors[field.id as keyof FormData]?.message}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div>
                {connectionStatus === 'connected' && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span className="font-medium">Connected</span>
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="flex items-center text-destructive">
                    <XCircle className="mr-2 h-5 w-5" />
                    <span className="font-medium">Connection Failed</span>
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Credentials
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
      {integration.id === 'microsoft-365' && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current status</p>
                <p className="text-lg font-medium capitalize">{connectionStatus.replace('_', ' ')}</p>
              </div>
              <Button variant="outline" onClick={handleTestConnection} disabled={testingConnection}>
                {testingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Connection
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last successful sync</p>
                <p className="text-lg font-medium">{formatLastSync(lastSyncedAt)}</p>
              </div>
              <Button onClick={handleManualSync} disabled={syncing || connectionStatus !== 'connected'}>
                {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Manual Sync
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}