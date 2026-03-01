import {
  getExpensesForPrediction,
  getActiveFlatsForPrediction,
} from "@/lib/dal/predictive-maintenance";
import { PredictiveMaintenanceContent } from "./predictive-maintenance-content";

// Known average service intervals (in days) per category.
// Based on common residential maintenance schedules in Indian apartments.
const SERVICE_INTERVALS: Record<string, number> = {
  ac: 180, // 6 months
  geyser: 365, // 1 year
  deep_cleaning: 180, // 6 months
  pest_control: 120, // 4 months
  chimney: 365, // 1 year
  plumbing: 270, // 9 months (recurring issues)
  electrical: 365, // 1 year
  paint: 730, // 2 years
  carpentry: 730, // 2 years
};

const CATEGORY_LABELS: Record<string, string> = {
  deep_cleaning: "Deep Cleaning",
  paint: "Paint Touch Up",
  electrical: "Electrical",
  plumbing: "Plumbing",
  ac: "AC Servicing",
  geyser: "Geyser Repair",
  carpentry: "Carpentry",
  pest_control: "Pest Control",
  chimney: "Chimney",
  other: "Other",
};

export type RiskLevel = "critical" | "high" | "medium" | "low";

export interface FlatPrediction {
  flatId: string;
  flatNumber: string;
  bhkType: string;
  ownerName: string;
  status: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  totalExpenses: number;
  expenseCount: number;
  upcomingMaintenance: CategoryPrediction[];
  recentRepairs: { category: string; date: string; amount: number }[];
}

export interface CategoryPrediction {
  category: string;
  categoryLabel: string;
  lastServiceDate: string | null;
  daysSinceLastService: number | null;
  expectedIntervalDays: number;
  daysOverdue: number; // positive = overdue, negative = days remaining
  predictedNextDate: string | null;
  avgCost: number;
  occurrences: number;
  urgency: RiskLevel;
}

export interface CategoryInsight {
  category: string;
  categoryLabel: string;
  totalOccurrences: number;
  totalCost: number;
  avgCost: number;
  avgIntervalDays: number | null;
  flatsAffected: number;
  overdueFlats: number;
}

export default async function PredictiveMaintenancePage() {
  const [expenses, flats] = await Promise.all([
    getExpensesForPrediction(),
    getActiveFlatsForPrediction(),
  ]);

  const now = new Date();
  const nowMs = now.getTime();

  // Group expenses by flat_id and then by category
  const expensesByFlat = new Map<
    string,
    Map<string, { dates: Date[]; amounts: number[]; descriptions: string[] }>
  >();

  for (const e of expenses) {
    if (!expensesByFlat.has(e.flat_id)) {
      expensesByFlat.set(e.flat_id, new Map());
    }
    const catMap = expensesByFlat.get(e.flat_id)!;
    if (!catMap.has(e.category)) {
      catMap.set(e.category, { dates: [], amounts: [], descriptions: [] });
    }
    const entry = catMap.get(e.category)!;
    entry.dates.push(new Date(e.expense_date));
    entry.amounts.push(e.amount);
    entry.descriptions.push(e.description);
  }

  // Build predictions per flat
  const flatPredictions: FlatPrediction[] = [];

  for (const flat of flats) {
    const flatExpenses = expensesByFlat.get(flat.id);
    const upcomingMaintenance: CategoryPrediction[] = [];
    const recentRepairs: { category: string; date: string; amount: number }[] =
      [];

    let totalExpenses = 0;
    let expenseCount = 0;
    let maxOverdueFraction = 0;

    if (flatExpenses) {
      for (const [category, data] of Array.from(flatExpenses.entries())) {
        const expectedInterval = SERVICE_INTERVALS[category];
        if (!expectedInterval) continue; // skip 'other'

        const sortedDates = [...data.dates].sort(
          (a, b) => a.getTime() - b.getTime()
        );
        const lastDate = sortedDates[sortedDates.length - 1];
        const daysSinceLastService = Math.floor(
          (nowMs - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysOverdue = daysSinceLastService - expectedInterval;

        // Compute actual average interval from history if >=2 data points
        let actualInterval = expectedInterval;
        if (sortedDates.length >= 2) {
          const intervals: number[] = [];
          for (let i = 1; i < sortedDates.length; i++) {
            intervals.push(
              Math.floor(
                (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
          }
          actualInterval = Math.round(
            intervals.reduce((a, b) => a + b, 0) / intervals.length
          );
        }

        const predictedNextMs =
          lastDate.getTime() + actualInterval * 24 * 60 * 60 * 1000;
        const predictedNextDate = new Date(predictedNextMs)
          .toISOString()
          .split("T")[0];

        const avgCost = Math.round(
          data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length
        );

        const overdueFraction = daysOverdue / expectedInterval;
        if (overdueFraction > maxOverdueFraction) {
          maxOverdueFraction = overdueFraction;
        }

        let urgency: RiskLevel = "low";
        if (daysOverdue > expectedInterval * 0.5) urgency = "critical";
        else if (daysOverdue > 0) urgency = "high";
        else if (daysOverdue > -30) urgency = "medium";

        upcomingMaintenance.push({
          category,
          categoryLabel: CATEGORY_LABELS[category] ?? category,
          lastServiceDate: lastDate.toISOString().split("T")[0],
          daysSinceLastService,
          expectedIntervalDays: actualInterval,
          daysOverdue,
          predictedNextDate,
          avgCost,
          occurrences: data.dates.length,
          urgency,
        });

        totalExpenses += data.amounts.reduce((a, b) => a + b, 0);
        expenseCount += data.dates.length;
      }

      // Get most recent 5 repairs for this flat
      const allFlatExpenses = expenses
        .filter((e) => e.flat_id === flat.id)
        .sort(
          (a, b) =>
            new Date(b.expense_date).getTime() -
            new Date(a.expense_date).getTime()
        )
        .slice(0, 5);

      for (const e of allFlatExpenses) {
        recentRepairs.push({
          category: CATEGORY_LABELS[e.category] ?? e.category,
          date: e.expense_date,
          amount: e.amount,
        });
      }
    }

    // Sort upcoming maintenance by urgency (overdue first)
    upcomingMaintenance.sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Calculate flat risk score (0-100)
    let riskScore = 0;
    if (upcomingMaintenance.length > 0) {
      // Base risk from most overdue category
      const worstOverdue = upcomingMaintenance[0].daysOverdue;
      const worstInterval = upcomingMaintenance[0].expectedIntervalDays;
      if (worstOverdue > 0) {
        riskScore += Math.min(60, Math.round((worstOverdue / worstInterval) * 60));
      }
      // Add risk from number of overdue categories
      const overdueCount = upcomingMaintenance.filter(
        (m) => m.daysOverdue > 0
      ).length;
      riskScore += Math.min(20, overdueCount * 7);
      // Add risk from high repair frequency
      if (expenseCount > 10) riskScore += 15;
      else if (expenseCount > 5) riskScore += 10;
      else if (expenseCount > 2) riskScore += 5;
    }

    riskScore = Math.min(100, riskScore);

    let riskLevel: RiskLevel = "low";
    if (riskScore >= 70) riskLevel = "critical";
    else if (riskScore >= 45) riskLevel = "high";
    else if (riskScore >= 20) riskLevel = "medium";

    // Only include flats with some expense history or occupied flats
    if (upcomingMaintenance.length > 0 || flat.status === "occupied") {
      flatPredictions.push({
        flatId: flat.id,
        flatNumber: flat.flat_number,
        bhkType: flat.bhk_type,
        ownerName: (flat.owner as any)?.name ?? "Unknown",
        status: flat.status,
        riskLevel,
        riskScore,
        totalExpenses,
        expenseCount,
        upcomingMaintenance,
        recentRepairs,
      });
    }
  }

  // Sort by risk score descending
  flatPredictions.sort((a, b) => b.riskScore - a.riskScore);

  // Build category insights
  const categoryStatsMap = new Map<
    string,
    {
      totalOccurrences: number;
      totalCost: number;
      intervals: number[];
      flats: Set<string>;
      overdueFlats: number;
    }
  >();

  for (const pred of flatPredictions) {
    for (const m of pred.upcomingMaintenance) {
      if (!categoryStatsMap.has(m.category)) {
        categoryStatsMap.set(m.category, {
          totalOccurrences: 0,
          totalCost: 0,
          intervals: [],
          flats: new Set(),
          overdueFlats: 0,
        });
      }
      const stats = categoryStatsMap.get(m.category)!;
      stats.totalOccurrences += m.occurrences;
      stats.totalCost += m.avgCost * m.occurrences;
      if (m.expectedIntervalDays) stats.intervals.push(m.expectedIntervalDays);
      stats.flats.add(pred.flatId);
      if (m.daysOverdue > 0) stats.overdueFlats++;
    }
  }

  const categoryInsights: CategoryInsight[] = Array.from(
    categoryStatsMap.entries()
  )
    .map(([category, stats]) => ({
      category,
      categoryLabel: CATEGORY_LABELS[category] ?? category,
      totalOccurrences: stats.totalOccurrences,
      totalCost: stats.totalCost,
      avgCost:
        stats.totalOccurrences > 0
          ? Math.round(stats.totalCost / stats.totalOccurrences)
          : 0,
      avgIntervalDays:
        stats.intervals.length > 0
          ? Math.round(
              stats.intervals.reduce((a, b) => a + b, 0) /
                stats.intervals.length
            )
          : null,
      flatsAffected: stats.flats.size,
      overdueFlats: stats.overdueFlats,
    }))
    .sort((a, b) => b.overdueFlats - a.overdueFlats);

  // Summary stats
  const totalAtRisk = flatPredictions.filter(
    (f) => f.riskLevel === "critical" || f.riskLevel === "high"
  ).length;
  const totalOverdueItems = flatPredictions.reduce(
    (sum, f) =>
      sum + f.upcomingMaintenance.filter((m) => m.daysOverdue > 0).length,
    0
  );
  const estimatedUpcomingCost = flatPredictions.reduce(
    (sum, f) =>
      sum +
      f.upcomingMaintenance
        .filter((m) => m.daysOverdue > -90) // due within 90 days
        .reduce((s, m) => s + m.avgCost, 0),
    0
  );

  return (
    <PredictiveMaintenanceContent
      flatPredictions={flatPredictions}
      categoryInsights={categoryInsights}
      totalFlats={flats.length}
      totalAtRisk={totalAtRisk}
      totalOverdueItems={totalOverdueItems}
      estimatedUpcomingCost={estimatedUpcomingCost}
    />
  );
}
