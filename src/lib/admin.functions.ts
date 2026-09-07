import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Owner account that always holds the admin role. */
export const OWNER_EMAIL = "mohamedrasoolraheesh@gmail.com";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — admin only");
  return true;
}

/** Whether the caller holds the admin role. Safe for every signed-in user. */
export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  role: "admin" | "user";
  created_at: string;
  prompts: number;
  runs: number;
  paid_inr: number;
};

/** Full platform overview: every user, their usage and their payments. */
export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [profiles, roles, prompts, tests, payments] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("prompts").select("id, user_id, quality_score, created_at"),
      supabaseAdmin.from("prompt_tests").select("id, user_id, cost, created_at"),
      supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false }),
    ]);

    const roleOf = new Map<string, "admin" | "user">();
    for (const r of roles.data ?? []) roleOf.set(r.user_id, r.role as "admin" | "user");

    const countBy = (rows: { user_id: string }[] | null) => {
      const m = new Map<string, number>();
      for (const r of rows ?? []) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1);
      return m;
    };
    const promptCount = countBy(prompts.data);
    const runCount = countBy(tests.data);

    const paidBy = new Map<string, number>();
    for (const p of payments.data ?? []) {
      if (p.status === "paid") paidBy.set(p.user_id, (paidBy.get(p.user_id) ?? 0) + p.amount_inr);
    }

    const users: AdminUserRow[] = (profiles.data ?? []).map((p) => ({
      id: p.id,
      email: p.email ?? "",
      full_name: p.full_name ?? (p.email ?? "").split("@")[0] ?? "user",
      plan: p.plan,
      role: roleOf.get(p.id) ?? "user",
      created_at: p.created_at,
      prompts: promptCount.get(p.id) ?? 0,
      runs: runCount.get(p.id) ?? 0,
      paid_inr: paidBy.get(p.id) ?? 0,
    }));

    const revenue = (payments.data ?? [])
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + p.amount_inr, 0);

    const scores = (prompts.data ?? []).map((p) => p.quality_score ?? 0).filter(Boolean);

    return {
      users,
      payments: payments.data ?? [],
      stats: {
        users: users.length,
        prompts: prompts.data?.length ?? 0,
        runs: tests.data?.length ?? 0,
        revenueInr: revenue,
        avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        paidCount: (payments.data ?? []).filter((p) => p.status === "paid").length,
      },
    };
  });

/** Promote or demote a user. The owner account can never lose admin. */
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "admin" | "user" }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();
    if ((profile?.email ?? "").toLowerCase() === OWNER_EMAIL && data.role !== "admin") {
      throw new Error("The owner account must stay an admin.");
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (data.role === "admin") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: "admin" });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Change a user's plan label from the admin console. */
export const setUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; plan: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ plan: data.plan })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove a user account and everything they own. */
export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("You can't delete your own account here.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();
    if ((profile?.email ?? "").toLowerCase() === OWNER_EMAIL) {
      throw new Error("The owner account can't be deleted.");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
