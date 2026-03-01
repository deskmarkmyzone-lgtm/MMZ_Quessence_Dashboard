import { PageHeader } from "@/components/shared/page-header";
import { OwnerForm } from "@/components/forms/owner-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewOwnerPage() {
  // Fetch communities for the dropdown
  const supabase = createClient();
  const { data: communities } = await supabase
    .from("communities")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="w-full">
      <PageHeader
        title="Add Owner"
        description="Create a new property owner"
        backHref="/pm/owners"
      />
      <OwnerForm communities={communities ?? []} />
    </div>
  );
}
