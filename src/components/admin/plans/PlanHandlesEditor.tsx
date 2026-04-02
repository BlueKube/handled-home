import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export function PlanHandlesEditor({ planId }: { planId: string }) {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ["plan_handles", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_handles")
        .select("*")
        .eq("plan_id", planId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [handlesPerCycle, setHandlesPerCycle] = useState(0);
  const [rolloverCap, setRolloverCap] = useState(0);
  const [expiryDays, setExpiryDays] = useState(60);

  useEffect(() => {
    if (config) {
      setHandlesPerCycle(config.handles_per_cycle);
      setRolloverCap(config.rollover_cap);
      setExpiryDays(config.rollover_expiry_days);
    }
  }, [config]);

  const save = useMutation({
    mutationFn: async () => {
      if (config) {
        const { error } = await supabase
          .from("plan_handles")
          .update({
            handles_per_cycle: handlesPerCycle,
            rollover_cap: rolloverCap,
            rollover_expiry_days: expiryDays,
            updated_at: new Date().toISOString(),
          })
          .eq("plan_id", planId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("plan_handles")
          .insert({
            plan_id: planId,
            handles_per_cycle: handlesPerCycle,
            rollover_cap: rolloverCap,
            rollover_expiry_days: expiryDays,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan_handles"] });
      toast.success("Handles config saved");
    },
    onError: () => toast.error("Failed to save handles config"),
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Sparkles className="h-4 w-4" /> Handles
      </h3>
      <div className="space-y-2">
        <Label>Handles per Cycle</Label>
        <Input type="number" min={0} value={handlesPerCycle} onChange={(e) => setHandlesPerCycle(parseInt(e.target.value) || 0)} />
      </div>
      <div className="space-y-2">
        <Label>Rollover Cap</Label>
        <Input type="number" min={0} value={rolloverCap} onChange={(e) => setRolloverCap(parseInt(e.target.value) || 0)} />
        <p className="text-xs text-muted-foreground">Max handles that carry over to next cycle</p>
      </div>
      <div className="space-y-2">
        <Label>Expiry Days</Label>
        <Input type="number" min={1} value={expiryDays} onChange={(e) => setExpiryDays(parseInt(e.target.value) || 60)} />
        <p className="text-xs text-muted-foreground">Days before unused handles expire</p>
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Saving…" : config ? "Update Handles" : "Set Handles"}
      </Button>
    </div>
  );
}
