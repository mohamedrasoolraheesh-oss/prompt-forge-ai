import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  FlaskConical,
  History,
  LayoutDashboard,
  LayoutTemplate,
  LibraryBig,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Wand2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useHotkey, modKey } from "@/hooks/useHotkey";
import { useTheme } from "@/hooks/useTheme";
import { CommandPalette } from "@/components/layout/command-palette";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/forge", label: "Forge", icon: Sparkles },
  { to: "/optimize", label: "Optimize", icon: Wand2 },
  { to: "/playground", label: "Playground", icon: FlaskConical },
  { to: "/library", label: "Library", icon: LibraryBig },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
      return (
        data ?? {
          id: auth.user.id,
          email: auth.user.email ?? "",
          full_name: auth.user.email?.split("@")[0] ?? "there",
          avatar_url: null,
          plan: "Pro Trial",
          default_model: "gpt",
          default_style: "detailed",
          theme: "dark",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );
    },
  });
}

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Main">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        const link = (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r forge-gradient" />
            )}
            <Icon className={cn("size-4 shrink-0 transition-transform group-hover:scale-110", active && "text-primary")} aria-hidden />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
        return collapsed ? (
          <Tooltip key={to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ) : (
          link
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg forge-gradient shadow-glow">
        <Zap className="size-4 text-white" aria-hidden />
      </span>
      {!collapsed && (
        <span className="font-display text-[15px] font-bold tracking-tight">Prompt Forge</span>
      )}
    </Link>
  );
}

function UserBlock({ collapsed }: { collapsed: boolean }) {
  const { data: profile } = useProfile();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const initials = (profile?.full_name ?? profile?.email ?? "PF").slice(0, 2).toUpperCase();

  return (
    <div className={cn("mt-auto border-t border-sidebar-border p-3", collapsed && "px-2")}>
      <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                {initials}
              </span>
              {!collapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {profile?.full_name ?? "Forger"}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {profile?.plan ?? "Free"}
                  </span>
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="truncate">{profile?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void navigate({ to: "/settings" })}>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                await supabase.auth.signOut();
                toast.success("Signed out");
                void navigate({ to: "/login" });
              }}
            >
              <LogOut className="size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggle}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useHotkey("k", () => setPaletteOpen((v) => !v));
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-background">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 md:flex",
            collapsed ? "w-[76px]" : "w-[248px]",
          )}
        >
          <Brand collapsed={collapsed} />
          <NavLinks collapsed={collapsed} />
          <UserBlock collapsed={collapsed} />
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3.5 top-6 hidden size-7 rounded-full border border-border bg-surface md:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
          </Button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border glass px-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex h-full flex-col">
                  <Brand collapsed={false} />
                  <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
                  <UserBlock collapsed={false} />
                </div>
              </SheetContent>
            </Sheet>

            <button
              onClick={() => setPaletteOpen(true)}
              className="group flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:max-w-sm"
            >
              <Search className="size-4" aria-hidden />
              <span className="flex-1 text-left">Search or run a command…</span>
              <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                {modKey()} K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="sm">
                    <Link to="/forge">
                      <Sparkles className="size-4" /> New Prompt
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New prompt — {modKey()} Enter to forge</TooltipContent>
              </Tooltip>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </TooltipProvider>
  );
}
