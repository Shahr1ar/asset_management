"use client";

import { Bell, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useAppStore } from "@/store/app-store";

export function Navbar() {
  const router = useRouter();
  const { adminProfile, logout } = useAuth();
  const setMobileNavOpen = useAppStore((state) => state.setMobileNavOpen);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-4 backdrop-blur xl:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          className="shrink-0 xl:hidden"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="hidden text-sm text-muted-foreground sm:block">Financial wallet admin</p>
          <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">
            Operations overview
          </h2>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto gap-3 rounded-full px-2 py-1.5">
              <Avatar className="h-9 w-9">
                <AvatarImage src={adminProfile?.profile.avatar} alt={adminProfile?.profile.fullName} />
                <AvatarFallback>
                  {adminProfile?.profile.fullName?.slice(0, 2).toUpperCase() ?? "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-foreground">
                  {adminProfile?.profile.fullName ?? "Admin User"}
                </p>
                <p className="text-xs text-muted-foreground">{adminProfile?.profile.email ?? "admin@wallet.io"}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
