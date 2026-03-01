"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowLeft,
  ArrowRight,
  Download,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { bulkRecordRentPayments } from "./actions";

// ---------- Types ----------

interface FlatInfo {
  id: string;
  flat_number: string;
  inclusive_rent: number;
  community_name: string | null;
  owner_name: string | null;
}

interface ColumnMapping {
  flat_number: string;
  amount: string;
  date: string;
  reference: string;
  remarks: string;
}

type MatchConfidence = "exact" | "partial" | "none";

interface MatchedRow {
  rowIndex: number;
  csvFlatValue: string;
  matchedFlat: FlatInfo | null;
  confidence: MatchConfidence;
  amount: number;
  date: string;
  reference: string;
  remarks: string;
  included: boolean;
}

type Step = "upload" | "mapping" | "matching" | "result";

interface BulkRentContentProps {
  flats: FlatInfo[];
}

// ---------- CSV Parser (reused from import-content pattern) ----------

function parseCSV(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return null;
  }

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim());

  const rows = lines
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

  return { headers, rows };
}

// ---------- Smart column detection ----------

function detectColumn(headers: string[], patterns: string[]): string {
  const normalized = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const pattern of patterns) {
    const idx = normalized.findIndex((h) => h === pattern);
    if (idx >= 0) return headers[idx];
  }
  for (const pattern of patterns) {
    const idx = normalized.findIndex((h) => h.includes(pattern));
    if (idx >= 0) return headers[idx];
  }
  return "";
}

function autoDetectMapping(headers: string[]): ColumnMapping {
  return {
    flat_number: detectColumn(headers, [
      "flatnumber",
      "flatno",
      "flat",
      "unit",
      "unitnumber",
      "apartment",
      "doorno",
    ]),
    amount: detectColumn(headers, [
      "amount",
      "credit",
      "deposit",
      "creditamount",
      "paidamount",
      "rentamount",
      "total",
    ]),
    date: detectColumn(headers, [
      "date",
      "paymentdate",
      "transactiondate",
      "txndate",
      "valuedate",
      "postingdate",
    ]),
    reference: detectColumn(headers, [
      "reference",
      "referenceno",
      "utr",
      "utrnumber",
      "transactionid",
      "txnid",
      "chequeno",
      "refno",
    ]),
    remarks: detectColumn(headers, [
      "remarks",
      "narration",
      "description",
      "particulars",
      "details",
      "notes",
      "memo",
    ]),
  };
}

// ---------- Flat matching ----------

function matchFlat(
  value: string,
  flats: FlatInfo[]
): { flat: FlatInfo | null; confidence: MatchConfidence } {
  if (!value || !value.trim()) return { flat: null, confidence: "none" };

  const cleaned = value.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  // Exact match on flat_number
  const exact = flats.find(
    (f) => f.flat_number.toLowerCase() === cleaned ||
      f.flat_number.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === cleaned
  );
  if (exact) return { flat: exact, confidence: "exact" };

  // Contains match -- CSV value contains a flat number, or flat number is in the CSV value
  const partial = flats.find(
    (f) => {
      const fn = f.flat_number.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      return cleaned.includes(fn) || fn.includes(cleaned);
    }
  );
  if (partial) return { flat: partial, confidence: "partial" };

  return { flat: null, confidence: "none" };
}

// ---------- Date parsing helper ----------

function parseDate(value: string): string {
  if (!value) return "";
  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = value.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Try MM/DD/YYYY
  const mdyMatch = value.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (mdyMatch) {
    // Already handled above; ambiguous formats default to DD/MM/YYYY
  }
  // Try Date constructor as fallback
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return value;
}

// ---------- Amount parsing helper ----------

function parseAmount(value: string): number {
  if (!value) return 0;
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[₹$,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ---------- Component ----------

export function BulkRentContent({ flats }: BulkRentContentProps) {
  const [step, setStep] = useState<Step>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    flat_number: "",
    amount: "",
    date: "",
    reference: "",
    remarks: "",
  });
  const [matchedRows, setMatchedRows] = useState<MatchedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // ---- Step 1: Upload ----

  const handleFileParsed = useCallback(
    (text: string) => {
      const parsed = parseCSV(text);
      if (!parsed) {
        toast.error("CSV must have at least a header row and one data row");
        return;
      }
      setCsvHeaders(parsed.headers);
      setCsvRows(parsed.rows);
      setMapping(autoDetectMapping(parsed.headers));
      setStep("mapping");
      setResult(null);
    },
    []
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        file.text().then(handleFileParsed);
      } else {
        toast.error("Please upload a .csv file");
      }
    },
    [handleFileParsed]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        file.text().then(handleFileParsed);
      }
    },
    [handleFileParsed]
  );

  // ---- Step 2: Column Mapping ----

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedToMatch = mapping.flat_number && mapping.amount && mapping.date;

  const performMatching = useCallback(() => {
    const flatNumIdx = csvHeaders.indexOf(mapping.flat_number);
    const amountIdx = csvHeaders.indexOf(mapping.amount);
    const dateIdx = csvHeaders.indexOf(mapping.date);
    const refIdx = mapping.reference ? csvHeaders.indexOf(mapping.reference) : -1;
    const remarksIdx = mapping.remarks ? csvHeaders.indexOf(mapping.remarks) : -1;

    const rows: MatchedRow[] = csvRows.map((row, i) => {
      const csvFlatValue = flatNumIdx >= 0 ? row[flatNumIdx] ?? "" : "";
      const { flat, confidence } = matchFlat(csvFlatValue, flats);
      const amount = parseAmount(amountIdx >= 0 ? row[amountIdx] ?? "" : "");
      const date = parseDate(dateIdx >= 0 ? row[dateIdx] ?? "" : "");
      const reference = refIdx >= 0 ? row[refIdx] ?? "" : "";
      const remarks = remarksIdx >= 0 ? row[remarksIdx] ?? "" : "";

      return {
        rowIndex: i,
        csvFlatValue,
        matchedFlat: flat,
        confidence,
        amount,
        date,
        reference,
        remarks,
        included: confidence !== "none" && amount > 0 && date !== "",
      };
    });

    setMatchedRows(rows);
    setStep("matching");
  }, [csvHeaders, csvRows, mapping, flats]);

  // ---- Step 3: Smart Matching ----

  const updateRowFlat = (rowIndex: number, flatId: string) => {
    setMatchedRows((prev) =>
      prev.map((row) => {
        if (row.rowIndex !== rowIndex) return row;
        const flat = flats.find((f) => f.id === flatId) ?? null;
        return {
          ...row,
          matchedFlat: flat,
          confidence: flat ? "exact" : "none",
          included: flat !== null && row.amount > 0 && row.date !== "",
        };
      })
    );
  };

  const toggleRowIncluded = (rowIndex: number) => {
    setMatchedRows((prev) =>
      prev.map((row) =>
        row.rowIndex === rowIndex ? { ...row, included: !row.included } : row
      )
    );
  };

  const filteredMatchedRows = useMemo(() => {
    if (!searchFilter) return matchedRows;
    const q = searchFilter.toLowerCase();
    return matchedRows.filter(
      (row) =>
        row.csvFlatValue.toLowerCase().includes(q) ||
        row.matchedFlat?.flat_number.toLowerCase().includes(q) ||
        row.reference.toLowerCase().includes(q) ||
        row.remarks.toLowerCase().includes(q)
    );
  }, [matchedRows, searchFilter]);

  const includedCount = matchedRows.filter((r) => r.included).length;
  const exactCount = matchedRows.filter((r) => r.confidence === "exact").length;
  const partialCount = matchedRows.filter((r) => r.confidence === "partial").length;
  const noMatchCount = matchedRows.filter((r) => r.confidence === "none").length;

  // ---- Step 4: Import ----

  const handleImport = async () => {
    const toImport = matchedRows.filter(
      (r) => r.included && r.matchedFlat && r.amount > 0 && r.date
    );

    if (toImport.length === 0) {
      toast.error("No valid rows selected for import");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const payments = toImport.map((r) => ({
        flat_id: r.matchedFlat!.id,
        amount: r.amount,
        payment_date: r.date,
        payment_method: "bank_transfer",
        payment_reference: r.reference || undefined,
        remarks: r.remarks || undefined,
      }));

      const res = await bulkRecordRentPayments(payments);
      setResult(res);
      setStep("result");

      if (res.imported > 0) {
        toast.success(`Successfully imported ${res.imported} payments`);
      }
      if (res.failed > 0) {
        toast.error(`${res.failed} payments failed`);
      }
    } catch {
      toast.error("Import failed unexpectedly");
    } finally {
      setImporting(false);
    }
  };

  const resetAll = () => {
    setStep("upload");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({ flat_number: "", amount: "", date: "", reference: "", remarks: "" });
    setMatchedRows([]);
    setResult(null);
    setSearchFilter("");
  };

  const downloadTemplate = () => {
    const csv = [
      "flat_number,amount,date,reference,remarks",
      "3154,56000,2026-01-05,UTR123456789,Jan rent",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_rent_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Render ----------

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/pm/rent"
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-h2 text-text-primary">Bulk Rent Import</h1>
          </div>
          <p className="text-body-sm text-text-secondary ml-8">
            Import bank statement CSV to auto-match payments to flats
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-1.5" />
          Template
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(["upload", "mapping", "matching", "result"] as Step[]).map(
          (s, idx) => (
            <div key={s} className="flex items-center gap-2">
              {idx > 0 && (
                <div
                  className={`h-px w-8 ${
                    stepIndex(step) >= idx
                      ? "bg-accent"
                      : "bg-border-primary"
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium transition-colors ${
                  step === s
                    ? "bg-accent text-white"
                    : stepIndex(step) > idx
                      ? "bg-accent/10 text-accent"
                      : "bg-bg-elevated text-text-muted"
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-current/20">
                  {stepIndex(step) > idx ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    idx + 1
                  )}
                </span>
                {s === "upload"
                  ? "Upload"
                  : s === "mapping"
                    ? "Map Columns"
                    : s === "matching"
                      ? "Match & Review"
                      : "Done"}
              </div>
            </div>
          )
        )}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-border-primary rounded-lg p-12 text-center hover:border-accent/50 transition-colors"
          >
            <Upload className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-body-sm text-text-secondary">
              Drag & drop your bank statement CSV here, or{" "}
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
            <p className="text-caption text-text-muted mt-1">
              Supports most bank statement formats (CSV)
            </p>
          </div>

          <div className="bg-bg-card border border-border-primary rounded-lg p-4">
            <h3 className="text-body-sm font-medium text-text-primary mb-2">
              How it works
            </h3>
            <ol className="text-caption text-text-secondary space-y-1.5 list-decimal list-inside">
              <li>Upload a CSV file (bank statement or custom format)</li>
              <li>Map the CSV columns to the required fields</li>
              <li>
                Review auto-matched payments -- flat numbers are matched
                automatically
              </li>
              <li>Fix any unmatched rows manually and import</li>
            </ol>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === "mapping" && (
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-body-sm font-medium text-text-primary">
                Map CSV Columns
              </h3>
              <span className="text-caption text-text-muted">
                {csvRows.length} rows detected
              </span>
            </div>
            <p className="text-caption text-text-secondary mb-4">
              We auto-detected some mappings. Please verify and adjust if
              needed.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MappingField
                label="Flat Number"
                required
                value={mapping.flat_number}
                options={csvHeaders}
                onChange={(v) => updateMapping("flat_number", v)}
              />
              <MappingField
                label="Amount"
                required
                value={mapping.amount}
                options={csvHeaders}
                onChange={(v) => updateMapping("amount", v)}
              />
              <MappingField
                label="Date"
                required
                value={mapping.date}
                options={csvHeaders}
                onChange={(v) => updateMapping("date", v)}
              />
              <MappingField
                label="Reference / UTR"
                value={mapping.reference}
                options={csvHeaders}
                onChange={(v) => updateMapping("reference", v)}
              />
              <MappingField
                label="Remarks"
                value={mapping.remarks}
                options={csvHeaders}
                onChange={(v) => updateMapping("remarks", v)}
              />
            </div>
          </div>

          {/* CSV Preview */}
          <div className="bg-bg-card border border-border-primary rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border-primary">
              <h3 className="text-body-sm font-medium text-text-primary">
                CSV Preview (first 5 rows)
              </h3>
            </div>
            <div className="overflow-auto max-h-60">
              <table className="w-full text-caption">
                <thead className="bg-bg-elevated sticky top-0">
                  <tr>
                    {csvHeaders.map((h) => (
                      <th
                        key={h}
                        className={`px-3 py-2 text-left font-medium whitespace-nowrap ${
                          Object.values(mapping).includes(h)
                            ? "text-accent"
                            : "text-text-muted"
                        }`}
                      >
                        {h}
                        {mapping.flat_number === h && " (Flat)"}
                        {mapping.amount === h && " (Amount)"}
                        {mapping.date === h && " (Date)"}
                        {mapping.reference === h && " (Ref)"}
                        {mapping.remarks === h && " (Remarks)"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-border-primary">
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
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={resetAll}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <Button
              onClick={performMatching}
              disabled={!canProceedToMatch}
            >
              Match Payments
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Smart Matching / Preview */}
      {step === "matching" && (
        <div className="space-y-4">
          {/* Match summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              label="Total Rows"
              value={matchedRows.length}
              color="text-text-primary"
            />
            <SummaryCard
              label="Exact Match"
              value={exactCount}
              color="text-green-500"
            />
            <SummaryCard
              label="Partial Match"
              value={partialCount}
              color="text-yellow-500"
            />
            <SummaryCard
              label="No Match"
              value={noMatchCount}
              color="text-red-500"
            />
          </div>

          {/* Search + actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search rows..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg-card border border-border-primary text-body-sm text-text-primary placeholder:text-text-muted"
              />
            </div>
            <span className="text-caption text-text-muted">
              {includedCount} of {matchedRows.length} rows selected for import
            </span>
          </div>

          {/* Match table */}
          <div className="bg-bg-card border border-border-primary rounded-lg overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border-primary bg-bg-elevated">
                  <th className="px-3 py-2.5 text-left text-caption text-text-muted font-medium w-10">
                    <input
                      type="checkbox"
                      checked={includedCount === matchedRows.length}
                      onChange={() => {
                        const allIncluded =
                          includedCount === matchedRows.length;
                        setMatchedRows((prev) =>
                          prev.map((r) => ({
                            ...r,
                            included: !allIncluded && r.matchedFlat !== null && r.amount > 0 && r.date !== "",
                          }))
                        );
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-3 py-2.5 text-left text-caption text-text-muted font-medium">
                    #
                  </th>
                  <th className="px-3 py-2.5 text-left text-caption text-text-muted font-medium">
                    Match
                  </th>
                  <th className="px-3 py-2.5 text-left text-caption text-text-muted font-medium">
                    CSV Value
                  </th>
                  <th className="px-3 py-2.5 text-left text-caption text-text-muted font-medium min-w-[200px]">
                    Matched Flat
                  </th>
                  <th className="px-3 py-2.5 text-right text-caption text-text-muted font-medium">
                    Amount
                  </th>
                  <th className="px-3 py-2.5 text-right text-caption text-text-muted font-medium">
                    Expected Rent
                  </th>
                  <th className="px-3 py-2.5 text-left text-caption text-text-muted font-medium">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-left text-caption text-text-muted font-medium">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMatchedRows.map((row) => {
                  const amountDiff =
                    row.matchedFlat && row.amount > 0
                      ? row.amount - row.matchedFlat.inclusive_rent
                      : 0;
                  const amountMismatch =
                    row.matchedFlat &&
                    row.amount > 0 &&
                    Math.abs(amountDiff) > 0;

                  return (
                    <tr
                      key={row.rowIndex}
                      className={`border-b border-border-primary last:border-0 transition-colors ${
                        row.included
                          ? "hover:bg-bg-hover"
                          : "opacity-50 bg-bg-elevated/30"
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={() => toggleRowIncluded(row.rowIndex)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2 text-caption text-text-muted">
                        {row.rowIndex + 1}
                      </td>
                      <td className="px-3 py-2">
                        <ConfidenceBadge confidence={row.confidence} />
                      </td>
                      <td className="px-3 py-2 text-body-sm text-text-secondary font-mono">
                        {row.csvFlatValue || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {row.confidence === "none" || !row.matchedFlat ? (
                          <Select
                            value={row.matchedFlat?.id ?? ""}
                            onValueChange={(v) =>
                              updateRowFlat(row.rowIndex, v)
                            }
                          >
                            <SelectTrigger className="h-8 text-caption bg-bg-page border-border-primary">
                              <SelectValue placeholder="Select flat..." />
                            </SelectTrigger>
                            <SelectContent>
                              {flats.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.flat_number}
                                  {f.community_name
                                    ? ` (${f.community_name})`
                                    : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-body-sm text-text-primary font-mono font-semibold">
                              {row.matchedFlat.flat_number}
                            </span>
                            {row.matchedFlat.community_name && (
                              <span className="text-caption text-text-muted">
                                {row.matchedFlat.community_name}
                              </span>
                            )}
                            <button
                              onClick={() =>
                                updateRowFlat(row.rowIndex, "")
                              }
                              className="text-text-muted hover:text-text-primary ml-auto"
                              title="Change flat"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td
                        className={`px-3 py-2 text-right text-body-sm font-medium ${
                          amountMismatch
                            ? "text-yellow-600"
                            : "text-text-primary"
                        }`}
                      >
                        {row.amount > 0
                          ? `\u20B9${row.amount.toLocaleString("en-IN")}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-right text-caption text-text-muted">
                        {row.matchedFlat ? (
                          <span>
                            {`\u20B9${row.matchedFlat.inclusive_rent.toLocaleString("en-IN")}`}
                            {amountMismatch && (
                              <span
                                className={`ml-1 ${
                                  amountDiff > 0
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                ({amountDiff > 0 ? "+" : ""}
                                {amountDiff.toLocaleString("en-IN")})
                              </span>
                            )}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2 text-body-sm text-text-secondary">
                        {row.date || "-"}
                      </td>
                      <td className="px-3 py-2 text-caption text-text-muted truncate max-w-[150px]">
                        {row.reference || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {matchedRows.length > 50 && filteredMatchedRows.length === matchedRows.length && (
            <p className="text-caption text-text-muted text-center">
              Showing all {matchedRows.length} rows
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setStep("mapping")}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Mapping
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || includedCount === 0}
            >
              {importing
                ? "Importing..."
                : `Import ${includedCount} Payments`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === "result" && result && (
        <div className="space-y-6">
          <div
            className={`rounded-lg p-6 ${
              result.failed > 0
                ? "bg-yellow-500/10 border border-yellow-500/20"
                : "bg-green-500/10 border border-green-500/20"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              {result.failed > 0 ? (
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              )}
              <div>
                <h3 className="text-body font-medium text-text-primary">
                  Import Complete
                </h3>
                <p className="text-body-sm text-text-secondary">
                  {result.imported} payment{result.imported !== 1 ? "s" : ""}{" "}
                  imported successfully
                  {result.failed > 0 &&
                    `, ${result.failed} failed`}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-caption font-medium text-text-primary">
                  Errors:
                </p>
                <div className="max-h-48 overflow-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <p
                      key={i}
                      className="text-caption text-text-secondary font-mono"
                    >
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/pm/rent">
              <Button>View Rent Payments</Button>
            </Link>
            <Button variant="outline" onClick={resetAll}>
              Import Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Sub-components ----------

function stepIndex(step: Step): number {
  const steps: Step[] = ["upload", "mapping", "matching", "result"];
  return steps.indexOf(step);
}

function MappingField({
  label,
  required,
  value,
  options,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-caption text-text-secondary block mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
        <SelectTrigger className="bg-bg-page border-border-primary h-9">
          <SelectValue placeholder="Select column..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            -- Not mapped --
          </SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: MatchConfidence }) {
  if (confidence === "exact") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Exact
      </span>
    );
  }
  if (confidence === "partial") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600">
        <AlertCircle className="h-3 w-3" />
        Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
      <X className="h-3 w-3" />
      None
    </span>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-bg-card border border-border-primary rounded-lg p-3 text-center">
      <p className={`text-h2 font-semibold ${color}`}>{value}</p>
      <p className="text-caption text-text-muted mt-0.5">{label}</p>
    </div>
  );
}
