import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODELS, STYLES } from "@/lib/constants";
import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Rebel Prompt AI" },
      {
        name: "description",
        content: "Manage your Rebel Prompt profile, default model, prompt style and appearance.",
      },
      { property: "og:title", content: "Settings — Rebel Prompt AI" },
      { property: "og:description", content: "Manage your profile and prompt defaults." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("");
  const [model, setModel] = useState("gpt");
  const [style, setStyle] = useState("detailed");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? "");
    setModel(profile.default_model);
    setStyle(profile.default_style);
  }, [profile]);

  async function save() {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").upsert({
        id: auth.user.id,
        email: auth.user.email ?? null,
        full_name: name,
        default_model: model,
        default_style: style,
        theme,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Profile, defaults and appearance.</p>
      </header>

      <section className="panel mt-6 p-6">
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile?.email ?? ""} disabled />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Plan</span>
          <Badge>{profile?.plan ?? "Free"}</Badge>
        </div>
      </section>

      <section className="panel mt-4 p-6">
        <h2 className="font-display text-lg font-semibold">Prompt defaults</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Default model</Label>
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
          <div className="space-y-1.5">
            <Label>Default style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="panel mt-4 flex items-center justify-between p-6">
        <div>
          <h2 className="font-display text-lg font-semibold">Dark mode</h2>
          <p className="text-sm text-muted-foreground">Rebel Prompt looks best in the dark.</p>
        </div>
        <Switch
          checked={theme === "dark"}
          onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
          aria-label="Toggle dark mode"
        />
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
          changes
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            void navigate({ to: "/login" });
          }}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
