"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { importFlats, importRentPayments, importExpenses } from "./actions";

type ImportType = "flats" | "rent_payments" | "expenses";

interface ImportContentProps {
  communities: { id: string; name: string }[];
  owners: { id: string; name: string }[];
}

const TEMPLATES: Record<ImportType, { headers: string[]; example: string[] }> =
  {
    flats: {
      headers: [
        "flat_number",
        "bhk_type",
        "carpet_area_sft",
        "base_rent",
        "maintenance_amount",
        "rent_due_day",
      ],
      example: ["3154", "2.5", "1492", "49748", "6252", "1"],
    },
    rent_payments: {
      headers: [
        "flat_number",
        "amount",
        "payment_date",
        "payment_method",
        "payment_status",
        "remarks",
      ],
      example: ["3154", "56000", "2026-01-05", "gpay", "full", "Jan rent"],
    },
    expenses: {
      headers: [
        "flat_number",
        "category",
        "description",
        "amount",
        "expense_date",
        "vendor_name",
      ],
      example: [
        "3154",
        "ac",
        "AC servicing",
        "1800",
        "2026-01-15",
        "Ravi Electricals",
      ],
    },
  };

export function ImportContent({ communities, owners }: ImportContentProps) {
  const [importType, setImportType] = useState<ImportType>("flats");
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [communityId, setCommunityId] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const parseCSV = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      toast.error("CSV must have at least a header row and one data row");
      return;
    }

    const parsedHeaders = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
    const parsedRows = lines
      .slice(1)
      .map((line) => {
        const values: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const ch of line) {
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += ch;
          }
        }
        values.push(current.trim());
        return values;
      })
      .filter((row) => row.some((cell) => cell.length > 0));

    setHeaders(parsedHeaders);
    setRows(parsedRows);
    setResult(null);
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        file.text().then(parseCSV);
      } else {
        toast.error("Please upload a .csv file");
      }
    },
    [parseCSV]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        file.text().then(parseCSV);
      }
    },
    [parseCSV]
  );

  const downloadTemplate = () => {
    const template = TEMPLATES[importType];
    const csv = [template.headers.join(","), template.example.join(",")].join(
      "\n"
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${importType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;

    if (importType === "flats" && (!communityId || !ownerId)) {
      toast.error("Please select a community and owner for flat imports");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const data = rows.map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] ?? "";
        });
        return obj;
      });

      let res;
      if (importType === "flats") {
        res = await importFlats(data, communityId, ownerId);
      } else if (importType === "rent_payments") {
        res = await importRentPayments(data);
      } else {
        res = await importExpenses(data);
      }

      setResult(res);
      if (res.imported > 0) {
        toast.success(`Imported ${res.imported} records`);
      }
      if (res.failed > 0) {
        toast.error(`${res.failed} records failed`);
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-h2 text-text-primary">CSV Import</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Bulk import data from CSV files
        </p>
      </div>

      {/* Import Type Selector */}
      <div className="flex gap-2">
        {(["flats", "rent_payments", "expenses"] as ImportType[]).map(
          (type) => (
            <button
              key={type}
              onClick={() => {
                setImportType(type);
                setRows([]);
                setHeaders([]);
                setResult(null);
              }}
              className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-colors ${
                importType === type
                  ? "bg-accent text-white"
                  : "bg-bg-elevated text-text-secondary hover:text-text-primary"
              }`}
            >
              {type === "flats"
                ? "Flats"
                : type === "rent_payments"
                  ? "Rent Payments"
                  : "Expenses"}
            </button>
          )
        )}
      </div>

      {/* Context Selectors for Flats */}
      {importType === "flats" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-caption text-text-secondary block mb-1">
              Community
            </label>
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-primary text-body-sm text-text-primary"
            >
              <option value="">Select community...</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-caption text-text-secondary block mb-1">
              Owner
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-primary text-body-sm text-text-primary"
            >
              <option value="">Select owner...</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Template Download + Upload */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-1.5" />
          Download Template
        </Button>
        <span className="text-caption text-text-muted">
          {TEMPLATES[importType].headers.join(", ")}
        </span>
      </div>

      {/* Drop Zone */}
      {rows.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-border-primary rounded-lg p-12 text-center hover:border-accent/50 transition-colors"
        >
          <Upload className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">
            Drag & drop a CSV file here, or{" "}
            <label className="text-accent cursor-pointer hover:underline">
              browse
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </p>
          <p className="text-caption text-text-muted mt-1">CSV files only</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              <span className="text-body-sm text-text-primary font-medium">
                {rows.length} rows ready to import
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRows([]);
                setHeaders([]);
                setResult(null);
              }}
            >
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>

          {/* Preview Table */}
          <div className="border border-border-primary rounded-lg overflow-auto max-h-80">
            <table className="w-full text-body-sm">
              <thead className="bg-bg-elevated sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-caption text-text-muted font-medium">
                    #
                  </th>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-caption text-text-muted font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-t border-border-primary">
                    <td className="px-3 py-1.5 text-text-muted">{i + 1}</td>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="px-3 py-1.5 text-text-primary whitespace-nowrap"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
                {rows.length > 20 && (
                  <tr className="border-t border-border-primary">
                    <td
                      colSpan={headers.length + 1}
                      className="px-3 py-2 text-center text-caption text-text-muted"
                    >
                      ... and {rows.length - 20} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Import Button */}
          <div className="flex items-center gap-3">
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importing..." : `Import ${rows.length} Records`}
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.failed > 0
                  ? "bg-warning/10 border border-warning/20"
                  : "bg-success/10 border border-success/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.failed > 0 ? (
                  <AlertCircle className="h-4 w-4 text-warning" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
                <span className="text-body-sm font-medium text-text-primary">
                  {result.imported} imported, {result.failed} failed
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1 mt-2">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <p key={i} className="text-caption text-text-secondary">
                      {err}
                    </p>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-caption text-text-muted">
                      ... and {result.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
