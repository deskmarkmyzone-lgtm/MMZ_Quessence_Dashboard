import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CommunityForm } from "@/components/forms/community-form";
import { getCommunityById } from "@/lib/dal";

export default async function EditCommunityPage({
  params,
}: {
  params: { id: string };
}) {
  let community;
  try {
    community = await getCommunityById(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Edit Community"
        description={`Editing ${community.name}`}
        backHref="/pm/communities"
      />
      <CommunityForm community={community} />
    </div>
  );
}
