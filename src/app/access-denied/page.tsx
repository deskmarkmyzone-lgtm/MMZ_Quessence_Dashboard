import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative w-[160px] h-[48px] mx-auto">
          <Image
            src="/logo-dark.svg"
            alt="Mark My Zone"
            fill
            className="object-contain dark:hidden"
          />
          <Image
            src="/logo-light.svg"
            alt="Mark My Zone"
            fill
            className="object-contain hidden dark:block"
          />
        </div>
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-danger" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-h2 text-text-primary">Access Denied</h1>
          <p className="text-body text-text-secondary">
            Your account is not associated with any property manager or owner
            profile. Please contact your property manager to get access.
          </p>
        </div>
        <Link href="/login">
          <Button
            variant="outline"
            className="border-border-primary text-text-secondary hover:text-text-primary"
          >
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  );
}
