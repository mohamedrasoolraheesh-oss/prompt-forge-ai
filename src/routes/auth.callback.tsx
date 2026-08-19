import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — Prompt Forge AI" },
      { name: "description", content: "Completing your Prompt Forge AI sign-in." },
      { property: "og:title", content: "Signing you in — Prompt Forge AI" },
      { property: "og:description", content: "Completing your Prompt Forge AI sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

const REDIRECT_KEY = "pf:redirect-after-auth";

function safePath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/** Make sure a profile row exists (covers OAuth users created before the trigger ran). */
async function ensureProfile() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  const { data: existing } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (existing) return;
  const meta = user.user_metadata ?? {};
  await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? null,
    full_name: (meta["full_name"] as string) ?? (meta["name"] as string) ?? user.email?.split("@")[0] ?? null,
    avatar_url: (meta["avatar_url"] as string) ?? null,
  });
}

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      if (done.current) return;
      done.current = true;
      try {
        await ensureProfile();
      } catch {
        /* non-fatal — the app creates the profile lazily too */
      }
      if (cancelled) return;
      const target =
        safePath(new URLSearchParams(window.location.search).get("redirect")) ??
        safePath(sessionStorage.getItem(REDIRECT_KEY)) ??
        "/dashboard";
      sessionStorage.removeItem(REDIRECT_KEY);
      void navigate({ to: target, replace: true });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void finish();
    });

    // The session may already be set by the time this route mounts.
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void finish();
    });

    // Hard stop so the user is never stuck on a spinner.
    const timeout = setTimeout(async () => {
      if (done.current || cancelled) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        void finish();
      } else {
        setError("We couldn't complete the sign-in. Please try again.");
        setTimeout(() => void navigate({ to: "/login", replace: true }), 1800);
      }
    }, 6000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <span className="grid size-11 place-items-center rounded-xl forge-gradient shadow-glow">
        <Zap className="size-5 text-white" aria-hidden />
      </span>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Signing you in…
        </p>
      )}
    </div>
  );
}
