import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ExpenseForm } from "@/components/forms/expense-form";

export default async function RecordExpensePage() {
  const supabase = createClient();

  // Fetch all active flats with owner names for the flat selector
  const { data: flats } = await supabase
    .from("flats")
    .select("id, flat_number, owner:owners(name)")
    .eq("is_active", true)
    .order("flat_number");

  const normalizedFlats = (flats ?? []).map((flat: any) => ({
    id: flat.id,
    flat_number: flat.flat_number,
    owner: flat.owner?.name ?? "Unknown",
  }));

  return (
    <div className="w-full">
      <PageHeader
        title="Record Expense"
        description="Record a repair or expense for a flat"
        backHref="/pm/expenses"
      />
      <ExpenseForm flats={normalizedFlats} />
    </div>
  );
}
