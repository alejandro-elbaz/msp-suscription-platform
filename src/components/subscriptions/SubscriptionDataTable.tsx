import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, Edit, RefreshCw, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Subscription, SubscriptionStatus, Service, MonitoringStatus } from "@shared/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
interface SubscriptionDataTableProps {
  data: Subscription[];
  services: Service[];
  isLoading: boolean;
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscriptionId: string) => void;
  onSync: (subscriptionId: string) => void;
}
const statusVariant: Record<SubscriptionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "secondary",
  cancelled: "destructive",
  expired: "outline",
};
const monitoringStatusColors: Record<MonitoringStatus, string> = {
  ok: "bg-green-500",
  issue: "bg-red-500",
  degraded: "bg-yellow-500",
};
export function SubscriptionDataTable({ data, services, isLoading, onEdit, onDelete, onSync }: SubscriptionDataTableProps) {
  const servicesById = new Map(services.map(s => [s.id, s]));
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]"></TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Renewal Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <div className={cn("h-2.5 w-2.5 rounded-full", monitoringStatusColors[sub.monitoringStatus ?? 'ok'])} />
                </TableCell>
                <TableCell className="font-medium">{servicesById.get(sub.serviceId)?.name || 'Unknown Service'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={sub.usage || 0} className="w-[60px]" />
                    <span className="text-xs text-muted-foreground">{sub.usage || 0}%</span>
                  </div>
                </TableCell>
                <TableCell>${(sub.cost / 100).toFixed(2)}</TableCell>
                <TableCell>{format(new Date(sub.renewalDate), "PPP")}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[sub.status]}>
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => onSync(sub.id)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onEdit(sub)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this subscription.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(sub.id)} className="bg-destructive hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Layers className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Subscriptions Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Add the first subscription for this client to get started.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}