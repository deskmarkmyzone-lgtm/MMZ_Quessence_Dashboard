"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Database,
  Users,
  Home,
  IndianRupee,
  Wrench,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  migrateFlatsAndOwners,
  migrateTenants,
  migrateRentPayments,
  migrateExpenses,
} from "./actions";

type LogEntry = { message: string; type: "info" | "success" | "error" };

export function MigrateContent() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<Record<
    string,
    { imported: number; failed: number }
  > | null>(null);

  const addLog = (entry: LogEntry) => setLogs((prev) => [...prev, entry]);

  const runMigration = async (
    label: string,
    action: () => Promise<{
      imported: number;
      failed: number;
      errors: string[];
    }>
  ) => {
    addLog({ message: `Starting ${label}...`, type: "info" });
    try {
      const result = await action();
      addLog({
        message: `${label}: ${result.imported} imported, ${result.failed} failed`,
        type: result.failed > 0 ? "error" : "success",
      });
      result.errors.forEach((err) =>
        addLog({ message: `  - ${err}`, type: "error" })
      );
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      addLog({ message: `${label} failed: ${msg}`, type: "error" });
      return { imported: 0, failed: 0, errors: [msg] };
    }
  };

  const handleMigrateAll = async () => {
    setRunning(true);
    setLogs([]);
    setSummary(null);

    const results: Record<string, { imported: number; failed: number }> = {};

    const r1 = await runMigration("Flats & Owners", migrateFlatsAndOwners);
    results["Flats & Owners"] = { imported: r1.imported, failed: r1.failed };

    const r2 = await runMigration("Tenants", migrateTenants);
    results["Tenants"] = { imported: r2.imported, failed: r2.failed };

    const r3 = await runMigration("Rent Payments", migrateRentPayments);
    results["Rent Payments"] = { imported: r3.imported, failed: r3.failed };

    const r4 = await runMigration("Expenses", migrateExpenses);
    results["Expenses"] = { imported: r4.imported, failed: r4.failed };

    setSummary(results);
    addLog({ message: "Migration complete!", type: "success" });
    setRunning(false);
  };

  const handleSingle = async (
    label: string,
    action: () => Promise<{
      imported: number;
      failed: number;
      errors: string[];
    }>
  ) => {
    setRunning(true);
    setLogs([]);
    setSummary(null);
    const r = await runMigration(label, action);
    setSummary({ [label]: { imported: r.imported, failed: r.failed } });
    setRunning(false);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <Link
          href="/pm/import"
          className="text-caption text-accent hover:underline"
        >
          &larr; Back to Import
        </Link>
        <h1 className="text-h2 text-text-primary mt-2">Data Migration</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Import data from the old Supabase project
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-5">
        <div className="flex items-start gap-3">
          <Database className="h-5 w-5 text-accent mt-0.5" />
          <div>
            <h3 className="text-body-sm text-text-primary font-medium">
              Old Database
            </h3>
            <p className="text-caption text-text-muted mt-1">
              Source: rsqvusfanywhzqryzqck.supabase.co
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-text-muted" />
                <span className="text-caption text-text-secondary">Flats</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-text-muted" />
                <span className="text-caption text-text-secondary">
                  Tenants
                </span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-text-muted" />
                <span className="text-caption text-text-secondary">
                  Rent Payments
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-text-muted" />
                <span className="text-caption text-text-secondary">
                  Maintenance
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleMigrateAll} disabled={running}>
          {running ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Migrate All
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            handleSingle("Flats & Owners", migrateFlatsAndOwners)
          }
          disabled={running}
        >
          Flats & Owners
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSingle("Tenants", migrateTenants)}
          disabled={running}
        >
          Tenants
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSingle("Rent Payments", migrateRentPayments)}
          disabled={running}
        >
          Rent Payments
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSingle("Expenses", migrateExpenses)}
          disabled={running}
        >
          Expenses
        </Button>
      </div>

      {/* Log */}
      {logs.length > 0 && (
        <div className="bg-bg-elevated border border-border-primary rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-caption space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2">
              {log.type === "success" && (
                <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
              )}
              {log.type === "error" && (
                <XCircle className="h-3.5 w-3.5 text-danger mt-0.5 shrink-0" />
              )}
              {log.type === "info" && (
                <Loader2 className="h-3.5 w-3.5 text-info mt-0.5 shrink-0" />
              )}
              <span
                className={
                  log.type === "error"
                    ? "text-danger"
                    : log.type === "success"
                      ? "text-success"
                      : "text-text-secondary"
                }
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-5">
          <h3 className="text-body-sm text-text-primary font-medium mb-3">
            Migration Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary).map(([key, val]) => (
              <div
                key={key}
                className="text-center p-3 bg-bg-elevated rounded-lg"
              >
                <p className="text-h3 text-text-primary">{val.imported}</p>
                <p className="text-caption text-text-muted">{key}</p>
                {val.failed > 0 && (
                  <p className="text-caption text-danger">
                    {val.failed} failed
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
