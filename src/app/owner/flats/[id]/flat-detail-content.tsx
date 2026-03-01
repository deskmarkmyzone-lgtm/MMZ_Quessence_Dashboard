"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { ImageViewer } from "@/components/shared/image-viewer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, Calendar, IndianRupee, Wrench } from "lucide-react";

interface FlatDetail {
  id: string;
  flat_number: string;
  community: string;
  bhk: string;
  sqft: number;
  status: "occupied" | "vacant" | "under_maintenance";
  tenant_name: string | null;
  tenant_type: "family" | "bachelor" | null;
  lease_start: string | null;
  lease_end: string | null;
  rent: number;
  base_rent: number;
  maintenance: number;
}

interface RentPayment {
  id: string;
  month: string;
  amount: number;
  date: string;
  status: "paid" | "partial" | "unpaid";
  method: string;
  proof_urls: string[];
}

interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  receipt_urls: string[];
}

interface FlatDetailContentProps {
  flat: FlatDetail;
  rentHistory: RentPayment[];
  expenses: ExpenseItem[];
}

export function FlatDetailContent({
  flat,
  rentHistory,
  expenses,
}: FlatDetailContentProps) {
  const router = useRouter();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<
    { src: string; alt?: string }[]
  >([]);

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

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/owner")}
          className="text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-h2 text-text-primary font-mono">
              {flat.flat_number}
            </h2>
            <StatusBadge status={flat.status} />
            {flat.tenant_type && <StatusBadge status={flat.tenant_type} />}
          </div>
          <p className="text-body-sm text-text-secondary mt-1">
            {flat.community} · {flat.bhk} ·{" "}
            {flat.sqft.toLocaleString("en-IN")} sqft
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-card border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-text-muted" />
            <span className="text-caption text-text-muted">Tenant</span>
          </div>
          <p className="text-body text-text-primary font-medium">
            {flat.tenant_name ?? "Vacant"}
          </p>
          {flat.lease_start && flat.lease_end && (
            <p className="text-caption text-text-secondary mt-1">
              {flat.lease_start} — {flat.lease_end}
            </p>
          )}
        </div>
        <div className="bg-bg-card border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="h-4 w-4 text-text-muted" />
            <span className="text-caption text-text-muted">Monthly Rent</span>
          </div>
          <p className="text-body text-accent font-bold">
            ₹{flat.rent.toLocaleString("en-IN")}
          </p>
          <p className="text-caption text-text-secondary mt-1">
            Base ₹{flat.base_rent.toLocaleString("en-IN")} + Maint ₹
            {flat.maintenance.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-bg-card border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-4 w-4 text-text-muted" />
            <span className="text-caption text-text-muted">
              Total Expenses
            </span>
          </div>
          <p className="text-body text-text-primary font-bold">
            ₹{totalExpenses.toLocaleString("en-IN")}
          </p>
          <p className="text-caption text-text-secondary mt-1">
            {expenses.length} repairs
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rent">
        <TabsList className="bg-bg-elevated border border-border-primary">
          <TabsTrigger
            value="rent"
            className="data-[state=active]:bg-bg-card"
          >
            Rent History
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="data-[state=active]:bg-bg-card"
          >
            Expenses
          </TabsTrigger>
        </TabsList>

        {/* Rent History Tab */}
        <TabsContent value="rent" className="mt-4">
          <div className="bg-bg-card border border-border-primary rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                    Month
                  </th>
                  <th className="text-right text-caption text-text-muted font-medium px-4 py-3">
                    Amount
                  </th>
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                    Date
                  </th>
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                    Method
                  </th>
                  <th className="text-center text-caption text-text-muted font-medium px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-caption text-text-muted font-medium px-4 py-3">
                    Proof
                  </th>
                </tr>
              </thead>
              <tbody>
                {rentHistory.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors"
                  >
                    <td className="px-4 py-3 text-body-sm text-text-primary font-medium">
                      {payment.month}
                    </td>
                    <td className="px-4 py-3 text-right text-body-sm text-text-primary font-medium">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {payment.date}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {payment.method}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {payment.proof_urls.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-accent hover:text-accent-light text-caption"
                          onClick={() =>
                            openProofViewer(payment.proof_urls, payment.month)
                          }
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {rentHistory.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-body-sm text-text-muted"
                    >
                      No rent payments recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="mt-4">
          <div className="bg-bg-card border border-border-primary rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                    Date
                  </th>
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                    Category
                  </th>
                  <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                    Description
                  </th>
                  <th className="text-right text-caption text-text-muted font-medium px-4 py-3">
                    Amount
                  </th>
                  <th className="text-right text-caption text-text-muted font-medium px-4 py-3">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors"
                  >
                    <td className="px-4 py-3 text-body-sm text-text-secondary">
                      {expense.date}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-caption bg-bg-elevated px-2 py-0.5 rounded text-text-primary">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-text-primary">
                      {expense.description}
                    </td>
                    <td className="px-4 py-3 text-right text-body-sm text-text-primary font-medium">
                      ₹{expense.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {expense.receipt_urls.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-accent hover:text-accent-light text-caption"
                          onClick={() =>
                            openReceiptViewer(
                              expense.receipt_urls,
                              expense.description
                            )
                          }
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-body-sm text-text-muted"
                    >
                      No expenses recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
