import { createClient } from "@/lib/supabase/server";

export async function getRentPayments(filters?: {
  search?: string;
  month?: string;
  status?: string;
  ownerId?: string;
  method?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from("rent_payments")
    .select(
      "*, flat:flats(id, flat_number, community:communities(id, name), owner:owners(id, name)), tenant:tenants(id, name)"
    )
    .order("payment_month", { ascending: false });

  if (filters?.month) {
    query = query.eq("payment_month", filters.month);
  }

  if (filters?.status) {
    query = query.eq("payment_status", filters.status);
  }

  if (filters?.ownerId) {
    query = query.eq("flat.owner_id", filters.ownerId);
  }

  if (filters?.method) {
    query = query.eq("payment_method", filters.method);
  }

  if (filters?.search) {
    query = query.or(
      `flat.flat_number.ilike.%${filters.search}%,payment_reference.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export async function getRentPaymentsByFlatId(flatId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rent_payments")
    .select("*, tenant:tenants(id, name)")
    .eq("flat_id", flatId)
    .order("payment_month", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getMonthlyRentGrid(month: string) {
  const supabase = createClient();

  // Get all occupied flats with their details
  const { data: flats, error: flatsError } = await supabase
    .from("flats")
    .select(
      "id, flat_number, inclusive_rent, community:communities(id, name), owner:owners(id, name), active_tenant:tenants(id, name)"
    )
    .eq("is_active", true)
    .eq("status", "occupied")
    .eq("active_tenant.is_active", true)
    .order("flat_number");

  if (flatsError) throw flatsError;

  // Get all rent payments for this month
  const { data: payments, error: paymentsError } = await supabase
    .from("rent_payments")
    .select("*")
    .eq("payment_month", month);

  if (paymentsError) throw paymentsError;

  // Build a map of flat_id -> payment
  const paymentMap = new Map(
    (payments ?? []).map((p) => [p.flat_id, p])
  );

  // Combine flats with their payment status
  return (flats ?? []).map((flat) => ({
    ...flat,
    payment: paymentMap.get(flat.id) ?? null,
  }));
}
