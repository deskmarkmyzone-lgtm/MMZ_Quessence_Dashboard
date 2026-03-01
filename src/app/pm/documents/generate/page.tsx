"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FileText, Receipt, Building2, BarChart3, ClipboardList,
  ArrowRight, ArrowLeft
} from "lucide-react";
import Link from "next/link";

const DOCUMENT_TYPES = [
  {
    type: "brokerage",
    title: "Brokerage Invoice",
    description: "Generate one-time brokerage fee invoice for new tenant placements. Includes TDS calculation.",
    icon: Receipt,
    href: "/pm/documents/generate/brokerage",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    type: "expenses",
    title: "Flat Expenses Bill",
    description: "Bill owners for repair and maintenance expenses paid by PM. Groups by flat with category breakdown.",
    icon: FileText,
    href: "/pm/documents/generate/expenses",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    type: "maintenance",
    title: "Maintenance Tracker",
    description: "Generate quarterly community maintenance charge summary per owner with pending amounts.",
    icon: Building2,
    href: "/pm/documents/generate/maintenance",
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    type: "rental-credit",
    title: "Rental Credit Report",
    description: "Full rent payment history for a flat during the tenancy period. Shows month-by-month breakdown.",
    icon: BarChart3,
    href: "/pm/documents/generate/rental-credit",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    type: "annexure",
    title: "Flat Annexure",
    description: "Room-by-room inventory checklist for move-in/move-out with deposit deduction calculation.",
    icon: ClipboardList,
    href: "/pm/documents/generate/annexure",
    color: "text-[#8B5CF6]",
    bg: "bg-[#8B5CF6]/10",
  },
];

export default function GenerateDocumentPage() {
  const router = useRouter();

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/pm/documents")}
          className="text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-h2 text-text-primary">Generate Document</h2>
          <p className="text-body text-text-secondary mt-1">
            Select a document type to generate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENT_TYPES.map((doc) => {
          const Icon = doc.icon;
          return (
            <Link
              key={doc.type}
              href={doc.href}
              className="bg-bg-card border border-border-primary rounded-lg p-6 hover:border-accent/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${doc.bg}`}>
                  <Icon className={`h-6 w-6 ${doc.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-body text-text-primary font-semibold">
                      {doc.title}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
                  </div>
                  <p className="text-caption text-text-secondary mt-1">
                    {doc.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
