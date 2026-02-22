import { useState } from "react";
import { useSupportPolicies, type SupportPolicy } from "@/hooks/useSupportPolicies";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, CheckCircle2, RotateCcw, FileText, ChevronRight } from "lucide-react";

const DEFAULT_DIALS = {
  outcomes_allowed: ["credit", "redo", "refund"],
  credit_tiers: [500, 1000, 2500],
  max_credit_cents: 5000,
  redo_allowed: true,
  evidence_required: true,
  sla_hours: 48,
  generosity: 0.5,
  abuse_controls: { max_tickets_per_month: 5, repeat_window_days: 30 },
};

export default function AdminSupportPolicies() {
  const { policies, scopes, isLoading, createPolicy, publishPolicy, rollbackPolicy } = useSupportPolicies();
  const [showCreate, setShowCreate] = useState(false);
  const [detailPolicy, setDetailPolicy] = useState<SupportPolicy | null>(null);
  const [form, setForm] = useState({ name: "", description: "", change_reason: "", dials: JSON.stringify(DEFAULT_DIALS, null, 2) });

  const handleCreate = () => {
    try {
      const dials = JSON.parse(form.dials);
      createPolicy.mutate(
        { name: form.name, description: form.description, dials, change_reason: form.change_reason },
        {
          onSuccess: () => {
            toast.success("Policy draft created");
            setShowCreate(false);
            setForm({ name: "", description: "", change_reason: "", dials: JSON.stringify(DEFAULT_DIALS, null, 2) });
          },
          onError: (e) => toast.error(e.message),
        }
      );
    } catch {
      toast.error("Invalid JSON in dials");
    }
  };

  return (
    <div className="p-6 max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">Support Policies</h1>
          <p className="text-caption">Versioned policy rules that control resolution outcomes</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Policy
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)}</div>
      ) : policies.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No policies yet. Create one to get started.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => (
            <Card
              key={p.id}
              className="p-4 flex items-center gap-3 cursor-pointer press-feedback"
              onClick={() => setDetailPolicy(p)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">v{p.version}</span>
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <Badge variant={p.status === "published" ? "default" : p.status === "draft" ? "secondary" : "outline"} className="text-[10px]">
                    {p.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {p.change_reason || p.description || "No description"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Card>
          ))}
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>New Policy Draft</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="Policy name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            <Input placeholder="Change reason (required)" value={form.change_reason} onChange={(e) => setForm(f => ({ ...f, change_reason: e.target.value }))} />
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Policy Dials (JSON)</label>
              <Textarea rows={12} className="font-mono text-xs" value={form.dials} onChange={(e) => setForm(f => ({ ...f, dials: e.target.value }))} />
            </div>
            <Button className="w-full" disabled={!form.name || !form.change_reason || createPolicy.isPending} onClick={handleCreate}>
              Create Draft
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={!!detailPolicy} onOpenChange={() => setDetailPolicy(null)}>
        <SheetContent className="overflow-y-auto">
          {detailPolicy && (
            <>
              <SheetHeader>
                <SheetTitle>v{detailPolicy.version} — {detailPolicy.name}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Badge variant={detailPolicy.status === "published" ? "default" : "secondary"}>
                    {detailPolicy.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {format(new Date(detailPolicy.created_at), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
                {detailPolicy.description && <p className="text-sm">{detailPolicy.description}</p>}
                {detailPolicy.change_reason && (
                  <p className="text-xs text-muted-foreground">Change reason: {detailPolicy.change_reason}</p>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Dials</label>
                  <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(detailPolicy.dials, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2">
                  {detailPolicy.status === "draft" && (
                    <Button
                      size="sm"
                      onClick={() => publishPolicy.mutate(detailPolicy.id, {
                        onSuccess: () => { toast.success("Published"); setDetailPolicy(null); },
                        onError: (e) => toast.error(e.message),
                      })}
                      disabled={publishPolicy.isPending}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Publish
                    </Button>
                  )}
                  {detailPolicy.status === "published" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rollbackPolicy.mutate(detailPolicy.id, {
                        onSuccess: () => { toast.success("Rolled back"); setDetailPolicy(null); },
                        onError: (e) => toast.error(e.message),
                      })}
                      disabled={rollbackPolicy.isPending}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Rollback
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
