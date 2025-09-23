import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Subscription, Service } from "@shared/types";
import { useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
const subscriptionSchema = z.object({
  serviceId: z.string().min(1, "Please select a service."),
  plan: z.string().min(1, "Plan name is required."),
  quantity: z.number().int().min(1, "Quantity must be at least 1."),
  cost: z.number().min(0, "Cost cannot be negative."),
  renewalDate: z.date(),
  status: z.enum(["active", "pending", "cancelled", "expired"]),
});
type SubscriptionFormData = z.infer<typeof subscriptionSchema>;
interface SubscriptionFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  subscription: Subscription | null;
  clientId?: string;
  services: Service[];
  onSuccess: () => void;
  isInternal?: boolean;
}
export function SubscriptionForm({ isOpen, onOpenChange, subscription, clientId, services, onSuccess, isInternal = false }: SubscriptionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
  });
  useEffect(() => {
    if (isOpen) {
      if (subscription) {
        reset({
          serviceId: subscription.serviceId,
          plan: subscription.plan,
          quantity: subscription.quantity,
          cost: subscription.cost / 100, // Convert from cents
          renewalDate: new Date(subscription.renewalDate),
          status: subscription.status,
        });
      } else {
        reset({
          serviceId: "",
          plan: "",
          quantity: 1,
          cost: 0,
          renewalDate: new Date(),
          status: "active",
        });
      }
    }
  }, [subscription, isOpen, reset]);
  const onSubmit = async (data: SubscriptionFormData) => {
    const payload = {
      ...data,
      clientId: isInternal ? 'internal' : clientId,
      cost: Math.round(data.cost * 100), // Convert to cents
      renewalDate: data.renewalDate.getTime(),
    };
    const endpoint = isInternal ? "/api/internal-subscriptions" : "/api/subscriptions";
    try {
      if (subscription) {
        await api(`/api/subscriptions/${subscription.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Subscription updated successfully.");
      } else {
        await api(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Subscription added successfully.");
      }
      onSuccess();
    } catch (error) {
      toast.error("Failed to save subscription.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{subscription ? "Edit Subscription" : "Add Subscription"}</DialogTitle>
          <DialogDescription>
            {subscription ? "Update the subscription details." : "Add a new service subscription."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="serviceId">Service</Label>
            <Controller
              name="serviceId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                  <SelectContent>
                    {services.map(service => <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.serviceId && <p className="text-red-500 text-sm">{errors.serviceId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Input id="plan" {...register("plan")} />
            {errors.plan && <p className="text-red-500 text-sm">{errors.plan.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" {...register("quantity", { valueAsNumber: true })} />
              {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input id="cost" type="number" step="0.01" {...register("cost", { valueAsNumber: true })} />
              {errors.cost && <p className="text-red-500 text-sm">{errors.cost.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="renewalDate">Renewal Date</Label>
            <Controller
              name="renewalDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.renewalDate && <p className="text-red-500 text-sm">{errors.renewalDate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}