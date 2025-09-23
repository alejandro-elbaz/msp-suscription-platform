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
import { MoreHorizontal, Trash, Edit, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { LicenseAssignment, LicensePool, Service } from "@shared/types";
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
interface LicenseAssignmentDataTableProps {
  data: LicenseAssignment[];
  pools: LicensePool[];
  services: Service[];
  isLoading: boolean;
  onEdit: (assignment: LicenseAssignment) => void;
  onDelete: (assignmentId: string) => void;
}
export function LicenseAssignmentDataTable({ data, pools, services, isLoading, onEdit, onDelete }: LicenseAssignmentDataTableProps) {
  const poolsById = new Map(pools.map(p => [p.id, p]));
  const servicesById = new Map(services.map(s => [s.id, s]));
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
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
            <TableHead>License Pool</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Assigned Seats</TableHead>
            <TableHead>Assigned Date</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((assignment) => {
              const pool = poolsById.get(assignment.poolId);
              const service = pool ? servicesById.get(pool.serviceId) : undefined;
              return (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{pool?.name || 'Unknown Pool'}</TableCell>
                  <TableCell>{service?.name || 'Unknown Service'}</TableCell>
                  <TableCell>{assignment.assignedSeats}</TableCell>
                  <TableCell>{format(new Date(assignment.assignedAt), "PPP")}</TableCell>
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
                          <DropdownMenuItem onSelect={() => onEdit(assignment)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will unassign these licenses from the client. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(assignment.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-48 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Licenses Assigned</h3>
                  <p className="text-sm text-muted-foreground">
                    Assign licenses from a shared pool to this client.
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