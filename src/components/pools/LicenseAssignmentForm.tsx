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
import type { LicenseAssignment, LicensePool, Service } from "@shared/types";
import { useEffect, useMemo } from "react";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import { LicensePoolWithAssigned } from "@/pages/LicensePoolsPage";
const assignmentSchema = z.object({
  poolId: z.string().min(1, "Please select a license pool."),
  assignedSeats: z.number().int().min(1, "Assigned seats must be at least 1."),
});
type AssignmentFormData = z.infer<typeof assignmentSchema>;
interface LicenseAssignmentFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  assignment: LicenseAssignment | null;
  clientId: string;
  pools: LicensePoolWithAssigned[];
  services: Service[];
  onSuccess: () => void;
}
export function LicenseAssignmentForm({ isOpen, onOpenChange, assignment, clientId, pools, services, onSuccess }: LicenseAssignmentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
  });
  const servicesById = useMemo(() => new Map(services.map(s => [s.id, s])), [services]);
  const selectedPoolId = watch("poolId");
  const selectedPool = pools.find(p => p.id === selectedPoolId);
  const availableSeats = selectedPool ? selectedPool.totalSeats - selectedPool.assignedSeats + (assignment?.assignedSeats || 0) : 0;
  useEffect(() => {
    if (isOpen) {
      if (assignment) {
        reset(assignment);
      } else {
        reset({ poolId: "", assignedSeats: 1 });
      }
    }
  }, [assignment, isOpen, reset]);
  const onSubmit = async (data: AssignmentFormData) => {
    if (data.assignedSeats > availableSeats) {
      toast.error("Not enough seats available in the selected pool.");
      return;
    }
    const payload = { ...data, clientId };
    try {
      if (assignment) {
        await api(`/api/license-assignments/${assignment.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Assignment updated successfully.");
      } else {
        await api("/api/license-assignments", { method: "POST", body: JSON.stringify(payload) });
        toast.success("License assigned successfully.");
      }
      onSuccess();
    } catch (error) {
      toast.error("Failed to save assignment.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{assignment ? "Edit Assignment" : "Assign License"}</DialogTitle>
          <DialogDescription>
            {assignment ? "Update the number of seats assigned." : "Assign seats from a shared license pool to this client."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="poolId">License Pool</Label>
            <Controller
              name="poolId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!assignment}>
                  <SelectTrigger><SelectValue placeholder="Select a pool" /></SelectTrigger>
                  <SelectContent>
                    {pools.map(pool => (
                      <SelectItem key={pool.id} value={pool.id}>
                        {pool.name} ({servicesById.get(pool.serviceId)?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.poolId && <p className="text-red-500 text-sm">{errors.poolId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedSeats">Seats to Assign</Label>
            <Input id="assignedSeats" type="number" {...register("assignedSeats", { valueAsNumber: true })} />
            {selectedPool && (
              <p className="text-xs text-muted-foreground">
                {availableSeats} seats available in this pool.
              </p>
            )}
            {errors.assignedSeats && <p className="text-red-500 text-sm">{errors.assignedSeats.message}</p>}
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