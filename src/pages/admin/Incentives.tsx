import { useState } from "react";
import { Plus, Shield, Gift, AlertTriangle, ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useReferralPrograms } from "@/hooks/useReferralPrograms";
import { useReferralRewards } from "@/hooks/useReferralRewards";
import { useReferralAdmin } from "@/hooks/useReferralAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const MILESTONES = ["installed", "subscribed", "first_visit", "paid_cycle", "provider_ready", "provider_first_job"];
const REWARD_TYPES = ["customer_credit", "provider_bonus"];
const STATUSES = ["draft", "active", "paused", "archived"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  earned: "bg-primary/10 text-primary",
  applied: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  voided: "bg-destructive/10 text-destructive",
  open: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  reviewed: "bg-primary/10 text-primary",
  dismissed: "bg-muted text-muted-foreground",
};

export default function AdminIncentives() {
  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Incentives</h1>
      <Tabs defaultValue="programs">
        <TabsList className="w-full">
          <TabsTrigger value="programs" className="flex-1">Programs</TabsTrigger>
          <TabsTrigger value="rewards" className="flex-1">Rewards</TabsTrigger>
          <TabsTrigger value="flags" className="flex-1">Risk Flags</TabsTrigger>
        </TabsList>
        <TabsContent value="programs"><ProgramsTab /></TabsContent>
        <TabsContent value="rewards"><RewardsTab /></TabsContent>
        <TabsContent value="flags"><FlagsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProgramsTab() {
  const { programs, createProgram, updateProgram } = useReferralPrograms();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", referrer_type: "customer",
    milestone_triggers: ["subscribed"] as string[],
    referrer_reward_amount_cents: 1000, referred_reward_amount_cents: 500,
    referrer_reward_type: "customer_credit", referred_reward_type: "customer_credit",
    hold_days: 7, status: "draft",
  });

  const handleCreate = () => {
    createProgram.mutate(form as any, { onSuccess: () => setCreating(false) });
  };

  if (programs.isLoading) return <Skeleton className="h-48 mt-4" />;

  return (
    <div className="space-y-4 mt-4">
      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetTrigger asChild>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Program</Button>
        </SheetTrigger>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>Create Program</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Referrer Type</label>
              <Select value={form.referrer_type} onValueChange={(v) => setForm({ ...form, referrer_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="provider">Provider</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Milestones (triggers)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {MILESTONES.map((m) => (
                  <Badge
                    key={m}
                    variant={form.milestone_triggers.includes(m) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setForm({
                      ...form,
                      milestone_triggers: form.milestone_triggers.includes(m)
                        ? form.milestone_triggers.filter((t) => t !== m)
                        : [...form.milestone_triggers, m],
                    })}
                  >
                    {m.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Referrer Amount (¢)</label>
                <Input type="number" value={form.referrer_reward_amount_cents} onChange={(e) => setForm({ ...form, referrer_reward_amount_cents: +e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Referred Amount (¢)</label>
                <Input type="number" value={form.referred_reward_amount_cents} onChange={(e) => setForm({ ...form, referred_reward_amount_cents: +e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Hold Days</label>
              <Input type="number" value={form.hold_days} onChange={(e) => setForm({ ...form, hold_days: +e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={createProgram.isPending || !form.name} className="w-full">
              Create Program
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {programs.data?.map((p: any) => (
        <Card key={p.id}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.referrer_type} · Hold {p.hold_days}d · ${(p.referrer_reward_amount_cents / 100).toFixed(0)} referrer / ${(p.referred_reward_amount_cents / 100).toFixed(0)} referred</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${STATUS_COLORS[p.status] || "bg-muted"}`}>{p.status}</Badge>
                {p.status === "draft" && (
                  <Button size="sm" variant="outline" onClick={() => updateProgram.mutate({ id: p.id, status: "active" })}>
                    Activate
                  </Button>
                )}
                {p.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => updateProgram.mutate({ id: p.id, status: "paused" })}>
                    Pause
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {p.milestone_triggers?.map((m: string) => (
                <Badge key={m} variant="secondary" className="text-xs">{m.replace(/_/g, " ")}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {programs.data?.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No programs yet. Create one to get started.</p>
      )}
    </div>
  );
}

function RewardsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const rewards = useReferralRewards(statusFilter ? { status: statusFilter } : undefined);
  const { voidReward, releaseHold, applyReward } = useReferralAdmin();
  const [actionDialog, setActionDialog] = useState<{ type: string; rewardId: string } | null>(null);
  const [reason, setReason] = useState("");

  const handleAction = () => {
    if (!actionDialog) return;
    if (actionDialog.type === "void") {
      voidReward.mutate({ rewardId: actionDialog.rewardId, reason }, { onSuccess: () => { setActionDialog(null); setReason(""); } });
    } else if (actionDialog.type === "release") {
      releaseHold.mutate({ rewardId: actionDialog.rewardId, reason }, { onSuccess: () => { setActionDialog(null); setReason(""); } });
    } else if (actionDialog.type === "apply") {
      applyReward.mutate(actionDialog.rewardId, { onSuccess: () => { setActionDialog(null); setReason(""); } });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="on_hold">On Hold</SelectItem>
          <SelectItem value="earned">Earned</SelectItem>
          <SelectItem value="applied">Applied</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="voided">Voided</SelectItem>
        </SelectContent>
      </Select>

      {rewards.isLoading && <Skeleton className="h-48" />}

      {rewards.data?.map((r: any) => (
        <Card key={r.id}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">${(r.amount_cents / 100).toFixed(2)}</p>
                  <Badge className={`text-xs ${STATUS_COLORS[r.status] || ""}`}>{r.status.replace("_", " ")}</Badge>
                  <Badge variant="outline" className="text-xs">{r.reward_type.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {r.referral_programs?.name} · {r.milestone} · #{r.id.slice(0, 8)}
                </p>
                {r.hold_reason && <p className="text-xs text-amber-600 mt-0.5">{r.hold_reason}</p>}
              </div>
              <div className="flex gap-1">
                {r.status === "on_hold" && (
                  <Button size="sm" variant="outline" onClick={() => setActionDialog({ type: "release", rewardId: r.id })}>
                    Release
                  </Button>
                )}
                {["earned", "on_hold"].includes(r.status) && (
                  <Button size="sm" variant="outline" onClick={() => setActionDialog({ type: "apply", rewardId: r.id })}>
                    Apply
                  </Button>
                )}
                {!["applied", "paid", "voided"].includes(r.status) && (
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setActionDialog({ type: "void", rewardId: r.id })}>
                    Void
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {rewards.data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No rewards found.</p>}

      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "void" ? "Void Reward" : actionDialog?.type === "release" ? "Release Hold" : "Apply Reward"}
            </DialogTitle>
          </DialogHeader>
          {actionDialog?.type !== "apply" && (
            <Textarea placeholder="Reason..." value={reason} onChange={(e) => setReason(e.target.value)} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              variant={actionDialog?.type === "void" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={actionDialog?.type !== "apply" && !reason}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FlagsTab() {
  const { riskFlags, reviewFlag } = useReferralAdmin();
  const [reviewDialog, setReviewDialog] = useState<{ flagId: string; action: "reviewed" | "dismissed" } | null>(null);
  const [note, setNote] = useState("");

  const handleReview = () => {
    if (!reviewDialog) return;
    reviewFlag.mutate({ flagId: reviewDialog.flagId, action: reviewDialog.action, note }, {
      onSuccess: () => { setReviewDialog(null); setNote(""); },
    });
  };

  if (riskFlags.isLoading) return <Skeleton className="h-48 mt-4" />;

  return (
    <div className="space-y-4 mt-4">
      {riskFlags.data?.map((f: any) => (
        <Card key={f.id}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="font-medium text-sm">{f.flag_type}</p>
                  <Badge className={`text-xs ${STATUS_COLORS[f.status] || ""}`}>{f.status}</Badge>
                </div>
                {f.reason && <p className="text-xs text-muted-foreground mt-0.5">{f.reason}</p>}
                {f.review_note && <p className="text-xs text-primary mt-0.5">Note: {f.review_note}</p>}
              </div>
              {f.status === "open" && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setReviewDialog({ flagId: f.id, action: "reviewed" })}>Review</Button>
                  <Button size="sm" variant="ghost" onClick={() => setReviewDialog({ flagId: f.id, action: "dismissed" })}>Dismiss</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {riskFlags.data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No risk flags.</p>}

      <Dialog open={!!reviewDialog} onOpenChange={(o) => !o && setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewDialog?.action === "reviewed" ? "Review Flag" : "Dismiss Flag"}</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Note (optional)..." value={note} onChange={(e) => setNote(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)}>Cancel</Button>
            <Button onClick={handleReview}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
