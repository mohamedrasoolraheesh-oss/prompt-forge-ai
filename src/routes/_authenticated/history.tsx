import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History as HistoryIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { CopyButton } from "@/components/prompt-view";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — Prompt Forge AI" },
      { name: "description", content: "Every playground run with its model, latency, tokens and full response." },
      { property: "og:title", content: "History — Prompt Forge AI" },
      { property: "og:description", content: "Every prompt test run, with latency and token stats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_tests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-tight">History</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Your most recent prompt runs.</p>
      </header>

      <div className="mt-6 space-y-3">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        {!isLoading && !data?.length && (
          <EmptyState
            icon={HistoryIcon}
            title="No runs yet"
            description="Head to the Playground and run a prompt — every execution is recorded here."
          />
        )}
        {data && data.length > 0 && (
          <Accordion type="single" collapsible className="panel divide-y divide-border/60 px-4">
            {data.map((t) => (
              <AccordionItem key={t.id} value={t.id} className="border-0">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex min-w-0 flex-1 items-center gap-3 pr-3 text-left">
                    <span className="min-w-0 flex-1 truncate text-sm">{t.prompt_text.slice(0, 90)}</span>
                    <Badge variant="outline" className="uppercase">{t.model}</Badge>
                    <Badge variant="secondary">{t.latency_ms} ms</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(t.created_at).toLocaleString()}</span>
                    <span>· temp {Number(t.temperature).toFixed(2)}</span>
                    <span>· {t.tokens} tokens</span>
                    {t.response && <CopyButton text={t.response} className="ml-auto" />}
                  </div>
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface p-4 font-mono text-[13px]">
                    {t.response ?? "—"}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
