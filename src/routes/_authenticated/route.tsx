import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Fast path: the persisted session is read from local storage instantly,
    // so navigation never waits on an auth-server round trip.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) return { user: session.user };
    // No local session — confirm with the server before redirecting.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
