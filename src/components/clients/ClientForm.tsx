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
import type { Client, ClientStatus } from "@shared/types";
import { useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
const clientSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters."),
  contactPerson: z.string().min(2, "Contact person must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  status: z.enum(["active", "inactive", "archived"]),
});
type ClientFormData = z.infer<typeof clientSchema>;
interface ClientFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  client: Client | null;
  onSuccess: () => void;
}
export function ClientForm({ isOpen, onOpenChange, client, onSuccess }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });
  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        contactPerson: client.contactPerson,
        email: client.email,
        status: client.status,
      });
    } else {
      reset({
        name: "",
        contactPerson: "",
        email: "",
        status: "active",
      });
    }
  }, [client, reset, isOpen]);
  const onSubmit = async (data: ClientFormData) => {
    try {
      if (client) {
        await api(`/api/clients/${client.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        toast.success("Client updated successfully.");
      } else {
        await api("/api/clients", {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success("Client created successfully.");
      }
      onSuccess();
    } catch (error) {
      toast.error("Failed to save client.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {client ? "Update the client's details." : "Enter the details for the new client."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" {...register("name")} className="col-span-3" />
            {errors.name && <p className="col-span-4 text-red-500 text-sm text-right">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactPerson" className="text-right">Contact</Label>
            <Input id="contactPerson" {...register("contactPerson")} className="col-span-3" />
            {errors.contactPerson && <p className="col-span-4 text-red-500 text-sm text-right">{errors.contactPerson.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" {...register("email")} className="col-span-3" />
            {errors.email && <p className="col-span-4 text-red-500 text-sm text-right">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
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