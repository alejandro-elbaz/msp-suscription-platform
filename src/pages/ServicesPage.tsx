import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { Service, ServiceCategory } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { groupBy } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceForm } from "@/components/services/ServiceForm";
export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api<Service[]>("/api/services");
      setServices(data);
    } catch (error) {
      toast.error("Failed to fetch services.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  const handleAddService = () => {
    setSelectedService(null);
    setIsFormOpen(true);
  };
  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };
  const handleDeleteService = async (serviceId: string) => {
    try {
      await api(`/api/services/${serviceId}`, { method: "DELETE" });
      toast.success("Service deleted successfully.");
      fetchServices();
    } catch (error) {
      toast.error("Failed to delete service.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchServices();
  };
  const groupedServices = useMemo(() => {
    return groupBy(services, 'category') as Record<ServiceCategory, Service[]>;
  }, [services]);
  const categoryOrder: ServiceCategory[] = ['SaaS', 'IaaS', 'Cybersecurity', 'Collaboration', 'Creative', 'Development'];
  return (
    <div className="flex flex-col w-full">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Service Catalog
        </h1>
        <Button onClick={handleAddService}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </header>
      {loading ? (
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {categoryOrder.map(category => (
            groupedServices[category] && (
              <div key={category}>
                <h2 className="text-2xl font-semibold tracking-tight mb-4">{category}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedServices[category].map(service => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onEdit={handleEditService}
                      onDelete={handleDeleteService}
                    />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
      <ServiceForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        service={selectedService}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}