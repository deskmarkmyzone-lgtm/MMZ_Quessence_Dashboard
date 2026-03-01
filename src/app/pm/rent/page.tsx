import { Suspense } from "react";
import { getRentPayments } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { RentContent } from "./rent-content";

export default async function RentPaymentsPage() {
  const supabase = createClient();

  // Fetch rent payments with joined flat/tenant/owner/community data
  const { data: payments } = await supabase
    .from("rent_payments")
    .select(
      "*, flat:flats(id, flat_number, community:communities(name), owner:owners(name)), tenant:tenants(name)"
    )
    .order("payment_date", { ascending: false })
    .limit(100);

  // Derive unique filter options from the data
  const allPayments = payments ?? [];
  const owners = Array.from(
    new Set(allPayments.map((p: any) => p.flat?.owner?.name).filter(Boolean))
  );
  const months = Array.from(
    new Set(allPayments.map((p: any) => p.payment_month).filter(Boolean))
  ).sort((a: string, b: string) => b.localeCompare(a));
  const methods = Array.from(
    new Set(allPayments.map((p: any) => p.payment_method).filter(Boolean))
  );

  return (
    <Suspense
      fallback={
        <div className="w-full animate-pulse">
          <div className="h-8 bg-bg-elevated rounded w-48 mb-6" />
          <div className="h-64 bg-bg-elevated rounded-lg" />
        </div>
      }
    >
      <RentContent
        payments={allPayments}
        owners={owners}
        months={months}
        methods={methods}
      />
    </Suspense>
  );
}
