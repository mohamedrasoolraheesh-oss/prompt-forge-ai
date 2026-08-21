import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutTemplate, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScoreRing } from "@/components/score-ring";
import { PromptView, CopyButton } from "@/components/prompt-view";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({
    meta: [
      { title: "Templates — Rebel Prompt AI" },
      {
        name: "description",
        content:
          "A curated library of high-scoring prompt templates for coding, marketing, research and more.",
      },
      { property: "og:title", content: "Templates — Rebel Prompt AI" },
      {
        property: "og:description",
        content: "Curated, high-scoring prompt templates you can use instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Templates,
});

type Template = {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  recommended_model: string;
  quality_score: number;
};

function Templates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Template | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates").select("*").order("title");
      if (error) throw error;
      return data as Template[];
    },
  });

  const rows = useMemo(() => {
    if (!q.trim()) return data ?? [];
    const needle = q.toLowerCase();
    return (data ?? []).filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        t.description.toLowerCase().includes(needle) ||
        t.category.toLowerCase().includes(needle),
    );
  }, [data, q]);

  async function applyTemplate(t: Template) {
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { data: created, error } = await supabase
        .from("prompts")
        .insert({
          user_id: auth.user.id,
          title: t.title,
          idea: t.description,
          content: t.content,
          category: t.category,
          model: t.recommended_model,
          quality_score: t.quality_score,
          tags: ["template"],
        })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("activity").insert({
        user_id: auth.user.id,
        kind: "template",
        message: `Used template "${t.title}"`,
        prompt_id: created.id,
      });
      await queryClient.invalidateQueries();
      toast.success("Added to your library");
      void navigate({ to: "/library/$promptId", params: { promptId: created.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not use template");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-tight">Templates</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Battle-tested starting points, ready to customize.
        </p>
      </header>

      <div className="relative mt-6 max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search templates…"
          className="pl-9"
          aria-label="Search templates"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        {rows.map((t) => (
          <article
            key={t.id}
            className="panel flex flex-col p-5 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-base font-semibold leading-snug">{t.title}</h2>
              <ScoreRing score={t.quality_score} size={44} stroke={4} />
            </div>
            <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
              {t.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="capitalize">
                {t.category}
              </Badge>
              <Badge variant="outline" className="uppercase">
                {t.recommended_model}
              </Badge>
              {t.variables.length > 0 && <Badge variant="outline">{t.variables.length} vars</Badge>}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setActive(t)}>
                Preview
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => void applyTemplate(t)}
                disabled={busy}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Use
              </Button>
            </div>
          </article>
        ))}
      </div>

      {!isLoading && !rows.length && (
        <div className="mt-5">
          <EmptyState
            icon={LayoutTemplate}
            title="No templates match"
            description="Try a different search term."
          />
        </div>
      )}

      <Dialog open={Boolean(active)} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription>{active?.description}</DialogDescription>
          </DialogHeader>
          {active && <PromptView content={active.content} />}
          <DialogFooter className="gap-2 sm:gap-2">
            {active && <CopyButton text={active.content} />}
            <Button onClick={() => active && void applyTemplate(active)} disabled={busy}>
              Use template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
