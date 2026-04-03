import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateTicket } from "@/hooks/useCreateTicket";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { SupportCategoryTile, getAllCategories, type SupportCategory } from "@/components/support/SupportCategoryTile";
import { ChevronLeft, CheckCircle2, Camera, X, Sparkles, Loader2, DollarSign, Shield, Clock, ImageIcon } from "lucide-react";
import { useCustomerJobs } from "@/hooks/useCustomerJobs";
import { toast } from "@/hooks/use-toast";

type Step = "category" | "billing_intercept" | "details" | "resolving" | "resolved" | "submitted";

export default function CustomerSupportNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetJobId = searchParams.get("job_id") || undefined;

  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<SupportCategory | null>(null);
  const [note, setNote] = useState("");
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createTicket = useCreateTicket();
  const { data: completedJobs } = useCustomerJobs("completed");
  const latestJob = completedJobs?.[0];
  const [resolvedCredit, setResolvedCredit] = useState<number | null>(null);
  const [resolutionExplanation, setResolutionExplanation] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for AI resolution after ticket is created
  useEffect(() => {
    if (step !== "resolving" || !createdTicketId) return;

    let attempts = 0;
    const maxAttempts = 10; // 5 seconds total

    pollRef.current = setInterval(async () => {
      attempts++;
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("status, ai_classification")
        .eq("id", createdTicketId)
        .single();

      if (ticket?.status === "resolved") {
        // AI auto-resolved — show the resolution
        const credit = (ticket.ai_classification as any)?.suggested_credit_cents ?? 0;
        const explanation = (ticket.ai_classification as any)?.resolution_explanation ?? "";
        setResolvedCredit(credit);
        setResolutionExplanation(explanation);
        setStep("resolved");
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (ticket?.status === "open" || attempts >= maxAttempts) {
        // AI didn't auto-resolve or timed out — show standard confirmation
        setStep("submitted");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, createdTicketId]);

  const ticketTypeMap: Record<SupportCategory, string> = {
    quality: "quality",
    missed: "missed_item",
    damage: "damage",
    billing: "billing",
    safety: "safety",
    routine_change: "routine_change",
  };

  const severityMap: Record<SupportCategory, string> = {
    quality: "medium",
    missed: "medium",
    damage: "high",
    billing: "low",
    safety: "critical",
    routine_change: "low",
  };

  const handleCategorySelect = (cat: SupportCategory) => {
    setCategory(cat);
    // Billing disputes get an intercept step with evidence before filing
    setStep(cat === "billing" ? "billing_intercept" : "details");
  };

  const handleSubmit = async () => {
    if (!category) return;
    const newErrors: Record<string, string> = {};
    if (note.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const ticket = await createTicket.mutateAsync({
        ticket_type: ticketTypeMap[category],
        category,
        job_id: presetJobId,
        customer_note: note.trim(),
        severity: severityMap[category],
      });
      setCreatedTicketId(ticket.id);

      // Upload photos if any
      for (const file of photoFiles) {
        const path = `tickets/${ticket.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("support-attachments")
          .upload(path, file);
        if (!uploadErr) {
          await supabase.from("support_attachments").insert({
            ticket_id: ticket.id,
            storage_path: path,
            file_type: file.type.startsWith("image/") ? "image" : "document",
            uploaded_by_user_id: (await supabase.auth.getUser()).data.user?.id,
            uploaded_by_role: "customer",
          });
        }
      }

      setStep("resolving");
    } catch (err: any) {
      // Handle duplicate ticket redirect
      if (err.message?.startsWith("DUPLICATE:")) {
        const existingId = err.message.split(":")[1];
        toast({ title: "Existing ticket found", description: "You already have an open ticket for this visit." });
        navigate(`/customer/support/tickets/${existingId}`);
        return;
      }
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 -ml-2"
          onClick={() => {
            if (step === "details") setStep(category === "billing" ? "billing_intercept" : "category");
            else if (step === "billing_intercept") setStep("category");
            else navigate("/customer/support");
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          {step === "details" ? "Back" : "Support"}
        </Button>
      </div>

      {/* Step: Category */}
      {step === "category" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-h2">What happened?</h1>
            <p className="text-caption">Choose the type of issue</p>
          </div>
          <div className="space-y-2">
            {getAllCategories().map((cat) => (
              <SupportCategoryTile
                key={cat}
                category={cat}
                selected={category === cat}
                onClick={handleCategorySelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step: Billing Intercept — show evidence before filing */}
      {step === "billing_intercept" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-h2">Before you submit</h1>
            <p className="text-caption">
              Here's what we have on file from your recent service. If something doesn't look right, continue below.
            </p>
          </div>

          {latestJob ? (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-primary" />
                Your most recent visit
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{latestJob.scheduled_date ?? "—"}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <ImageIcon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Photos</p>
                  <p className="text-sm font-medium">{latestJob.photo_count ?? 0} on file</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Every visit includes photo proof and checklist verification. If you'd like to review the full receipt, visit your Activity tab.
              </p>
            </Card>
          ) : (
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No recent visits found to reference.</p>
            </Card>
          )}

          <Card className="p-4 bg-accent/5 border-accent/20 space-y-2">
            <p className="text-sm font-medium">Need a billing adjustment?</p>
            <p className="text-xs text-muted-foreground">
              If something was charged incorrectly, we can often resolve it with a credit to your account — no need to contact your bank.
            </p>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/customer/activity")}>
              Review my receipts
            </Button>
            <Button className="flex-1" onClick={() => setStep("details")}>
              Continue to submit
            </Button>
          </div>
        </div>
      )}

      {/* Step: Details */}
      {step === "details" && category && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-h2">Tell us more</h1>
            <p className="text-caption">
              {category === "damage"
                ? "Describe the damage and we'll get it sorted"
                : "A quick note helps us resolve this faster"}
            </p>
          </div>

          {presetJobId && (
            <Card className="p-3 bg-secondary/50">
              <p className="text-xs text-muted-foreground">Linked to a recent visit</p>
            </Card>
          )}

          <Textarea
            value={note}
            onChange={(e) => {
              const capped = e.target.value.slice(0, 500);
              setNote(capped);
              if (capped.trim().length >= 10) {
                setErrors((prev) => ({ ...prev, description: "" }));
              }
            }}
            placeholder="Describe what happened…"
            rows={4}
            autoFocus
            aria-describedby={errors.description ? "description-error" : undefined}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{note.length}/500</span>
          </div>
          {errors.description && (
            <p id="description-error" className="text-sm text-destructive mt-1" role="alert">{errors.description}</p>
          )}

          {/* P3: Photo upload */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setPhotoFiles((prev) => [...prev, ...files].slice(0, 5));
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoFiles.length >= 5}
            >
              <Camera className="h-4 w-4" />
              {photoFiles.length > 0 ? `${photoFiles.length} photo(s)` : "Add photos"}
            </Button>
            {photoFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {photoFiles.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full"
            disabled={createTicket.isPending}
            onClick={handleSubmit}
          >
            {createTicket.isPending ? "Submitting…" : "Submit"}
          </Button>
        </div>
      )}

      {/* Step: Resolving (AI processing) */}
      {step === "resolving" && (
        <div className="text-center py-12 space-y-4">
          <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">Checking if we can resolve this instantly…</p>
            <p className="text-sm text-muted-foreground">
              Our system is reviewing your issue right now.
            </p>
          </div>
        </div>
      )}

      {/* Step: Resolved (AI auto-resolved with credit) */}
      {step === "resolved" && (
        <div className="text-center py-8 space-y-4">
          <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-7 w-7 text-success" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold">Resolved instantly</p>
            <p className="text-sm text-muted-foreground">
              {resolutionExplanation || "We've reviewed the evidence and resolved your issue."}
            </p>
          </div>
          {resolvedCredit != null && resolvedCredit > 0 && (
            <Card className="p-4 border-success/30 bg-success/5 inline-block mx-auto">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                <span className="text-lg font-bold text-success">
                  ${(resolvedCredit / 100).toFixed(2)} credit applied
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Applied to your account automatically</p>
            </Card>
          )}
          <div className="flex gap-2 justify-center pt-2">
            {createdTicketId && (
              <Button
                variant="outline"
                onClick={() => navigate(`/customer/support/tickets/${createdTicketId}`)}
              >
                View details
              </Button>
            )}
            <Button onClick={() => navigate("/customer")}>
              Back to Home
            </Button>
          </div>
        </div>
      )}

      {/* Step: Submitted (manual review) */}
      {step === "submitted" && (
        <div className="text-center py-12 space-y-4">
          <CheckCircle2 className="h-14 w-14 text-success mx-auto" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">We're on it</p>
            <p className="text-sm text-muted-foreground">
              You'll hear from us soon. We'll try to resolve this as fast as possible.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            {createdTicketId && (
              <Button
                variant="outline"
                onClick={() => navigate(`/customer/support/tickets/${createdTicketId}`)}
              >
                View ticket
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/customer/support")}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
