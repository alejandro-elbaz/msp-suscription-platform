import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search, Users, Briefcase } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Client, Service } from "@shared/types";
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  const fetchData = useCallback(async () => {
    if (open) {
      try {
        const promises: Promise<unknown>[] = [];
        if (clients.length === 0) {
          promises.push(api<Client[]>("/api/clients").then(setClients));
        }
        if (services.length === 0) {
          promises.push(api<Service[]>("/api/services").then(setServices));
        }
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      } catch (error) {
        console.error("Failed to fetch search data:", error);
      }
    }
  }, [open, clients.length, services.length]);
  useEffect(() => {
    fetchData();
  }, [open, fetchData]);
  const runCommand = (command: () => unknown) => {
    setOpen(false);
    command();
  };
  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search clients and services...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Clients">
            {clients.map((client) => (
              <CommandItem
                key={client.id}
                value={`client-${client.name}`}
                onSelect={() => runCommand(() => navigate(`/clients/${client.id}`))}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>{client.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Services">
            {services.map((service) => (
              <CommandItem
                key={service.id}
                value={`service-${service.name}`}
                onSelect={() => runCommand(() => navigate("/services"))}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                <span>{service.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}