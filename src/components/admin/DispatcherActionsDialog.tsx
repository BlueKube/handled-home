import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DispatcherActionsProps {
  jobId: string;
  open: boolean;
  onClose: () => void;
}

type ActionType = "note" | "follow_up" | "create_ticket";

export function DispatcherActionsDialog({ jobId, open, onClose }: DispatcherActionsProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [action, setAction] = useState<ActionType>("note");
  const [note, setNote] = useState("");

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("job_events").insert({
        job_id: jobId,
        event_type: action === "follow_up" ? "needs_follow_up" : action === "create_ticket" ? "ticket_created" : "internal_note",
        actor_user_id: user.id,
        actor_role: "admin",
        metadata: { note, action_type: action } as any,
      });
      if (error) throw error;

      // "Follow Up" is tracked via the job_event only — no job status change
      // to avoid violating the CHECK constraint on jobs.status

      if (action === "create_ticket") {
        // Get the job's customer_id (required FK on support_tickets)
        const { data: jobData } = await supabase
          .from("jobs")
          .select("customer_id")
          .eq("id", jobId)
          .single();
        if (!jobData) throw new Error("Job not found");

        await supabase.from("support_tickets").insert({
          customer_id: jobData.customer_id,
          job_id: jobId,
          customer_note: note || "Escalated from dispatcher queue",
          ticket_type: "general",
          severity: "high",
          status: "open",
        });
      }
    },
    onSuccess: () => {
      toast.success(
        action === "note" ? "Note added" :
        action === "follow_up" ? "Marked for follow-up" :
        "Support ticket created"
      );
      qc.invalidateQueries({ queryKey: ["dispatcher-queues"] });
      setNote("");
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dispatcher Action</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            {([
              { key: "note", label: "Add Note" },
              { key: "follow_up", label: "Follow Up" },
              { key: "create_ticket", label: "Create Ticket" },
            ] as const).map((a) => (
              <Button
                key={a.key}
                size="sm"
                variant={action === a.key ? "default" : "outline"}
                onClick={() => setAction(a.key)}
              >
                {a.label}
              </Button>
            ))}
          </div>

          <div>
            <Label>Note / Reason</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                action === "create_ticket"
                  ? "Describe the issue for the support ticket..."
                  : "Internal note..."
              }
              rows={3}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Job: <span className="font-mono">{jobId.slice(0, 12)}…</span>
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => addNoteMutation.mutate()}
            disabled={addNoteMutation.isPending || !note.trim()}
          >
            {addNoteMutation.isPending ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
