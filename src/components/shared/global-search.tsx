"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Building2,
  Users,
  DoorOpen,
  IndianRupee,
  Wrench,
  FileText,
  BarChart3,
  Settings,
  UserCircle,
  Plus,
  ClipboardList,
} from "lucide-react";

const NAVIGATION_ITEMS = [
  { label: "Dashboard", href: "/pm", icon: Home },
  { label: "Communities", href: "/pm/communities", icon: Building2 },
  { label: "Owners", href: "/pm/owners", icon: Users },
  { label: "Flats", href: "/pm/flats", icon: DoorOpen },
  { label: "Rent Payments", href: "/pm/rent", icon: IndianRupee },
  { label: "Monthly Rent Grid", href: "/pm/rent/monthly", icon: IndianRupee },
  { label: "Expenses", href: "/pm/expenses", icon: Wrench },
  { label: "Maintenance", href: "/pm/maintenance", icon: Building2 },
  { label: "Documents", href: "/pm/documents", icon: FileText },
  { label: "Analytics", href: "/pm/analytics", icon: BarChart3 },
  { label: "Settings", href: "/pm/settings", icon: Settings },
];

const QUICK_ACTIONS = [
  { label: "Record Rent Payment", href: "/pm/rent/record", icon: IndianRupee },
  { label: "Record Expense", href: "/pm/expenses/record", icon: Wrench },
  { label: "Add New Flat", href: "/pm/flats/new/edit", icon: Plus },
  { label: "Generate Brokerage Invoice", href: "/pm/documents/generate/brokerage", icon: FileText },
  { label: "Generate Expenses Bill", href: "/pm/documents/generate/expenses", icon: FileText },
  { label: "Generate Maintenance Tracker", href: "/pm/documents/generate/maintenance", icon: ClipboardList },
];

interface SearchItem {
  label: string;
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [flats, setFlats] = useState<SearchItem[]>([]);
  const [owners, setOwners] = useState<SearchItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  // Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch flats and owners when dialog first opens
  useEffect(() => {
    if (!open || loaded) return;

    const fetchData = async () => {
      const supabase = createClient();
      const [flatsRes, ownersRes] = await Promise.all([
        supabase
          .from("flats")
          .select("id, flat_number, status, tenants(name, is_active, tenant_type)")
          .eq("is_active", true)
          .order("flat_number"),
        supabase
          .from("owners")
          .select("id, name, flats(id)")
          .eq("is_active", true)
          .order("name"),
      ]);

      if (flatsRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFlats(flatsRes.data.map((f: any) => {
          const activeTenant = Array.isArray(f.tenants)
            ? f.tenants.find((t: { is_active: boolean }) => t.is_active)
            : null;
          const tenantInfo = activeTenant
            ? ` — ${activeTenant.name} (${activeTenant.tenant_type === "bachelor" ? "Bachelor" : "Family"})`
            : f.status === "vacant" ? " — Vacant" : "";
          return {
            label: `Flat ${f.flat_number}${tenantInfo}`,
            href: `/pm/flats/${f.id}`,
          };
        }));
      }

      if (ownersRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setOwners(ownersRes.data.map((o: any) => {
          const flatCount = Array.isArray(o.flats) ? o.flats.length : 0;
          return {
            label: `${o.name} (${flatCount} flat${flatCount !== 1 ? "s" : ""})`,
            href: `/pm/owners/${o.id}`,
          };
        }));
      }

      setLoaded(true);
    };

    fetchData();
  }, [open, loaded]);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search flats, owners, pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {QUICK_ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => handleSelect(item.href)}
              >
                <Icon className="mr-2 h-4 w-4 text-accent" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Flats">
          {flats.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => handleSelect(item.href)}
            >
              <DoorOpen className="mr-2 h-4 w-4 text-info" />
              {item.label}
            </CommandItem>
          ))}
          {!loaded && open && (
            <CommandItem disabled value="loading-flats">
              <span className="text-text-muted text-caption">Loading flats...</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Owners">
          {owners.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => handleSelect(item.href)}
            >
              <UserCircle className="mr-2 h-4 w-4 text-[#8B5CF6]" />
              {item.label}
            </CommandItem>
          ))}
          {!loaded && open && (
            <CommandItem disabled value="loading-owners">
              <span className="text-text-muted text-caption">Loading owners...</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => handleSelect(item.href)}
              >
                <Icon className="mr-2 h-4 w-4 text-text-muted" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
