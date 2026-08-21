import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Rebel Prompt AI" },
      {
        name: "description",
        content: "Track prompt quality over time, category mix, model usage and test latency.",
      },
      { property: "og:title", content: "Analytics — Rebel Prompt AI" },
      {
        property: "og:description",
        content: "Track prompt quality, category mix and model usage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analytics,
});

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const [prompts, tests] = await Promise.all([
        supabase
          .from("prompts")
          .select("category, model, quality_score, created_at")
          .order("created_at"),
        supabase.from("prompt_tests").select("model, latency_ms, created_at").order("created_at"),
      ]);
      return { prompts: prompts.data ?? [], tests: tests.data ?? [] };
    },
  });

  const charts = useMemo(() => {
    const prompts = data?.prompts ?? [];
    const byDay = new Map<string, { day: string; score: number; count: number }>();
    for (const p of prompts) {
      const day = new Date(p.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const row = byDay.get(day) ?? { day, score: 0, count: 0 };
      row.score += p.quality_score;
      row.count += 1;
      byDay.set(day, row);
    }
    const quality = [...byDay.values()].map((r) => ({
      day: r.day,
      score: Math.round(r.score / r.count),
    }));

    const catMap = new Map<string, number>();
    for (const p of prompts) catMap.set(p.category, (catMap.get(p.category) ?? 0) + 1);
    const categories = [...catMap.entries()].map(([name, value]) => ({ name, value }));

    const modelMap = new Map<string, number>();
    for (const p of prompts) modelMap.set(p.model, (modelMap.get(p.model) ?? 0) + 1);
    const models = [...modelMap.entries()].map(([name, value]) => ({ name, value }));

    const latency = (data?.tests ?? []).slice(-20).map((t, i) => ({
      run: `#${i + 1}`,
      ms: t.latency_ms,
    }));

    return { quality, categories, models, latency, total: prompts.length };
  }, [data]);

  if (isLoading) {
    return (
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!charts.total) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Forge and test a few prompts — your quality trends and usage charts will appear here."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">How your prompt quality is trending.</p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Average quality over time">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={charts.quality}>
              <defs>
                <linearGradient id="q" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#q)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Prompts by category">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={charts.categories}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {charts.categories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Model usage">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.models}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Recent run latency (ms)">
          {charts.latency.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={charts.latency}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="run" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="ms" radius={[6, 6, 0, 0]} fill="var(--chart-4)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No playground runs yet.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="mb-3 font-display text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
