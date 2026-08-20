import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  FlaskConical,
  LibraryBig,
  Sparkles,
  Star,
  TrendingUp,
  Wand2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScoreRing } from "@/components/score-ring";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Prompt Forge AI" },
      {
        name: "description",
        content: "Your prompt engineering overview: quality scores, recent prompts and activity.",
      },
      { property: "og:title", content: "Dashboard — Prompt Forge AI" },
      { property: "og:description", content: "Your prompt engineering overview at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [prompts, tests, activity] = await Promise.all([
        supabase.from("prompts").select("*").order("updated_at", { ascending: false }),
        supabase.from("prompt_tests").select("id, created_at, tokens, cost"),
        supabase.from("activity").select("*").order("created_at", { ascending: false }).limit(8),
      ]);
      const list = prompts.data ?? [];
      const avg = list.length
        ? Math.round(list.reduce((a, p) => a + (p.quality_score ?? 0), 0) / list.length)
        : 0;
      return {
        prompts: list,
        avg,
        favorites: list.filter((p) => p.is_favorite).length,
        tests: tests.data?.length ?? 0,
        tokens: (tests.data ?? []).reduce((a, t) => a + (t.tokens ?? 0), 0),
        activity: activity.data ?? [],
      };
    },
  });
}

const QUICK = [
  { to: "/forge", label: "Forge a prompt", desc: "Idea → structured prompt", icon: Sparkles },
  { to: "/optimize", label: "Optimize", desc: "Refine an existing prompt", icon: Wand2 },
  { to: "/playground", label: "Playground", desc: "Test with variables", icon: FlaskConical },
  { to: "/library", label: "Library", desc: "Browse saved prompts", icon: LibraryBig },
];

function Dashboard() {
  const { data, isLoading } = useDashboard();
  const { data: profile } = useProfile();
  const name = (profile?.full_name ?? "there").split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-rise">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Hey {name}, ready to <span className="text-gradient">forge</span>?
        </h1>
      </header>

      <section
        className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Overview stats"
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[104px] rounded-xl" />
            ))
          : [
              { label: "Prompts", value: data?.prompts.length ?? 0, icon: LibraryBig },
              { label: "Avg. quality", value: data?.avg ?? 0, icon: TrendingUp, suffix: "/100" },
              { label: "Favorites", value: data?.favorites ?? 0, icon: Star },
              { label: "Test runs", value: data?.tests ?? 0, icon: FlaskConical },
            ].map(({ label, value, icon: Icon, suffix }) => (
              <div
                key={label}
                className="panel p-5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                  </span>
                  <Icon className="size-4 text-primary" aria-hidden />
                </div>
                <p className="mt-3 font-display text-3xl font-bold tabular-nums">
                  {value}
                  {suffix && <span className="text-base text-muted-foreground">{suffix}</span>}
                </p>
              </div>
            ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent prompts</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/library">
                View all <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            {!isLoading && !data?.prompts.length && (
              <EmptyState
                icon={Sparkles}
                title="No prompts yet"
                description="Forge your first prompt and it will show up here."
              />
            )}
            {data?.prompts.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                to="/library/$promptId"
                params={{ promptId: p.id }}
                className="flex items-center gap-4 rounded-lg border border-border/60 bg-surface p-3 transition-colors hover:border-primary/40"
              >
                <ScoreRing score={p.quality_score ?? 0} size={44} stroke={4} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.title}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="capitalize">
                      {p.category}
                    </Badge>
                    <span className="uppercase">{p.model}</span>
                  </span>
                </span>
                {p.is_favorite && (
                  <Star className="size-4 fill-warning text-warning" aria-label="Favorite" />
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <h2 className="font-display text-lg font-semibold">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              {QUICK.map(({ to, label, desc, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center gap-3 rounded-lg border border-border/60 bg-surface p-3 transition-all hover:border-primary/40 hover:bg-accent/40"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="font-display text-lg font-semibold">Activity</h2>
            <ul className="mt-4 space-y-3">
              {!data?.activity.length && (
                <li className="text-sm text-muted-foreground">Nothing here yet.</li>
              )}
              {data?.activity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate">{a.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
