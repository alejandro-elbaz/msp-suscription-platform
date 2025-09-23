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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { LicensePool, Service } from "@shared/types";
import { useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
const poolSchema = z.object({
  name: z.string().min(2, "Pool name must be at least 2 characters."),
  serviceId: z.string().min(1, "Please select a service."),
  totalSeats: z.number().int().min(1, "Total seats must be at least 1."),
});
type PoolFormData = z.infer<typeof poolSchema>;
interface LicensePoolFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pool: LicensePool | null;
  services: Service[];
  onSuccess: () => void;
}
export function LicensePoolForm({ isOpen, onOpenChange, pool, services, onSuccess }: LicensePoolFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PoolFormData>({
    resolver: zodResolver(poolSchema),
  });
  useEffect(() => {
    if (isOpen) {
      if (pool) {
        reset(pool);
      } else {
        reset({ name: "", serviceId: "", totalSeats: 1 });
      }
    }
  }, [pool, isOpen, reset]);
  const onSubmit = async (data: PoolFormData) => {
    try {
      if (pool) {
        await api(`/api/license-pools/${pool.id}`, { method: "PUT", body: JSON.stringify(data) });
        toast.success("License pool updated successfully.");
      } else {
        await api("/api/license-pools", { method: "POST", body: JSON.stringify(data) });
        toast.success("License pool created successfully.");
      }
      onSuccess();
    } catch (error) {
      toast.error("Failed to save license pool.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{pool ? "Edit License Pool" : "Add New License Pool"}</DialogTitle>
          <DialogDescription>
            {pool ? "Update the pool's details." : "Enter the details for the new license pool."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Pool Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
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
            <Label htmlFor="totalSeats">Total Seats</Label>
            <Input id="totalSeats" type="number" {...register("totalSeats", { valueAsNumber: true })} />
            {errors.totalSeats && <p className="text-red-500 text-sm">{errors.totalSeats.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}