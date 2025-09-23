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
  useEffect(() => {
    if (initialState) {
      setConnectionStatus(initialState.status);
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
    toast.info(`Connecting to ${integration.name}...`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simulate success/failure
    const isSuccess = Math.random() > 0.2; // 80% success rate
    const newStatus: IntegrationStatus = isSuccess ? 'connected' : 'error';
    try {
      await api(`/api/integration-states/${integration.id}`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      setConnectionStatus(newStatus);
      if (isSuccess) {
        toast.success(`Successfully connected to ${integration.name}!`);
      } else {
        toast.error(`Failed to connect to ${integration.name}.`, {
          description: "Please check your credentials and try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to save integration status.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
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
              <Button type="submit" disabled={isSubmitting || connectionStatus === 'connected'}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {connectionStatus === 'connected' ? 'Connected' : 'Connect'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}