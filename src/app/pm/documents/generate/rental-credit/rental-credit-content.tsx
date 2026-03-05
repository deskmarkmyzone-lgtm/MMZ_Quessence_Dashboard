"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { RentalCreditReportPDF } from "@/lib/pdf/rental-credit-report";
import { downloadPDF } from "@/lib/pdf/download";
import { createDocument } from "@/lib/actions";
import { exportToExcel } from "@/lib/excel/export";

interface Tenant {
  id: string;
  name: string;
  lease_start_date: string;
  lease_end_date: string;
  monthly_rent: number;
  monthly_inclusive_rent: number;
  monthly_maintenance: number;
  is_active: boolean;
  security_deposit: number;
}

interface Flat {
  id: string;
  flat_number: string;
  bhk_type: string;
  carpet_area_sft: number;
  inclusive_rent: number;
  base_rent: number;
  maintenance_amount: number;
  owner_id: string;
  owner_name: string;
  tenant_name: string;
  tenant_type: string;
  lease_start: string;
  lease_end: string;
  security_deposit: number;
}

interface RentPayment {
  id: string;
  flat_id: string;
  amount: number;
  payment_date: string;
  payment_month: string;
  base_rent_portion: number;
  maintenance_portion: number;
  remarks: string;
}

interface BankDetails {
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_holder_name?: string;
  [key: string]: unknown;
}

interface RentalCreditContentProps {
  flats: Flat[];
  rentPayments: RentPayment[];
  bankDetails: BankDetails | null;
}

export function RentalCreditContent({
  flats,
  rentPayments,
  bankDetails,
}: RentalCreditContentProps) {
  const router = useRouter();
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedFlat = flats.find((f) => f.id === selectedFlatId);
  const payments = useMemo(() => {
    return selectedFlatId
      ? rentPayments
          .filter((p) => p.flat_id === selectedFlatId)
          .sort((a, b) => a.payment_date.localeCompare(b.payment_date))
      : [];
  }, [selectedFlatId, rentPayments]);

  const totalRentCollected = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const [generating, setGenerating] = useState(false);

  const handleExportExcel = async () => {
    if (!selectedFlat || payments.length === 0) return;
    try {
      const excelData = payments.map((p) => ({
        flat_number: selectedFlat.flat_number,
        payment_date: p.payment_date,
        base_rent: p.base_rent_portion,
        maintenance: p.maintenance_portion,
        inclusive_rent: p.amount,
        remarks: p.remarks || "",
      }));

      exportToExcel(excelData, [
        { key: "flat_number", label: "Flat No" },
        { key: "payment_date", label: "Date" },
        { key: "base_rent", label: "Amount (Rent)" },
        { key: "maintenance", label: "Maintenance" },
        { key: "inclusive_rent", label: "Inclusive Rent" },
        { key: "remarks", label: "Remarks" },
      ], {
        filename: `rental-credit-flat-${selectedFlat.flat_number}`,
        sheetName: "Rental Credit Report",
      });
      // Auto-save document record
      await createDocument({
        document_type: "rental_credit_report",
        owner_id: selectedFlat.owner_id,
        period_label: `Flat ${selectedFlat.flat_number} - ${selectedFlat.lease_start} to ${selectedFlat.lease_end}`,
        line_items: payments.map((p) => ({
          payment_date: p.payment_date,
          base_rent: p.base_rent_portion,
          maintenance: p.maintenance_portion,
          inclusive_rent: p.amount,
        })),
        grand_total: totalRentCollected,
      }).catch(() => {});

      toast.success("Excel downloaded and saved to documents");
    } catch {
      toast.error("Failed to export Excel");
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedFlat || payments.length === 0) return;
    setGenerating(true);
    try {
      const totalRent = payments.reduce((sum, p) => sum + p.base_rent_portion, 0);
      const totalMaintenance = payments.reduce((sum, p) => sum + p.maintenance_portion, 0);
      const pdfLineItems = payments.map((p) => ({
        rentReceivedDate: p.payment_date,
        rent: p.base_rent_portion,
        maintenance: p.maintenance_portion,
        incMaintRent: p.amount,
        remarks: p.remarks,
        aorStartDate: p.id === payments[0].id ? selectedFlat.lease_start : undefined,
        aorLastDate: p.id === payments[0].id ? selectedFlat.lease_end : undefined,
      }));
      await downloadPDF(
        RentalCreditReportPDF({
          flatNo: selectedFlat.flat_number,
          ownerName: selectedFlat.owner_name,
          tenantName: selectedFlat.tenant_name,
          bhk: selectedFlat.bhk_type,
          aorStart: selectedFlat.lease_start,
          aorEnd: selectedFlat.lease_end,
          lineItems: pdfLineItems,
          totalRent,
          totalMaintenance,
          totalInclusive: totalRentCollected,
        }),
        `rental-credit-flat-${selectedFlat.flat_number}`
      );
      // Auto-save document record
      await createDocument({
        document_type: "rental_credit_report",
        owner_id: selectedFlat.owner_id,
        period_label: `Flat ${selectedFlat.flat_number} - ${selectedFlat.lease_start} to ${selectedFlat.lease_end}`,
        line_items: payments.map((p) => ({
          payment_date: p.payment_date,
          base_rent: p.base_rent_portion,
          maintenance: p.maintenance_portion,
          inclusive_rent: p.amount,
        })),
        grand_total: totalRentCollected,
      }).catch(() => {});

      toast.success("PDF downloaded and saved to documents");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedFlat || payments.length === 0) return;
    setSaving(true);
    try {
      const lineItems = payments.map((p) => ({
        payment_date: p.payment_date,
        base_rent: p.base_rent_portion,
        maintenance: p.maintenance_portion,
        inclusive_rent: p.amount,
        remarks: p.remarks,
      }));

      const result = await createDocument({
        document_type: "rental_credit_report",
        owner_id: selectedFlat.owner_id,
        period_label: `Flat ${selectedFlat.flat_number} - ${selectedFlat.lease_start} to ${selectedFlat.lease_end}`,
        line_items: lineItems,
        grand_total: totalRentCollected,
        bank_details: bankDetails,
      });

      if (result.success) {
        toast.success("Rental credit report saved as draft");
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
    <div className="max-w-4xl mx-auto">
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
          <h2 className="text-h2 text-text-primary">Generate Rental Credit Report</h2>
          <p className="text-body-sm text-text-secondary">
            Full rent payment history for a flat during the tenancy period
          </p>
        </div>
      </div>

      {/* Flat Selector */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Select Flat</h3>
        <div className="space-y-2">
          <Label className="text-text-secondary">Flat</Label>
          <Select
            value={selectedFlatId}
            onValueChange={(v) => {
              setSelectedFlatId(v);
              setShowPreview(false);
            }}
          >
            <SelectTrigger className="bg-bg-page border-border-primary max-w-md">
              <SelectValue placeholder="Select a flat..." />
            </SelectTrigger>
            <SelectContent>
              {flats.map((flat) => (
                <SelectItem key={flat.id} value={flat.id}>
                  Flat {flat.flat_number} · {flat.bhk_type} BHK · {flat.tenant_name} ({flat.tenant_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFlat && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <p className="text-caption text-text-muted">Tenant</p>
              <p className="text-body-sm text-text-primary font-medium">{selectedFlat.tenant_name}</p>
            </div>
            <div>
              <p className="text-caption text-text-muted">Type</p>
              <p className="text-body-sm text-text-primary">{selectedFlat.tenant_type}</p>
            </div>
            <div>
              <p className="text-caption text-text-muted">Lease Period</p>
              <p className="text-body-sm text-text-primary">{selectedFlat.lease_start} to {selectedFlat.lease_end}</p>
            </div>
            <div>
              <p className="text-caption text-text-muted">Monthly Rent</p>
              <p className="text-body-sm text-accent font-medium">₹{selectedFlat.inclusive_rent.toLocaleString("en-IN")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment History Table */}
      {selectedFlat && payments.length > 0 && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h3 text-text-primary">FLAT NO - {selectedFlat.flat_number}</h3>
              <p className="text-caption text-text-secondary">
                {payments.length} transactions · Total: ₹{totalRentCollected.toLocaleString("en-IN")}
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

          {/* Dashboard table */}
          <div className="overflow-x-auto">
            <table className="w-full text-caption">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left py-2 px-3 text-text-muted font-semibold">Date</th>
                  <th className="text-right py-2 px-3 text-text-muted font-semibold">Rent</th>
                  <th className="text-right py-2 px-3 text-text-muted font-semibold">Maintenance</th>
                  <th className="text-right py-2 px-3 text-text-muted font-semibold">Inc Maint Rent</th>
                  <th className="text-left py-2 px-3 text-text-muted font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {/* Lease start row */}
                <tr className="border-b border-border-subtle bg-bg-elevated/30">
                  <td colSpan={4} className="py-2 px-3 text-text-secondary text-caption italic">
                    AOR Start: {selectedFlat.lease_start}
                  </td>
                  <td className="py-2 px-3 text-text-muted text-caption italic">
                    AOR End: {selectedFlat.lease_end}
                  </td>
                </tr>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border-subtle hover:bg-bg-hover">
                    <td className="py-2.5 px-3 text-text-primary">{p.payment_date}</td>
                    <td className="py-2.5 px-3 text-text-secondary text-right">
                      {p.base_rent_portion > 0 ? `₹${p.base_rent_portion.toLocaleString("en-IN")}` : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary text-right">
                      {p.maintenance_portion > 0 ? `₹${p.maintenance_portion.toLocaleString("en-IN")}` : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-accent text-right font-medium">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-text-muted">{p.remarks || ""}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-primary bg-bg-elevated/50">
                  <td className="py-3 px-3 text-text-primary font-semibold">Total</td>
                  <td className="py-3 px-3" />
                  <td className="py-3 px-3" />
                  <td className="py-3 px-3 text-right text-accent font-bold">
                    ₹{totalRentCollected.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Owner Summary */}
          <div className="border-t border-border-primary pt-4">
            <h4 className="text-body-sm text-text-primary font-semibold mb-3">
              {selectedFlat.owner_name} RENTAL FLATS
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-caption">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left py-2 px-3 text-text-muted font-semibold">#</th>
                    <th className="text-left py-2 px-3 text-text-muted font-semibold">Flat No</th>
                    <th className="text-center py-2 px-3 text-text-muted font-semibold">Occupied</th>
                    <th className="text-center py-2 px-3 text-text-muted font-semibold">Type</th>
                    <th className="text-right py-2 px-3 text-text-muted font-semibold">Rent</th>
                    <th className="text-right py-2 px-3 text-text-muted font-semibold">Maintenance</th>
                    <th className="text-right py-2 px-3 text-text-muted font-semibold">Inc Maint</th>
                  </tr>
                </thead>
                <tbody>
                  {flats.map((f, idx) => (
                    <tr key={f.id} className={`border-b border-border-subtle ${f.id === selectedFlatId ? "bg-accent/5" : "hover:bg-bg-hover"}`}>
                      <td className="py-2 px-3 text-text-muted">{idx + 1}</td>
                      <td className="py-2 px-3 text-text-primary font-mono font-medium">{f.flat_number}</td>
                      <td className="py-2 px-3 text-text-secondary text-center">Yes</td>
                      <td className="py-2 px-3 text-text-secondary text-center">{f.tenant_type}</td>
                      <td className="py-2 px-3 text-text-secondary text-right">₹{f.base_rent.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-text-secondary text-right">₹{f.maintenance_amount.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-accent text-right font-medium">₹{f.inclusive_rent.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Preview */}
          {showPreview && (
            <div className="border border-border-primary rounded-lg p-6 bg-white text-black space-y-4">
              <div className="text-center">
                <h3 className="text-base font-bold">FLAT NO - {selectedFlat.flat_number}</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1.5 text-left">AOR Start Date</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left">Rent Received Date</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-right">Rent</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-right">Maintenance</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-right">Inc Maint Rent</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left">Remarks</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left">AOR Last Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1">{selectedFlat.lease_start}</td>
                      <td className="border border-gray-300 px-2 py-1" />
                      <td className="border border-gray-300 px-2 py-1" />
                      <td className="border border-gray-300 px-2 py-1" />
                      <td className="border border-gray-300 px-2 py-1" />
                      <td className="border border-gray-300 px-2 py-1" />
                      <td className="border border-gray-300 px-2 py-1">{selectedFlat.lease_end}</td>
                    </tr>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="border border-gray-300 px-2 py-1" />
                        <td className="border border-gray-300 px-2 py-1">{p.payment_date}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {p.base_rent_portion > 0 ? p.base_rent_portion.toLocaleString("en-IN") : ""}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {p.maintenance_portion > 0 ? p.maintenance_portion.toLocaleString("en-IN") : ""}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right font-medium">
                          {p.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">{p.remarks}</td>
                        <td className="border border-gray-300 px-2 py-1" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {selectedFlat && payments.length > 0 && (
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
