import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LibraryBig, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDelete } from "@/components/confirm-delete";
import { ScoreRing } from "@/components/score-ring";
import { EmptyState } from "@/components/empty-state";
import { CATEGORIES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/library/")({
  head: () => ({
    meta: [
      { title: "Library — Prompt Forge AI" },
      {
        name: "description",
        content:
          "Search, filter and manage every prompt you've forged, with quality scores and version history.",
      },
      { property: "og:title", content: "Library — Prompt Forge AI" },
      { property: "og:description", content: "Search and manage every prompt you've forged." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

export function usePrompts() {
  return useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function LibraryPage() {
  const { data, isLoading } = usePrompts();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");

  const rows = useMemo(() => {
    let list = data ?? [];
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.content.toLowerCase().includes(needle) ||
          p.tags.some((t) => t.toLowerCase().includes(needle)),
      );
    }
    if (category !== "all") list = list.filter((p) => p.category === category);
    const sorted = [...list];
    if (sort === "score") sorted.sort((a, b) => b.quality_score - a.quality_score);
    if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "favorites") sorted.sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite));
    return sorted;
  }, [data, q, category, sort]);

  async function toggleFavorite(id: string, next: boolean) {
    await supabase.from("prompts").update({ is_favorite: next }).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["prompts"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("prompts").delete().eq("id", id);
    if (error) {
      toast.error(error.message || "Could not delete that prompt");
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Prompt deleted");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-tight">Library</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {data?.length ?? 0} saved prompt{(data?.length ?? 0) === 1 ? "" : "s"}
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search prompts, content and tags…"
            className="pl-9"
            aria-label="Search prompts"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="score">Highest score</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
            <SelectItem value="favorites">Favorites first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
      </div>

      {!isLoading && !rows.length && (
        <div className="mt-5">
          <EmptyState
            icon={LibraryBig}
            title={data?.length ? "No matches" : "Your library is empty"}
            description={
              data?.length
                ? "Try a different search term or category filter."
                : "Prompts you forge and save will collect here with scores and versions."
            }
          />
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((p) => (
          <article
            key={p.id}
            className="panel group relative flex flex-col p-4 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-3">
              <ScoreRing score={p.quality_score} size={46} stroke={4} />
              <div className="min-w-0 flex-1">
                <Link
                  to="/library/$promptId"
                  params={{ promptId: p.id }}
                  className="block truncate text-sm font-semibold hover:underline"
                >
                  {p.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {p.idea || p.content}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="capitalize">
                {p.category}
              </Badge>
              <Badge variant="outline" className="uppercase">
                {p.model}
              </Badge>
              <Badge variant="outline">v{p.version}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
              <span className="text-[11px] text-muted-foreground">
                {new Date(p.updated_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={p.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  onClick={() => void toggleFavorite(p.id, !p.is_favorite)}
                >
                  <Star className={p.is_favorite ? "size-4 fill-warning text-warning" : "size-4"} />
                </Button>
                <ConfirmDelete title={`Delete "${p.title}"?`} onConfirm={() => remove(p.id)} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
