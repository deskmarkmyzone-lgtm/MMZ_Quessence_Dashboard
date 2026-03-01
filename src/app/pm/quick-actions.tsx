"use client";

import Link from "next/link";
import { IndianRupee, Wrench, FileText, Plus, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Record Rent",
    description: "Log a rent payment with proof",
    href: "/pm/rent/record",
    icon: IndianRupee,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    label: "Record Expense",
    description: "Log a repair or expense",
    href: "/pm/expenses/record",
    icon: Wrench,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    label: "Generate Invoice",
    description: "Create a new document",
    href: "/pm/documents/generate",
    icon: FileText,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    label: "Add Flat",
    description: "Register a new flat",
    href: "/pm/flats/new/edit",
    icon: Plus,
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    label: "Add Tenant",
    description: "Register a new tenant",
    href: "/pm/flats",
    icon: UserPlus,
    color: "text-[#8B5CF6]",
    bg: "bg-[#8B5CF6]/10",
  },
];

export function QuickActions() {
  return (
    <div className="bg-bg-card border border-border-primary rounded-lg p-5">
      <h3 className="text-h3 text-text-primary mb-4">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-md hover:bg-bg-hover transition-colors group"
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0",
                  action.bg
                )}
              >
                <Icon className={cn("h-4 w-4", action.color)} />
              </div>
              <div>
                <p className="text-body font-medium text-text-primary group-hover:text-accent transition-colors">
                  {action.label}
                </p>
                <p className="text-caption text-text-muted">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
