import { cn } from "@/lib/utils";

type StatusType =
  | "occupied"
  | "vacant"
  | "under_maintenance"
  | "paid"
  | "partial"
  | "unpaid"
  | "pending"
  | "draft"
  | "approved"
  | "published"
  | "rejected"
  | "family"
  | "bachelor"
  | "active"
  | "inactive";

const statusConfig: Record<
  StatusType,
  { label: string; bg: string; text: string }
> = {
  occupied: { label: "Occupied", bg: "bg-success/10", text: "text-success" },
  vacant: { label: "Vacant", bg: "bg-danger/10", text: "text-danger" },
  under_maintenance: { label: "Maintenance", bg: "bg-warning/10", text: "text-warning" },
  paid: { label: "Paid", bg: "bg-success/10", text: "text-success" },
  partial: { label: "Partial", bg: "bg-warning/10", text: "text-warning" },
  unpaid: { label: "Unpaid", bg: "bg-danger/10", text: "text-danger" },
  pending: { label: "Pending", bg: "bg-info/10", text: "text-info" },
  draft: { label: "Draft", bg: "bg-text-muted/10", text: "text-text-muted" },
  approved: { label: "Approved", bg: "bg-success/10", text: "text-success" },
  published: { label: "Published", bg: "bg-accent/10", text: "text-accent" },
  rejected: { label: "Rejected", bg: "bg-danger/10", text: "text-danger" },
  family: { label: "Family", bg: "bg-[#8B5CF6]/10", text: "text-[#8B5CF6]" },
  bachelor: { label: "Bachelor", bg: "bg-[#F97316]/10", text: "text-[#F97316]" },
  active: { label: "Active", bg: "bg-success/10", text: "text-success" },
  inactive: { label: "Inactive", bg: "bg-text-muted/10", text: "text-text-muted" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] ?? {
    label: status,
    bg: "bg-text-muted/10",
    text: "text-text-muted",
  };

  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-badge font-semibold",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
