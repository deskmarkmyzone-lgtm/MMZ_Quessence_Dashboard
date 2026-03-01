"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exitTenant } from "@/lib/actions/tenants";
import { createElement } from "react";
import { SortableList } from "@/components/shared/sortable-list";

interface TenantExitContentProps {
  tenant: {
    id: string;
    name: string;
    lease_start_date: string | null;
    lease_end_date: string | null;
    security_deposit: number;
    monthly_rent: number;
    monthly_inclusive_rent: number | null;
  };
  flat: {
    id: string;
    flat_number: string;
    owner_id: string;
    owner_name: string;
  };
}

const STEPS = ["Exit Details", "Deposit Deductions", "Review & Generate"];

export function TenantExitContent({ tenant, flat }: TenantExitContentProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Exit details
  const [exitDate, setExitDate] = useState(new Date().toISOString().split("T")[0]);
  const [exitReason, setExitReason] = useState("");

  // Step 2: Deductions
  const [deductions, setDeductions] = useState([
    { id: "1", description: "Paint Touchups", amount: 4000 },
    { id: "2", description: "Deep Cleaning", amount: 3000 },
    { id: "3", description: "3 AC Servicing", amount: 1800 },
  ]);

  // Step 2: Refund bank details
  const [bankDetails, setBankDetails] = useState({
    account_holder: tenant.name,
    bank_name: "",
    account_number: "",
    ifsc: "",
  });

  const addDeduction = () => {
    setDeductions([...deductions, { id: Date.now().toString(), description: "", amount: 0 }]);
  };

  const removeDeduction = (id: string) => {
    setDeductions(deductions.filter(d => d.id !== id));
  };

  const updateDeduction = (id: string, field: "description" | "amount", value: string | number) => {
    setDeductions(deductions.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const securityDeposit = tenant.security_deposit ?? 0;
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const refundAmount = securityDeposit - totalDeductions;

  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      const { FlatAnnexurePDF } = await import("@/lib/pdf/flat-annexure");
      const { downloadPDF } = await import("@/lib/pdf/download");
      const element = createElement(FlatAnnexurePDF, {
        flatNo: flat.flat_number,
        ownerName: flat.owner_name,
        tenantName: tenant.name,
        moveOutDate: exitDate,
        rooms: [],
        securityDeposit,
        deductions: deductions
          .filter((d) => d.amount > 0)
          .map((d) => ({ description: d.description, amount: d.amount })),
        totalDeductions,
        refundAmount,
        tenantBankDetails: bankDetails.bank_name
          ? {
              name: bankDetails.account_holder,
              bank: bankDetails.bank_name,
              accountNo: bankDetails.account_number,
              ifsc: bankDetails.ifsc,
            }
          : undefined,
      });
      await downloadPDF(element, `Flat_${flat.flat_number}_Exit_${exitDate}`);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const result = await exitTenant(tenant.id, {
        exit_date: exitDate,
        exit_reason: exitReason || undefined,
      });
      if (result.success) {
        toast.success("Tenant exit completed successfully.");
        router.push(`/pm/flats/${flat.id}`);
      } else {
        toast.error(result.error || "Failed to complete tenant exit");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => step > 0 ? setStep(step - 1) : router.push(`/pm/flats/${flat.id}/tenant`)}
          className="text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-h2 text-text-primary">Tenant Exit Wizard</h2>
          <p className="text-body-sm text-text-secondary">
            {tenant.name} · Flat {flat.flat_number}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-caption font-semibold shrink-0",
              i < step ? "bg-success text-white" :
              i === step ? "bg-accent text-white" :
              "bg-bg-elevated text-text-muted"
            )}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn(
              "text-caption hidden sm:inline",
              i === step ? "text-text-primary font-medium" : "text-text-muted"
            )}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 rounded",
                i < step ? "bg-success" : "bg-border-primary"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Exit Details */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
            <h3 className="text-h3 text-text-primary">Confirm Exit Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-caption text-text-muted">Tenant</p>
                <p className="text-body text-text-primary font-medium">{tenant.name}</p>
              </div>
              <div>
                <p className="text-caption text-text-muted">Flat</p>
                <p className="text-body text-text-primary font-mono font-medium">{flat.flat_number}</p>
              </div>
              <div>
                <p className="text-caption text-text-muted">Lease Period</p>
                <p className="text-body text-text-secondary">
                  {tenant.lease_start_date ?? "N/A"} to {tenant.lease_end_date ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-caption text-text-muted">Security Deposit</p>
                <p className="text-body text-accent font-medium">{"\u20B9"}{securityDeposit.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-text-secondary">Move-Out Date *</Label>
              <Input
                type="date"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                className="bg-bg-page border-border-primary max-w-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-text-secondary">Reason for Exit</Label>
              <Textarea
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                placeholder="e.g., Job relocation, lease expired..."
                className="bg-bg-page border-border-primary"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep(1)} className="bg-accent hover:bg-accent-light text-white">
              Next: Deposit Deductions
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Deposit Deductions */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-h3 text-text-primary">Deposit Deductions</h3>
              <Button variant="outline" size="sm" onClick={addDeduction} className="border-border-primary text-text-secondary">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              <SortableList
                items={deductions}
                onReorder={setDeductions}
                renderItem={(d) => (
                  <div className="flex items-center gap-3">
                    <Input
                      value={d.description}
                      onChange={(e) => updateDeduction(d.id, "description", e.target.value)}
                      placeholder="Description"
                      className="flex-1 bg-bg-page border-border-primary"
                    />
                    <Input
                      type="number"
                      value={d.amount || ""}
                      onChange={(e) => updateDeduction(d.id, "amount", parseFloat(e.target.value) || 0)}
                      placeholder="Amount"
                      className="w-32 bg-bg-page border-border-primary"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeduction(d.id)}
                      className="text-text-muted hover:text-danger shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              />
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-border-primary space-y-2">
              <div className="flex justify-between text-body-sm">
                <span className="text-text-secondary">Security Deposit</span>
                <span className="text-text-primary font-medium">{"\u20B9"}{securityDeposit.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-text-secondary">Total Deductions</span>
                <span className="text-danger font-medium">- {"\u20B9"}{totalDeductions.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-body pt-2 border-t border-border-primary">
                <span className="text-text-primary font-semibold">Refund Amount</span>
                <span className={cn("font-bold", refundAmount >= 0 ? "text-success" : "text-danger")}>
                  {"\u20B9"}{refundAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Refund Bank Details */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
            <h3 className="text-h3 text-text-primary">Tenant Bank Details (for refund)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-text-secondary">Account Holder</Label>
                <Input
                  value={bankDetails.account_holder}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_holder: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-text-secondary">Bank Name</Label>
                <Input
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                  placeholder="e.g., HDFC Bank"
                  className="bg-bg-page border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-text-secondary">Account Number</Label>
                <Input
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-text-secondary">IFSC Code</Label>
                <Input
                  value={bankDetails.ifsc}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)} className="border-border-primary text-text-secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => setStep(2)} className="bg-accent hover:bg-accent-light text-white">
              Next: Review
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Generate */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
            <h3 className="text-h3 text-text-primary">Exit Summary</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-caption text-text-muted">Tenant</p>
                <p className="text-body text-text-primary font-medium">{tenant.name}</p>
              </div>
              <div>
                <p className="text-caption text-text-muted">Flat</p>
                <p className="text-body text-text-primary font-mono">{flat.flat_number}</p>
              </div>
              <div>
                <p className="text-caption text-text-muted">Move-Out Date</p>
                <p className="text-body text-text-primary">{exitDate}</p>
              </div>
              <div>
                <p className="text-caption text-text-muted">Reason</p>
                <p className="text-body text-text-primary">{exitReason || "Not specified"}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border-primary">
              <h4 className="text-body-sm text-text-primary font-semibold mb-3">Deposit Calculation</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-text-secondary">Security Deposit</span>
                  <span className="text-text-primary">{"\u20B9"}{securityDeposit.toLocaleString("en-IN")}</span>
                </div>
                {deductions.filter(d => d.amount > 0).map((d) => (
                  <div key={d.id} className="flex justify-between text-body-sm">
                    <span className="text-text-secondary">{d.description}</span>
                    <span className="text-danger">- {"\u20B9"}{d.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex justify-between text-body font-semibold pt-2 border-t border-border-primary">
                  <span className="text-text-primary">Refund Amount</span>
                  <span className={refundAmount >= 0 ? "text-success" : "text-danger"}>
                    {"\u20B9"}{refundAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {bankDetails.bank_name && (
              <div className="pt-4 border-t border-border-primary">
                <h4 className="text-body-sm text-text-primary font-semibold mb-2">Refund Bank Details</h4>
                <div className="grid grid-cols-2 gap-2 text-caption">
                  <span className="text-text-muted">Account Holder</span>
                  <span className="text-text-primary">{bankDetails.account_holder}</span>
                  <span className="text-text-muted">Bank</span>
                  <span className="text-text-primary">{bankDetails.bank_name}</span>
                  <span className="text-text-muted">Account #</span>
                  <span className="text-text-primary font-mono">{bankDetails.account_number}</span>
                  <span className="text-text-muted">IFSC</span>
                  <span className="text-text-primary font-mono">{bankDetails.ifsc}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="border-border-primary text-text-secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-border-primary text-text-secondary"
                onClick={handleGeneratePDF}
                disabled={generatingPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                {generatingPDF ? "Generating..." : "Generate PDF"}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="bg-success hover:bg-success/90 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isSubmitting ? "Processing..." : "Complete Exit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
