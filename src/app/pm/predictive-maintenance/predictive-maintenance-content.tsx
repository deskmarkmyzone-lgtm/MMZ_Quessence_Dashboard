"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import {
  AlertTriangle,
  Activity,
  Clock,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  FlatPrediction,
  CategoryInsight,
  RiskLevel,
  CategoryPrediction,
} from "./page";

interface PredictiveMaintenanceContentProps {
  flatPredictions: FlatPrediction[];
  categoryInsights: CategoryInsight[];
  totalFlats: number;
  totalAtRisk: number;
  totalOverdueItems: number;
  estimatedUpcomingCost: number;
}

const RISK_CONFIG: Record<
  RiskLevel,
  { color: string; bg: string; label: string }
> = {
  critical: {
    color: "text-danger",
    bg: "bg-danger/10",
    label: "Critical",
  },
  high: {
    color: "text-warning",
    bg: "bg-warning/10",
    label: "High",
  },
  medium: {
    color: "text-info",
    bg: "bg-info/10",
    label: "Medium",
  },
  low: {
    color: "text-success",
    bg: "bg-success/10",
    label: "Low",
  },
};

const formatINR = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`;

export function PredictiveMaintenanceContent({
  flatPredictions,
  categoryInsights,
  totalFlats,
  totalAtRisk,
  totalOverdueItems,
  estimatedUpcomingCost,
}: PredictiveMaintenanceContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [riskFilter, setRiskFilter] = useState(
    searchParams.get("risk") || "all"
  );
  const [sortBy, setSortBy] = useState<"risk" | "overdue" | "cost">(
    (searchParams.get("sort") as "risk" | "overdue" | "cost") || "risk"
  );
  const [expandedFlat, setExpandedFlat] = useState<string | null>(null);

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`/pm/predictive-maintenance?${params.toString()}`, {
      scroll: false,
    });
  };

  // Filter predictions
  let filtered = flatPredictions;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (f) =>
        f.flatNumber.toLowerCase().includes(q) ||
        f.ownerName.toLowerCase().includes(q)
    );
  }
  if (riskFilter !== "all") {
    filtered = filtered.filter((f) => f.riskLevel === riskFilter);
  }

  // Sort
  if (sortBy === "overdue") {
    filtered = [...filtered].sort((a, b) => {
      const aMax =
        a.upcomingMaintenance.length > 0
          ? a.upcomingMaintenance[0].daysOverdue
          : -999;
      const bMax =
        b.upcomingMaintenance.length > 0
          ? b.upcomingMaintenance[0].daysOverdue
          : -999;
      return bMax - aMax;
    });
  } else if (sortBy === "cost") {
    filtered = [...filtered].sort(
      (a, b) => b.totalExpenses - a.totalExpenses
    );
  }
  // default (risk) is already sorted

  // Chart data — overdue items by category
  const overdueByCategory = categoryInsights
    .filter((c) => c.overdueFlats > 0)
    .map((c) => ({
      category: c.categoryLabel,
      overdue: c.overdueFlats,
      avgCost: c.avgCost,
    }));

  return (
    <div className="w-full">
      <PageHeader
        title="Predictive Maintenance"
        description="AI-powered maintenance predictions based on repair history patterns"
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          icon={AlertTriangle}
          label="At Risk Flats"
          value={totalAtRisk.toString()}
          sublabel={`of ${totalFlats} total`}
          color={totalAtRisk > 0 ? "text-danger" : "text-success"}
        />
        <SummaryCard
          icon={Clock}
          label="Overdue Services"
          value={totalOverdueItems.toString()}
          sublabel="Past recommended date"
          color={totalOverdueItems > 0 ? "text-warning" : "text-success"}
        />
        <SummaryCard
          icon={IndianRupee}
          label="Est. 90-Day Cost"
          value={formatINR(estimatedUpcomingCost)}
          sublabel="Predicted expenses"
          color="text-info"
        />
        <SummaryCard
          icon={Activity}
          label="Categories Tracked"
          value={categoryInsights.length.toString()}
          sublabel="Service patterns"
          color="text-accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overdue by Category chart */}
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 lg:col-span-2">
          <h3 className="text-h3 text-text-primary mb-1">
            Overdue Services by Category
          </h3>
          <p className="text-caption text-text-secondary mb-4">
            Flats that have exceeded recommended service intervals
          </p>
          <div className="h-[260px]">
            {overdueByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overdueByCategory} layout="vertical" barSize={20}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border-primary, #E5E7EB)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-text-muted, #9CA3AF)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-text-secondary, #6B7280)",
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      name === "overdue"
                        ? `${value} flats`
                        : formatINR(Number(value)),
                      name === "overdue" ? "Overdue Flats" : "Avg Cost",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--color-bg-card, #fff)",
                      border: "1px solid var(--color-border-primary, #E5E7EB)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="overdue" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-caption">
                No overdue services found — all flats are on schedule
              </div>
            )}
          </div>
        </div>

        {/* Category Insights Table */}
        <div className="bg-bg-card border border-border-primary rounded-lg p-6">
          <h3 className="text-h3 text-text-primary mb-1">Service Intervals</h3>
          <p className="text-caption text-text-secondary mb-4">
            Average observed intervals
          </p>
          <div className="space-y-3">
            {categoryInsights.length > 0 ? (
              categoryInsights.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between py-2 border-b border-border-primary last:border-0"
                >
                  <div>
                    <p className="text-body-sm text-text-primary font-medium">
                      {c.categoryLabel}
                    </p>
                    <p className="text-caption text-text-muted">
                      {c.flatsAffected} flats · {c.totalOccurrences} repairs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm text-text-primary font-mono">
                      {c.avgIntervalDays
                        ? `${c.avgIntervalDays}d`
                        : "-"}
                    </p>
                    <p className="text-caption text-text-muted">
                      avg ₹{c.avgCost.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-text-muted text-caption">
                No maintenance data yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search flat number or owner..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateURL({ q: e.target.value });
            }}
            className="pl-9 bg-bg-card border-border-primary"
          />
        </div>
        <Select
          value={riskFilter}
          onValueChange={(v) => {
            setRiskFilter(v);
            updateURL({ risk: v });
          }}
        >
          <SelectTrigger className="w-[160px] bg-bg-card border-border-primary">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent className="bg-bg-card border-border-primary">
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(v) => {
            setSortBy(v as "risk" | "overdue" | "cost");
            updateURL({ sort: v });
          }}
        >
          <SelectTrigger className="w-[160px] bg-bg-card border-border-primary">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-bg-card border-border-primary">
            <SelectItem value="risk">Risk Score</SelectItem>
            <SelectItem value="overdue">Most Overdue</SelectItem>
            <SelectItem value="cost">Total Cost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Flat Predictions List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((flat) => (
            <FlatPredictionCard
              key={flat.flatId}
              flat={flat}
              expanded={expandedFlat === flat.flatId}
              onToggle={() =>
                setExpandedFlat(
                  expandedFlat === flat.flatId ? null : flat.flatId
                )
              }
            />
          ))
        ) : (
          <div className="bg-bg-card border border-border-primary rounded-lg p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-body text-text-secondary">
              {flatPredictions.length === 0
                ? "No maintenance history found. Record expenses to enable predictions."
                : "No flats match the current filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FlatPredictionCard({
  flat,
  expanded,
  onToggle,
}: {
  flat: FlatPrediction;
  expanded: boolean;
  onToggle: () => void;
}) {
  const risk = RISK_CONFIG[flat.riskLevel];
  const overdueCount = flat.upcomingMaintenance.filter(
    (m) => m.daysOverdue > 0
  ).length;

  return (
    <div className="bg-bg-card border border-border-primary rounded-lg overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-bg-hover transition-colors text-left"
      >
        {/* Risk Badge */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center ${risk.bg}`}
        >
          <span className={`text-h3 font-bold ${risk.color}`}>
            {flat.riskScore}
          </span>
        </div>

        {/* Flat Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-mono font-semibold text-text-primary">
              {flat.flatNumber}
            </span>
            <span
              className={`text-caption font-medium px-2 py-0.5 rounded-full ${risk.bg} ${risk.color}`}
            >
              {risk.label}
            </span>
            <span className="text-caption text-text-muted">
              {flat.bhkType} BHK
            </span>
          </div>
          <p className="text-caption text-text-secondary truncate">
            {flat.ownerName}
            {overdueCount > 0 && (
              <span className="text-danger ml-2">
                · {overdueCount} overdue service{overdueCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Summary stats */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="text-right">
            <p className="text-caption text-text-muted">Repairs</p>
            <p className="text-body-sm text-text-primary font-medium">
              {flat.expenseCount}
            </p>
          </div>
          <div className="text-right">
            <p className="text-caption text-text-muted">Total Spent</p>
            <p className="text-body-sm text-text-primary font-medium">
              ₹{flat.totalExpenses.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Expand chevron */}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-text-muted flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-muted flex-shrink-0" />
        )}
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-border-primary px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Maintenance Timeline */}
            <div>
              <h4 className="text-body-sm font-semibold text-text-primary mb-3">
                Maintenance Predictions
              </h4>
              {flat.upcomingMaintenance.length > 0 ? (
                <div className="space-y-2">
                  {flat.upcomingMaintenance.map((m) => (
                    <MaintenanceItem key={m.category} prediction={m} />
                  ))}
                </div>
              ) : (
                <p className="text-caption text-text-muted py-3">
                  No predictable maintenance patterns yet
                </p>
              )}
            </div>

            {/* Recent Repairs */}
            <div>
              <h4 className="text-body-sm font-semibold text-text-primary mb-3">
                Recent Repairs
              </h4>
              {flat.recentRepairs.length > 0 ? (
                <div className="space-y-2">
                  {flat.recentRepairs.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 border-b border-border-primary last:border-0"
                    >
                      <div>
                        <p className="text-body-sm text-text-primary">
                          {r.category}
                        </p>
                        <p className="text-caption text-text-muted">
                          {new Date(r.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span className="text-body-sm font-mono text-text-primary">
                        ₹{r.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-caption text-text-muted py-3">
                  No recent repairs
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MaintenanceItem({ prediction }: { prediction: CategoryPrediction }) {
  const isOverdue = prediction.daysOverdue > 0;
  const urgency = RISK_CONFIG[prediction.urgency];

  return (
    <div className="flex items-start gap-3 py-2 border-b border-border-primary last:border-0">
      {/* Status indicator */}
      <div
        className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${
          isOverdue ? "bg-danger animate-pulse" : prediction.urgency === "medium" ? "bg-warning" : "bg-success"
        }`}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-text-primary font-medium">
            {prediction.categoryLabel}
          </span>
          <span
            className={`text-caption font-medium px-1.5 py-0.5 rounded ${urgency.bg} ${urgency.color}`}
          >
            {isOverdue
              ? `${prediction.daysOverdue}d overdue`
              : prediction.daysOverdue > -30
              ? `Due in ${Math.abs(prediction.daysOverdue)}d`
              : `${Math.abs(prediction.daysOverdue)}d remaining`}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-caption text-text-muted">
            Last:{" "}
            {prediction.lastServiceDate
              ? new Date(prediction.lastServiceDate).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short", year: "2-digit" }
                )
              : "Never"}
          </span>
          <span className="text-caption text-text-muted">
            Interval: {prediction.expectedIntervalDays}d
          </span>
          <span className="text-caption text-text-muted">
            {prediction.occurrences} repair{prediction.occurrences > 1 ? "s" : ""}
          </span>
          <span className="text-caption text-text-muted font-mono">
            ~₹{prediction.avgCost.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel: string;
  color: string;
}) {
  return (
    <div className="bg-bg-card border border-border-primary rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 text-text-muted" />
      </div>
      <p className={`text-h2 font-bold ${color}`}>{value}</p>
      <p className="text-caption text-text-muted">{label}</p>
      <p className="text-caption text-text-secondary mt-1">{sublabel}</p>
    </div>
  );
}
