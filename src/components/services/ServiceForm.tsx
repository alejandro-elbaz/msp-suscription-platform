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
import { Textarea } from "@/components/ui/textarea";
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
import type { Service, ServiceCategory } from "@shared/types";
import { useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
const serviceSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters."),
  category: z.enum(['SaaS', 'IaaS', 'Cybersecurity', 'Creative', 'Collaboration', 'Development']),
  description: z.string().min(10, "Description must be at least 10 characters."),
});
type ServiceFormData = z.infer<typeof serviceSchema>;
interface ServiceFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  service: Service | null;
  onSuccess: () => void;
}
const categories: ServiceCategory[] = ['SaaS', 'IaaS', 'Cybersecurity', 'Creative', 'Collaboration', 'Development'];
export function ServiceForm({ isOpen, onOpenChange, service, onSuccess }: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });
  useEffect(() => {
    if (isOpen) {
      if (service) {
        reset(service);
      } else {
        reset({
          name: "",
          category: "SaaS",
          description: "",
        });
      }
    }
  }, [service, isOpen, reset]);
  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (service) {
        await api(`/api/services/${service.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        toast.success("Service updated successfully.");
      } else {
        await api("/api/services", {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success("Service created successfully.");
      }
      onSuccess();
    } catch (error) {
      toast.error("Failed to save service.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "Add New Service"}</DialogTitle>
          <DialogDescription>
            {service ? "Update the service details." : "Enter the details for the new service."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
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