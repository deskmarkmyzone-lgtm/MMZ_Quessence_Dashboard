"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, Save, Eye, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { ExpensesBillPDF } from "@/lib/pdf/expenses-bill";
import { downloadPDF } from "@/lib/pdf/download";
import { createDocument } from "@/lib/actions";
import { exportToExcel } from "@/lib/excel/export";
import type { ExpenseCategory } from "@/types";

// Category columns for the expense table
const CATEGORY_COLUMNS: {
  key: ExpenseCategory;
  label: string;
  short: string;
}[] = [
  { key: "deep_cleaning", label: "Deep Cleaning", short: "Deep Clean" },
  { key: "paint", label: "Paint Touch Up", short: "Paint" },
  { key: "ac", label: "AC Servicing", short: "AC's" },
  { key: "geyser", label: "Geyser Servicing", short: "Geyser's" },
  { key: "electrical", label: "Electrical", short: "Electrical" },
  { key: "plumbing", label: "Plumbing", short: "Plumbing" },
  { key: "other", label: "Any Other", short: "Other" },
];

// Period options
const PERIOD_OPTIONS = [
  { value: "2025-11_2026-01", label: "Nov 2025 - Jan 2026" },
  { value: "2025-08_2025-10", label: "Aug 2025 - Oct 2025" },
  { value: "2025-05_2025-07", label: "May 2025 - Jul 2025" },
];

interface OwnerRow {
  id: string;
  name: string;
}

interface FlatRow {
  id: string;
  flat_number: string;
  bhk_type: string;
  carpet_area_sft: number;
  owner_id: string;
}

interface ExpenseRow {
  id: string;
  flat_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  vendor_name: string | null;
}

interface BankDetails {
  account_name: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  branch: string;
  pan: string;
}

interface ExpensesContentProps {
  owners: OwnerRow[];
  flats: FlatRow[];
  expenses: ExpenseRow[];
  bankDetails: BankDetails;
}

export function ExpensesContent({
  owners,
  flats,
  expenses,
  bankDetails,
}: ExpensesContentProps) {
  const router = useRouter();
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [billDate, setBillDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedOwner = owners.find((o) => o.id === selectedOwnerId);
  const selectedPeriodLabel =
    PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label || "";

  // Build a lookup from flat_id to flat details (only for selected owner)
  const ownerFlatsMap = useMemo(() => {
    const map = new Map<string, FlatRow>();
    flats
      .filter((f) => f.owner_id === selectedOwnerId)
      .forEach((f) => map.set(f.id, f));
    return map;
  }, [flats, selectedOwnerId]);

  // Filter expenses for selected owner's flats and period
  const filteredExpenses = useMemo(() => {
    if (!selectedOwnerId || !selectedPeriod) return [];
    const [startMonth, endMonth] = selectedPeriod.split("_");
    const startDate = `${startMonth}-01`;
    const endDate = `${endMonth}-31`;

    return expenses.filter((e) => {
      const flat = ownerFlatsMap.get(e.flat_id);
      if (!flat) return false;
      return e.expense_date >= startDate && e.expense_date <= endDate;
    });
  }, [selectedOwnerId, selectedPeriod, expenses, ownerFlatsMap]);

  // Group expenses by flat and pivot by category
  const flatRows = useMemo(() => {
    const flatMap = new Map<
      string,
      {
        flat_number: string;
        bhk_type: string;
        carpet_area_sft: number;
        categories: Record<string, number>;
        remarks: string[];
        total: number;
      }
    >();

    filteredExpenses.forEach((expense) => {
      const flat = ownerFlatsMap.get(expense.flat_id);
      if (!flat) return;

      const existing = flatMap.get(flat.flat_number);
      if (existing) {
        existing.categories[expense.category] =
          (existing.categories[expense.category] || 0) + expense.amount;
        existing.total += expense.amount;
        if (
          expense.description &&
          !existing.remarks.includes(expense.description)
        ) {
          existing.remarks.push(expense.description);
        }
      } else {
        flatMap.set(flat.flat_number, {
          flat_number: flat.flat_number,
          bhk_type: flat.bhk_type,
          carpet_area_sft: flat.carpet_area_sft,
          categories: { [expense.category]: expense.amount },
          remarks: expense.description ? [expense.description] : [],
          total: expense.amount,
        });
      }
    });

    return Array.from(flatMap.values()).sort((a, b) =>
      a.flat_number.localeCompare(b.flat_number)
    );
  }, [filteredExpenses, ownerFlatsMap]);

  // Category totals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    flatRows.forEach((row) => {
      Object.entries(row.categories).forEach(([cat, amt]) => {
        totals[cat] = (totals[cat] || 0) + amt;
      });
    });
    return totals;
  }, [flatRows]);

  const grandTotal = flatRows.reduce((sum, row) => sum + row.total, 0);

  const [generating, setGenerating] = useState(false);

  const handleSaveDraft = async () => {
    if (!selectedOwner || flatRows.length === 0) return;
    setSaving(true);
    try {
      const [startMonth, endMonth] = selectedPeriod.split("_");

      const result = await createDocument({
        document_type: "expenses_bill",
        owner_id: selectedOwner.id,
        period_label: selectedPeriodLabel,
        period_start: `${startMonth}-01`,
        period_end: `${endMonth}-31`,
        grand_total: grandTotal,
        line_items: flatRows.map((row, idx) => ({
          slNo: idx + 1,
          flat_number: row.flat_number,
          bhk_type: row.bhk_type,
          carpet_area_sft: row.carpet_area_sft,
          categories: row.categories,
          remarks: row.remarks,
          total: row.total,
        })),
        bank_details: {
          name: bankDetails.account_name,
          bank: bankDetails.bank_name,
          accountNo: bankDetails.account_number,
          ifsc: bankDetails.ifsc,
          branch: bankDetails.branch,
          pan: bankDetails.pan,
        },
      });

      if (result.success) {
        toast.success("Expenses bill saved as draft");
        router.push("/pm/documents");
      } else {
        toast.error(result.error || "Failed to save draft");
      }
    } catch {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedOwner || flatRows.length === 0) return;
    try {
      const excelData = flatRows.map((row, idx) => ({
        slNo: idx + 1,
        flat_number: row.flat_number,
        bhk_type: row.bhk_type,
        carpet_area_sft: row.carpet_area_sft,
        deep_cleaning: row.categories["deep_cleaning"] || 0,
        paint: row.categories["paint"] || 0,
        ac: row.categories["ac"] || 0,
        geyser: row.categories["geyser"] || 0,
        electrical: row.categories["electrical"] || 0,
        plumbing: row.categories["plumbing"] || 0,
        other: row.categories["other"] || 0,
        remarks: row.remarks.join(", "),
        total: row.total,
      }));

      exportToExcel(excelData, [
        { key: "slNo", label: "Sl No" },
        { key: "flat_number", label: "Flat No" },
        { key: "bhk_type", label: "BHK" },
        { key: "carpet_area_sft", label: "SFT" },
        { key: "deep_cleaning", label: "Deep Cleaning" },
        { key: "paint", label: "Paint Touch Up" },
        { key: "ac", label: "AC Servicing" },
        { key: "geyser", label: "Geyser Servicing" },
        { key: "electrical", label: "Electrical" },
        { key: "plumbing", label: "Plumbing" },
        { key: "other", label: "Other" },
        { key: "remarks", label: "Remarks" },
        { key: "total", label: "Total" },
      ], {
        filename: `expenses-bill-${selectedOwner.name.replace(/\s+/g, "-").toLowerCase()}`,
        sheetName: "Expenses Bill",
      });
      // Auto-save document record
      await createDocument({
        document_type: "expenses_bill",
        owner_id: selectedOwner.id,
        period_label: selectedPeriodLabel,
        grand_total: grandTotal,
        line_items: flatRows.map((row, idx) => ({
          slNo: idx + 1,
          flat_number: row.flat_number,
          categories: row.categories,
          total: row.total,
        })),
      }).catch(() => {});

      toast.success("Excel downloaded and saved to documents");
    } catch {
      toast.error("Failed to export Excel");
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedOwner || flatRows.length === 0) return;
    setGenerating(true);
    try {
      const pdfLineItems = flatRows.map((row, idx) => ({
        slNo: idx + 1,
        flatNo: row.flat_number,
        bhk: row.bhk_type,
        sft: row.carpet_area_sft,
        deepCleaning: row.categories["deep_cleaning"] || 0,
        paintTouchUp: row.categories["paint"] || 0,
        acs: row.categories["ac"] || 0,
        geysers: row.categories["geyser"] || 0,
        anyOther:
          (row.categories["electrical"] || 0) +
          (row.categories["plumbing"] || 0) +
          (row.categories["other"] || 0),
        remarks: row.remarks.join(", "),
      }));
      await downloadPDF(
        ExpensesBillPDF({
          date: billDate,
          ownerName: selectedOwner.name,
          periodLabel: selectedPeriodLabel,
          lineItems: pdfLineItems,
          totals: {
            deepCleaning: categoryTotals["deep_cleaning"] || 0,
            paintTouchUp: categoryTotals["paint"] || 0,
            acs: categoryTotals["ac"] || 0,
            geysers: categoryTotals["geyser"] || 0,
            anyOther:
              (categoryTotals["electrical"] || 0) +
              (categoryTotals["plumbing"] || 0) +
              (categoryTotals["other"] || 0),
          },
          grandTotal,
          bankDetails: {
            name: bankDetails.account_name,
            bank: bankDetails.bank_name,
            accountNo: bankDetails.account_number,
            ifsc: bankDetails.ifsc,
            branch: bankDetails.branch,
            pan: bankDetails.pan,
          },
        }),
        `expenses-bill-${selectedOwner.name.replace(/\s+/g, "-").toLowerCase()}`
      );
      // Auto-save document record
      await createDocument({
        document_type: "expenses_bill",
        owner_id: selectedOwner.id,
        period_label: selectedPeriodLabel,
        grand_total: grandTotal,
        line_items: flatRows.map((row, idx) => ({
          slNo: idx + 1,
          flat_number: row.flat_number,
          categories: row.categories,
          total: row.total,
        })),
      }).catch(() => {});

      toast.success("PDF downloaded and saved to documents");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/pm/documents/generate")}
          className="text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-h2 text-text-primary">
            Generate Flat Expenses Bill
          </h2>
          <p className="text-body-sm text-text-secondary">
            Bill owners for PM-paid repair and maintenance expenses
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Select Owner & Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-text-secondary">Owner</Label>
            <Select
              value={selectedOwnerId}
              onValueChange={(v) => {
                setSelectedOwnerId(v);
                setShowPreview(false);
              }}
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue placeholder="Select owner..." />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Period</Label>
            <Select
              value={selectedPeriod}
              onValueChange={(v) => {
                setSelectedPeriod(v);
                setShowPreview(false);
              }}
            >
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue placeholder="Select period..." />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Bill Date</Label>
            <Input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      {selectedOwnerId && selectedPeriod && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h3 text-text-primary">Expense Breakdown</h3>
              <p className="text-caption text-text-secondary">
                {filteredExpenses.length} expenses across {flatRows.length}{" "}
                flats
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="border-border-primary text-text-secondary"
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? "Hide" : "Show"} Full Preview
            </Button>
          </div>

          {flatRows.length === 0 ? (
            <p className="text-body-sm text-text-muted py-8 text-center">
              No PM-paid expenses found for this owner in the selected period.
            </p>
          ) : (
            <>
              {/* Dashboard-styled summary */}
              <div className="overflow-x-auto">
                <table className="w-full text-caption">
                  <thead>
                    <tr className="border-b border-border-primary">
                      <th className="text-left py-2 px-2 text-text-muted font-semibold">
                        #
                      </th>
                      <th className="text-left py-2 px-2 text-text-muted font-semibold">
                        Flat
                      </th>
                      <th className="text-center py-2 px-2 text-text-muted font-semibold">
                        BHK
                      </th>
                      <th className="text-center py-2 px-2 text-text-muted font-semibold">
                        SFT
                      </th>
                      {CATEGORY_COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className="text-right py-2 px-2 text-text-muted font-semibold"
                        >
                          {col.short}
                        </th>
                      ))}
                      <th className="text-left py-2 px-2 text-text-muted font-semibold">
                        Remarks
                      </th>
                      <th className="text-right py-2 px-2 text-text-muted font-semibold">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatRows.map((row, idx) => (
                      <tr
                        key={row.flat_number}
                        className="border-b border-border-subtle hover:bg-bg-hover"
                      >
                        <td className="py-2.5 px-2 text-text-muted">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-2 text-text-primary font-mono font-medium">
                          {row.flat_number}
                        </td>
                        <td className="py-2.5 px-2 text-text-secondary text-center">
                          {row.bhk_type}
                        </td>
                        <td className="py-2.5 px-2 text-text-secondary text-center">
                          {row.carpet_area_sft}
                        </td>
                        {CATEGORY_COLUMNS.map((col) => (
                          <td
                            key={col.key}
                            className="py-2.5 px-2 text-right text-text-secondary"
                          >
                            {row.categories[col.key]
                              ? `₹${row.categories[col.key].toLocaleString("en-IN")}`
                              : "-"}
                          </td>
                        ))}
                        <td className="py-2.5 px-2 text-text-muted text-xs max-w-[120px] truncate">
                          {row.remarks.join(", ") || "-"}
                        </td>
                        <td className="py-2.5 px-2 text-right text-accent font-semibold">
                          ₹{row.total.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border-primary bg-bg-elevated/50">
                      <td
                        colSpan={4}
                        className="py-3 px-2 text-text-primary font-semibold"
                      >
                        TOTAL
                      </td>
                      {CATEGORY_COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className="py-3 px-2 text-right text-text-primary font-medium"
                        >
                          {categoryTotals[col.key]
                            ? `₹${categoryTotals[col.key].toLocaleString("en-IN")}`
                            : "-"}
                        </td>
                      ))}
                      <td className="py-3 px-2" />
                      <td className="py-3 px-2 text-right text-accent font-bold">
                        ₹{grandTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Full Preview (print-style) */}
              {showPreview && (
                <div className="border border-border-primary rounded-lg p-6 bg-white text-black space-y-4">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold tracking-wide">
                      MARK MY ZONE
                    </h2>
                    <h3 className="text-base font-semibold text-gray-700">
                      {selectedOwner?.name} - FLAT EXPENSES
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedPeriodLabel}
                    </p>
                  </div>

                  <div className="flex justify-end text-sm">
                    <p className="text-gray-500">
                      Date: <span className="text-black">{billDate}</span>
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-2 py-1.5 text-left">
                            Sl
                          </th>
                          <th className="border border-gray-300 px-2 py-1.5 text-left">
                            Flat No
                          </th>
                          <th className="border border-gray-300 px-2 py-1.5 text-center">
                            BHK
                          </th>
                          <th className="border border-gray-300 px-2 py-1.5 text-center">
                            SFT
                          </th>
                          {CATEGORY_COLUMNS.map((col) => (
                            <th
                              key={col.key}
                              className="border border-gray-300 px-2 py-1.5 text-right"
                            >
                              {col.label}
                            </th>
                          ))}
                          <th className="border border-gray-300 px-2 py-1.5 text-left">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {flatRows.map((row, idx) => (
                          <tr key={row.flat_number}>
                            <td className="border border-gray-300 px-2 py-1">
                              {idx + 1}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-mono">
                              {row.flat_number}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {row.bhk_type}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {row.carpet_area_sft}
                            </td>
                            {CATEGORY_COLUMNS.map((col) => (
                              <td
                                key={col.key}
                                className="border border-gray-300 px-2 py-1 text-right"
                              >
                                {row.categories[col.key]
                                  ? row.categories[col.key].toLocaleString(
                                      "en-IN"
                                    )
                                  : ""}
                              </td>
                            ))}
                            <td className="border border-gray-300 px-2 py-1">
                              {row.remarks.join(", ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-semibold">
                          <td
                            colSpan={4}
                            className="border border-gray-300 px-2 py-1.5"
                          >
                            TOTAL AMOUNT
                          </td>
                          {CATEGORY_COLUMNS.map((col) => (
                            <td
                              key={col.key}
                              className="border border-gray-300 px-2 py-1.5 text-right"
                            >
                              {categoryTotals[col.key]
                                ? categoryTotals[col.key].toLocaleString(
                                    "en-IN"
                                  )
                                : ""}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-2 py-1.5" />
                        </tr>
                        <tr className="font-bold">
                          <td
                            colSpan={4 + CATEGORY_COLUMNS.length}
                            className="border border-gray-300 px-2 py-2 text-right"
                          >
                            GRAND TOTAL:
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-right">
                            ₹{grandTotal.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Bank Details */}
                  <div className="border border-gray-300 rounded p-3 text-xs space-y-1">
                    <p className="font-semibold text-gray-700">
                      BANK DETAILS:
                    </p>
                    <p>
                      Name: {bankDetails.account_name} | Bank:{" "}
                      {bankDetails.bank_name}
                    </p>
                    <p>
                      A/C: {bankDetails.account_number} | IFSC:{" "}
                      {bankDetails.ifsc}
                    </p>
                    <p>
                      Branch: {bankDetails.branch} | PAN: {bankDetails.pan}
                    </p>
                  </div>

                  <div className="text-right pt-4">
                    <p className="text-xs text-gray-500">
                      AUTHORISED SIGNATORY
                    </p>
                    <div className="h-8 border-b border-gray-300 w-40 ml-auto mt-1" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Actions */}
      {flatRows.length > 0 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/pm/documents/generate")}
            className="border-border-primary text-text-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="border-border-primary text-text-secondary"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleGeneratePDF}
              disabled={generating}
              className="border-border-primary text-text-secondary"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {generating ? "Generating..." : "Generate PDF"}
            </Button>
            <Button
              onClick={handleSaveDraft}
              disabled={saving}
              className="bg-accent hover:bg-accent-light text-white"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save as Draft"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
