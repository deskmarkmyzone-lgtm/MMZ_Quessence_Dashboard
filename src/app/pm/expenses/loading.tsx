import { TableSkeleton } from "@/components/shared/skeleton-loader";

export default function ExpensesLoading() {
  return <TableSkeleton rows={6} cols={7} />;
}
