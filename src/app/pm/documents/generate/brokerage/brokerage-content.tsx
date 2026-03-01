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
import { cn } from "@/lib/utils";
import { calculateBrokerage } from "@/lib/utils/calculations";
import { BrokerageInvoicePDF } from "@/lib/pdf/brokerage-invoice";
import { downloadPDF } from "@/lib/pdf/download";
import { createDocument } from "@/lib/actions";
import { exportToExcel } from "@/lib/excel/export";
import type { BrokerageCalcMethod } from "@/types";

interface OwnerRow {
  id: string;
  name: string;
  email: string;
  brokerage_calc_method: BrokerageCalcMethod;
  brokerage_days: number;
  brokerage_percentage: number | null;
  brokerage_fixed_amount: number | null;
  gst_applicable: boolean;
  family_group_name: string | null;
}

interface EligibleTenant {
  id: string;
  owner_id: string;
  tenant_name: string;
  flat_number: string;
  tower: number;
  bhk_type: string;
  carpet_area_sft: number;
  inclusive_rent: number;
  lease_start: string;
}

interface BankDetails {
  account_name: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  branch: string;
  pan: string;
}

interface BrokerageContentProps {
  owners: OwnerRow[];
  eligibleTenants: EligibleTenant[];
  bankDetails: BankDetails;
}

export function BrokerageContent({
  owners,
  eligibleTenants: allEligibleTenants,
  bankDetails,
}: BrokerageContentProps) {
  const router = useRouter();
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedOwner = owners.find((o) => o.id === selectedOwnerId);

  // Filter eligible tenants for selected owner
  const eligibleTenants = useMemo(() => {
    if (!selectedOwnerId) return [];
    const owner = owners.find((o) => o.id === selectedOwnerId);
    if (!owner) return [];

    if (owner.family_group_name) {
      const familyOwnerIds = owners
        .filter((o) => o.family_group_name === owner.family_group_name)
        .map((o) => o.id);
      return allEligibleTenants.filter((t) =>
        familyOwnerIds.includes(t.owner_id)
      );
    }
    return allEligibleTenants.filter((t) => t.owner_id === selectedOwnerId);
  }, [selectedOwnerId, owners, allEligibleTenants]);

  // Auto-select all eligible tenants when owner changes
  const handleOwnerChange = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    setShowPreview(false);
    const owner = owners.find((o) => o.id === ownerId);
    if (!owner) return;

    let tenants: typeof allEligibleTenants;
    if (owner.family_group_name) {
      const familyOwnerIds = owners
        .filter((o) => o.family_group_name === owner.family_group_name)
        .map((o) => o.id);
      tenants = allEligibleTenants.filter((t) =>
        familyOwnerIds.includes(t.owner_id)
      );
    } else {
      tenants = allEligibleTenants.filter((t) => t.owner_id === ownerId);
    }
    setSelectedTenantIds(tenants.map((t) => t.id));
  };

  const toggleTenant = (tenantId: string) => {
    setSelectedTenantIds((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  // Calculate line items for selected tenants
  const lineItems = useMemo(() => {
    if (!selectedOwner) return [];
    return selectedTenantIds
      .map((tid) => {
        const tenant = eligibleTenants.find((t) => t.id === tid);
        if (!tenant) return null;
        const owner =
          owners.find((o) => o.id === tenant.owner_id) || selectedOwner;
        const method = owner.brokerage_calc_method;
        const value =
          method === "days_of_rent"
            ? owner.brokerage_days
            : method === "percentage"
              ? owner.brokerage_percentage || 0
              : owner.brokerage_fixed_amount || 0;

        const calc = calculateBrokerage(tenant.inclusive_rent, method, value);

        return {
          ...tenant,
          owner_name: owner.name,
          brokerage: calc.brokerage,
          tds: calc.tds,
          net: calc.net,
        };
      })
      .filter(Boolean) as Array<
      EligibleTenant & {
        owner_name: string;
        brokerage: number;
        tds: number;
        net: number;
      }
    >;
  }, [selectedTenantIds, selectedOwner, eligibleTenants, owners]);

  const totals = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => ({
        inclusive_rent: acc.inclusive_rent + item.inclusive_rent,
        brokerage: acc.brokerage + item.brokerage,
        tds: acc.tds + item.tds,
        net: acc.net + item.net,
      }),
      { inclusive_rent: 0, brokerage: 0, tds: 0, net: 0 }
    );
  }, [lineItems]);

  const handleSaveDraft = async () => {
    if (!selectedOwner || lineItems.length === 0) return;
    setSaving(true);
    try {
      const result = await createDocument({
        document_type: "brokerage_invoice",
        owner_id: selectedOwner.id,
        grand_total: totals.brokerage,
        tds_amount: totals.tds,
        line_items: lineItems.map((item, idx) => ({
          slNo: idx + 1,
          tenant_id: item.id,
          tenant_name: item.tenant_name,
          flat_number: item.flat_number,
          tower: item.tower,
          bhk_type: item.bhk_type,
          carpet_area_sft: item.carpet_area_sft,
          inclusive_rent: item.inclusive_rent,
          lease_start: item.lease_start,
          owner_name: item.owner_name,
          brokerage: item.brokerage,
          tds: item.tds,
          net: item.net,
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
        toast.success("Brokerage invoice saved as draft");
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

  const [generating, setGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    if (!selectedOwner || lineItems.length === 0) return;
    setGenerating(true);
    try {
      const pdfLineItems = lineItems.map((item, idx) => ({
        slNo: idx + 1,
        flatOwner: item.owner_name,
        tenant: item.tenant_name,
        tower: item.tower,
        flatNo: item.flat_number,
        bhk: item.bhk_type,
        areaSft: item.carpet_area_sft,
        rentalStart: item.lease_start,
        flatRental: item.inclusive_rent,
        brokerage: item.brokerage,
        tds: item.tds,
        netAmount: item.net,
      }));

      await downloadPDF(
        BrokerageInvoicePDF({
          invoiceNo: "MMZ/INV/2026/0002",
          date: invoiceDate,
          ownerName: selectedOwner.name,
          ownerAddress: "Hyderabad, Telangana",
          communityName: "Prestige High Fields",
          lineItems: pdfLineItems,
          grandTotalBrokerage: totals.brokerage,
          grandTotalTDS: totals.tds,
          grandTotalNet: totals.net,
          bankDetails: {
            name: bankDetails.account_name,
            bank: bankDetails.bank_name,
            accountNo: bankDetails.account_number,
            ifsc: bankDetails.ifsc,
            branch: bankDetails.branch,
            pan: bankDetails.pan,
          },
        }),
        `brokerage-invoice-${selectedOwner.name.replace(/\s+/g, "-").toLowerCase()}`
      );
      toast.success("PDF downloaded successfully");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportExcel = () => {
    if (!selectedOwner || lineItems.length === 0) return;
    try {
      const excelData = lineItems.map((item, idx) => ({
        slNo: idx + 1,
        owner_name: item.owner_name,
        tenant_name: item.tenant_name,
        tower: item.tower,
        flat_number: item.flat_number,
        bhk_type: item.bhk_type,
        carpet_area_sft: item.carpet_area_sft,
        lease_start: item.lease_start,
        inclusive_rent: item.inclusive_rent,
        brokerage: item.brokerage,
        tds: item.tds,
        net: item.net,
      }));

      exportToExcel(excelData, [
        { key: "slNo", label: "Sl No" },
        { key: "owner_name", label: "Flat Owner" },
        { key: "tenant_name", label: "Tenant" },
        { key: "tower", label: "Tower" },
        { key: "flat_number", label: "Flat No" },
        { key: "bhk_type", label: "BHK" },
        { key: "carpet_area_sft", label: "Area (SFT)" },
        { key: "lease_start", label: "Rental Start" },
        { key: "inclusive_rent", label: "Flat Rental" },
        { key: "brokerage", label: "Brokerage" },
        { key: "tds", label: "TDS (2%)" },
        { key: "net", label: "Net Amount" },
      ], {
        filename: `brokerage-invoice-${selectedOwner.name.replace(/\s+/g, "-").toLowerCase()}`,
        sheetName: "Brokerage Invoice",
      });
      toast.success("Excel downloaded successfully");
    } catch {
      toast.error("Failed to export Excel");
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
          <h2 className="text-h2 text-text-primary">
            Generate Brokerage Invoice
          </h2>
          <p className="text-body-sm text-text-secondary">
            One-time fee for new tenant placements with TDS calculation
          </p>
        </div>
      </div>

      {/* Step 1: Select Owner */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
        <h3 className="text-h3 text-text-primary">1. Select Owner</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-text-secondary">Owner / Family Group</Label>
            <Select value={selectedOwnerId} onValueChange={handleOwnerChange}>
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue placeholder="Select an owner..." />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.name}
                    {owner.family_group_name
                      ? ` (${owner.family_group_name})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Invoice Date</Label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="bg-bg-page border-border-primary max-w-xs"
            />
          </div>
        </div>

        {selectedOwner && (
          <div className="flex flex-wrap gap-4 pt-2 text-caption text-text-secondary">
            <span>
              Method:{" "}
              <span className="text-text-primary font-medium">
                {selectedOwner.brokerage_calc_method === "days_of_rent"
                  ? `${selectedOwner.brokerage_days} days of rent`
                  : selectedOwner.brokerage_calc_method === "percentage"
                    ? `${selectedOwner.brokerage_percentage}%`
                    : `Fixed`}
              </span>
            </span>
            <span>
              TDS:{" "}
              <span className="text-text-primary font-medium">2%</span>
            </span>
            <span>
              GST:{" "}
              <span className="text-text-primary font-medium">
                {selectedOwner.gst_applicable ? "Yes" : "N/A"}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Step 2: Select New Tenants */}
      {selectedOwnerId && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-h3 text-text-primary">
              2. New Tenant Placements
            </h3>
            <span className="text-caption text-text-muted">
              {selectedTenantIds.length} of {eligibleTenants.length} selected
            </span>
          </div>

          {eligibleTenants.length === 0 ? (
            <p className="text-body-sm text-text-muted py-4 text-center">
              No new tenant placements found for this owner.
            </p>
          ) : (
            <div className="space-y-3">
              {eligibleTenants.map((tenant) => {
                const isSelected = selectedTenantIds.includes(tenant.id);
                const owner = owners.find(
                  (o) => o.id === tenant.owner_id
                );
                const method =
                  owner?.brokerage_calc_method || "days_of_rent";
                const value =
                  method === "days_of_rent"
                    ? owner?.brokerage_days || 8
                    : method === "percentage"
                      ? owner?.brokerage_percentage || 0
                      : owner?.brokerage_fixed_amount || 0;
                const calc = calculateBrokerage(
                  tenant.inclusive_rent,
                  method,
                  value
                );

                return (
                  <div
                    key={tenant.id}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-all",
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "border-border-primary hover:border-border-primary/80"
                    )}
                    onClick={() => toggleTenant(tenant.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0",
                            isSelected
                              ? "bg-accent border-accent"
                              : "border-border-primary"
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-body-sm text-text-primary font-medium">
                            {tenant.tenant_name}
                          </p>
                          <p className="text-caption text-text-secondary">
                            Flat {tenant.flat_number} · T{tenant.tower} ·{" "}
                            {tenant.bhk_type} BHK · {tenant.carpet_area_sft}{" "}
                            sft
                          </p>
                          <p className="text-caption text-text-muted">
                            Start: {tenant.lease_start} · Owner:{" "}
                            {owner?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-caption text-text-muted">
                          Rent: ₹
                          {tenant.inclusive_rent.toLocaleString("en-IN")}
                        </p>
                        <p className="text-body-sm text-accent font-semibold">
                          Brokerage: ₹
                          {calc.brokerage.toLocaleString("en-IN")}
                        </p>
                        <p className="text-caption text-text-secondary">
                          Net: ₹{calc.net.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Invoice Preview */}
      {lineItems.length > 0 && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-h3 text-text-primary">3. Invoice Preview</h3>
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

          {/* Summary Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-caption">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left py-2 px-3 text-text-muted font-semibold">
                    #
                  </th>
                  <th className="text-left py-2 px-3 text-text-muted font-semibold">
                    Tenant
                  </th>
                  <th className="text-left py-2 px-3 text-text-muted font-semibold">
                    Flat
                  </th>
                  <th className="text-left py-2 px-3 text-text-muted font-semibold">
                    BHK
                  </th>
                  <th className="text-right py-2 px-3 text-text-muted font-semibold">
                    Rent
                  </th>
                  <th className="text-right py-2 px-3 text-text-muted font-semibold">
                    Brokerage
                  </th>
                  <th className="text-right py-2 px-3 text-text-muted font-semibold">
                    TDS (2%)
                  </th>
                  <th className="text-right py-2 px-3 text-text-muted font-semibold">
                    Net Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-border-subtle hover:bg-bg-hover"
                  >
                    <td className="py-2.5 px-3 text-text-muted">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-text-primary font-medium">
                      {item.tenant_name}
                    </td>
                    <td className="py-2.5 px-3 text-text-primary font-mono">
                      {item.flat_number}
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary">
                      {item.bhk_type}
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary text-right">
                      ₹{item.inclusive_rent.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-text-primary text-right font-medium">
                      ₹{item.brokerage.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-danger text-right">
                      ₹{item.tds.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-accent text-right font-semibold">
                      ₹{item.net.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-primary bg-bg-elevated/50">
                  <td
                    colSpan={4}
                    className="py-3 px-3 text-text-primary font-semibold"
                  >
                    Grand Total
                  </td>
                  <td className="py-3 px-3 text-right text-text-secondary font-medium">
                    ₹{totals.inclusive_rent.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right text-text-primary font-bold">
                    ₹{totals.brokerage.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right text-danger font-medium">
                    ₹{totals.tds.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right text-accent font-bold">
                    ₹{totals.net.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Full Preview */}
          {showPreview && (
            <div className="border border-border-primary rounded-lg p-6 bg-white text-black space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold tracking-wide">
                  MARK MY ZONE
                </h2>
                <h3 className="text-base font-semibold text-gray-700">
                  RENTAL INVOICE
                </h3>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-gray-500">Invoice No:</p>
                  <p className="font-mono font-medium">
                    MMZ/INV/2026/0002
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Date:</p>
                  <p>{invoiceDate}</p>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-gray-500">To,</p>
                <p className="font-medium">{selectedOwner?.name}</p>
                <p className="text-gray-600">Hyderabad, Telangana</p>
              </div>

              <p className="text-sm">
                <span className="font-medium">Sub:</span> Prestige High
                Fields Rental Payment Invoice
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1.5 text-left">
                        Sl
                      </th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left">
                        Owner
                      </th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left">
                        Tenant
                      </th>
                      <th className="border border-gray-300 px-2 py-1.5 text-center">
                        Tower
                      </th>
                      <th className="border border-gray-300 px-2 py-1.5 text-center">
                        Flat
                      </th>
                      <th className="border border-gray-300 px-2 py-1.5 text-center">
                        BHK
                      </th>
                      <th className="border border-gray-300 px-2 py-1.5 text-center">
                        SFT
                      </th>
                      <th className="border border-gray-300 px-2 py-1.5 text-center">
                        Start
                      </th>
                      <th className="border border-gray-300 px-2 py-1.5 text-right">
                        Rent
                      </th>
                      <th className="border border-gray-300 px-2 py-1.5 text-right">
                        Brokerage
                      </th>
                      <th className="border border-gray-300 px-2 py-1.5 text-right">
                        TDS
                      </th>
                      <th className="border border-gray-300 px-2 py-1.5 text-right">
                        Net Amt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="border border-gray-300 px-2 py-1">
                          {idx + 1}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          {item.owner_name}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          {item.tenant_name}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {item.tower}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center font-mono">
                          {item.flat_number}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {item.bhk_type}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {item.carpet_area_sft}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {item.lease_start}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {item.inclusive_rent.toLocaleString("en-IN")}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {item.brokerage.toLocaleString("en-IN")}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {item.tds.toLocaleString("en-IN")}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right font-medium">
                          {item.net.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td
                        colSpan={8}
                        className="border border-gray-300 px-2 py-1.5"
                      >
                        Grand Total
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right">
                        {totals.inclusive_rent.toLocaleString("en-IN")}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right">
                        {totals.brokerage.toLocaleString("en-IN")}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right">
                        {totals.tds.toLocaleString("en-IN")}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right">
                        {totals.net.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bank Details */}
              <div className="border border-gray-300 rounded p-3 text-xs space-y-1">
                <p className="font-semibold text-gray-700">BANK DETAILS:</p>
                <p>
                  Name: {bankDetails.account_name} | Bank: {bankDetails.bank_name}
                </p>
                <p>
                  A/C: {bankDetails.account_number} | IFSC: {bankDetails.ifsc}
                </p>
                <p>
                  Branch: {bankDetails.branch} | PAN: {bankDetails.pan}
                </p>
              </div>

              <div className="text-sm text-gray-600 italic">
                Kindly release the payment at the earliest.
              </div>

              <div className="text-right pt-4">
                <p className="text-xs text-gray-500">
                  AUTHORISED SIGNATORY
                </p>
                <div className="h-8 border-b border-gray-300 w-40 ml-auto mt-1" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {lineItems.length > 0 && (
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
