import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { OwnerForm } from "@/components/forms/owner-form";
import { getOwnerById } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export default async function EditOwnerPage({
  params,
}: {
  params: { id: string };
}) {
  let owner;
  try {
    owner = await getOwnerById(params.id);
    if (!owner) notFound();
  } catch {
    notFound();
  }

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
        title="Edit Owner"
        description={`Editing ${owner.name}`}
        backHref={`/pm/owners/${params.id}`}
      />
      <OwnerForm owner={owner} communities={communities ?? []} />
    </div>
  );
}
