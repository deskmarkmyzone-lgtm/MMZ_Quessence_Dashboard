import { IndianRupee, Wrench, UserPlus, FileText, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatCurrency } from "@/lib/utils/format";

// Demo data
const activities = [
  {
    id: "1",
    type: "rent" as const,
    message: "Rent recorded for Flat 3154",
    detail: formatCurrency(56000),
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    icon: IndianRupee,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    id: "2",
    type: "expense" as const,
    message: "Geyser repair for Flat 8061",
    detail: formatCurrency(3800),
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    icon: Wrench,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    id: "3",
    type: "tenant" as const,
    message: "New tenant added to Flat 2224",
    detail: "Ajaypal Singh",
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    icon: UserPlus,
    color: "text-[#8B5CF6]",
    bg: "bg-[#8B5CF6]/10",
  },
  {
    id: "4",
    type: "document" as const,
    message: "Brokerage invoice published",
    detail: "INV-2026-0015",
    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
    icon: FileText,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    id: "5",
    type: "flat" as const,
    message: "Flat 6292 status changed to Vacant",
    detail: "",
    timestamp: new Date(Date.now() - 72 * 3600000).toISOString(),
    icon: Home,
    color: "text-danger",
    bg: "bg-danger/10",
  },
];

export function RecentActivity() {
  return (
    <div className="bg-bg-card border border-border-primary rounded-lg p-5">
      <h3 className="text-h3 text-text-primary mb-4">Recent Activity</h3>
      <div className="space-y-1">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-md hover:bg-bg-hover transition-colors"
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5",
                  activity.bg
                )}
              >
                <Icon className={cn("h-4 w-4", activity.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body text-text-primary">{activity.message}</p>
                {activity.detail && (
                  <p className="text-body-sm text-text-secondary">
                    {activity.detail}
                  </p>
                )}
              </div>
              <span className="text-caption text-text-muted flex-shrink-0">
                {formatRelativeTime(activity.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
