import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  /** When provided, shows a back arrow that navigates to this href */
  backHref?: string;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  backHref,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6" role="banner">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link href={backHref} aria-label="Go back">
            <Button
              variant="ghost"
              size="icon"
              className="text-text-secondary hover:text-text-primary h-11 w-11 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
        )}
        <div>
          <h1 className="text-h2 text-text-primary">{title}</h1>
          {description && (
            <p className="text-body text-text-secondary mt-1">{description}</p>
          )}
        </div>
      </div>
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Link href={actionHref}>
            <Button className="bg-accent hover:bg-accent-light text-white">
              <Plus className="h-4 w-4 mr-2" />
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button
            onClick={onAction}
            className="bg-accent hover:bg-accent-light text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
