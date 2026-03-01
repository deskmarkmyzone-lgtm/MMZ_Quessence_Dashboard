import { Suspense } from "react";
import { getFlatsForMatching } from "./actions";
import { BulkRentContent } from "./bulk-rent-content";

export default async function BulkRentPage() {
  const flats = await getFlatsForMatching();

  return (
    <Suspense
      fallback={
        <div className="w-full animate-pulse">
          <div className="h-8 bg-bg-elevated rounded w-48 mb-6" />
          <div className="h-64 bg-bg-elevated rounded-lg" />
        </div>
      }
    >
      <BulkRentContent flats={flats} />
    </Suspense>
  );
}
