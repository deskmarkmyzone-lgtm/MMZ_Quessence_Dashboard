"use client";

import { PageHeader } from "@/components/shared/page-header";
import {
  Building2, IndianRupee, TrendingUp, TrendingDown,
  Wrench, Calendar
} from "lucide-react";
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

interface AnalyticsContentProps {
  rentPunctuality: RentPunctualityRow[];
  topRepairs: RepairRow[];
  monthlyRentCollection: MonthlyRentRow[];
  occupancyData: OccupancyRow[];
  vacancyImpact: VacancyImpactRow[];
  totalFlats: number;
  occupiedFlats: number;
}

const formatINR = (value: number) => `₹${(value / 1000).toFixed(0)}K`;

export function AnalyticsContent({
  rentPunctuality,
  topRepairs,
  monthlyRentCollection,
  occupancyData,
  vacancyImpact,
  totalFlats,
  occupiedFlats,
}: AnalyticsContentProps) {
  const totalVacancyLoss = vacancyImpact.reduce((sum, v) => sum + v.revenueLost, 0);
  const avgCollectionRate = monthlyRentCollection.length > 0
    ? Math.round(
        monthlyRentCollection.reduce((sum, m) => sum + (m.expected > 0 ? (m.collected / m.expected) * 100 : 0), 0) /
        monthlyRentCollection.length
      )
    : 0;
  const totalExpenses = topRepairs.reduce((sum, r) => sum + r.amount, 0);
  const avgPunctuality = rentPunctuality.length > 0
    ? Math.round(rentPunctuality.reduce((s, r) => s + r.score, 0) / rentPunctuality.length)
    : 0;

  return (
    <div className="w-full">
      <PageHeader
        title="Analytics"
        description="Portfolio insights and performance metrics"
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={Building2}
          label="Occupancy Rate"
          value={totalFlats > 0 ? `${Math.round((occupiedFlats / totalFlats) * 100)}%` : "0%"}
          sublabel={`${occupiedFlats}/${totalFlats} flats`}
          trend="up"
        />
        <KPICard
          icon={IndianRupee}
          label="Avg Collection"
          value={`${avgCollectionRate}%`}
          sublabel="Last 6 months"
          trend={avgCollectionRate >= 90 ? "up" : "down"}
        />
        <KPICard
          icon={Wrench}
          label="Total Repairs"
          value={topRepairs.reduce((sum, r) => sum + r.count, 0).toString()}
          sublabel={`₹${totalExpenses.toLocaleString("en-IN")}`}
          trend="neutral"
        />
        <KPICard
          icon={Calendar}
          label="Avg Punctuality"
          value={`${avgPunctuality}%`}
          sublabel="On-time payments"
          trend={avgPunctuality >= 70 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Rent Collection — Bar Chart */}
        <div className="bg-bg-card border border-border-primary rounded-lg p-6">
          <h3 className="text-h3 text-text-primary mb-1">Monthly Rent Collection</h3>
          <p className="text-caption text-text-secondary mb-4">Collected vs Expected (last 6 months)</p>
          <div className="h-[280px]">
            {monthlyRentCollection.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRentCollection} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary, #E5E7EB)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "var(--text-muted, #9CA3AF)" }}
                    axisLine={{ stroke: "var(--border-primary, #E5E7EB)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatINR}
                    tick={{ fontSize: 11, fill: "var(--text-muted, #9CA3AF)" }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      `₹${Number(value).toLocaleString("en-IN")}`,
                      name === "collected" ? "Collected" : "Expected",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--bg-card, #fff)",
                      border: "1px solid var(--border-primary, #E5E7EB)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--text-primary, #1A1A2E)",
                    }}
                    labelStyle={{ color: "var(--text-secondary, #6B7280)" }}
                  />
                  <Bar dataKey="expected" fill="var(--chart-amber, #F59E0B)" opacity={0.35} radius={[4, 4, 0, 0]} name="expected" />
                  <Bar dataKey="collected" fill="var(--chart-blue, #3B82F6)" radius={[4, 4, 0, 0]} name="collected" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-caption">
                No rent data available yet
              </div>
            )}
          </div>
        </div>

        {/* Top Repair Categories — Horizontal Bar Chart */}
        <div className="bg-bg-card border border-border-primary rounded-lg p-6">
          <h3 className="text-h3 text-text-primary mb-1">Top Repair Categories</h3>
          <p className="text-caption text-text-secondary mb-4">By total cost across all flats</p>
          <div className="h-[280px]">
            {topRepairs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRepairs} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary, #E5E7EB)" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={formatINR}
                    tick={{ fontSize: 11, fill: "var(--text-muted, #9CA3AF)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tick={{ fontSize: 11, fill: "var(--text-secondary, #6B7280)" }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Cost"]}
                    contentStyle={{
                      backgroundColor: "var(--bg-card, #fff)",
                      border: "1px solid var(--border-primary, #E5E7EB)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--text-primary, #1A1A2E)",
                    }}
                    labelStyle={{ color: "var(--text-secondary, #6B7280)" }}
                  />
                  <Bar dataKey="amount" fill="var(--chart-purple, #8B5CF6)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-caption">
                No expense data available yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Occupancy Pie Chart */}
        <div className="bg-bg-card border border-border-primary rounded-lg p-6">
          <h3 className="text-h3 text-text-primary mb-1">Occupancy</h3>
          <p className="text-caption text-text-secondary mb-4">Current portfolio</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {occupancyData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [`${value} flats`, name]}
                  contentStyle={{
                    backgroundColor: "var(--bg-card, #fff)",
                    border: "1px solid var(--border-primary, #E5E7EB)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--text-primary, #1A1A2E)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {occupancyData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-caption">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-text-secondary">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vacancy Revenue Impact */}
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 lg:col-span-2">
          <h3 className="text-h3 text-text-primary mb-1">Vacancy Revenue Impact</h3>
          <p className="text-caption text-text-secondary mb-4">
            Monthly lost revenue from vacant flats · Total: ₹{totalVacancyLoss.toLocaleString("en-IN")}
          </p>
          <div className="h-[200px]">
            {vacancyImpact.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vacancyImpact}>
                  <defs>
                    <linearGradient id="vacancyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-red, #EF4444)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-red, #EF4444)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary, #E5E7EB)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "var(--text-muted, #9CA3AF)" }}
                    axisLine={{ stroke: "var(--border-primary, #E5E7EB)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatINR}
                    tick={{ fontSize: 11, fill: "var(--text-muted, #9CA3AF)" }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      name === "revenueLost"
                        ? `₹${Number(value).toLocaleString("en-IN")}`
                        : `${value} flats`,
                      name === "revenueLost" ? "Revenue Lost" : "Vacant Flats",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--bg-card, #fff)",
                      border: "1px solid var(--border-primary, #E5E7EB)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--text-primary, #1A1A2E)",
                    }}
                    labelStyle={{ color: "var(--text-secondary, #6B7280)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenueLost"
                    stroke="var(--chart-red, #EF4444)"
                    fill="url(#vacancyGradient)"
                    strokeWidth={2}
                    name="revenueLost"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-caption">
                No vacancy data available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Rent Punctuality Ranking */}
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 lg:col-span-2">
          <h3 className="text-h3 text-text-primary mb-1">Rent Punctuality Ranking</h3>
          <p className="text-caption text-text-secondary mb-4">Score based on on-time payments</p>

          <div className="overflow-x-auto">
            {rentPunctuality.length > 0 ? (
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
                  {[...rentPunctuality]
                    .sort((a, b) => b.score - a.score)
                    .map((r, i) => (
                      <tr key={r.flat} className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors">
                        <td className="px-3 py-2.5 text-caption text-text-muted">{i + 1}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-body-sm text-text-primary font-mono font-semibold">{r.flat}</span>
                        </td>
                        <td className="px-3 py-2.5 text-body-sm text-text-primary">{r.tenant}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-caption text-success font-medium">{r.onTime}/6</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-caption text-warning font-medium">{r.late}/6</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-caption text-danger font-medium">{r.unpaid}/6</span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`text-body-sm font-semibold ${
                            r.score >= 80 ? "text-success" : r.score >= 60 ? "text-warning" : "text-danger"
                          }`}>
                            {r.score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-text-muted text-caption">
                No payment data available yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
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
