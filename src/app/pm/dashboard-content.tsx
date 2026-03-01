"use client";

import {
  Building2,
  Home,
  IndianRupee,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  TrendingDown,
  TrendingUp,
  FileText,
  ArrowRight,
  Wrench,
  BarChart3,
} from "lucide-react";
import { KPICard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { QuickActions } from "./quick-actions";
import { RecentActivity } from "./recent-activity";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

interface RentPunctualityRow {
  flat: string;
  tenant: string;
  onTime: number;
  late: number;
  unpaid: number;
  score: number;
}

interface RepairRow {
  category: string;
  count: number;
  amount: number;
}

interface MonthlyRentRow {
  month: string;
  collected: number;
  expected: number;
}

interface OccupancyRow {
  name: string;
  value: number;
  color: string;
}

interface VacancyImpactRow {
  month: string;
  revenueLost: number;
  vacantCount: number;
}

interface DashboardContentProps {
  kpis: {
    totalFlats: number;
    occupied: number;
    vacant: number;
    underMaintenance: number;
    rentCollected: number;
    rentExpected: number;
    pendingRents: number;
    totalOwners: number;
  };
  vacantFlats: {
    flat: string;
    owner: string;
    bhk: string;
    vacantSince: string;
    daysVacant: number;
    expectedRent: number;
    revenueLost: number;
    id?: string;
  }[];
  pendingInvoices: {
    id: string;
    number: string;
    owner: string;
    amount: number;
    issuedDate: string;
    daysOutstanding: number;
    status: "overdue" | "pending";
  }[];
  analytics: {
    occupancyData: OccupancyRow[];
    monthlyRentCollection: MonthlyRentRow[];
    topRepairs: RepairRow[];
    rentPunctuality: RentPunctualityRow[];
    vacancyImpact: VacancyImpactRow[];
  };
}

const formatINR = (value: number) => `₹${(value / 1000).toFixed(0)}K`;

export function DashboardContent({ kpis, vacantFlats, pendingInvoices, analytics }: DashboardContentProps) {
  const totalVacancyLoss = vacantFlats.reduce((s, f) => s + f.revenueLost, 0);
  const totalOutstanding = pendingInvoices.reduce((s, i) => s + i.amount, 0);

  // Analytics derived KPIs
  const avgCollectionRate = analytics.monthlyRentCollection.length > 0
    ? Math.round(
        analytics.monthlyRentCollection.reduce((sum, m) => sum + (m.expected > 0 ? (m.collected / m.expected) * 100 : 0), 0) /
        analytics.monthlyRentCollection.length
      )
    : 0;
  const totalRepairCost = analytics.topRepairs.reduce((sum, r) => sum + r.amount, 0);
  const totalRepairCount = analytics.topRepairs.reduce((sum, r) => sum + r.count, 0);
  const avgPunctuality = analytics.rentPunctuality.length > 0
    ? Math.round(analytics.rentPunctuality.reduce((s, r) => s + r.score, 0) / analytics.rentPunctuality.length)
    : 0;
  const totalVacancyImpact = analytics.vacancyImpact.reduce((sum, v) => sum + v.revenueLost, 0);

  const top5Punctuality = [...analytics.rentPunctuality].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="space-y-6 w-full">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Total Flats" value={kpis.totalFlats} icon={Home} color="primary" />
        <KPICard title="Occupied" value={kpis.occupied} icon={CheckCircle2} color="success" />
        <KPICard title="Vacant" value={kpis.vacant} icon={Building2} color="danger" />
        <KPICard
          title="Rent Collected"
          value={kpis.rentCollected}
          icon={IndianRupee}
          prefix="₹"
          color="success"
        />
        <KPICard title="Owners" value={kpis.totalOwners} icon={Users} color="info" />
        <KPICard title="Overdue" value={kpis.pendingRents} icon={AlertTriangle} color="warning" />
      </div>

      {/* Collection Rate Bar */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
          <p className="text-body-sm text-text-primary font-medium">
            Monthly Collection Rate — {new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </p>
          <p className="text-caption text-text-muted shrink-0">
            ₹{kpis.rentCollected.toLocaleString("en-IN")} / ₹{kpis.rentExpected.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="w-full bg-bg-elevated rounded-full h-3">
          <div
            className="bg-accent h-3 rounded-full transition-all duration-700"
            style={{ width: `${kpis.rentExpected > 0 ? Math.round((kpis.rentCollected / kpis.rentExpected) * 100) : 0}%` }}
          />
        </div>
        <p className="text-caption text-text-muted mt-1">
          {kpis.rentExpected > 0 ? Math.round((kpis.rentCollected / kpis.rentExpected) * 100) : 0}% collected
          · ₹{(kpis.rentExpected - kpis.rentCollected).toLocaleString("en-IN")} shortfall
        </p>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>

      {/* ─── Portfolio Insights ─── */}
      <div className="border-t border-border-primary pt-6">
        <div className="flex items-center justify-between mb-5 gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            <h2 className="text-h3 text-text-primary">Portfolio Insights</h2>
          </div>
          <Link href="/pm/analytics" className="text-accent hover:underline text-caption flex items-center gap-1">
            Full analytics <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Analytics KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <AnalyticsKPI
            icon={Building2}
            label="Occupancy Rate"
            value={kpis.totalFlats > 0 ? `${Math.round((kpis.occupied / kpis.totalFlats) * 100)}%` : "0%"}
            sublabel={`${kpis.occupied}/${kpis.totalFlats} flats`}
            trend={kpis.occupied / Math.max(kpis.totalFlats, 1) >= 0.8 ? "up" : "down"}
          />
          <AnalyticsKPI
            icon={IndianRupee}
            label="Avg Collection"
            value={`${avgCollectionRate}%`}
            sublabel="Last 6 months"
            trend={avgCollectionRate >= 90 ? "up" : "down"}
          />
          <AnalyticsKPI
            icon={Wrench}
            label="Total Repairs"
            value={totalRepairCount.toString()}
            sublabel={`₹${totalRepairCost.toLocaleString("en-IN")}`}
            trend="neutral"
          />
          <AnalyticsKPI
            icon={Calendar}
            label="Avg Punctuality"
            value={`${avgPunctuality}%`}
            sublabel="On-time payments"
            trend={avgPunctuality >= 70 ? "up" : "down"}
          />
        </div>

        {/* Charts Row 1: Monthly Rent Collection + Occupancy Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-5 lg:col-span-2">
            <h3 className="text-body-sm text-text-primary font-semibold mb-1">Monthly Rent Collection</h3>
            <p className="text-caption text-text-secondary mb-3">Collected vs Expected (last 6 months)</p>
            <div className="h-[220px]">
              {analytics.monthlyRentCollection.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthlyRentCollection} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary, #E5E7EB)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted, #9CA3AF)" }} axisLine={{ stroke: "var(--border-primary, #E5E7EB)" }} tickLine={false} />
                    <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: "var(--text-muted, #9CA3AF)" }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip
                      formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString("en-IN")}`, name === "collected" ? "Collected" : "Expected"]}
                      contentStyle={{ backgroundColor: "var(--bg-card, #fff)", border: "1px solid var(--border-primary, #E5E7EB)", borderRadius: "8px", fontSize: "12px", color: "var(--text-primary, #1A1A2E)" }}
                      labelStyle={{ color: "var(--text-secondary, #6B7280)" }}
                    />
                    <Bar dataKey="expected" fill="var(--chart-amber, #F59E0B)" opacity={0.35} radius={[4, 4, 0, 0]} name="expected" />
                    <Bar dataKey="collected" fill="var(--chart-blue, #3B82F6)" radius={[4, 4, 0, 0]} name="collected" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted text-caption">No rent data yet</div>
              )}
            </div>
          </div>

          <div className="bg-bg-card border border-border-primary rounded-lg p-5">
            <h3 className="text-body-sm text-text-primary font-semibold mb-1">Occupancy</h3>
            <p className="text-caption text-text-secondary mb-3">Current portfolio</p>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.occupancyData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                    {analytics.occupancyData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} flats`, name]}
                    contentStyle={{ backgroundColor: "var(--bg-card, #fff)", border: "1px solid var(--border-primary, #E5E7EB)", borderRadius: "8px", fontSize: "12px", color: "var(--text-primary, #1A1A2E)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-1">
              {analytics.occupancyData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-caption">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-text-secondary">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2: Repairs + Vacancy Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-5">
            <h3 className="text-body-sm text-text-primary font-semibold mb-1">Top Repair Categories</h3>
            <p className="text-caption text-text-secondary mb-3">By total cost across all flats</p>
            <div className="h-[220px]">
              {analytics.topRepairs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topRepairs} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary, #E5E7EB)" horizontal={false} />
                    <XAxis type="number" tickFormatter={formatINR} tick={{ fontSize: 11, fill: "var(--text-muted, #9CA3AF)" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "var(--text-secondary, #6B7280)" }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip
                      formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Cost"]}
                      contentStyle={{ backgroundColor: "var(--bg-card, #fff)", border: "1px solid var(--border-primary, #E5E7EB)", borderRadius: "8px", fontSize: "12px", color: "var(--text-primary, #1A1A2E)" }}
                      labelStyle={{ color: "var(--text-secondary, #6B7280)" }}
                    />
                    <Bar dataKey="amount" fill="var(--chart-purple, #8B5CF6)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted text-caption">No expense data yet</div>
              )}
            </div>
          </div>

          <div className="bg-bg-card border border-border-primary rounded-lg p-5">
            <h3 className="text-body-sm text-text-primary font-semibold mb-1">Vacancy Revenue Impact</h3>
            <p className="text-caption text-text-secondary mb-3">
              Monthly lost revenue · Total: ₹{totalVacancyImpact.toLocaleString("en-IN")}
            </p>
            <div className="h-[220px]">
              {analytics.vacancyImpact.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.vacancyImpact}>
                    <defs>
                      <linearGradient id="dashVacGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-red, #EF4444)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-red, #EF4444)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary, #E5E7EB)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted, #9CA3AF)" }} axisLine={{ stroke: "var(--border-primary, #E5E7EB)" }} tickLine={false} />
                    <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: "var(--text-muted, #9CA3AF)" }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        name === "revenueLost" ? `₹${Number(value).toLocaleString("en-IN")}` : `${value} flats`,
                        name === "revenueLost" ? "Revenue Lost" : "Vacant Flats",
                      ]}
                      contentStyle={{ backgroundColor: "var(--bg-card, #fff)", border: "1px solid var(--border-primary, #E5E7EB)", borderRadius: "8px", fontSize: "12px", color: "var(--text-primary, #1A1A2E)" }}
                      labelStyle={{ color: "var(--text-secondary, #6B7280)" }}
                    />
                    <Area type="monotone" dataKey="revenueLost" stroke="var(--chart-red, #EF4444)" fill="url(#dashVacGrad)" strokeWidth={2} name="revenueLost" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted text-caption">No vacancy data</div>
              )}
            </div>
          </div>
        </div>

        {/* Rent Punctuality Top 5 */}
        <div className="bg-bg-card border border-border-primary rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div>
              <h3 className="text-body-sm text-text-primary font-semibold">Rent Punctuality Ranking</h3>
              <p className="text-caption text-text-secondary">Top 5 flats by on-time payment score (last 6 months)</p>
            </div>
            <Link href="/pm/analytics" className="text-accent hover:underline text-caption flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {top5Punctuality.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left text-caption text-text-muted font-medium px-3 py-2">#</th>
                    <th className="text-left text-caption text-text-muted font-medium px-3 py-2">Flat</th>
                    <th className="text-left text-caption text-text-muted font-medium px-3 py-2">Tenant</th>
                    <th className="text-center text-caption text-text-muted font-medium px-3 py-2">On Time</th>
                    <th className="text-center text-caption text-text-muted font-medium px-3 py-2">Late</th>
                    <th className="text-center text-caption text-text-muted font-medium px-3 py-2">Unpaid</th>
                    <th className="text-right text-caption text-text-muted font-medium px-3 py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {top5Punctuality.map((r, i) => (
                    <tr key={r.flat} className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors">
                      <td className="px-3 py-2.5 text-caption text-text-muted">{i + 1}</td>
                      <td className="px-3 py-2.5"><span className="text-body-sm text-text-primary font-mono font-semibold">{r.flat}</span></td>
                      <td className="px-3 py-2.5 text-body-sm text-text-primary">{r.tenant}</td>
                      <td className="px-3 py-2.5 text-center"><span className="text-caption text-success font-medium">{r.onTime}/6</span></td>
                      <td className="px-3 py-2.5 text-center"><span className="text-caption text-warning font-medium">{r.late}/6</span></td>
                      <td className="px-3 py-2.5 text-center"><span className="text-caption text-danger font-medium">{r.unpaid}/6</span></td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`text-body-sm font-semibold ${r.score >= 80 ? "text-success" : r.score >= 60 ? "text-warning" : "text-danger"}`}>
                          {r.score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-text-muted text-caption">No payment data available yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Vacancy Tracking + Owner Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vacancy Tracking */}
        <div className="bg-bg-card border border-border-primary rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="min-w-0">
              <h3 className="text-h3 text-text-primary">Vacancy Tracker</h3>
              <p className="text-caption text-text-secondary mt-0.5 truncate">
                {vacantFlats.length} vacant · ₹{totalVacancyLoss.toLocaleString("en-IN")} revenue lost
              </p>
            </div>
            <TrendingDown className="h-5 w-5 text-danger shrink-0" />
          </div>
          <div className="space-y-3">
            {vacantFlats.map((flat) => (
              <Link
                key={flat.id ?? flat.flat}
                href={`/pm/flats/${flat.id ?? flat.flat}`}
                className="flex items-center justify-between gap-3 p-3 bg-bg-elevated rounded-lg hover:bg-bg-hover transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-body-sm text-text-primary font-mono font-semibold">{flat.flat}</span>
                    <span className="text-caption text-text-muted">{flat.bhk} BHK</span>
                    <StatusBadge status="vacant" />
                  </div>
                  <p className="text-caption text-text-muted mt-0.5 truncate">
                    {flat.owner} · Vacant since {flat.vacantSince} ({flat.daysVacant} days)
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-body-sm text-danger font-medium">
                    -₹{flat.revenueLost.toLocaleString("en-IN")}
                  </p>
                  <p className="text-caption text-text-muted">
                    ₹{flat.expectedRent.toLocaleString("en-IN")}/mo
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Owner Payment Tracking */}
        <div className="bg-bg-card border border-border-primary rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="min-w-0">
              <h3 className="text-h3 text-text-primary">Outstanding Invoices</h3>
              <p className="text-caption text-text-secondary mt-0.5 truncate">
                {pendingInvoices.length} pending · ₹{totalOutstanding.toLocaleString("en-IN")} receivable
              </p>
            </div>
            <Link href="/pm/documents" className="text-accent hover:underline text-caption flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingInvoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/pm/documents/${inv.id}`}
                className="flex items-center justify-between gap-3 p-3 bg-bg-elevated rounded-lg hover:bg-bg-hover transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-text-muted shrink-0" />
                    <span className="text-body-sm text-text-primary font-mono truncate">{inv.number}</span>
                  </div>
                  <p className="text-caption text-text-muted mt-0.5 truncate">
                    {inv.owner} · Issued {inv.issuedDate}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-body-sm text-text-primary font-semibold">
                    ₹{inv.amount.toLocaleString("en-IN")}
                  </p>
                  <p className={`text-caption font-medium ${inv.status === "overdue" ? "text-danger" : "text-warning"}`}>
                    {inv.daysOutstanding}d {inv.status === "overdue" ? "overdue" : "outstanding"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsKPI({
  icon: Icon,
  label,
  value,
  sublabel,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel: string;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-bg-card border border-border-primary rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 text-text-muted" />
        {trend === "up" && <TrendingUp className="h-4 w-4 text-success" />}
        {trend === "down" && <TrendingDown className="h-4 w-4 text-danger" />}
      </div>
      <p className="text-h2 text-text-primary font-bold">{value}</p>
      <p className="text-caption text-text-muted">{label}</p>
      <p className="text-caption text-text-secondary mt-1">{sublabel}</p>
    </div>
  );
}
