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
import { MaintenanceTrackerPDF } from "@/lib/pdf/maintenance-tracker";
import { downloadPDF } from "@/lib/pdf/download";
import { createDocument } from "@/lib/actions";
import { exportToExcel } from "@/lib/excel/export";

// Quarter options — Indian Financial Year (Apr–Mar)
const QUARTER_OPTIONS = [
  { value: "Q4-FY25", label: "Q4 FY25 (Jan - Mar 2025)" },
  { value: "Q1-FY26", label: "Q1 FY26 (Apr - Jun 2025)" },
  { value: "Q2-FY26", label: "Q2 FY26 (Jul - Sep 2025)" },
  { value: "Q3-FY26", label: "Q3 FY26 (Oct - Dec 2025)" },
  { value: "Q4-FY26", label: "Q4 FY26 (Jan - Mar 2026)" },
];

interface Owner {
  id: string;
  name: string;
}

interface MaintenanceRecord {
  id: string;
  flat_id: string;
  quarter: string;
  maintenance_amount: number;
  previous_pending: number;
  total_amount: number;
  flat_number: string;
  bhk_type: string;
  carpet_area_sft: number;
  owner_id: string;
}

interface BankDetails {
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_holder_name?: string;
  [key: string]: unknown;
}

interface MaintenanceTrackerContentProps {
  owners: Owner[];
  maintenanceRecords: MaintenanceRecord[];
  bankDetails: BankDetails | null;
}

export function MaintenanceTrackerContent({
  owners,
  maintenanceRecords,
  bankDetails,
}: MaintenanceTrackerContentProps) {
  const router = useRouter();
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>([]);
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedOwner = owners.find((o) => o.id === selectedOwnerId);

  const toggleQuarter = (q: string) => {
    setSelectedQuarters((prev) =>
      prev.includes(q) ? prev.filter((v) => v !== q) : [...prev, q]
    );
    setShowPreview(false);
  };

  // Filter maintenance records
  const filteredRecords = useMemo(() => {
    if (!selectedOwnerId || selectedQuarters.length === 0) return [];
    return maintenanceRecords.filter(
      (m) => m.owner_id === selectedOwnerId && selectedQuarters.includes(m.quarter)
    );
  }, [selectedOwnerId, selectedQuarters, maintenanceRecords]);

  // Group by flat, showing each quarter as a column
  const flatRows = useMemo(() => {
    const flatMap = new Map<string, {
      flat_number: string;
      bhk_type: string;
      carpet_area_sft: number;
      quarterly_maintenance: number;
      quarters: Record<string, number>;
      previous_pending: number;
      total: number;
    }>();

    filteredRecords.forEach((rec) => {
      const existing = flatMap.get(rec.flat_number);
      if (existing) {
        existing.quarters[rec.quarter] = rec.maintenance_amount;
        existing.previous_pending += rec.previous_pending;
        existing.total += rec.maintenance_amount + rec.previous_pending;
      } else {
        flatMap.set(rec.flat_number, {
          flat_number: rec.flat_number,
          bhk_type: rec.bhk_type,
          carpet_area_sft: rec.carpet_area_sft,
          quarterly_maintenance: rec.maintenance_amount,
          quarters: { [rec.quarter]: rec.maintenance_amount },
          previous_pending: rec.previous_pending,
          total: rec.maintenance_amount + rec.previous_pending,
        });
      }
    });

    return Array.from(flatMap.values()).sort((a, b) =>
      a.flat_number.localeCompare(b.flat_number)
    );
  }, [filteredRecords]);

  const grandTotal = flatRows.reduce((sum, row) => sum + row.total, 0);

  const [generating, setGenerating] = useState(false);

  const handleExportExcel = async () => {
    if (!selectedOwner || flatRows.length === 0) return;
    try {
      const sortedQuarters = [...selectedQuarters].sort();
      const excelData = flatRows.map((row, idx) => {
        const rowData: Record<string, string | number> = {
          slNo: idx + 1,
          flat_number: row.flat_number,
          bhk_type: row.bhk_type,
          carpet_area_sft: row.carpet_area_sft,
          quarterly_maintenance: row.quarterly_maintenance,
        };
        sortedQuarters.forEach((q) => {
          rowData[q] = row.quarters[q] || 0;
        });
        rowData.previous_pending = row.previous_pending;
        rowData.total = row.total;
        return rowData;
      });

      const columns: { key: string; label: string }[] = [
        { key: "slNo", label: "Sl No" },
        { key: "flat_number", label: "Flat No" },
        { key: "bhk_type", label: "BHK" },
        { key: "carpet_area_sft", label: "SFT" },
        { key: "quarterly_maintenance", label: "Maintenance Amount" },
        ...sortedQuarters.map((q) => ({ key: q, label: q })),
        { key: "previous_pending", label: "Previous Pending" },
        { key: "total", label: "Total" },
      ];

      exportToExcel(excelData, columns, {
        filename: `maintenance-tracker-${selectedOwner.name.replace(/\s+/g, "-").toLowerCase()}`,
        sheetName: "Maintenance Tracker",
      });
      // Auto-save document record
      const excelSaveResult = await createDocument({
        document_type: "maintenance_tracker",
        owner_id: selectedOwner.id,
        period_label: selectedQuarters.sort().join(", "),
        line_items: flatRows.map((row, idx) => ({
          slNo: idx + 1,
          flatNo: row.flat_number,
          maintenance: row.quarterly_maintenance,
          quarters: row.quarters,
          previousPending: row.previous_pending,
          totalAmount: row.total,
        })),
        grand_total: grandTotal,
      });

      if (excelSaveResult.success) {
        toast.success("Excel downloaded and saved to documents");
      } else {
        toast.success("Excel downloaded");
        toast.error(`Failed to save to documents: ${excelSaveResult.error}`);
      }
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
        maintenance: row.quarterly_maintenance,
        q2: row.quarters[selectedQuarters.sort()[0]] || 0,
        q3: row.quarters[selectedQuarters.sort()[1]] || 0,
        previousPending: row.previous_pending,
        totalAmount: row.total,
      }));
      await downloadPDF(
        MaintenanceTrackerPDF({
          date: docDate,
          ownerName: selectedOwner.name,
          lineItems: pdfLineItems,
          grandTotal,
        }),
        `maintenance-tracker-${selectedOwner.name.replace(/\s+/g, "-").toLowerCase()}`
      );
      // Auto-save document record
      const pdfSaveResult = await createDocument({
        document_type: "maintenance_tracker",
        owner_id: selectedOwner.id,
        period_label: selectedQuarters.sort().join(", "),
        line_items: flatRows.map((row, idx) => ({
          slNo: idx + 1,
          flatNo: row.flat_number,
          maintenance: row.quarterly_maintenance,
          quarters: row.quarters,
          previousPending: row.previous_pending,
          totalAmount: row.total,
        })),
        grand_total: grandTotal,
      });

      if (pdfSaveResult.success) {
        toast.success("PDF downloaded and saved to documents");
      } else {
        toast.success("PDF downloaded");
        toast.error(`Failed to save to documents: ${pdfSaveResult.error}`);
      }
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedOwner || flatRows.length === 0) return;
    setSaving(true);
    try {
      const lineItems = flatRows.map((row, idx) => ({
        slNo: idx + 1,
        flatNo: row.flat_number,
        bhk: row.bhk_type,
        sft: row.carpet_area_sft,
        maintenance: row.quarterly_maintenance,
        quarters: row.quarters,
        previousPending: row.previous_pending,
        totalAmount: row.total,
      }));

      const result = await createDocument({
        document_type: "maintenance_tracker",
        owner_id: selectedOwner.id,
        period_label: selectedQuarters.sort().join(", "),
        line_items: lineItems,
        grand_total: grandTotal,
        bank_details: bankDetails,
      });

      if (result.success) {
        toast.success("Maintenance tracker saved as draft");
        router.push("/pm/documents");
      } else {
        toast.error(result.error ?? "Failed to save draft");
      }
    } catch {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
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
          <h2 className="text-h2 text-text-primary">Generate Maintenance Tracker</h2>
          <p className="text-body-sm text-text-secondary">
            Quarterly community maintenance charge summary per owner
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Select Owner & Quarters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label className="text-text-secondary">Document Date</Label>
            <Input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className="bg-bg-page border-border-primary max-w-xs"
            />
          </div>
        </div>

        {/* Quarter selector */}
        <div className="space-y-2">
          <Label className="text-text-secondary">Select Quarters</Label>
          <div className="flex flex-wrap gap-2">
            {QUARTER_OPTIONS.map((q) => (
              <button
                key={q.value}
                onClick={() => toggleQuarter(q.value)}
                className={`px-3 py-1.5 rounded-md text-caption font-medium border transition-colors ${
                  selectedQuarters.includes(q.value)
                    ? "bg-accent text-white border-accent"
                    : "bg-bg-page text-text-secondary border-border-primary hover:border-accent/50"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Maintenance Table */}
      {flatRows.length > 0 && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h3 text-text-primary">Maintenance Summary</h3>
              <p className="text-caption text-text-secondary">
                {flatRows.length} flats · {selectedQuarters.length} quarter(s)
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

          <div className="overflow-x-auto">
            <table className="w-full text-caption">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left py-2 px-3 text-text-muted font-semibold">#</th>
                  <th className="text-left py-2 px-3 text-text-muted font-semibold">Flat No</th>
                  <th className="text-center py-2 px-3 text-text-muted font-semibold">BHK</th>
                  <th className="text-center py-2 px-3 text-text-muted font-semibold">SFT</th>
                  <th className="text-right py-2 px-3 text-text-muted font-semibold">Maintenance</th>
                  {selectedQuarters.sort().map((q) => (
                    <th key={q} className="text-right py-2 px-3 text-text-muted font-semibold">{q}</th>
                  ))}
                  <th className="text-right py-2 px-3 text-text-muted font-semibold">Prev Pending</th>
                  <th className="text-right py-2 px-3 text-text-muted font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {flatRows.map((row, idx) => (
                  <tr key={row.flat_number} className="border-b border-border-subtle hover:bg-bg-hover">
                    <td className="py-2.5 px-3 text-text-muted">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-text-primary font-mono font-medium">{row.flat_number}</td>
                    <td className="py-2.5 px-3 text-text-secondary text-center">{row.bhk_type}</td>
                    <td className="py-2.5 px-3 text-text-secondary text-center">{row.carpet_area_sft}</td>
                    <td className="py-2.5 px-3 text-text-secondary text-right">
                      ₹{row.quarterly_maintenance.toLocaleString("en-IN")}
                    </td>
                    {selectedQuarters.sort().map((q) => (
                      <td key={q} className="py-2.5 px-3 text-text-primary text-right">
                        {row.quarters[q] ? `₹${row.quarters[q].toLocaleString("en-IN")}` : "-"}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-warning text-right">
                      {row.previous_pending > 0
                        ? `₹${row.previous_pending.toLocaleString("en-IN")}`
                        : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-accent text-right font-semibold">
                      ₹{row.total.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-primary bg-bg-elevated/50">
                  <td colSpan={4 + selectedQuarters.length + 1} className="py-3 px-3 text-text-primary font-semibold">
                    GRAND TOTAL
                  </td>
                  <td className="py-3 px-3" />
                  <td className="py-3 px-3 text-right text-accent font-bold">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Full Preview */}
          {showPreview && (
            <div className="border border-border-primary rounded-lg p-6 bg-white text-black space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-semibold text-gray-700">
                  {selectedOwner?.name} RENTAL FLATS MAINTENANCE
                </h3>
                <p className="text-sm text-gray-500">Date: {docDate}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1.5 text-left">S.No</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left">Flat No</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-center">BHK</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-center">SFT</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-right">Maintenance</th>
                      {selectedQuarters.sort().map((q) => (
                        <th key={q} className="border border-gray-300 px-2 py-1.5 text-right">{q}</th>
                      ))}
                      <th className="border border-gray-300 px-2 py-1.5 text-right">Prev Pending</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatRows.map((row, idx) => (
                      <tr key={row.flat_number}>
                        <td className="border border-gray-300 px-2 py-1">{idx + 1}</td>
                        <td className="border border-gray-300 px-2 py-1 font-mono">{row.flat_number}</td>
                        <td className="border border-gray-300 px-2 py-1 text-center">{row.bhk_type}BHK</td>
                        <td className="border border-gray-300 px-2 py-1 text-center">{row.carpet_area_sft}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {row.quarterly_maintenance.toLocaleString("en-IN")}
                        </td>
                        {selectedQuarters.sort().map((q) => (
                          <td key={q} className="border border-gray-300 px-2 py-1 text-right">
                            {row.quarters[q] ? row.quarters[q].toLocaleString("en-IN") : ""}
                          </td>
                        ))}
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {row.previous_pending > 0 ? row.previous_pending.toLocaleString("en-IN") : ""}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right font-medium">
                          {row.total.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={4 + selectedQuarters.length + 1} className="border border-gray-300 px-2 py-2 text-right">
                        GRAND TOTAL:
                      </td>
                      <td className="border border-gray-300 px-2 py-2" />
                      <td className="border border-gray-300 px-2 py-2 text-right">
                        {grandTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
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
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {generating ? "Generating..." : "Generate PDF"}
            </Button>
            <Button
              onClick={handleSaveDraft}
              disabled={saving}
              className="bg-accent hover:bg-accent-light text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Save as Draft"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
