import Link from "next/link";

export default function OwnerNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-[80px] font-bold leading-none text-accent/20">404</h1>
        <h2 className="text-h3 text-text-primary mt-2">Page not found</h2>
        <p className="text-body-sm text-text-secondary mt-3">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/owner"
          className="inline-flex items-center px-4 py-2 mt-6 rounded-md bg-accent hover:bg-accent-light text-white text-body-sm font-medium transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
