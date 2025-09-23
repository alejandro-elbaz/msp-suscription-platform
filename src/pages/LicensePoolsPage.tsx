import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { LicensePool, Service } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { LicensePoolDataTable } from "@/components/pools/LicensePoolDataTable";
import { LicensePoolForm } from "@/components/pools/LicensePoolForm";
export type LicensePoolWithAssigned = LicensePool & { assignedSeats: number };
export default function LicensePoolsPage() {
  const [pools, setPools] = useState<LicensePoolWithAssigned[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<LicensePool | null>(null);
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [poolsData, servicesData] = await Promise.all([
        api<LicensePoolWithAssigned[]>("/api/license-pools"),
        api<Service[]>("/api/services"),
      ]);
      setPools(poolsData);
      setServices(servicesData);
    } catch (error) {
      toast.error("Failed to fetch license pools.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleAddPool = () => {
    setSelectedPool(null);
    setIsFormOpen(true);
  };
  const handleEditPool = (pool: LicensePool) => {
    setSelectedPool(pool);
    setIsFormOpen(true);
  };
  const handleDeletePool = async (poolId: string) => {
    try {
      await api(`/api/license-pools/${poolId}`, { method: "DELETE" });
      toast.success("License pool deleted successfully.");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete license pool.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchData();
  };
  return (
    <div className="flex flex-col w-full">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Shared License Pools
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your central inventory of shared licenses to assign to clients.
          </p>
        </div>
        <Button onClick={handleAddPool}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Pool
        </Button>
      </header>
      <LicensePoolDataTable
        data={pools}
        services={services}
        isLoading={loading}
        onEdit={handleEditPool}
        onDelete={handleDeletePool}
      />
      <LicensePoolForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        pool={selectedPool}
        services={services}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}