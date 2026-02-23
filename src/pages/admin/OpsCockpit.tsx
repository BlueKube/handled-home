import { useNavigate } from "react-router-dom";
import { useOpsMetrics } from "@/hooks/useOpsMetrics";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardCheck, AlertTriangle, ShieldAlert, Camera,
  Gauge, Calendar,
  Bug, CreditCard as CreditCardIcon, RotateCcw,
  DollarSign, UserX, XCircle,
  Users, Briefcase, TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function formatCents(cents: number) {
  return "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function OpsCockpit() {
  const { data: m, isLoading, dataUpdatedAt } = useOpsMetrics();
  const nav = useNavigate();

  if (isLoading || !m) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-h2">Ops Cockpit</h1>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const updatedLabel = dataUpdatedAt
    ? `Updated ${formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true })}`
    : "";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 mb-1">Ops Cockpit</h1>
          <p className="text-caption">{updatedLabel}</p>
        </div>
      </div>

      {/* A) Today Execution */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today Execution</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div onClick={() => nav("/admin/ops/jobs")} className="cursor-pointer">
            <StatCard icon={ClipboardCheck} label="Scheduled" value={m.jobsScheduledToday} />
          </div>
          <div onClick={() => nav("/admin/ops/jobs")} className="cursor-pointer">
            <StatCard icon={ClipboardCheck} label="Completed" value={m.jobsCompletedToday} />
          </div>
          <div onClick={() => nav("/admin/ops/jobs")} className="cursor-pointer">
            <StatCard icon={AlertTriangle} label="In Issue" value={m.jobsInIssue} />
          </div>
          <div onClick={() => nav("/admin/ops/jobs")} className="cursor-pointer">
            <StatCard icon={Camera} label="Proof Exceptions" value={m.proofExceptions} />
          </div>
        </div>
      </section>

      {/* B) Capacity Pressure */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Capacity Pressure</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div onClick={() => nav("/admin/ops/zones")} className="cursor-pointer">
            <StatCard icon={Gauge} label="Zones >90%" value={m.zonesOverCapacity} />
          </div>
          <Card className="p-4 col-span-1 lg:col-span-3 cursor-pointer" onClick={() => nav("/admin/ops/zones")}>
            <p className="text-sm text-muted-foreground mb-2">Tight Days (Top 3)</p>
            {m.tightDays.length === 0 ? (
              <p className="text-caption">No zones near capacity</p>
            ) : (
              <div className="space-y-1">
                {m.tightDays.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t.zone_name}</span>
                    <span className="text-muted-foreground">{t.day} — {t.pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* C) Quality (7d) */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quality (7 Days)</h2>
        <div className="grid gap-3 grid-cols-3">
          <div onClick={() => nav("/admin/ops/jobs")} className="cursor-pointer">
            <StatCard icon={Bug} label="Issue Rate" value={`${m.issueRate}%`} />
          </div>
          <div onClick={() => nav("/admin/ops/billing")} className="cursor-pointer">
            <StatCard icon={CreditCardIcon} label="Credits Issued" value={formatCents(m.creditsIssuedCents)} />
          </div>
          <div onClick={() => nav("/admin/ops/jobs")} className="cursor-pointer">
            <StatCard icon={RotateCcw} label="Redo Intents" value={m.redoIntents} />
          </div>
        </div>
      </section>

      {/* D) Revenue & Billing */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Revenue & Billing</h2>
        <div className="grid gap-3 grid-cols-3">
          <div onClick={() => nav("/admin/ops/billing")} className="cursor-pointer">
            <StatCard icon={DollarSign} label="Paid Today" value={formatCents(m.paidTodayCents)} />
          </div>
          <div onClick={() => nav("/admin/ops/billing")} className="cursor-pointer">
            <StatCard icon={UserX} label="Past Due" value={m.pastDueCount} />
          </div>
          <div onClick={() => nav("/admin/ops/billing")} className="cursor-pointer">
            <StatCard icon={XCircle} label="Failed Today" value={m.failedPaymentsToday} />
          </div>
        </div>
      </section>

      {/* E) Growth (7d) */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Growth (7 Days)</h2>
        <div className="grid gap-3 grid-cols-3">
          <div onClick={() => nav("/admin/ops/growth")} className="cursor-pointer">
            <StatCard icon={Users} label="Referrals" value={m.referralsActivated} />
          </div>
          <div onClick={() => nav("/admin/ops/growth")} className="cursor-pointer">
            <StatCard icon={Briefcase} label="Provider Apps" value={m.providerApplications} />
          </div>
          <div onClick={() => nav("/admin/ops/growth")} className="cursor-pointer">
            <StatCard icon={TrendingUp} label="Hot Zones" value={m.hotZones.length} />
          </div>
        </div>
      </section>
    </div>
  );
}
