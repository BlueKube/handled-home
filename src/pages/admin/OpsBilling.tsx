import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, UserX, XCircle, CreditCard, RotateCcw } from "lucide-react";

function formatCents(c: number) {
  return "$" + (c / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function OpsBilling() {
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["ops-billing-health"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const today = new Date().toISOString().split("T")[0];

      const [pastDueRes, failedRes, credits7Res, credits30Res] = await Promise.all([
        supabase.from("customer_invoices").select("id", { count: "exact", head: true }).eq("status", "PAST_DUE"),
        supabase.from("customer_invoices").select("id", { count: "exact", head: true }).eq("status", "FAILED").gte("updated_at", today + "T00:00:00Z"),
        supabase.from("customer_credits").select("amount_cents").gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("customer_credits").select("amount_cents").gte("created_at", thirtyDaysAgo.toISOString()),
      ]);

      return {
        pastDue: pastDueRes.count ?? 0,
        failedToday: failedRes.count ?? 0,
        credits7d: (credits7Res.data ?? []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0),
        credits30d: (credits30Res.data ?? []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0),
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-h2">Billing Health</h1>
          <p className="text-caption">Deep-links into billing admin for action</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <div onClick={() => nav("/admin/billing")} className="cursor-pointer">
          <StatCard icon={UserX} label="Past Due" value={data.pastDue} />
        </div>
        <div onClick={() => nav("/admin/billing")} className="cursor-pointer">
          <StatCard icon={XCircle} label="Failed Today" value={data.failedToday} />
        </div>
        <div onClick={() => nav("/admin/billing")} className="cursor-pointer">
          <StatCard icon={CreditCard} label="Credits (7d)" value={formatCents(data.credits7d)} />
        </div>
        <div onClick={() => nav("/admin/billing")} className="cursor-pointer">
          <StatCard icon={RotateCcw} label="Credits (30d)" value={formatCents(data.credits30d)} />
        </div>
      </div>

      <Button variant="outline" onClick={() => nav("/admin/billing")}>
        Open Billing Admin →
      </Button>
    </div>
  );
}
