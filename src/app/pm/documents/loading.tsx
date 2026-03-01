import { TableSkeleton } from "@/components/shared/skeleton-loader";

export default function DocumentsLoading() {
  return <TableSkeleton rows={6} cols={6} />;
}
