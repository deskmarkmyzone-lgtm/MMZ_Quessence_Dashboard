import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page px-4">
      <div className="text-center max-w-md">
        <h1 className="text-[120px] font-bold leading-none text-accent/20">404</h1>
        <h2 className="text-h2 text-text-primary mt-2">Page not found</h2>
        <p className="text-body-sm text-text-secondary mt-3">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href="/pm"
            className="inline-flex items-center px-4 py-2 rounded-md bg-accent hover:bg-accent-light text-white text-body-sm font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 rounded-md border border-border-primary text-text-secondary hover:text-text-primary text-body-sm font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
