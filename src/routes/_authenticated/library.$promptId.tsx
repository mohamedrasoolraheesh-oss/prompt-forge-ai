import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FlaskConical, History, Loader2, Save, Star, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing, ScoreBar } from "@/components/score-ring";
import { PromptView, CopyButton } from "@/components/prompt-view";
import { ErrorState } from "@/components/empty-state";
import { scorePrompt } from "@/lib/ai-client";
import { SCORE_LABELS, averageScore, scoreLabel, type Breakdown } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/library/$promptId")({
  head: () => ({
    meta: [
      { title: "Prompt detail — Prompt Forge AI" },
      {
        name: "description",
        content: "Review, edit, re-score and version a saved prompt in your Prompt Forge library.",
      },
      { property: "og:title", content: "Prompt detail — Prompt Forge AI" },
      { property: "og:description", content: "Review, edit and version a saved prompt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PromptDetail,
});

function PromptDetail() {
  const { promptId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["prompt", promptId],
    queryFn: async () => {
      const [prompt, versions] = await Promise.all([
        supabase.from("prompts").select("*").eq("id", promptId).maybeSingle(),
        supabase
          .from("prompt_versions")
          .select("*")
          .eq("prompt_id", promptId)
          .order("version", { ascending: false }),
      ]);
      if (prompt.error) throw prompt.error;
      if (!prompt.data) throw new Error("Prompt not found");
      return { prompt: prompt.data, versions: versions.data ?? [] };
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <ErrorState
          message="We couldn't load that prompt."
          onRetry={() => void queryClient.invalidateQueries()}
        />
      </div>
    );
  }

  const p = data.prompt;
  const content = draft ?? p.content;
  const breakdown = (p.score_breakdown ?? {}) as Partial<Breakdown>;
  const suggestions = Array.isArray(p.suggestions) ? (p.suggestions as string[]) : [];
  const dirty = (draft !== null && draft !== p.content) || (title !== null && title !== p.title);

  async function saveVersion() {
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const result = await scorePrompt(content, p.model);
      const score = averageScore(result.breakdown);
      const nextVersion = p.version + 1;
      const { error: upErr } = await supabase
        .from("prompts")
        .update({
          title: title ?? p.title,
          content,
          quality_score: score,
          score_breakdown: result.breakdown,
          suggestions: result.suggestions,
          version: nextVersion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
      if (upErr) throw upErr;
      await supabase.from("prompt_versions").insert({
        prompt_id: p.id,
        user_id: auth.user.id,
        version: nextVersion,
        content,
        note: "Manual edit",
        quality_score: score,
      });
      await supabase.from("activity").insert({
        user_id: auth.user.id,
        kind: "edit",
        message: `Saved v${nextVersion} of "${title ?? p.title}"`,
        prompt_id: p.id,
      });
      setDraft(null);
      setTitle(null);
      await queryClient.invalidateQueries();
      toast.success(`Saved version ${nextVersion}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function restore(version: number, versionContent: string) {
    setDraft(versionContent);
    toast.info(`Loaded v${version} into the editor — save to make it current`);
  }

  async function remove() {
    const { error: delErr } = await supabase.from("prompts").delete().eq("id", p.id);
    if (delErr) {
      toast.error(delErr.message || "Could not delete that prompt");
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Prompt deleted");
    void navigate({ to: "/library" });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/library">
          <ArrowLeft className="size-4" /> Library
        </Link>
      </Button>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Input
            value={title ?? p.title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Prompt title"
            className="h-auto border-0 bg-transparent px-0 font-display text-2xl font-bold tracking-tight shadow-none focus-visible:ring-0"
          />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="capitalize">
              {p.category}
            </Badge>
            <Badge variant="outline" className="uppercase">
              {p.model}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {p.style}
            </Badge>
            <Badge variant="outline">v{p.version}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={p.is_favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={async () => {
              await supabase.from("prompts").update({ is_favorite: !p.is_favorite }).eq("id", p.id);
              await queryClient.invalidateQueries();
            }}
          >
            <Star className={p.is_favorite ? "size-4 fill-warning text-warning" : "size-4"} />
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/playground" search={{ promptId: p.id }}>
              <FlaskConical className="size-4" /> Test
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/optimize" search={{ promptId: p.id }}>
              <Wand2 className="size-4" /> Optimize
            </Link>
          </Button>
          <Button size="sm" onClick={() => void saveVersion()} disabled={!dirty || busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
            version
          </Button>
          <ConfirmDelete title={`Delete "${title ?? p.title}"?`} onConfirm={() => remove()} />
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        <Tabs defaultValue="preview" className="min-w-0">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="versions">
              <History className="size-3.5" /> Versions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            <div className="panel p-5">
              <div className="mb-3 flex justify-end">
                <CopyButton text={content} />
              </div>
              <PromptView content={content} />
            </div>
          </TabsContent>
          <TabsContent value="edit">
            <div className="panel p-5">
              <Textarea
                value={content}
                onChange={(e) => setDraft(e.target.value)}
                rows={24}
                className="resize-y font-mono text-[13px]"
                aria-label="Prompt content"
              />
            </div>
          </TabsContent>
          <TabsContent value="versions">
            <div className="panel divide-y divide-border/60 p-2">
              {!data.versions.length && (
                <p className="p-4 text-sm text-muted-foreground">No versions recorded yet.</p>
              )}
              {data.versions.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3">
                  <ScoreRing score={v.quality_score} size={40} stroke={4} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Version {v.version}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {v.note ?? "—"} · {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void restore(v.version, v.content)}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <aside className="space-y-4">
          <div className="panel flex flex-col items-center p-5">
            <ScoreRing score={p.quality_score} size={116} stroke={9} />
            <p className="mt-3 text-sm font-medium">{scoreLabel(p.quality_score)}</p>
            <p className="text-xs text-muted-foreground">Quality score</p>
          </div>
          <div className="panel p-5">
            <h2 className="font-display text-base font-semibold">Breakdown</h2>
            <div className="mt-3 space-y-2.5">
              {Object.entries(breakdown).map(([k, v]) => (
                <ScoreBar key={k} name={SCORE_LABELS[k] ?? k} value={Number(v)} />
              ))}
              {!Object.keys(breakdown).length && (
                <p className="text-sm text-muted-foreground">
                  Save a version to generate a breakdown.
                </p>
              )}
            </div>
          </div>
          {suggestions.length > 0 && (
            <div className="panel p-5">
              <h2 className="font-display text-base font-semibold">Suggestions</h2>
              <ul className="mt-2 space-y-1.5">
                {suggestions.map((s) => (
                  <li key={s} className="flex gap-2 text-sm text-muted-foreground">
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
