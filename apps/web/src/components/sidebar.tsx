"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Brain,
  Calendar,
  ClipboardList,
  Crosshair,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/notifications";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  notifications?: AppNotification[];
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hoje", label: "Hoje", icon: Crosshair },
  { href: "/decks", label: "Decks", icon: Layers },
  { href: "/review", label: "Revisão", icon: BookOpen },
  { href: "/simulados", label: "Simulados", icon: ClipboardList },
  { href: "/gaps", label: "Lacunas", icon: Brain },
  { href: "/planner", label: "Planner", icon: Calendar },
];

/** Shared nav content used in both desktop sidebar and mobile sheet */
function SidebarContent({
  user,
  pathname,
  notifications,
  onNavigate,
}: {
  user: SidebarProps["user"];
  pathname: string;
  notifications: AppNotification[];
  onNavigate?: () => void;
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Logo + Notifications */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={onNavigate}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 transition-transform group-hover:scale-105">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">SinapseMED</span>
        </Link>
        <NotificationBell notifications={notifications} />
      </div>

      <Separator className="bg-white/10" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white/10 text-white font-semibold border-l-2 border-white"
                  : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-white/10" />

      {/* User section */}
      <div className="p-3 space-y-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
            pathname === "/settings"
              ? "bg-white/10 text-white font-semibold border-l-2 border-white"
              : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
          )}
        >
          <Settings className={cn("h-4 w-4 shrink-0", pathname === "/settings" ? "text-white" : "")} />
          Configurações
        </Link>

        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="text-xs bg-white/15 text-sidebar-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

/** Desktop sidebar — hidden on mobile */
export function Sidebar({ user, notifications = [] }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <SidebarContent user={user} pathname={pathname} notifications={notifications} />
    </aside>
  );
}

/** Mobile header with hamburger + Sheet drawer */
export function MobileHeader({ user, notifications = [] }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sheet on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top bar — visible only on mobile */}
      <header className="flex lg:hidden items-center justify-between h-14 border-b bg-card px-4 sticky top-0 z-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight">SinapseMED</span>
        </Link>

        <NotificationBell notifications={notifications} />
      </header>

      {/* Sheet drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border" showCloseButton={false}>
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <div className="flex flex-col h-full">
            <SidebarContent
              user={user}
              pathname={pathname}
              notifications={notifications}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
