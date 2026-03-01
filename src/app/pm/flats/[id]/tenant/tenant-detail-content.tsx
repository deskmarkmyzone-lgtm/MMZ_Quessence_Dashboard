"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit, User, Phone, Mail, Building2, Calendar,
  IndianRupee, FileText, Briefcase, Shield, ExternalLink, AlertTriangle, Clock, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { PastTenantsSection } from "./past-tenants-section";
import Link from "next/link";

interface TenantData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  tenant_type: string;
  occupation_type: string | null;
  company_name: string | null;
  business_name: string | null;
  family_member_count: number | null;
  bachelor_occupant_count: number | null;
  bachelor_gender_breakdown: string | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  security_deposit: number | null;
  monthly_rent: number;
  monthly_maintenance: number | null;
  monthly_inclusive_rent: number | null;
  rent_due_day: number | null;
  is_active: boolean;
  aadhaar_file_id: string | null;
  pan_file_id: string | null;
  employment_proof_file_id: string | null;
  agreement_file_id: string | null;
}

interface PastTenantData {
  id: string;
  name: string;
  tenant_type: string;
  lease_start_date: string | null;
  lease_end_date: string | null;
  exit_date: string | null;
  exit_reason: string | null;
  monthly_rent: number;
  monthly_maintenance: number | null;
  monthly_inclusive_rent: number | null;
}

interface TenantDetailContentProps {
  tenant: TenantData;
  flatId: string;
  flatNumber: string;
  agreementUrl: string | null;
  pastTenants?: PastTenantData[];
}

export function TenantDetailContent({ tenant, flatId, flatNumber, agreementUrl, pastTenants = [] }: TenantDetailContentProps) {
  const router = useRouter();

  const inclusiveRent = tenant.monthly_inclusive_rent ?? (tenant.monthly_rent + (tenant.monthly_maintenance ?? 0));

  // Calculate lease remaining
  let leaseRemaining = "-";
  let leaseDuration = "-";
  const leaseEndDate = tenant.lease_end_date ? new Date(tenant.lease_end_date) : null;
  const leaseStartDate = tenant.lease_start_date ? new Date(tenant.lease_start_date) : null;
  const now = new Date();
  const daysRemaining = leaseEndDate ? Math.ceil((leaseEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const leaseExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 60;

  if (leaseStartDate && leaseEndDate) {
    const totalMonths = Math.round((leaseEndDate.getTime() - leaseStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const remainingMonths = Math.max(0, Math.round((leaseEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    leaseDuration = `${totalMonths} months`;
    leaseRemaining = `${remainingMonths} months`;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/pm/flats/${flatId}`)}
          className="text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-h2 text-text-primary">{tenant.name}</h2>
            <StatusBadge status={tenant.tenant_type} />
            <StatusBadge status={tenant.is_active ? "active" : "inactive"} />
          </div>
          <p className="text-body-sm text-text-secondary mt-1">
            Tenant at Flat {flatNumber}
          </p>
        </div>
        <Link href={`/pm/flats/${flatId}/tenant/edit`}>
          <Button className="bg-accent hover:bg-accent-light text-white">
            <Edit className="h-4 w-4 mr-2" />
            Edit Tenant
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Details */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={User} label="Full Name" value={tenant.name} />
              <InfoRow icon={Phone} label="Phone" value={tenant.phone ?? "Not provided"} />
              <InfoRow icon={Mail} label="Email" value={tenant.email ?? "Not provided"} />
              <InfoRow
                icon={User}
                label="Tenant Type"
                value={tenant.tenant_type === "family" ? "Family" : "Bachelor"}
              />
              {tenant.tenant_type === "family" && tenant.family_member_count && (
                <InfoRow
                  icon={User}
                  label="Family Members"
                  value={`${tenant.family_member_count} members`}
                />
              )}
              {tenant.tenant_type === "bachelor" && tenant.bachelor_occupant_count && (
                <InfoRow
                  icon={User}
                  label="Occupants"
                  value={`${tenant.bachelor_occupant_count} occupants${tenant.bachelor_gender_breakdown ? ` (${tenant.bachelor_gender_breakdown})` : ""}`}
                />
              )}
            </div>
          </div>

          {/* Occupation */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Occupation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow
                icon={Briefcase}
                label="Occupation Type"
                value={tenant.occupation_type === "employee" ? "Employee" : tenant.occupation_type === "business_owner" ? "Business Owner" : "Not specified"}
              />
              <InfoRow icon={Building2} label="Company" value={tenant.company_name ?? tenant.business_name ?? "Not specified"} />
            </div>
          </div>

          {/* Lease Details */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-h3 text-text-primary">Lease Details</h3>
              {leaseExpiringSoon && daysRemaining !== null && daysRemaining > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-caption font-medium text-warning bg-warning/10 border border-warning/30 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  Expires in {daysRemaining} days
                </span>
              )}
              {daysRemaining !== null && daysRemaining <= 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-caption font-medium text-danger bg-danger/10 border border-danger/30 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  Expired
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={Calendar} label="Lease Start" value={leaseStartDate ? leaseStartDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not set"} />
              <InfoRow icon={Calendar} label="Lease End" value={leaseEndDate ? leaseEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not set"} />
              <InfoRow icon={Clock} label="Days Remaining" value={daysRemaining === null ? "N/A" : daysRemaining <= 0 ? "Expired" : `${daysRemaining} days`} />
              <InfoRow icon={Calendar} label="Rent Due Day" value={`${tenant.rent_due_day ?? 1}th of each month`} />
            </div>
            {agreementUrl && (
              <div className="mt-4 pt-4 border-t border-border-primary">
                <a
                  href={agreementUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-body-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Lease Agreement
                </a>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DocumentItem label="Aadhaar Card" uploaded={!!tenant.aadhaar_file_id} />
              <DocumentItem label="PAN Card" uploaded={!!tenant.pan_file_id} />
              <DocumentItem label="Employment Proof" uploaded={!!tenant.employment_proof_file_id} />
              <DocumentItem label="Rental Agreement" uploaded={!!tenant.agreement_file_id} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security Deposit - Prominent Card */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-accent" />
              <h3 className="text-h3 text-text-primary">Security Deposit</h3>
            </div>
            <div className="text-center py-3 bg-bg-elevated rounded-lg mb-3">
              <p className="text-caption text-text-muted mb-1">Deposit Amount</p>
              <p className="text-h2 text-accent font-bold">
                {tenant.security_deposit
                  ? `₹${tenant.security_deposit.toLocaleString("en-IN")}`
                  : "Not set"}
              </p>
            </div>
            <SummaryRow
              label="Status"
              value={tenant.is_active ? "Active" : "Refunded/Pending Refund"}
              color={tenant.is_active ? "text-success" : "text-warning"}
            />
          </div>

          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Rent Breakdown</h3>
            <div className="space-y-3">
              <SummaryRow label="Base Rent" value={`₹${tenant.monthly_rent.toLocaleString("en-IN")}`} />
              <SummaryRow label="Maintenance" value={`₹${(tenant.monthly_maintenance ?? 0).toLocaleString("en-IN")}`} />
              <div className="pt-2 border-t border-border-primary">
                <SummaryRow
                  label="Total Inclusive"
                  value={`₹${inclusiveRent.toLocaleString("en-IN")}`}
                  color="text-accent"
                  bold
                />
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-border-primary rounded-lg p-6">
            <h3 className="text-h3 text-text-primary mb-4">Lease Status</h3>
            <div className="space-y-3">
              <SummaryRow label="Status" value={tenant.is_active ? "Active" : "Inactive"} color={tenant.is_active ? "text-success" : "text-danger"} />
              <SummaryRow label="Duration" value={leaseDuration} />
              <SummaryRow label="Remaining" value={leaseRemaining} />
              {daysRemaining !== null && (
                <SummaryRow
                  label="Days Left"
                  value={daysRemaining <= 0 ? "Expired" : `${daysRemaining} days`}
                  color={daysRemaining <= 0 ? "text-danger" : leaseExpiringSoon ? "text-warning" : undefined}
                />
              )}
            </div>
            {leaseExpiringSoon && daysRemaining !== null && daysRemaining > 0 && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-warning/10 border border-warning/30 rounded-md">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                <span className="text-caption text-warning font-medium">
                  Lease expires in {daysRemaining} days
                </span>
              </div>
            )}
            {daysRemaining !== null && daysRemaining <= 0 && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-danger/10 border border-danger/30 rounded-md">
                <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                <span className="text-caption text-danger font-medium">
                  Lease has expired
                </span>
              </div>
            )}
          </div>

          <Link href={`/pm/flats/${flatId}/tenant/exit`}>
            <Button
              variant="outline"
              className="w-full border-danger text-danger hover:bg-danger/10"
            >
              Initiate Tenant Exit
            </Button>
          </Link>
        </div>
      </div>

      {/* Past Tenants Section */}
      {pastTenants.length > 0 && (
        <PastTenantsSection pastTenants={pastTenants} flatId={flatId} />
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-text-muted mt-0.5" />
      <div>
        <p className="text-caption text-text-muted">{label}</p>
        <p className="text-body text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body-sm text-text-secondary">{label}</span>
      <span className={`text-body-sm ${bold ? "font-semibold" : "font-medium"} ${color ?? "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}

function DocumentItem({ label, uploaded }: { label: string; uploaded: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-text-muted" />
        <span className="text-body-sm text-text-primary">{label}</span>
      </div>
      {uploaded ? (
        <span className="text-caption text-success">Uploaded</span>
      ) : (
        <span className="text-caption text-text-muted">Not uploaded</span>
      )}
    </div>
  );
}
