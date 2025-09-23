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
import { MoreHorizontal, Trash, Edit, Library } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { LicensePool, Service } from "@shared/types";
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
import { Progress } from "@/components/ui/progress";
import { LicensePoolWithAssigned } from "@/pages/LicensePoolsPage";
interface LicensePoolDataTableProps {
  data: LicensePoolWithAssigned[];
  services: Service[];
  isLoading: boolean;
  onEdit: (pool: LicensePool) => void;
  onDelete: (poolId: string) => void;
}
export function LicensePoolDataTable({ data, services, isLoading, onEdit, onDelete }: LicensePoolDataTableProps) {
  const servicesById = new Map(services.map(s => [s.id, s]));
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pool Name</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Seat Usage</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pool Name</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Seat Usage</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((pool) => {
              const usagePercentage = pool.totalSeats > 0 ? (pool.assignedSeats / pool.totalSeats) * 100 : 0;
              return (
                <TableRow key={pool.id}>
                  <TableCell className="font-medium">{pool.name}</TableCell>
                  <TableCell>{servicesById.get(pool.serviceId)?.name || 'Unknown Service'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={usagePercentage} className="w-24" />
                      <span className="text-sm text-muted-foreground">
                        {pool.assignedSeats} / {pool.totalSeats}
                      </span>
                    </div>
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
                          <DropdownMenuItem onSelect={() => onEdit(pool)}>
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
                            This will permanently delete the license pool. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(pool.id)} className="bg-destructive hover:bg-destructive/90">
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
              <TableCell colSpan={4} className="h-48 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Library className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No License Pools Found</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your first license pool to start managing shared licenses.
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