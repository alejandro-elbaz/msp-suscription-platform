import { NavLink } from "react-router-dom";
import { Package, Home, Users, Briefcase, BarChart3, Plug, Settings, ShieldCheck, Library } from "lucide-react";
import { cn } from "@/lib/utils";
const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/services", icon: Briefcase, label: "Services" },
  { to: "/internal-subscriptions", icon: ShieldCheck, label: "Internal Subscriptions" },
  { to: "/license-pools", icon: Library, label: "License Pools" },
  { to: "/integrations", icon: Plug, label: "Integrations" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];
export function Sidebar() {
  return (
    <div className="flex h-full max-h-screen flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <NavLink to="/" className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6 text-primary" />
          <span className="">NexusMSP</span>
        </NavLink>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <nav className="grid items-start text-sm font-medium">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "bg-muted text-primary"
              )
            }
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
        </nav>
      </div>
    </div>
  );
}