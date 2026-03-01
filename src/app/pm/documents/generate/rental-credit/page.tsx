import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { RentalCreditContent } from "./rental-credit-content";

export default async function RentalCreditReportPage() {
  const supabase = createClient();

  const { data: flatsData } = await supabase
    .from("flats")
    .select(
      "id, flat_number, bhk_type, carpet_area_sft, inclusive_rent, base_rent, maintenance_amount, owner:owners(id, name), tenants(id, name, lease_start_date, lease_end_date, monthly_rent, monthly_inclusive_rent, monthly_maintenance, is_active, security_deposit)"
    )
    .eq("is_active", true)
    .eq("status", "occupied");

  const { data: paymentsData } = await supabase
    .from("rent_payments")
    .select(
      "id, flat_id, amount, payment_date, payment_month, base_rent_portion, maintenance_portion, remarks"
    )
    .order("payment_date", { ascending: true });

  const { data: settingsData } = await supabase
    .from("mmz_settings")
    .select("*")
    .maybeSingle();

  const flats = (flatsData ?? []).map((f: any) => {
    const activeTenant = Array.isArray(f.tenants)
      ? f.tenants.find((t: any) => t.is_active)
      : null;

    return {
      id: f.id,
      flat_number: f.flat_number,
      bhk_type: f.bhk_type,
      carpet_area_sft: f.carpet_area_sft ?? 0,
      inclusive_rent: activeTenant?.monthly_inclusive_rent ?? f.inclusive_rent ?? 0,
      base_rent: activeTenant?.monthly_rent ?? f.base_rent ?? 0,
      maintenance_amount: activeTenant?.monthly_maintenance ?? f.maintenance_amount ?? 0,
      owner_id: f.owner?.id ?? "",
      owner_name: f.owner?.name ?? "-",
      tenant_name: activeTenant?.name ?? "-",
      tenant_type: "Tenant",
      lease_start: activeTenant?.lease_start_date ?? "",
      lease_end: activeTenant?.lease_end_date ?? "",
      security_deposit: activeTenant?.security_deposit ?? 0,
    };
  });

  const rentPayments = (paymentsData ?? []).map((p: any) => ({
    id: p.id,
    flat_id: p.flat_id,
    amount: p.amount ?? 0,
    payment_date: p.payment_date,
    payment_month: p.payment_month ?? "",
    base_rent_portion: p.base_rent_portion ?? 0,
    maintenance_portion: p.maintenance_portion ?? 0,
    remarks: p.remarks ?? "",
  }));

  const bankDetails = settingsData
    ? {
        bank_name: settingsData.bank_name,
        account_number: settingsData.account_number,
        ifsc_code: settingsData.ifsc_code,
        branch_name: settingsData.branch_name,
        account_holder_name: settingsData.account_holder_name,
      }
    : null;

  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-bg-elevated rounded w-64 mb-6" />
          <div className="h-48 bg-bg-elevated rounded-lg mb-6" />
          <div className="h-64 bg-bg-elevated rounded-lg" />
        </div>
      }
    >
      <RentalCreditContent
        flats={flats}
        rentPayments={rentPayments}
        bankDetails={bankDetails}
      />
    </Suspense>
  );
}
