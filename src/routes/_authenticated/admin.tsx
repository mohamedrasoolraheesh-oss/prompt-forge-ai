import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  IndianRupee,
  Loader2,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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

type PaymentRow = {
  id: string;
  user_id: string;
  plan: string;
  billing_cycle: string;
  amount_inr: number;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
};

const invoiceNumber = (p: PaymentRow) => `RPF-${p.id.slice(0, 8).toUpperCase()}`;

/** Open a printable invoice for one payment in a new tab. */
function openInvoice(p: PaymentRow, customer: { name: string; email: string }) {
  const w = window.open("", "_blank", "width=760,height=900");
  if (!w) {
    toast.error("Allow pop-ups to view invoices.");
    return;
  }
  const date = new Date(p.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Invoice ${invoiceNumber(p)}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;color:#18181b;margin:0;padding:48px;background:#fff}
  .wrap{max-width:640px;margin:0 auto}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #7c3aed;padding-bottom:24px}
  h1{font-size:22px;margin:0}
  .brand{font-size:13px;color:#7c3aed;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
  .meta{text-align:right;font-size:13px;color:#52525b}
  table{width:100%;border-collapse:collapse;margin-top:32px;font-size:14px}
  th{text-align:left;color:#71717a;font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:.05em;padding:8px 0;border-bottom:1px solid #e4e4e7}
  td{padding:12px 0;border-bottom:1px solid #f4f4f5}
  .total td{font-weight:700;font-size:16px;border-bottom:none}
  .foot{margin-top:40px;font-size:12px;color:#a1a1aa}
  .paid{display:inline-block;background:#dcfce7;color:#166534;font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px}
  @media print{body{padding:0}}
</style></head><body><div class="wrap">
  <div class="top">
    <div><p class="brand">Rebel Prompt AI</p><h1>Invoice ${invoiceNumber(p)}</h1></div>
    <div class="meta">
      <p>${date}</p>
      <p>Status: <span class="paid">${p.status.toUpperCase()}</span></p>
      ${p.razorpay_payment_id ? `<p>Ref: ${p.razorpay_payment_id}</p>` : ""}
    </div>
  </div>
  <p style="margin-top:24px;font-size:14px"><strong>Billed to:</strong><br>${customer.name}<br>${customer.email}</p>
  <table>
    <thead><tr><th>Description</th><th>Cycle</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr><td>Rebel Prompt AI — ${p.plan} plan</td><td style="text-transform:capitalize">${p.billing_cycle}</td><td style="text-align:right">${inr(p.amount_inr)}</td></tr>
      <tr class="total"><td>Total</td><td></td><td style="text-align:right">${inr(p.amount_inr)}</td></tr>
    </tbody>
  </table>
  <p class="foot">Thank you for using Rebel Prompt AI. This is a computer-generated invoice.</p>
</div><script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

function AdminPage() {
  const fetchOverview = useServerFn(adminOverview);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [portalId, setPortalId] = useState<string | null>(null);

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
                      label={`Delete ${u.email}`}
                      onConfirm={() => deleteMutation.mutate(u.id)}
                    />
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
