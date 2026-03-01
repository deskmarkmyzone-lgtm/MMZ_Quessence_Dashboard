"use client";

import { useState } from "react";
import {
  ArrowLeft, Edit, User, Building2, IndianRupee,
  Calendar, Home, Wrench, CreditCard, Eye,
  Shield, FileText, ExternalLink, AlertTriangle, Clock,
  ClipboardList, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { ImageViewer } from "@/components/shared/image-viewer";
import { NotesSection } from "@/components/shared/notes-section";
import Link from "next/link";
import type { Tenant } from "@/types";
import type { Note } from "@/lib/actions/notes";

interface FlatData {
  id: string;
  flat_number: string;
  bhk_type: string;
  carpet_area_sft: number | null;
  base_rent: number;
  maintenance_amount: number;
  inclusive_rent: number;
  status: string;
  rent_due_day: number;
  notes: string | null;
  owner_id: string;
  community?: { id: string; name: string } | null;
  owner?: { id: string; name: string } | null;
}

interface RentPaymentWithProofs {
  id: string;
  amount: number;
  payment_date: string;
  payment_month: string;
  payment_status: string;
  proof_urls: string[];
  [key: string]: unknown;
}

interface ExpenseWithReceipts {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  vendor_name: string | null;
  receipt_urls: string[];
  [key: string]: unknown;
}

interface RentRevision {
  id: string;
  flat_id: string;
  old_base_rent: number | null;
  new_base_rent: number | null;
  old_maintenance: number | null;
  new_maintenance: number | null;
  old_inclusive_rent: number | null;
  new_inclusive_rent: number | null;
  percentage_change: number | null;
  revision_date: string;
  reason: string | null;
  effective_from: string | null;
  recorded_by: string | null;
}

interface AnnexureSummary {
  id: string;
  type: "move_in" | "move_out";
  date: string;
  securityDeposit: number | null;
  totalDeductions: number | null;
  refundAmount: number | null;
  isCompleted: boolean;
  createdAt: string;
}

interface FlatDetailContentProps {
  flat: FlatData;
  tenant: Tenant | null;
  rentHistory: RentPaymentWithProofs[];
  expenses: ExpenseWithReceipts[];
  rentRevisions: RentRevision[];
  notes: Note[];
  agreementUrl: string | null;
  annexures: AnnexureSummary[];
}

export function FlatDetailContent({ flat, tenant, rentHistory, expenses, rentRevisions, notes, agreementUrl, annexures }: FlatDetailContentProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ src: string; alt?: string }[]>([]);

  // Lease calculations
  const leaseEndDate = tenant?.lease_end_date ? new Date(tenant.lease_end_date) : null;
  const leaseStartDate = tenant?.lease_start_date ? new Date(tenant.lease_start_date) : null;
  const now = new Date();
  const daysRemaining = leaseEndDate ? Math.ceil((leaseEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const leaseExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 60;

  const openProofViewer = (urls: string[], label: string) => {
    if (urls.length === 0) return;
    setViewerImages(urls.map((src) => ({ src, alt: `Payment proof - ${label}` })));
    setViewerOpen(true);
  };

  const openReceiptViewer = (urls: string[], label: string) => {
    if (urls.length === 0) return;
    setViewerImages(urls.map((src) => ({ src, alt: `Receipt - ${label}` })));
    setViewerOpen(true);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-start sm:items-center gap-3 mb-6 flex-wrap">
        <Link href="/pm/flats" className="shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:text-text-primary h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-h3 sm:text-h2 text-text-primary">
              Flat {flat.flat_number}
            </h2>
            <span className="text-body-sm sm:text-body text-text-secondary">
              {flat.bhk_type} BHK · {flat.carpet_area_sft} sqft
            </span>
            <StatusBadge status={flat.status as "occupied" | "vacant" | "under_maintenance"} />
          </div>
          <p className="text-body-sm text-text-secondary mt-1 truncate">
            {flat.community?.name} · Owner: {flat.owner?.name}
          </p>
        </div>
        <Link href={`/pm/flats/${flat.id}/edit`} className="shrink-0">
          <Button className="bg-accent hover:bg-accent-light text-white">
            <Edit className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Edit Flat</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="bg-bg-card border border-border-primary w-max sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rent">Rent History</TabsTrigger>
            <TabsTrigger value="revisions">Revisions</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="annexure">Annexure</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flat Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-bg-card border border-border-primary rounded-lg p-4 sm:p-6">
                <h3 className="text-h3 text-text-primary mb-4">Flat Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <InfoItem icon={Home} label="Flat Number" value={flat.flat_number} mono />
                  <InfoItem icon={Building2} label="BHK" value={`${flat.bhk_type} BHK`} />
                  <InfoItem icon={Building2} label="Area" value={`${flat.carpet_area_sft ?? "-"} sqft`} />
                  <InfoItem icon={IndianRupee} label="Base Rent" value={`₹${flat.base_rent.toLocaleString("en-IN")}`} />
                  <InfoItem icon={IndianRupee} label="Maintenance" value={`₹${flat.maintenance_amount.toLocaleString("en-IN")}`} />
                  <InfoItem icon={IndianRupee} label="Inclusive Rent" value={`₹${flat.inclusive_rent.toLocaleString("en-IN")}`} highlight />
                  <InfoItem icon={Calendar} label="Due Day" value={`${flat.rent_due_day}th of each month`} />
                </div>
                {flat.notes && (
                  <div className="mt-4 pt-4 border-t border-border-primary">
                    <p className="text-caption text-text-muted mb-1">Internal Notes</p>
                    <p className="text-body-sm text-text-secondary">{flat.notes}</p>
                  </div>
                )}
              </div>

              {/* Tenant Section */}
              {tenant && (
                <div className="bg-bg-card border border-border-primary rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-h3 text-text-primary">Current Tenant</h3>
                    <Link href={`/pm/flats/${flat.id}/tenant`}>
                      <Button variant="outline" size="sm" className="border-border-primary text-text-secondary">
                        View Details
                      </Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoItem icon={User} label="Name" value={tenant.name} />
                    <InfoItem icon={User} label="Type" value={tenant.tenant_type === "family" ? "Family" : "Bachelor"} />
                    <InfoItem icon={Building2} label="Company" value={tenant.company_name ?? "-"} />
                    <InfoItem icon={Calendar} label="Lease Start" value={tenant.lease_start_date ?? "-"} />
                    <InfoItem icon={Calendar} label="Lease End" value={tenant.lease_end_date ?? "-"} />
                    <InfoItem icon={IndianRupee} label="Security Deposit" value={tenant.security_deposit ? `₹${tenant.security_deposit.toLocaleString("en-IN")}` : "-"} />
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <NotesSection
                entityType="flat"
                entityId={flat.id}
                notes={notes}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-bg-card border border-border-primary rounded-lg p-6">
                <h3 className="text-h3 text-text-primary mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/pm/rent/record" className="block">
                    <Button variant="outline" className="w-full justify-start border-border-primary text-text-secondary">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Record Rent Payment
                    </Button>
                  </Link>
                  <Link href="/pm/expenses/record" className="block">
                    <Button variant="outline" className="w-full justify-start border-border-primary text-text-secondary">
                      <Wrench className="h-4 w-4 mr-2" />
                      Record Expense
                    </Button>
                  </Link>
                  <Link href={`/pm/owners/${flat.owner_id}`} className="block">
                    <Button variant="outline" className="w-full justify-start border-border-primary text-text-secondary">
                      <User className="h-4 w-4 mr-2" />
                      View Owner
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-bg-card border border-border-primary rounded-lg p-6">
                <h3 className="text-h3 text-text-primary mb-4">Rent Summary</h3>
                <div className="space-y-3">
                  {rentHistory.length > 0 ? (
                    <>
                      <SummaryRow
                        label="Last Payment"
                        value={rentHistory[0].payment_date ? new Date(rentHistory[0].payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      />
                      <SummaryRow
                        label="Last Amount"
                        value={`₹${rentHistory[0].amount.toLocaleString("en-IN")}`}
                        color="text-success"
                      />
                      <SummaryRow
                        label="Payments This Year"
                        value={String(rentHistory.filter(r => new Date(r.payment_date).getFullYear() === new Date().getFullYear()).length)}
                      />
                      <SummaryRow
                        label="Total Collected"
                        value={`₹${rentHistory.reduce((sum, r) => sum + r.amount, 0).toLocaleString("en-IN")}`}
                      />
                    </>
                  ) : (
                    <p className="text-body-sm text-text-muted">No rent payments recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Security Deposit Card */}
              {tenant && (
                <div className="bg-bg-card border border-border-primary rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-4 w-4 text-accent" />
                    <h3 className="text-h3 text-text-primary">Security Deposit</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="text-center py-3 bg-bg-elevated rounded-lg">
                      <p className="text-caption text-text-muted mb-1">Deposit Amount</p>
                      <p className="text-h2 text-accent font-bold">
                        {tenant.security_deposit
                          ? `₹${tenant.security_deposit.toLocaleString("en-IN")}`
                          : "Not set"}
                      </p>
                    </div>
                    <SummaryRow
                      label="Status"
                      value={tenant.is_active ? "Active" : (tenant.exit_date ? "Refunded/Pending Refund" : "Inactive")}
                      color={tenant.is_active ? "text-success" : "text-warning"}
                    />
                  </div>
                </div>
              )}

              {/* Lease Agreement Card */}
              {tenant && (
                <div className="bg-bg-card border border-border-primary rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-4 w-4 text-accent" />
                    <h3 className="text-h3 text-text-primary">Lease Agreement</h3>
                  </div>
                  <div className="space-y-3">
                    {leaseStartDate && leaseEndDate ? (
                      <>
                        <SummaryRow
                          label="Start Date"
                          value={leaseStartDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        />
                        <SummaryRow
                          label="End Date"
                          value={leaseEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        />
                        {daysRemaining !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-body-sm text-text-secondary">Days Remaining</span>
                            <span className={`text-body-sm font-medium ${
                              daysRemaining <= 0 ? "text-danger" : leaseExpiringSoon ? "text-warning" : "text-text-primary"
                            }`}>
                              {daysRemaining <= 0 ? "Expired" : `${daysRemaining} days`}
                            </span>
                          </div>
                        )}
                        {leaseExpiringSoon && daysRemaining > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-warning/10 border border-warning/30 rounded-md">
                            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                            <span className="text-caption text-warning font-medium">
                              Lease expires in {daysRemaining} days
                            </span>
                          </div>
                        )}
                        {daysRemaining !== null && daysRemaining <= 0 && (
                          <div className="flex items-center gap-2 p-2 bg-danger/10 border border-danger/30 rounded-md">
                            <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                            <span className="text-caption text-danger font-medium">
                              Lease has expired
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-body-sm text-text-muted">Lease dates not set.</p>
                    )}
                    {agreementUrl ? (
                      <a
                        href={agreementUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full mt-2 p-2.5 text-body-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        View Lease Agreement
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 p-2.5 text-body-sm text-text-muted bg-bg-elevated rounded-lg">
                        <FileText className="h-4 w-4 shrink-0" />
                        No agreement uploaded
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Rent History Tab */}
        <TabsContent value="rent">
          <div className="bg-bg-card border border-border-primary rounded-lg overflow-x-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-border-primary">
              <h3 className="text-h3 text-text-primary">Rent History</h3>
            </div>
            {rentHistory.length > 0 ? (
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left text-caption text-text-muted font-medium px-4 sm:px-6 py-3">Month</th>
                    <th className="text-right text-caption text-text-muted font-medium px-4 sm:px-6 py-3">Amount</th>
                    <th className="text-left text-caption text-text-muted font-medium px-4 sm:px-6 py-3">Date</th>
                    <th className="text-center text-caption text-text-muted font-medium px-4 sm:px-6 py-3">Status</th>
                    <th className="text-center text-caption text-text-muted font-medium px-4 sm:px-6 py-3">Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {rentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors">
                      <td className="px-6 py-3 text-body-sm text-text-primary">{payment.payment_month}</td>
                      <td className="px-6 py-3 text-right text-body-sm text-text-primary font-medium">
                        ₹{payment.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3 text-body-sm text-text-secondary">
                        {new Date(payment.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <StatusBadge status={payment.payment_status} />
                      </td>
                      <td className="px-6 py-3 text-center">
                        {payment.proof_urls.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-accent text-caption"
                            onClick={() => openProofViewer(payment.proof_urls, payment.payment_month)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-caption text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-body-sm text-text-muted">No rent payments recorded yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Revisions Tab */}
        <TabsContent value="revisions">
          <div className="bg-bg-card border border-border-primary rounded-lg overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-border-primary">
              <h3 className="text-h3 text-text-primary">Rent Revisions</h3>
              <p className="text-caption text-text-muted mt-1">Timeline of rent changes for this flat</p>
            </div>
            {rentRevisions.length > 0 ? (
              <div className="px-4 sm:px-6 py-6">
                <div className="relative">
                  {rentRevisions.map((revision, index) => {
                    const isLast = index === rentRevisions.length - 1;
                    const pctChange = revision.percentage_change;
                    const isPositive = pctChange !== null && pctChange > 0;
                    const isNegative = pctChange !== null && pctChange < 0;

                    return (
                      <div key={revision.id} className="relative flex gap-4">
                        {/* Timeline line and dot */}
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-accent flex-shrink-0 mt-1" />
                          {!isLast && (
                            <div className="w-0.5 bg-border-primary flex-1 min-h-[24px]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 ${!isLast ? "pb-6" : ""}`}>
                          <p className="text-caption text-text-muted">
                            {new Date(revision.revision_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {revision.effective_from && (
                              <span className="ml-2">
                                (effective {new Date(revision.effective_from).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })})
                              </span>
                            )}
                          </p>

                          <div className="mt-1 space-y-1">
                            {/* Inclusive rent change */}
                            {revision.old_inclusive_rent !== null && revision.new_inclusive_rent !== null && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-body-sm text-text-primary font-medium">
                                  ₹{revision.old_inclusive_rent.toLocaleString("en-IN")}
                                </span>
                                <span className="text-text-muted">{"\u2192"}</span>
                                <span className="text-body-sm text-text-primary font-medium">
                                  ₹{revision.new_inclusive_rent.toLocaleString("en-IN")}
                                </span>
                                {pctChange !== null && (
                                  <span
                                    className={`text-caption font-medium ${
                                      isPositive ? "text-success" : isNegative ? "text-error" : "text-text-muted"
                                    }`}
                                  >
                                    ({isPositive ? "+" : ""}
                                    {pctChange.toFixed(1)}%)
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Base rent + maintenance breakdown */}
                            {(revision.old_base_rent !== null || revision.old_maintenance !== null) && (
                              <div className="text-caption text-text-secondary">
                                {revision.old_base_rent !== null && revision.new_base_rent !== null && (
                                  <span>
                                    Base: ₹{revision.old_base_rent.toLocaleString("en-IN")} {"\u2192"} ₹{revision.new_base_rent.toLocaleString("en-IN")}
                                  </span>
                                )}
                                {revision.old_base_rent !== null && revision.old_maintenance !== null && (
                                  <span className="mx-2">|</span>
                                )}
                                {revision.old_maintenance !== null && revision.new_maintenance !== null && (
                                  <span>
                                    Maint: ₹{revision.old_maintenance.toLocaleString("en-IN")} {"\u2192"} ₹{revision.new_maintenance.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Reason */}
                            {revision.reason && (
                              <p className="text-caption text-text-muted italic">
                                {revision.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-body-sm text-text-muted">No rent changes recorded.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <div className="bg-bg-card border border-border-primary rounded-lg overflow-x-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-border-primary">
              <h3 className="text-h3 text-text-primary">Expenses</h3>
            </div>
            {expenses.length > 0 ? (
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left text-caption text-text-muted font-medium px-6 py-3">Date</th>
                    <th className="text-left text-caption text-text-muted font-medium px-6 py-3">Category</th>
                    <th className="text-left text-caption text-text-muted font-medium px-6 py-3">Description</th>
                    <th className="text-right text-caption text-text-muted font-medium px-6 py-3">Amount</th>
                    <th className="text-left text-caption text-text-muted font-medium px-6 py-3">Vendor</th>
                    <th className="text-center text-caption text-text-muted font-medium px-6 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors">
                      <td className="px-6 py-3 text-body-sm text-text-secondary">
                        {new Date(expense.expense_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-caption bg-bg-elevated px-2 py-0.5 rounded text-text-primary">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-body-sm text-text-primary">{expense.description}</td>
                      <td className="px-6 py-3 text-right text-body-sm text-text-primary font-medium">
                        ₹{expense.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3 text-body-sm text-text-secondary">{expense.vendor_name ?? "-"}</td>
                      <td className="px-6 py-3 text-center">
                        {expense.receipt_urls.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-accent text-caption"
                            onClick={() => openReceiptViewer(expense.receipt_urls, expense.description)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-caption text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-body-sm text-text-muted">No expenses recorded yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Annexure Tab */}
        <TabsContent value="annexure">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-h3 text-text-primary">Flat Annexure / Inventory</h3>
                <p className="text-body-sm text-text-secondary mt-1">
                  Move-in and move-out inventory records for this flat.
                </p>
              </div>
              <Link href={`/pm/documents/generate/annexure?flat_id=${flat.id}`}>
                <Button className="gap-1.5 bg-accent text-white hover:bg-accent/90">
                  <Plus className="h-4 w-4" />
                  Create Annexure
                </Button>
              </Link>
            </div>

            {annexures.length > 0 ? (
              <div className="space-y-3">
                {annexures.map((ann) => (
                  <div
                    key={ann.id}
                    className="bg-bg-card border border-border-primary rounded-lg p-4 flex items-center justify-between hover:bg-bg-hover transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-bg-elevated flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-body-sm text-text-primary font-medium">
                          {ann.type === "move_in" ? "Move-In" : "Move-Out"} Annexure
                        </p>
                        <p className="text-caption text-text-muted">
                          {new Date(ann.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {ann.type === "move_out" && ann.refundAmount != null && (
                        <div className="text-right">
                          <p className="text-caption text-text-muted">Refund</p>
                          <p className="text-body-sm text-success font-medium">
                            ₹{ann.refundAmount.toLocaleString("en-IN")}
                          </p>
                        </div>
                      )}
                      <StatusBadge status={ann.isCompleted ? "approved" : "draft"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center">
                <ClipboardList className="h-10 w-10 text-text-muted mx-auto mb-3" />
                <p className="text-body-sm text-text-secondary">
                  No annexures created yet.
                </p>
                <p className="text-caption text-text-muted mt-1">
                  Create a move-in annexure when a tenant moves in, or a move-out annexure when they leave.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <div className="space-y-6">
            {/* Lease Agreement Section */}
            {tenant && (
              <div className="bg-bg-card border border-border-primary rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-accent" />
                  <h3 className="text-h3 text-text-primary">Lease Agreement</h3>
                  {leaseExpiringSoon && daysRemaining !== null && daysRemaining > 0 && (
                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-caption font-medium text-warning bg-warning/10 border border-warning/30 rounded-full">
                      <AlertTriangle className="h-3 w-3" />
                      Expires in {daysRemaining} days
                    </span>
                  )}
                  {daysRemaining !== null && daysRemaining <= 0 && (
                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-caption font-medium text-danger bg-danger/10 border border-danger/30 rounded-full">
                      <AlertTriangle className="h-3 w-3" />
                      Expired
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-caption text-text-muted">Tenant</p>
                    <p className="text-body-sm text-text-primary font-medium">{tenant.name}</p>
                  </div>
                  <div>
                    <p className="text-caption text-text-muted">Lease Start</p>
                    <p className="text-body-sm text-text-primary">
                      {leaseStartDate
                        ? leaseStartDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-caption text-text-muted">Lease End</p>
                    <p className="text-body-sm text-text-primary">
                      {leaseEndDate
                        ? leaseEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-caption text-text-muted">Days Remaining</p>
                    <p className={`text-body-sm font-medium ${
                      daysRemaining === null ? "text-text-muted" :
                      daysRemaining <= 0 ? "text-danger" :
                      leaseExpiringSoon ? "text-warning" : "text-text-primary"
                    }`}>
                      {daysRemaining === null ? "N/A" : daysRemaining <= 0 ? "Expired" : `${daysRemaining} days`}
                    </p>
                  </div>
                </div>
                {agreementUrl ? (
                  <a
                    href={agreementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-body-sm font-medium text-white bg-accent hover:bg-accent-light rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Agreement Document
                  </a>
                ) : (
                  <p className="text-body-sm text-text-muted">No agreement document uploaded.</p>
                )}
              </div>
            )}

            {/* Tenant Documents */}
            {tenant && (
              <div className="bg-bg-card border border-border-primary rounded-lg p-6">
                <h3 className="text-h3 text-text-primary mb-4">Tenant Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DocStatusItem label="Aadhaar Card" uploaded={!!tenant.aadhaar_file_id} />
                  <DocStatusItem label="PAN Card" uploaded={!!tenant.pan_file_id} />
                  <DocStatusItem label="Employment Proof" uploaded={!!tenant.employment_proof_file_id} />
                  <DocStatusItem label="Rental Agreement" uploaded={!!tenant.agreement_file_id} />
                </div>
              </div>
            )}

            {!tenant && (
              <div className="bg-bg-card border border-border-primary rounded-lg p-6">
                <h3 className="text-h3 text-text-primary mb-4">Documents</h3>
                <p className="text-body-sm text-text-muted">No active tenant. Documents will appear when a tenant is assigned.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ImageViewer
        images={viewerImages}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  mono,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-text-muted mt-0.5" />
      <div>
        <p className="text-caption text-text-muted">{label}</p>
        <p className={`text-body-sm ${highlight ? "text-accent font-semibold" : "text-text-primary"} ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body-sm text-text-secondary">{label}</span>
      <span className={`text-body-sm font-medium ${color ?? "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}

function DocStatusItem({ label, uploaded }: { label: string; uploaded: boolean }) {
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
