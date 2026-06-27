"use client";

import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && "hidden")}>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, mobileNavOpen, setMobileNavOpen } = useAppStore();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden border-r border-border bg-card xl:flex xl:flex-col",
          sidebarOpen ? "xl:w-72" : "xl:w-24",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <div className={cn("overflow-hidden transition-all", !sidebarOpen && "w-0 opacity-0")}>
            <Logo />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
        </div>
        <ScrollArea className="flex-1 px-3 py-5">
          <NavLinks collapsed={!sidebarOpen} />
        </ScrollArea>
      </aside>

      {/* Mobile / tablet drawer */}
      <div
        aria-hidden
        onClick={() => setMobileNavOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity xl:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col border-r border-border bg-card shadow-panel transition-transform duration-300 xl:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <Logo />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 px-3 py-5">
          <NavLinks collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
        </ScrollArea>
      </aside>
    </>
  );
}
