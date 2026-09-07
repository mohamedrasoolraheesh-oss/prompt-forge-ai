import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { IndianRupee, Loader2, ShieldCheck, Sparkles, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDelete } from "@/components/confirm-delete";
import {
  adminOverview,
  deleteUser,
  setUserPlan,
  setUserRole,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — Rebel Prompt AI" },
      {
        name: "description",
        content:
          "Owner-only console for Rebel Prompt AI: manage users, roles, plans and Razorpay payments.",
      },
      { property: "og:title", content: "Admin console — Rebel Prompt AI" },
      {
        property: "og:description",
        content: "Manage users, roles, plans and payments for Rebel Prompt AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function AdminPage() {
  const fetchOverview = useServerFn(adminOverview);
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview(),
    retry: false,
  });

  const roleFn = useServerFn(setUserRole);
  const planFn = useServerFn(setUserPlan);
  const deleteFn = useServerFn(deleteUser);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-overview"] });

  const roleMutation = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "user" }) => roleFn({ data: v }),
    onSuccess: () => {
      toast.success("Access updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const planMutation = useMutation({
    mutationFn: (v: { userId: string; plan: string }) => planFn({ data: v }),
    onSuccess: () => {
      toast.success("Plan updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("Account removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <EmptyState
          icon={ShieldCheck}
          title="Admins only"
          description="This console is restricted to the owner account."
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const users = data.users.filter((u) =>
    `${u.email} ${u.full_name}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const stats = [
    { label: "Users", value: String(data.stats.users), icon: Users },
    { label: "Prompts", value: String(data.stats.prompts), icon: Sparkles },
    { label: "Playground runs", value: String(data.stats.runs), icon: Sparkles },
    { label: "Revenue", value: inr(data.stats.revenueInr), icon: IndianRupee },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl forge-gradient shadow-glow">
          <ShieldCheck className="size-5 text-white" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">Admin console</h1>
          <p className="text-sm text-muted-foreground">
            Full access to every account, prompt and payment.
          </p>
        </div>
        <Badge variant="outline" className="ml-auto border-primary/30 bg-primary/10">
          Owner
        </Badge>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <s.icon className="size-3.5" aria-hidden /> {s.label}
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg font-semibold">Users</h2>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email"
            className="ml-auto h-9 w-full sm:w-64"
            aria-label="Search users"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Prompts</th>
                <th className="px-4 py-3 font-medium">Runs</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.role}
                      onValueChange={(v) =>
                        roleMutation.mutate({ userId: u.id, role: v as "admin" | "user" })
                      }
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.plan}
                      onValueChange={(v) => planMutation.mutate({ userId: u.id, plan: v })}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Starter">Starter</SelectItem>
                        <SelectItem value="Pro Trial">Pro Trial</SelectItem>
                        <SelectItem value="Pro">Pro</SelectItem>
                        <SelectItem value="Team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{u.prompts}</td>
                  <td className="px-4 py-3 tabular-nums">{u.runs}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(u.paid_inr)}</td>
                  <td className="px-4 py-3 text-right">
                    <ConfirmDelete
                      title="Remove this account?"
                      description={`${u.email} and all of their prompts will be permanently deleted.`}
                      onConfirm={() => deleteMutation.mutate(u.id)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        aria-label={`Delete ${u.email}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </ConfirmDelete>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No users match that search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Payments</h2>
        {data.payments.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No payments yet. Upgrades made on the pricing page appear here.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Cycle</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      {new Date(p.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">{p.plan}</td>
                    <td className="px-4 py-3 capitalize">{p.billing_cycle}</td>
                    <td className="px-4 py-3 tabular-nums">{inr(p.amount_inr)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === "paid" ? "default" : "outline"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.razorpay_payment_id ?? p.razorpay_order_id ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(roleMutation.isPending || planMutation.isPending || deleteMutation.isPending) && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Saving…
        </p>
      )}
    </div>
  );
}
