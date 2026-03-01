import { PageHeader } from "@/components/shared/page-header";
import { CommunityForm } from "@/components/forms/community-form";

export default function NewCommunityPage() {
  return (
    <div className="w-full">
      <PageHeader
        title="Add Community"
        description="Create a new property community"
        backHref="/pm/communities"
      />
      <CommunityForm />
    </div>
  );
}
