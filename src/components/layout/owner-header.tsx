"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OwnerHeaderProps {
  ownerName: string;
  unreadCount: number;
}

export function OwnerHeader({ ownerName, unreadCount }: OwnerHeaderProps) {
  const router = useRouter();

  const initials = ownerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header role="banner" aria-label="Page header" className="h-16 bg-bg-card border-b border-border-primary flex items-center justify-between px-4 md:px-6">
      {/* Left: Logo + Greeting */}
      <div className="flex items-center gap-3">
        <Link href="/owner" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="hidden sm:inline text-body text-text-primary font-semibold">
            Mark My Zone
          </span>
        </Link>
      </div>

      {/* Right: Theme, Notifications, Profile */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Link href="/owner/notifications" aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            className="h-10 w-10 text-text-secondary hover:text-text-primary hover:bg-bg-hover relative"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full" aria-hidden="true" />
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" aria-label="User menu" className="h-10 w-10 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent text-white text-caption">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-bg-card border-border-primary"
          >
            <DropdownMenuItem className="text-text-secondary text-body-sm cursor-default">
              {ownerName}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border-primary" />
            <DropdownMenuItem
              onClick={() => router.push("/owner/profile")}
              className="text-text-primary cursor-pointer"
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-danger cursor-pointer"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
