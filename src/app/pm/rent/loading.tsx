import { TableSkeleton } from "@/components/shared/skeleton-loader";

export default function RentLoading() {
  return <TableSkeleton rows={8} cols={6} />;
}
