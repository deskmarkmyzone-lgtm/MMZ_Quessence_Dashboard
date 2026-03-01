"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Users, CreditCard, Settings2, Shield, Trash2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Bell, Calculator } from "lucide-react";
import { updateBankDetails, updateInvoiceSettings, updateCalculationSettings, updateNotificationPreferences } from "@/lib/actions";
import type { UserRole } from "@/types";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  joined: string;
}

interface SettingsData {
  bank_account_name?: string;
  account_holder_name?: string;
  bank_name?: string;
  bank_account_number?: string;
  account_number?: string;
  bank_ifsc?: string;
  ifsc_code?: string;
  bank_branch?: string;
  branch_name?: string;
  pan_number?: string;
  pan?: string;
  invoice_prefix?: string;
  next_invoice_number?: number;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  gstin?: string;
  maintenance_rate_per_sqft?: number;
}

interface NotificationPref {
  notification_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
}

interface SettingsContentProps {
  team: TeamMember[];
  settings: SettingsData;
  notificationPrefs: NotificationPref[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
};

const NOTIFICATION_TYPES = [
  { key: "rent_overdue", label: "Rent Overdue", description: "When rent payments are past due" },
  { key: "lease_expiring", label: "Lease Expiring", description: "When leases are approaching expiry" },
  { key: "document_approved", label: "Document Approved", description: "When your submitted document is approved" },
  { key: "document_rejected", label: "Document Rejected", description: "When your submitted document is rejected" },
  { key: "expense_recorded", label: "Expense Recorded", description: "When a new expense is recorded on a flat" },
  { key: "statement_published", label: "Statement Published", description: "When a statement is published to an owner" },
  { key: "tenant_added", label: "Tenant Added", description: "When a new tenant is added to a flat" },
  { key: "tenant_exited", label: "Tenant Exited", description: "When a tenant exits a flat" },
  { key: "maintenance_updated", label: "Maintenance Updated", description: "When maintenance charges are updated" },
  { key: "owner_onboarded", label: "Owner Onboarded", description: "When an owner completes onboarding" },
];

export function SettingsContent({ team, settings, notificationPrefs }: SettingsContentProps) {
  const router = useRouter();
  const [tab, setTab] = useState("team");
  const [bankDetails, setBankDetails] = useState({
    account_name: settings.account_holder_name ?? settings.bank_account_name ?? "",
    bank_name: settings.bank_name ?? "",
    account_number: settings.account_number ?? settings.bank_account_number ?? "",
    ifsc: settings.ifsc_code ?? settings.bank_ifsc ?? "",
    branch: settings.branch_name ?? settings.bank_branch ?? "",
    pan_number: settings.pan ?? settings.pan_number ?? "",
  });
  const [invoiceSettings, setInvoiceSettings] = useState({
    prefix: settings.invoice_prefix ?? "MMZ",
    next_number: settings.next_invoice_number ?? 1,
    company_name: settings.company_name ?? "Mark My Zone",
    company_address: settings.company_address ?? "",
    company_phone: settings.company_phone ?? "",
    company_email: settings.company_email ?? "",
  });

  const [calculationSettings, setCalculationSettings] = useState({
    maintenance_rate_per_sqft: settings.maintenance_rate_per_sqft ?? 3.68,
  });

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<Record<string, { in_app: boolean; email: boolean }>>(() => {
    const prefsMap: Record<string, { in_app: boolean; email: boolean }> = {};
    for (const nt of NOTIFICATION_TYPES) {
      const existing = notificationPrefs.find((p) => p.notification_type === nt.key);
      prefsMap[nt.key] = {
        in_app: existing?.in_app_enabled ?? true,
        email: existing?.email_enabled ?? true,
      };
    }
    return prefsMap;
  });

  const handleSaveNotificationPrefs = async () => {
    const prefs = Object.entries(notifPrefs).map(([key, val]) => ({
      notification_type: key,
      in_app_enabled: val.in_app,
      email_enabled: val.email,
    }));
    const result = await updateNotificationPreferences(prefs);
    if (result.success) {
      toast.success("Notification preferences saved");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to save preferences");
    }
  };

  const handleSaveBankDetails = async () => {
    const result = await updateBankDetails({
      account_holder_name: bankDetails.account_name,
      bank_name: bankDetails.bank_name,
      account_number: bankDetails.account_number,
      ifsc_code: bankDetails.ifsc,
      branch_name: bankDetails.branch,
    });
    if (result.success) {
      toast.success("Bank details saved successfully");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to save bank details");
    }
  };

  const handleSaveInvoiceSettings = async () => {
    const result = await updateInvoiceSettings({
      company_name: invoiceSettings.company_name,
      company_address: invoiceSettings.company_address,
      invoice_prefix: invoiceSettings.prefix,
      pan: bankDetails.pan_number,
    });
    if (result.success) {
      toast.success("Invoice settings saved successfully");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to save invoice settings");
    }
  };

  const handleSaveCalculationSettings = async () => {
    const result = await updateCalculationSettings({
      maintenance_rate_per_sqft: calculationSettings.maintenance_rate_per_sqft,
    });
    if (result.success) {
      toast.success("Calculation settings saved successfully");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to save calculation settings");
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Settings"
        description="Manage team, bank details, and system configuration"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-bg-elevated border border-border-primary mb-6">
          <TabsTrigger value="team" className="data-[state=active]:bg-bg-card">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="bank" className="data-[state=active]:bg-bg-card">
            <CreditCard className="h-4 w-4 mr-2" />
            Bank Details
          </TabsTrigger>
          <TabsTrigger value="invoice" className="data-[state=active]:bg-bg-card">
            <Settings2 className="h-4 w-4 mr-2" />
            Invoice Settings
          </TabsTrigger>
          <TabsTrigger value="calculations" className="data-[state=active]:bg-bg-card">
            <Calculator className="h-4 w-4 mr-2" />
            Calculations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-bg-card">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-bg-card">
            <Upload className="h-4 w-4 mr-2" />
            Data Import
          </TabsTrigger>
        </TabsList>

        {/* Team Management */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h3 text-text-primary">Team Members</h3>
              <p className="text-body-sm text-text-secondary mt-1">
                {team.filter(t => t.is_active).length} active members
              </p>
            </div>
            <Button className="bg-accent hover:bg-accent-light text-white">
              <Users className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>

          <div className="bg-bg-card border border-border-primary rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Name</th>
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Email</th>
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Role</th>
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Joined</th>
                  <th className="text-center text-caption text-text-muted font-medium px-4 py-3">Status</th>
                  <th className="text-right text-caption text-text-muted font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr key={member.id} className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent/10 text-accent text-caption font-semibold flex items-center justify-center">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-body-sm text-text-primary font-medium">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">{member.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-caption bg-bg-elevated px-2 py-0.5 rounded text-text-primary">
                        {ROLE_LABELS[member.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">{member.joined}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={member.is_active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary">
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Role Permissions Summary */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Role Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-bg-elevated rounded-lg">
                <h4 className="text-body-sm text-text-primary font-semibold mb-2">Super Admin</h4>
                <p className="text-caption text-text-secondary">Full access. Manage team, approve statements, system settings, audit log.</p>
              </div>
              <div className="p-4 bg-bg-elevated rounded-lg">
                <h4 className="text-body-sm text-text-primary font-semibold mb-2">Admin</h4>
                <p className="text-caption text-text-secondary">Everything except team management and system settings. Can approve statements.</p>
              </div>
              <div className="p-4 bg-bg-elevated rounded-lg">
                <h4 className="text-body-sm text-text-primary font-semibold mb-2">Manager</h4>
                <p className="text-caption text-text-secondary">Record rent, expenses, manage tenants. Cannot approve or delete records.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Bank Details */}
        <TabsContent value="bank" className="space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
            <h3 className="text-h3 text-text-primary">MMZ Bank Details</h3>
            <p className="text-body-sm text-text-secondary">These details appear on all generated invoices and statements.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-text-secondary">Account Holder Name</Label>
                <Input
                  value={bankDetails.account_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_name: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-text-secondary">Bank Name</Label>
                <Input
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
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
              <div className="space-y-2">
                <Label className="text-text-secondary">Branch</Label>
                <Input
                  value={bankDetails.branch}
                  onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-text-secondary">PAN Number</Label>
                <Input
                  value={bankDetails.pan_number}
                  onChange={(e) => setBankDetails({ ...bankDetails, pan_number: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveBankDetails} className="bg-accent hover:bg-accent-light text-white">
                Save Bank Details
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Invoice Settings */}
        <TabsContent value="invoice" className="space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
            <h3 className="text-h3 text-text-primary">Invoice Configuration</h3>
            <p className="text-body-sm text-text-secondary">Configure invoice numbering and company details for generated documents.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-text-secondary">Invoice Prefix</Label>
                <Input
                  value={invoiceSettings.prefix}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, prefix: e.target.value })}
                  placeholder="e.g., MMZ"
                  className="bg-bg-page border-border-primary"
                />
                <p className="text-caption text-text-muted">Format: {invoiceSettings.prefix}/INV/2026/0001</p>
              </div>
              <div className="space-y-2">
                <Label className="text-text-secondary">Next Invoice Number</Label>
                <Input
                  type="number"
                  value={invoiceSettings.next_number}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, next_number: parseInt(e.target.value) || 1 })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
            <h3 className="text-h3 text-text-primary">Company Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-text-secondary">Company Name</Label>
                <Input
                  value={invoiceSettings.company_name}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, company_name: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-text-secondary">Company Email</Label>
                <Input
                  value={invoiceSettings.company_email}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, company_email: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-text-secondary">Company Phone</Label>
                <Input
                  value={invoiceSettings.company_phone}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, company_phone: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-text-secondary">Company Address</Label>
              <Input
                value={invoiceSettings.company_address}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, company_address: e.target.value })}
                className="bg-bg-page border-border-primary"
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveInvoiceSettings} className="bg-accent hover:bg-accent-light text-white">
                Save Invoice Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Calculation Settings */}
        <TabsContent value="calculations" className="space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
            <h3 className="text-h3 text-text-primary">Maintenance Calculation</h3>
            <p className="text-body-sm text-text-secondary">
              Configure the default rate used to auto-calculate maintenance charges when adding or editing flats.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-text-secondary">Maintenance Rate (per sqft)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-body text-text-muted">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={calculationSettings.maintenance_rate_per_sqft}
                    onChange={(e) =>
                      setCalculationSettings({
                        ...calculationSettings,
                        maintenance_rate_per_sqft: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-bg-page border-border-primary"
                  />
                  <span className="text-body-sm text-text-muted whitespace-nowrap">/ sqft</span>
                </div>
                <p className="text-caption text-text-muted">
                  When a flat&apos;s carpet area is entered, the maintenance amount will be auto-calculated
                  as: carpet area (sqft) x this rate. Default: ₹3.68/sqft
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-text-secondary">Example Calculation</Label>
                <div className="bg-bg-elevated border border-border-primary rounded-lg p-4 space-y-1">
                  <p className="text-body-sm text-text-secondary">
                    Carpet area: <span className="text-text-primary font-medium">1,283 sqft</span>
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    Rate: <span className="text-text-primary font-medium">₹{calculationSettings.maintenance_rate_per_sqft}/sqft</span>
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    Maintenance: <span className="text-text-primary font-semibold">
                      ₹{Math.round(1283 * calculationSettings.maintenance_rate_per_sqft).toLocaleString("en-IN")}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveCalculationSettings} className="bg-accent hover:bg-accent-light text-white">
                Save Calculation Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Notification Preferences */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-h3 text-text-primary">Notification Preferences</h3>
                <p className="text-body-sm text-text-secondary mt-1">
                  Choose which notifications you receive in-app and via email.
                </p>
              </div>
              <Button onClick={handleSaveNotificationPrefs} className="bg-accent hover:bg-accent-light text-white">
                Save Preferences
              </Button>
            </div>

            <div className="border border-border-primary rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-primary bg-bg-elevated">
                    <th className="text-left text-caption text-text-muted font-medium px-4 py-3">Notification Type</th>
                    <th className="text-center text-caption text-text-muted font-medium px-4 py-3 w-24">In-App</th>
                    <th className="text-center text-caption text-text-muted font-medium px-4 py-3 w-24">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {NOTIFICATION_TYPES.map((nt) => (
                    <tr key={nt.key} className="border-b border-border-primary last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-body-sm text-text-primary font-medium">{nt.label}</p>
                        <p className="text-caption text-text-muted">{nt.description}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={notifPrefs[nt.key]?.in_app ?? true}
                          onCheckedChange={(checked) =>
                            setNotifPrefs((prev) => ({
                              ...prev,
                              [nt.key]: { ...prev[nt.key], in_app: checked },
                            }))
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={notifPrefs[nt.key]?.email ?? true}
                          onCheckedChange={(checked) =>
                            setNotifPrefs((prev) => ({
                              ...prev,
                              [nt.key]: { ...prev[nt.key], email: checked },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Data Import */}
        <TabsContent value="import" className="space-y-6">
          <CSVImportSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== CSV Import Section (unchanged) =====

type ImportStep = "upload" | "mapping" | "preview" | "complete";
type ImportTarget = "flats" | "owners" | "rent_payments" | "expenses";

const IMPORT_TEMPLATES: Record<ImportTarget, { label: string; columns: string[]; example: string[][] }> = {
  flats: {
    label: "Flats",
    columns: ["flat_number", "tower", "floor", "unit", "bhk_type", "carpet_area_sft", "base_rent", "maintenance_amount", "status"],
    example: [
      ["3154", "3", "15", "4", "2.5", "1492", "49748", "6252", "occupied"],
      ["6292", "6", "29", "2", "4", "2848", "82067", "11933", "occupied"],
    ],
  },
  owners: {
    label: "Owners",
    columns: ["name", "email", "phone", "pan_number", "brokerage_calc_method", "brokerage_days"],
    example: [
      ["R. Krishna Kumar", "krishna@gmail.com", "9876543210", "ABCDE1234F", "days_of_rent", "8"],
      ["Ajitha Krishna Kumar", "ajitha@gmail.com", "9876543211", "FGHIJ5678K", "days_of_rent", "15"],
    ],
  },
  rent_payments: {
    label: "Rent Payments",
    columns: ["flat_number", "amount", "payment_date", "payment_month", "payment_method", "payment_status"],
    example: [
      ["3154", "56000", "2026-02-05", "2026-02-01", "gpay", "full"],
      ["6292", "94000", "2026-02-03", "2026-02-01", "bank_transfer", "full"],
    ],
  },
  expenses: {
    label: "Expenses",
    columns: ["flat_number", "category", "description", "amount", "expense_date", "vendor_name"],
    example: [
      ["3154", "ac", "AC servicing 3 units", "5400", "2026-01-15", "Cool Air Services"],
      ["6292", "plumbing", "Kitchen sink repair", "2700", "2026-01-22", "Ravi Plumbing"],
    ],
  },
};

function CSVImportSection() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [target, setTarget] = useState<ImportTarget>("flats");
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }
      const csvHeaders = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map((line) =>
        line.split(",").map((cell) => cell.trim().replace(/"/g, ""))
      );
      setHeaders(csvHeaders);
      setParsedRows(rows);
      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const template = IMPORT_TEMPLATES[target];
    const csvContent = [
      template.columns.join(","),
      ...template.example.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mmz_${target}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleImport = () => {
    setStep("complete");
    toast.success(`${parsedRows.length} records imported successfully`);
  };

  const handleReset = () => {
    setStep("upload");
    setFileName("");
    setParsedRows([]);
    setHeaders([]);
  };

  return (
    <div className="space-y-6">
      {/* Import Target Selection */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6">
        <h3 className="text-h3 text-text-primary mb-2">CSV Data Import</h3>
        <p className="text-body-sm text-text-secondary mb-4">
          Import bulk data from CSV files. Download a template first to ensure correct formatting.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(Object.keys(IMPORT_TEMPLATES) as ImportTarget[]).map((key) => (
            <button
              key={key}
              onClick={() => { setTarget(key); handleReset(); }}
              className={`p-3 rounded-lg border text-left transition-all ${
                target === key
                  ? "border-accent bg-accent/5 text-accent"
                  : "border-border-primary bg-bg-page text-text-secondary hover:border-accent/50"
              }`}
            >
              <FileSpreadsheet className="h-5 w-5 mb-1" />
              <p className="text-body-sm font-medium">{IMPORT_TEMPLATES[key].label}</p>
            </button>
          ))}
        </div>

        <Button variant="outline" onClick={handleDownloadTemplate} className="gap-1.5">
          <FileSpreadsheet className="h-4 w-4" />
          Download Template ({IMPORT_TEMPLATES[target].label})
        </Button>
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-6">
          <h3 className="text-h3 text-text-primary mb-4">Upload CSV File</h3>
          <label className="block border-2 border-dashed border-border-primary rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 transition-colors">
            <Upload className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-body-sm text-text-primary mb-1">
              Click to upload or drag & drop
            </p>
            <p className="text-caption text-text-muted">.csv files only</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Step: Mapping / Preview */}
      {step === "mapping" && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h3 text-text-primary">Preview Import</h3>
              <p className="text-body-sm text-text-secondary mt-1">
                {fileName} &middot; {parsedRows.length} rows &middot; {headers.length} columns
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Upload Different File
            </Button>
          </div>

          {/* Column mapping check */}
          <div className="bg-bg-elevated rounded-lg p-4">
            <p className="text-caption text-text-muted font-medium mb-2">Column Mapping</p>
            <div className="flex flex-wrap gap-2">
              {headers.map((h) => {
                const expected = IMPORT_TEMPLATES[target].columns;
                const isMatch = expected.includes(h.toLowerCase());
                return (
                  <span
                    key={h}
                    className={`inline-flex items-center gap-1 text-caption px-2 py-1 rounded ${
                      isMatch
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {isMatch ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {h}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Data preview table */}
          <div className="overflow-x-auto border border-border-primary rounded-lg">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="bg-bg-elevated border-b border-border-primary">
                  <th className="text-left text-caption text-text-muted font-medium px-3 py-2">#</th>
                  {headers.map((h) => (
                    <th key={h} className="text-left text-caption text-text-muted font-medium px-3 py-2 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-border-primary last:border-0">
                    <td className="px-3 py-2 text-text-muted">{i + 1}</td>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-text-primary whitespace-nowrap">
                        {cell || <span className="text-text-muted">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedRows.length > 5 && (
              <p className="text-caption text-text-muted text-center py-2 bg-bg-elevated">
                ... and {parsedRows.length - 5} more rows
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleReset}>Cancel</Button>
            <Button
              onClick={handleImport}
              className="bg-accent hover:bg-accent-light text-white gap-1.5"
            >
              <Upload className="h-4 w-4" />
              Import {parsedRows.length} Records
            </Button>
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === "complete" && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
          <h3 className="text-h3 text-text-primary mb-2">Import Complete</h3>
          <p className="text-body-sm text-text-secondary mb-6">
            Successfully imported {parsedRows.length} {IMPORT_TEMPLATES[target].label.toLowerCase()} records.
          </p>
          <Button onClick={handleReset} variant="outline">
            Import More Data
          </Button>
        </div>
      )}
    </div>
  );
}
