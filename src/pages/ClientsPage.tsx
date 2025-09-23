import { ClientDataTable } from "@/components/clients/ClientDataTable";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Client } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { ClientForm } from "@/components/clients/ClientForm";
export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await api<Client[]>("/api/clients");
      setClients(data);
    } catch (error) {
      toast.error("Failed to fetch clients.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchClients();
  }, []);
  const handleAddClient = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };
  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };
  const handleDeleteClient = async (clientId: string) => {
    try {
      await api(`/api/clients/${clientId}`, { method: "DELETE" });
      toast.success("Client deleted successfully.");
      fetchClients();
    } catch (error) {
      toast.error("Failed to delete client.", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchClients();
  };
  return (
    <div className="flex flex-col w-full">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Clients
        </h1>
        <Button onClick={handleAddClient}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </header>
      <ClientDataTable
        data={clients}
        isLoading={loading}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
      />
      <ClientForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        client={selectedClient}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}