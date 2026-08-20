import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Loader2, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyButton } from "@/components/prompt-view";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { streamAI } from "@/lib/ai-client";
import { MODELS, applyVariables, extractVariables } from "@/lib/constants";

const searchSchema = z.object({ promptId: z.string().optional() });

export const Route = createFileRoute("/_authenticated/playground")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Playground — Prompt Forge AI" },
      {
        name: "description",
        content:
          "Run prompts with live variables, tune temperature and tokens, and inspect latency, cost and output.",
      },
      { property: "og:title", content: "Playground — Prompt Forge AI" },
      {
        property: "og:description",
        content: "Test prompts with variables, temperature and token controls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Playground,
});

function Playground() {
  const { promptId } = Route.useSearch();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [vars, setVars] = useState<Record<string, string>>({});
  const [model, setModel] = useState("gpt");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [response, setResponse] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ latency: number; tokens: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!promptId) return;
    void supabase
      .from("prompts")
      .select("content, model")
      .eq("id", promptId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrompt(data.content);
          setModel(data.model);
        }
      });
  }, [promptId]);

  const variables = useMemo(() => extractVariables(prompt), [prompt]);
  const resolved = useMemo(() => applyVariables(prompt, vars), [prompt, vars]);

  async function run() {
    if (prompt.trim().length < 4) {
      toast.error("Enter a prompt to run");
      return;
    }
    setRunning(true);
    setError(null);
    setResponse("");
    setStats(null);
    const started = performance.now();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { text } = await streamAI(
        { action: "run", prompt: resolved, model, temperature, maxTokens },
        (full) => setResponse(full),
        controller.signal,
      );
      const latency = Math.round(performance.now() - started);
      const tokens = Math.round(text.length / 4);
      setStats({ latency, tokens });
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await supabase.from("prompt_tests").insert({
          user_id: auth.user.id,
          prompt_id: promptId ?? null,
          prompt_text: resolved,
          variables: vars,
          model,
          temperature,
          max_tokens: maxTokens,
          response: text,
          latency_ms: latency,
          tokens,
        });
        await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-tight">Playground</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Test prompts with{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">{"{{variables}}"}</code>, tune
          settings, and inspect the response.
        </p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,460px)_1fr]">
        <section className="panel h-fit p-5" aria-label="Prompt and settings">
          <Label htmlFor="pg-prompt">Prompt</Label>
          <Textarea
            id="pg-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={12}
            placeholder="You are an expert {{role}}. Help the user with {{task}}…"
            className="mt-1.5 resize-y font-mono text-[13px]"
          />

          {variables.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Variables
              </p>
              {variables.map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <code className="w-32 shrink-0 truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                    {v}
                  </code>
                  <Input
                    value={vars[v] ?? ""}
                    onChange={(e) => setVars((p) => ({ ...p, [v]: e.target.value }))}
                    placeholder={`Value for ${v}`}
                    aria-label={`Value for ${v}`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Temperature</Label>
                <span className="tabular-nums text-muted-foreground">{temperature.toFixed(2)}</span>
              </div>
              <Slider
                value={[temperature]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => setTemperature(v ?? 0.7)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Max tokens</Label>
                <span className="tabular-nums text-muted-foreground">{maxTokens}</span>
              </div>
              <Slider
                value={[maxTokens]}
                min={128}
                max={4096}
                step={128}
                onValueChange={([v]) => setMaxTokens(v ?? 1024)}
              />
            </div>
          </div>

          <div className="mt-5">
            {running ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => abortRef.current?.abort()}
              >
                <Square className="size-4" /> Stop
              </Button>
            ) : (
              <Button className="w-full" onClick={() => void run()}>
                <Play className="size-4" /> Run prompt
              </Button>
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-4" aria-label="Response">
          {error && <ErrorState message={error} onRetry={() => void run()} />}
          {!error && !response && !running && (
            <EmptyState
              icon={FlaskConical}
              title="No run yet"
              description="Fill in your variables and hit Run to see a live streaming response with latency and token stats."
            />
          )}
          {(response || running) && !error && (
            <div className="panel p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base font-semibold">Response</h2>
                  {running && (
                    <Badge variant="secondary" className="gap-1">
                      <Loader2 className="size-3 animate-spin" /> streaming
                    </Badge>
                  )}
                  {stats && (
                    <>
                      <Badge variant="outline">{stats.latency} ms</Badge>
                      <Badge variant="outline">~{stats.tokens} tokens</Badge>
                    </>
                  )}
                </div>
                {!running && response && <CopyButton text={response} />}
              </div>
              <pre className="max-h-[62vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface p-4 font-mono text-[13px] leading-relaxed">
                {response}
                {running && (
                  <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
                )}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
